import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { carrierOf, type Carrier } from './carriers';
import { audioFaults, countHanzi } from './gate';
import type { Engine, EngineRequest } from './types';

const Cast = z.object({
	engine: z.literal('azure'),
	rate: z.string().regex(/^[+-]\d+%$/),
	voices: z.record(z.string(), z.string().min(1))
});
export type Cast = z.infer<typeof Cast>;

export const parseCast = (yamlText: string): Cast => Cast.parse(parse(yamlText));

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ssml(cast: Cast, voice: string, text: string) {
	return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${voice}"><prosody rate="${cast.rate}">${escape(text)}<break time="250ms"/></prosody></voice></speak>`;
}

export const billable = (body: string) =>
	[...body.replace(/<\/?(speak|voice)\b[^>]*>/g, '')].reduce(
		(n, c) => n + (/[\u3400-\u9fff]/.test(c) ? 2 : 1),
		0
	);

export function azureRequest(cast: Cast, req: Pick<EngineRequest, 'kind' | 'voice' | 'hanzi'>) {
	const voice = cast.voices[req.voice];
	if (!voice) throw new Error(`unknown voice: ${req.voice}`);
	const carrier: Carrier | undefined =
		req.kind === 'syllable' ? carrierOf(req.hanzi) : { say: req.hanzi };
	if (!carrier) return undefined;
	return { body: ssml(cast, voice, carrier.say), cut: carrier.cut === true };
}

export type AzureDeps = {
	key: string;
	region: string;
	cacheDir: string;
	rawDir?: string;
	fetchImpl?: typeof fetch;
	encode?: (wav: string, mp3: string, cut: boolean) => void;
	faults?: (file: string, hanzi?: number, minSeconds?: number) => string[];
	sleep?: (ms: number) => Promise<void>;
	minIntervalMs?: number;
};

const MAX_ATTEMPTS = 3;
const MAX_TRIES = 6;
const MIN_SYLLABLE_SECONDS = 0.15;
const MAX_END_DB = -50;
const TRIM = 'silenceremove=start_periods=1:start_threshold=-70dB:start_silence=0.1:detection=peak';
export const FILTER = `adelay=delays=100:all=1,apad=pad_dur=0.1,${TRIM},areverse,${TRIM},areverse,loudnorm=I=-16:TP=-1.5:LRA=11`;

export function endLevel(wav: Uint8Array) {
	const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
	let rate = 24000;
	let at = 12;
	while (at + 8 <= wav.byteLength) {
		const id = String.fromCharCode(...wav.subarray(at, at + 4));
		const size = view.getUint32(at + 4, true);
		if (id === 'fmt ') rate = view.getUint32(at + 12, true);
		if (id === 'data') {
			const start = at + 8;
			const n = rate / 100;
			const frames = Math.floor((Math.min(start + size, wav.byteLength) - start) / 2 / n);
			const level = (f: number) => {
				let sum = 0;
				for (let i = 0; i < n; i++) sum += view.getInt16(start + (f * n + i) * 2, true) ** 2;
				return 10 * Math.log10(sum / n + 1e-9);
			};
			let peak = -Infinity;
			for (let f = 0; f < frames; f++) peak = Math.max(peak, level(f));
			return frames ? level(frames - 1) - peak : 0;
		}
		at += 8 + size + (size % 2);
	}
	return 0;
}

