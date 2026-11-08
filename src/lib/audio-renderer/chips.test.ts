import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createMemorySink, importContent, type ImportedContent } from '../content/import';
import { PRODUCTION_ROOTS, scopeFor } from '../content/import/scope';
import { loadRefs } from '../content/lint/refs';
import { CHIP_HANZI, chipEntries, chipSsml, chipWaveform, encodeChipMp3 } from './chips';
import type { encodeMp3 } from './gate';

const ROOT = join(__dirname, '..', '..', '..');
const CONTENT = join(ROOT, 'content');

let content: ImportedContent;

beforeAll(async () => {
	const sink = createMemorySink();
	const res = await importContent(CONTENT, sink, {
		refs: loadRefs(ROOT).refs,
		only: scopeFor(CONTENT, PRODUCTION_ROOTS)
	});
	if ('errors' in res) throw new Error(JSON.stringify(res.errors.slice(0, 3)));
	content = sink.content!;
});

describe('CHIP_HANZI', () => {
	it('holds exactly the marked pinyin of every chip in the HSK1 audio manifest', () => {
		expect(
			chipEntries(content.audio)
				.map((e) => e.hanzi)
				.sort()
		).toEqual(Object.keys(CHIP_HANZI).sort());
	});

	it('reads each Primer card chip with the hanzi the card shows', () => {
		let checked = 0;
		for (const lesson of content.lessons) {
			if (!('kind' in lesson) || lesson.kind !== 'primer') continue;
			for (const section of Object.values(lesson.sections))
				for (const card of section.cards)
					for (const chip of card.syllables) {
						if (typeof chip === 'string' || !chip.hanzi || !chip.say.includes(' ')) continue;
						expect(CHIP_HANZI[chip.say]).toBe(chip.hanzi);
						checked++;
					}
		}
		expect(checked).toBeGreaterThan(0);
	});
});

describe('chipSsml', () => {
	it('sends the phrase as Chinese with the pinned voice and rate', () => {
		expect(chipSsml('一起')).toBe(
			'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-YunxiNeural"><prosody rate="-10%">一起</prosody></voice></speak>'
		);
	});
});

describe('chipWaveform', () => {
	it('POSTs the SSML to the region endpoint with the subscription key', async () => {
		const calls: { url: string; init: RequestInit }[] = [];
		const fake = (async (url: string | URL | Request, init?: RequestInit) => {
			calls.push({ url: String(url), init: init! });
			return new Response(new Uint8Array([1, 2, 3]));
		}) as typeof fetch;

		const bytes = await chipWaveform({ key: 'k', region: 'westus2' }, '一起', fake);
		expect([...bytes]).toEqual([1, 2, 3]);
		expect(calls[0].url).toBe('https://westus2.tts.speech.microsoft.com/cognitiveservices/v1');
		expect(calls[0].init.method).toBe('POST');
		expect(calls[0].init.body).toBe(chipSsml('一起'));
		expect(calls[0].init.headers).toMatchObject({
			'Ocp-Apim-Subscription-Key': 'k',
			'Content-Type': 'application/ssml+xml',
			'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm'
		});
	});

	it('reports the status, not the key, when Azure rejects the request', async () => {
		const fake = (async () => new Response('', { status: 401 })) as unknown as typeof fetch;
		await expect(
			chipWaveform({ key: 'secret-key', region: 'westus2' }, '一起', fake)
		).rejects.toThrow('Azure Speech answered 401');
	});
});

describe('encodeChipMp3', () => {
	it('encodes at tempo 1 with both silences trimmed', () => {
		const calls: unknown[][] = [];
		const fake = ((...args: unknown[]) => {
			calls.push(args);
		}) as typeof encodeMp3;

		encodeChipMp3('chip.wav', 'chip.mp3', fake);
		expect(calls).toEqual([['chip.wav', 'chip.mp3', 1, { trimSilence: true }]]);
	});
});
