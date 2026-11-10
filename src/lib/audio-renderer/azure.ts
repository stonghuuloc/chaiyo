import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
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
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { z } from 'zod';
import { carrierOf, type Carrier } from './carriers';
import { toneNumber } from './recorded';
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
	return { body: ssml(cast, voice, carrier.say), cut: carrier.cut === true, say: carrier.say };
}

export type AzureDeps = {
	key: string;
	region: string;
	cacheDir: string;
	rawDir?: string;
	fetchImpl?: typeof fetch;
	encode?: (wav: string, mp3: string, cut: boolean) => void;
	encodeClip?: (wav: string, mp3: string) => void;
	hear?: (wav: string, text: string) => Promise<number>;
	faults?: (file: string, hanzi?: number, minSeconds?: number) => string[];
	sleep?: (ms: number) => Promise<void>;
	minIntervalMs?: number;
};

const MAX_ATTEMPTS = 3;
const MAX_TAKES = 16;
const MAX_MISHEARD = 6;
const MAX_TRIES = 6;
const MIN_SYLLABLE_SECONDS = 0.15;
const MAX_TAIL_FALL_DB = 50;
const LOUDNESS = -16;
const MAX_PEAK = -1;
const TRIM = 'silenceremove=start_periods=1:start_threshold=-70dB:start_silence=0.1:detection=peak';
export const FILTER = `adelay=delays=100:all=1,apad=pad_dur=0.1,${TRIM},areverse,${TRIM},areverse,loudnorm=I=-16:TP=-1.5:LRA=11`;

export function tailFall(wav: Uint8Array) {
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
			const levels = Array.from({ length: frames }, (_, f) => level(f));
			const peak = Math.max(...levels);
			const last = levels.findLastIndex((l) => l > peak - 20);
			const next = levels.slice(last + 1, last + 3);
			return next.length ? levels[last] - Math.min(...next) : Infinity;
		}
		at += 8 + size + (size % 2);
	}
	return 0;
}

function measuredGain(wav: string) {
	const r = spawnSync(
		'ffmpeg',
		['-hide_banner', '-i', wav, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
		{ encoding: 'utf8' }
	);
	if (r.error) throw new Error(`ffmpeg could not start: ${r.error.message}`);
	const loudness = Number(
		r.stderr
			.match(/I:\s+(-?[\d.]+) LUFS/g)
			?.pop()
			?.split(/\s+/)[1]
	);
	const peak = Number(
		r.stderr
			.match(/Peak:\s+(-?[\d.]+) dBFS/g)
			?.pop()
			?.split(/\s+/)[1]
	);
	if (!Number.isFinite(loudness) || !Number.isFinite(peak))
		throw new Error(`ffmpeg could not measure ${wav}`);
	return Math.min(LOUDNESS - loudness, MAX_PEAK - peak);
}

export const PLAIN = `volume to ${LOUDNESS} LUFS, peak ${MAX_PEAK} dBFS`;

export function encodePlain(wav: string, mp3: string) {
	const r = spawnSync(
		'ffmpeg',
		[
			'-y',
			'-loglevel',
			'error',
			'-i',
			wav,
			'-af',
			`volume=${measuredGain(wav).toFixed(2)}dB`,
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
	if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim()}`);
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

const Heard = z
	.object({ heard: z.string(), missing: z.number() })
	.or(z.object({ error: z.string() }));

export function whisperWorker() {
	const script = join(dirname(fileURLToPath(import.meta.url)), 'whisper_worker.py');
	const child = spawn(
		'uv',
		['run', '--no-project', '--with', 'mlx-whisper', '--with', 'pypinyin', 'python', script],
		{ stdio: ['pipe', 'pipe', 'inherit'] }
	);
	const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
	const spawnFailed = new Promise<never>((_, reject) => child.once('error', reject));
	return {
		async hear(wav: string, text: string) {
			child.stdin.write(JSON.stringify({ wav, text }) + '\n');
			const next = await Promise.race([lines.next(), spawnFailed]);
			if (next.done) throw new Error('Whisper worker exited');
			const reply = Heard.parse(JSON.parse(next.value));
			if ('error' in reply) throw new Error(`Whisper failed: ${reply.error}`);
			return reply.missing;
		},
		close: () => child.kill()
	};
}

export function azureEngine(cast: Cast, deps: AzureDeps): Engine & { close(): void } {
	const fetchImpl = deps.fetchImpl ?? fetch;
	const encodeCell = deps.encode ?? encodeTrimmed;
	const encodeClip = deps.encodeClip ?? encodePlain;
	const faultsOf = deps.faults ?? audioFaults;
	const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
	const minInterval = deps.minIntervalMs ?? 3100;
	const work = mkdtempSync(join(tmpdir(), 'chaiyo-azure-'));
	mkdirSync(deps.cacheDir, { recursive: true });
	if (deps.rawDir) mkdirSync(deps.rawDir, { recursive: true });
	let last = -Infinity;
	let clip = 0;
	let worker: ReturnType<typeof whisperWorker> | undefined;
	const hear =
		deps.hear ??
		((wav: string, text: string) =>
			(worker ??= whisperWorker()).hear(wav, text).catch((err) => {
				worker?.close();
				worker = undefined;
				throw err;
			}));

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
			const cell = req.kind === 'syllable' && toneNumber(req.hanzi) !== undefined;
			const hash = createHash('sha256')
				.update(`${request.body}|${request.cut}|${cell ? FILTER : PLAIN}`)
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
			const mp3 = join(work, `${clip}.mp3`);
			const chosen = join(work, `${clip++}.chosen.mp3`);
			let best: { take: Uint8Array; missing: number } | undefined;
			let lastFault = '';
			let kept = !!raw && existsSync(raw);
			let takes = 0;
			let failed = 0;
			let misheard = 0;
			for (
				;
				takes < MAX_TAKES &&
				failed < MAX_ATTEMPTS &&
				misheard < MAX_MISHEARD &&
				best?.missing !== 0;
				kept = false
			) {
				if (!kept) takes++;
				const take = kept && raw ? new Uint8Array(readFileSync(raw)) : await speak(request.body);
				writeFileSync(wav, take);
				const fall = tailFall(take);
				if (fall > MAX_TAIL_FALL_DB) {
					lastFault = `cut off at the end (falls ${fall.toFixed(0)} dB in 20 ms)`;
					continue;
				}
				if (cell) encodeCell(wav, mp3, request.cut);
				else encodeClip(wav, mp3);
				const faults = faultsOf(
					mp3,
					countHanzi(req.hanzi),
					req.kind === 'syllable' ? MIN_SYLLABLE_SECONDS : undefined
				);
				if (faults.length) {
					if (!kept) failed++;
					lastFault = faults.join('; ');
					continue;
				}
				const missing = cell ? 0 : await hear(wav, request.say);
				if (!best || missing < best.missing) {
					best = { take, missing };
					renameSync(mp3, chosen);
				}
				if (missing) misheard++;
			}
			if (best) {
				if (best.missing)
					console.log(
						`${req.hanzi}: kept the take Whisper heard best (${best.missing} syllables missed) after ${takes} takes`
					);
				if (raw) writeFileSync(raw, best.take);
				renameSync(chosen, cached);
				return readFileSync(cached);
			}
			throw new Error(`${req.hanzi}: ${lastFault}`);
		},
		close() {
			worker?.close();
			rmSync(work, { recursive: true, force: true });
		}
	};
}