export function encodeTrimmed(wav: string, mp3: string, cut: boolean) {
	let source = wav;
	if (cut) {
		source = `${wav}.cut.wav`;
		const r = spawnSync(
			'uv',
			[
				'run',
				'--no-project',
				'--with',
				'praat-parselmouth',
				'--with',
				'numpy',
				'python',
				'scripts/cut-first-syllable.py',
				wav,
				source
			],
			{ encoding: 'utf8' }
		);
		if (r.status !== 0) throw new Error(`cut failed: ${r.error?.message ?? r.stderr.trim()}`);
	}
	const r = spawnSync(
		'ffmpeg',
		[
			'-y',
			'-loglevel',
			'error',
			'-i',
			source,
			'-af',
			FILTER,
			'-ac',
			'1',
			'-ar',
			'24000',
			'-b:a',
			'48k',
			mp3
		],
		{ encoding: 'utf8' }
	);
	if (r.error) throw new Error(`ffmpeg could not start: ${r.error.message}`);
	if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim()}`);
}

export function azureEngine(cast: Cast, deps: AzureDeps): Engine & { close(): void } {
	const fetchImpl = deps.fetchImpl ?? fetch;
	const encode = deps.encode ?? encodeTrimmed;
	const faultsOf = deps.faults ?? audioFaults;
	const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
	const minInterval = deps.minIntervalMs ?? 3100;
	const work = mkdtempSync(join(tmpdir(), 'chaiyo-azure-'));
	mkdirSync(deps.cacheDir, { recursive: true });
	if (deps.rawDir) mkdirSync(deps.rawDir, { recursive: true });
	let last = -Infinity;
	let clip = 0;

	const speak = async (body: string) => {
		for (let tries = 1; ; tries++) {
			const wait = last + minInterval - Date.now();
			if (wait > 0) await sleep(wait);
			last = Date.now();
			const res = await fetchImpl(
				`https://${deps.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
				{
					method: 'POST',
					headers: {
						'Ocp-Apim-Subscription-Key': deps.key,
						'Content-Type': 'application/ssml+xml',
						'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
						'User-Agent': 'chaiyo-render-audio'
					},
					body
				}
			);
			if (res.ok) return new Uint8Array(await res.arrayBuffer());
			if ((res.status !== 429 && res.status < 500) || tries === MAX_TRIES)
				throw new Error(`Azure answered ${res.status}`);
			await sleep(Number(res.headers.get('retry-after') ?? 0) * 1000 || 2000 * 2 ** tries);
		}
	};

	return {
		async synthesize(req) {
			if (req.kind !== 'syllable' && req.text !== req.hanzi)
				throw new Error(`${req.hanzi}: Azure takes hanzi, not the reading ${req.text}`);
			const request = azureRequest(cast, req);
			if (!request) throw new Error(`${req.hanzi}: no carrier`);
			const hash = createHash('sha256')
				.update(`${request.body}|${request.cut}|${FILTER}`)
				.digest('hex')
				.slice(0, 12);
			const cached = join(deps.cacheDir, `${req.key}-${hash}.mp3`);
			if (existsSync(cached)) return readFileSync(cached);
			const raw =
				deps.rawDir &&
				join(
					deps.rawDir,
					`${req.key}-${createHash('sha256').update(request.body).digest('hex').slice(0, 12)}.wav`
				);
			const wav = join(work, `${clip}.wav`);
			const mp3 = join(work, `${clip++}.mp3`);
			let lastFault = '';
			let kept = !!raw && existsSync(raw);
			for (let attempt = 0; attempt < MAX_ATTEMPTS; kept = false) {
				if (!kept) attempt++;
				const take = kept && raw ? new Uint8Array(readFileSync(raw)) : await speak(request.body);
				writeFileSync(wav, take);
				const end = endLevel(take);
				let faults = [`cut off at the end (${end.toFixed(1)} dB)`];
				if (end <= MAX_END_DB) {
					encode(wav, mp3, request.cut);
					faults = faultsOf(
						mp3,
						countHanzi(req.hanzi),
						req.kind === 'syllable' ? MIN_SYLLABLE_SECONDS : undefined
					);
				}
				if (!faults.length) {
					if (raw && !kept) writeFileSync(raw, take);
					renameSync(mp3, cached);
					return readFileSync(cached);
				}
				lastFault = faults.join('; ');
			}
			throw new Error(`${req.hanzi}: ${lastFault}`);
		},
		close() {
			rmSync(work, { recursive: true, force: true });
		}
	};
}
