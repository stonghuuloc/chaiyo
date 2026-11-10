import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { carrierOf } from './carriers';
import type { Engine, EngineRequest } from './types';

const Cast = z.object({
	engine: z.literal('azure'),
	rate: z.string().regex(/^[+-]\d+%$/),
	format: z.string().regex(/-mp3$/),
	voices: z.record(z.string(), z.string().min(1))
});
export type Cast = z.infer<typeof Cast>;

export const parseCast = (yamlText: string): Cast => Cast.parse(parse(yamlText));

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ssml(cast: Cast, voice: string, style: string, text: string) {
	return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN"><voice name="${voice}"><s /><mstts:express-as style="${style}"><prosody rate="${cast.rate}"> ${escape(text)} </prosody></mstts:express-as><s /></voice></speak>`;
}

export const billable = (body: string) =>
	[...body.replace(/<\/?(speak|voice)\b[^>]*>/g, '')].reduce(
		(n, c) => n + (/[㐀-鿿]/.test(c) ? 2 : 1),
		0
	);

export function azureRequest(
	cast: Cast,
	req: Pick<EngineRequest, 'kind' | 'voice' | 'style' | 'hanzi'>
) {
	const voice = cast.voices[req.voice];
	if (!voice) throw new Error(`unknown voice: ${req.voice}`);
	if (!req.style) return undefined;
	const say = req.kind === 'syllable' ? carrierOf(req.hanzi)?.say : req.hanzi;
	return say === undefined ? undefined : { body: ssml(cast, voice, req.style, say) };
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

export function azureEngine(cast: Cast, deps: AzureDeps): Engine & { close(): void } {
	const fetchImpl = deps.fetchImpl ?? fetch;
	const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
	const minInterval = deps.minIntervalMs ?? 3100;
	mkdirSync(deps.cacheDir, { recursive: true });
	let last = -Infinity;

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
			if (req.kind !== 'syllable' && req.text !== req.hanzi)
				throw new Error(`${req.hanzi}: Azure takes hanzi, not the reading ${req.text}`);
			const request = azureRequest(cast, req);
			if (!request) throw new Error(`${req.hanzi}: not an Azure clip (no style or no carrier)`);
			const hash = createHash('sha256')
				.update(`${request.body}|${cast.format}`)
				.digest('hex')
				.slice(0, 12);
			const cached = join(deps.cacheDir, `${req.key}-${hash}.mp3`);
			if (existsSync(cached)) return new Uint8Array(readFileSync(cached));
			const clip = await speak(request.body);
			writeFileSync(cached, clip);
			return clip;
		},
		close() {}
	};
}
