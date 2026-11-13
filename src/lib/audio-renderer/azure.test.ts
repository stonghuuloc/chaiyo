import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CAST as cast } from '../audio/cast';
import { azureEngine, azureRequest, billable, sapi, ssml } from './azure';

const clip = new Uint8Array([0xff, 0xf3, 1, 2, 3]);
type Opts = { kind?: 'sentence' | 'word' | 'syllable'; voice?: string; style?: string };
const req = (hanzi: string, o: Opts = {}) => {
	const style = 'style' in o ? o.style : 'newscast';
	const voice = o.voice ?? 'redpanda';
	return {
		key: `k-${hanzi}-${voice}-${style}`,
		kind: o.kind ?? 'sentence',
		voice,
		style,
		hanzi,
		text: hanzi
	};
};

describe('cast', () => {
	it('Xiaoxiao and Yunfeng standard voices at -20%, 48 kHz mp3', () => {
		expect(cast.rate).toBe('-20%');
		expect(cast.format).toBe('audio-48khz-192kbitrate-mono-mp3');
		expect(cast.voices).toEqual({
			redpanda: 'zh-CN-XiaoxiaoNeural',
			takin: 'zh-CN-YunfengNeural'
		});
	});
});

describe('ssml', () => {
	it('wraps the text in Loc’s template: style, rate, empty <s /> on both sides, escaped', () => {
		expect(ssml(cast, 'v', 'chat-casual', 'a<b&c')).toBe(
			'<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN"><voice name="v"><s /><mstts:express-as style="chat-casual"><prosody rate="-20%"> a&lt;b&amp;c </prosody></mstts:express-as><s /></voice></speak>'
		);
	});

	it('bills hanzi twice and every other character inside the voice once', () => {
		const inner =
			'<s /><mstts:express-as style="newscast"><prosody rate="-20%">  </prosody></mstts:express-as><s />';
		expect(billable(ssml(cast, 'v', 'newscast', '您好'))).toBe(4 + inner.length);
	});
});

describe('sapi', () => {
	it.each([
		['dī', '的', 'di 1'],
		['guo', '过', 'guo 5'],
		['dōngxi', '东西', 'dong 1 xi 5'],
		['duōshao', '多少', 'duo 1 shao 5'],
		['lǜ', '绿', 'lv 4'],
		['yíhuìr', '一会儿', 'yi 2 hui r 4']
	])('%s %s → %s', (reading, hanzi, ph) => {
		expect(sapi(reading, hanzi)).toBe(ph);
	});

	it('gives up when the syllables do not line up with the hanzi', () => {
		expect(sapi('dōng', '东西')).toBeUndefined();
	});
});

describe('azureRequest', () => {
	it('keeps the plain body when the reading is the hanzi, so cached clips keep their hash', () => {
		const plain = azureRequest(cast, req('行', { kind: 'word', style: 'poetry-reading' }))!.body;
		expect(plain).not.toContain('phoneme');
		expect(plain).toBe(ssml(cast, 'zh-CN-XiaoxiaoNeural', 'poetry-reading', '行'));
	});

	it('sends a sentence as written, in its speaker’s voice and style', () => {
		const body = azureRequest(cast, req('对不起！', { voice: 'takin', style: 'serious' }))!.body;
		expect(body).toContain('<voice name="zh-CN-YunfengNeural">');
		expect(body).toContain('style="serious"');
		expect(body).toContain('> 对不起！ <');
		expect(() => azureRequest(cast, req('x', { voice: 'nobody' }))).toThrow('unknown voice');
	});

	it('sends the hanzi of a Primer chip', () => {
		const body = azureRequest(
			cast,
			req('nǐ hǎo', { kind: 'syllable', style: 'poetry-reading' })
		)!.body;
		expect(body).toContain('> 你好 <');
	});

	it('never sends a pinyin-chart cell: it has no style', () => {
		expect(azureRequest(cast, req('bā', { kind: 'syllable', style: undefined }))).toBeUndefined();
	});
});

describe('azureEngine', () => {
	const setup = (statuses: number[], minIntervalMs = 0) => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'azure-test-'));
		const fetchImpl = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => {
			const status = statuses.shift() ?? 200;
			return new Response(status === 200 ? clip : null, {
				status,
				headers: status === 429 ? { 'retry-after': '1' } : {}
			});
		});
		const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
		const engine = azureEngine(cast, {
			key: 'k',
			region: 'r',
			cacheDir,
			fetchImpl: fetchImpl as unknown as typeof fetch,
			sleep,
			minIntervalMs
		});
		return { engine, fetchImpl, sleep };
	};

	it('returns Azure’s bytes unchanged and asks for the cast format', async () => {
		const { engine, fetchImpl } = setup([]);
		expect(await engine.synthesize(req('你好！'))).toEqual(clip);
		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toBe('https://r.tts.speech.microsoft.com/cognitiveservices/v1');
		expect((init.headers as Record<string, string>)['X-Microsoft-OutputFormat']).toBe(
			'audio-48khz-192kbitrate-mono-mp3'
		);
	});

	it('caches a clip by key and request, so a second render does not call Azure', async () => {
		const { engine, fetchImpl } = setup([]);
		await engine.synthesize(req('好'));
		expect(await engine.synthesize(req('好'))).toEqual(clip);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it('caches a key that carries its folder', async () => {
		const { engine, fetchImpl } = setup([]);
		const words = { ...req('好'), key: 'words/abc' };
		await engine.synthesize(words);
		expect(await engine.synthesize(words)).toEqual(clip);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it('waits out a 429 and gives up on a 400', async () => {
		const a = setup([429, 200]);
		await a.engine.synthesize(req('好'));
		expect(a.sleep).toHaveBeenCalledWith(1000);
		const b = setup([400]);
		await expect(b.engine.synthesize(req('好'))).rejects.toThrow('Azure answered 400');
	});

	it('pins a second reading with a sapi phoneme so Azure does not read the common one', async () => {
		// Arrange
		const { engine, fetchImpl } = setup([]);
		// Act
		await engine.synthesize({
			...req('行', { kind: 'word', style: 'poetry-reading' }),
			text: 'háng'
		});
		// Assert
		const body = fetchImpl.mock.calls[0][1].body as string;
		expect(body).toContain('> <phoneme alphabet="sapi" ph="hang 2">行</phoneme> <');
	});

	it('refuses a reading that does not split into its hanzi without calling Azure', async () => {
		// Arrange
		const { engine, fetchImpl } = setup([]);
		// Act / Assert
		await expect(
			engine.synthesize({ ...req('东西', { kind: 'word', style: 'poetry-reading' }), text: 'dōng' })
		).rejects.toThrow('does not split into its hanzi');
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('refuses a pinyin-chart cell without calling Azure', async () => {
		const { engine, fetchImpl } = setup([]);
		await expect(
			engine.synthesize(req('bā', { kind: 'syllable', style: undefined }))
		).rejects.toThrow('not an Azure clip');
		expect(fetchImpl).not.toHaveBeenCalled();
	});
	it('spaces concurrent requests by the interval instead of firing them together', async () => {
		vi.useFakeTimers({ now: 0 });
		try {
			const { engine, sleep } = setup([], 100);
			await Promise.all(['一', '二', '三'].map((h) => engine.synthesize(req(h))));
			expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
		} finally {
			vi.useRealTimers();
		}
	});
});
