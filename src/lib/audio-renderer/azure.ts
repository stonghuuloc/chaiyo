import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Cast } from '../audio/cast';
import { splitSyllables } from '../content/derive/pinyin';
import { carrierOf } from './carriers';
import type { Engine, EngineRequest } from './types';

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ssml(cast: Cast, voice: string, style: string, text: string, ph?: string) {
	const say = ph ? `<phoneme alphabet="sapi" ph="${ph}">${escape(text)}</phoneme>` : escape(text);
	return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN"><voice name="${voice}"><s /><mstts:express-as style="${style}"><prosody rate="${cast.rate}"> ${say} </prosody></mstts:express-as><s /></voice></speak>`;
}

// Azure's zh-CN phone set: toneless pinyin, ü as v, tone 1-5 (5 = neutral), syllables space-separated
export function sapi(reading: string, hanzi: string) {
	const { clauses, aligned } = splitSyllables(reading, [...hanzi].length);
	if (!aligned) return undefined;
	return clauses
		.flat()
		.map(({ syl, tone, erhua }) => {
			const base = syl.normalize('NFD').replace(/[̀́̄̌]/g, '').normalize('NFC').replace(/ü/g, 'v');
			const t = tone || 5;
			return erhua ? `${base.replace(/r$/, '')} r ${t}` : `${base} ${t}`;
		})
		.join(' ');
}

export const billable = (body: string) =>
	[...body.replace(/<\/?(speak|voice)\b[^>]*>/g, '')].reduce(
		(n, c) => n + (/[\u3400-\u9fff]/.test(c) ? 2 : 1),
		0
	);

export function azureRequest(
	cast: Cast,
	req: Pick<EngineRequest, 'kind' | 'voice' | 'style' | 'hanzi'> & { text?: string }
) {
	const voice = cast.voices[req.voice];
	if (!voice) throw new Error(`unknown voice: ${req.voice}`);
	if (!req.style) return undefined;
	if (req.kind === 'syllable') {
		const say = carrierOf(req.hanzi)?.say;
		return say === undefined ? undefined : { body: ssml(cast, voice, req.style, say) };
	}
	// a second reading (的 dī) pins its pinyin, or Azure reads the common one
	if (req.text === undefined || req.text === req.hanzi)
		return { body: ssml(cast, voice, req.style, req.hanzi) };
	const ph = sapi(req.text, req.hanzi);
	return ph === undefined ? undefined : { body: ssml(cast, voice, req.style, req.hanzi, ph) };
}

export type AzureDeps = {
	key: string;
	region: string;
	cacheDir: string;
	fetchImpl?: typeof fetch;
	sleep?: (ms: number) => Promise<void>;
	minIntervalMs?: number;
};

const MAX_TRIES = 6;

export function azureEngine(cast: Cast, deps: AzureDeps): Engine {
	const fetchImpl = deps.fetchImpl ?? fetch;
	const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
	const minInterval = deps.minIntervalMs ?? 3100;
	mkdirSync(deps.cacheDir, { recursive: true });
	let nextSlot = 0;

	const speak = async (body: string) => {
		for (let tries = 1; ; tries++) {
			const now = Date.now();
			const slot = Math.max(now, nextSlot);
			nextSlot = slot + minInterval;
			if (slot > now) await sleep(slot - now);
			const res = await fetchImpl(
				`https://${deps.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
				{
					method: 'POST',
					headers: {
						'Ocp-Apim-Subscription-Key': deps.key,
						'Content-Type': 'application/ssml+xml',
						'X-Microsoft-OutputFormat': cast.format,
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
			const request = azureRequest(cast, req);
			if (!request)
				throw new Error(
					`${req.hanzi}: not an Azure clip (no style, no carrier, or reading ${req.text} does not split into its hanzi)`
				);
			const hash = createHash('sha256')
				.update(`${request.body}|${cast.format}`)
				.digest('hex')
				.slice(0, 12);
			const cached = join(deps.cacheDir, `${req.key.replace(/\//g, '_')}-${hash}.mp3`);
			if (existsSync(cached)) return new Uint8Array(readFileSync(cached));
			const clip = await speak(request.body);
			writeFileSync(cached, clip);
			return clip;
		}
	};
}
