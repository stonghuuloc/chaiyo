import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { azureEngine, azureRequest, billable, parseCast, ssml, tailFall } from './azure';

const cast = parseCast(readFileSync('content/cast.yaml', 'utf8'));
const wav = (samples: number[]) => {
	const out = new Uint8Array(44 + samples.length * 2);
	const view = new DataView(out.buffer);
	out.set(new TextEncoder().encode('RIFF'), 0);
	out.set(new TextEncoder().encode('WAVEfmt '), 8);
	view.setUint32(16, 16, true);
	view.setUint32(24, 24000, true);
	out.set(new TextEncoder().encode('data'), 36);
	view.setUint32(40, samples.length * 2, true);
	samples.forEach((s, i) => view.setInt16(44 + i * 2, s, true));
	return out;
};
const tone = (ms: number) =>
	Array.from({ length: ms * 24 }, (_, i) => Math.round(8000 * Math.sin(i / 3)));
const silence = (ms: number) => new Array<number>(ms * 24).fill(0);
const decay = (ms: number) => tone(ms).map((s, i) => Math.round(s * 10 ** (-(6 * i) / 240 / 20)));
const ended = wav([...tone(200), ...decay(200), ...silence(100)]);
const cut = wav([...tone(200), ...silence(100)]);
const req = (
	hanzi: string,
	kind: 'sentence' | 'word' | 'syllable' = 'sentence',
	voice = 'redpanda'
) => ({
	key: `k-${hanzi}-${voice}`,
	kind,
	voice,
	hanzi,
	text: hanzi
});

describe('cast', () => {
	it('two voices, takin differs from redpanda, plain at -20%', () => {
		expect(cast.rate).toBe('-20%');
		expect(Object.keys(cast.voices)).toEqual(['redpanda', 'takin']);
		expect(cast.voices.redpanda).toBe('zh-CN-Xiaoke:DragonHDFlashLatestNeural');
		expect(cast.voices.takin).not.toBe(cast.voices.redpanda);
	});

	it('rejects an OmniVoice cast', () => {
		expect(() => parseCast('engine: omnivoice\nrate: "-20%"\nvoices: {}')).toThrow();
	});
});

describe('ssml', () => {
	it('slows plain text inside the voice and escapes markup', () => {
		const body = ssml(cast, 'v', 'a<b&c');
		expect(body).toContain(
			'<voice name="v"><prosody rate="-20%">a&lt;b&amp;c<break time="250ms"/></prosody></voice>'
		);
		expect(body).not.toContain('express-as');
		expect(body).not.toContain('phoneme');
	});

	it('bills hanzi twice and the prosody tag, not speak or voice', () => {
		expect(billable(ssml(cast, 'v', '您好'))).toBe(
			4 + '<prosody rate="-20%"><break time="250ms"/></prosody>'.length
		);
	});
});

describe('azureRequest', () => {
	it('sends the carrier hanzi for a syllable cell and the hanzi for a chip', () => {
		expect(azureRequest(cast, req('bā', 'syllable'))!.body).toContain('>八<break');
		expect(azureRequest(cast, req('nǐ hǎo', 'syllable'))!.body).toContain('>你好<break');
	});

	it('marks a word carrier for the cut and skips a cell with no carrier', () => {
		expect(azureRequest(cast, req('biè', 'syllable'))!.cut).toBe(true);
		expect(azureRequest(cast, req('bā', 'syllable'))!.cut).toBe(false);
		expect(azureRequest(cast, req('biā', 'syllable'))).toBeUndefined();
	});

	it('sends a sentence as written, in the voice of its speaker', () => {
		const body = azureRequest(cast, req('对不起！', 'sentence', 'takin'))!.body;
		expect(body).toContain(`<voice name="${cast.voices.takin}">`);
		expect(body).toContain('>对不起！<break');
		expect(() => azureRequest(cast, req('x', 'sentence', 'nobody'))).toThrow('unknown voice');
	});
});

describe('tailFall', () => {
	it('reads the fall in the 20 ms after the last frame within 20 dB of the peak', () => {
		expect(tailFall(ended)).toBeLessThan(50);
		expect(tailFall(cut)).toBeGreaterThan(50);
		expect(tailFall(wav(tone(200)))).toBe(Infinity);
	});
});

describe('azureEngine', () => {
	const setup = (
		statuses: number[],
		faults: string[][] = [],
		{
			takes = [] as Uint8Array<ArrayBuffer>[],
			rawDir,
			missing = [] as number[]
		}: { takes?: Uint8Array<ArrayBuffer>[]; rawDir?: string; missing?: number[] } = {}
	) => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'azure-test-'));
		const fetchImpl = vi.fn(async () => {
			const status = statuses.shift() ?? 200;
			return new Response(status === 200 ? (takes.shift() ?? ended) : null, {
				status,
				headers: status === 429 ? { 'retry-after': '1' } : {}
			});
		});
		const sleep = vi.fn(async () => {});
		const faultsOf = vi.fn<(file: string, hanzi?: number, min?: number) => string[]>(
			() => faults.shift() ?? []
		);
		const hear = vi.fn<(wav: string, text: string) => Promise<number>>(
			async () => missing.shift() ?? 0
		);
		const engine = azureEngine(cast, {
			key: 'k',
			region: 'r',
			cacheDir,
			rawDir,
			fetchImpl: fetchImpl as unknown as typeof fetch,
			encode: (wav, mp3, cut) => writeFileSync(mp3, `mp3:${readFileSync(wav).length}:${cut}`),
			encodeClip: (wav, mp3) => writeFileSync(mp3, `plain:${readFileSync(wav).length}`),
			faults: faultsOf,
			hear,
			sleep,
			minIntervalMs: 0
		});
		return { engine, fetchImpl, sleep, faultsOf, hear, cacheDir };
	};

	it('posts SSML to the region endpoint and caches the clip by key and request', async () => {
		const { engine, fetchImpl, cacheDir } = setup([]);
		const body = await engine.synthesize(req('你好！'));
		expect(new TextDecoder().decode(body)).toBe(`plain:${ended.length}`);
		expect(fetchImpl).toHaveBeenCalledWith(
			'https://r.tts.speech.microsoft.com/cognitiveservices/v1',
			expect.objectContaining({ method: 'POST' })
		);
		await engine.synthesize(req('你好！'));
		expect(fetchImpl).toHaveBeenCalledTimes(1);
		expect(existsSync(cacheDir)).toBe(true);
		engine.close();
	});

	it('waits out a 429 and gives up on a 400', async () => {
		const a = setup([429, 200]);
		await a.engine.synthesize(req('好'));
		expect(a.sleep).toHaveBeenCalledWith(1000);
		const b = setup([400]);
		await expect(b.engine.synthesize(req('好'))).rejects.toThrow('Azure answered 400');
	});

	it('asks again when the gate fails, three takes at most', async () => {
		const ok = setup([], [['too short (0.10 s)']]);
		await ok.engine.synthesize(req('好'));
		expect(ok.fetchImpl).toHaveBeenCalledTimes(2);
		const bad = setup([], [['a'], ['b'], ['c']]);
		await expect(bad.engine.synthesize(req('好'))).rejects.toThrow('好: c');
		expect(bad.fetchImpl).toHaveBeenCalledTimes(3);
	});

	it('asks again when the take is cut off at the end, before encoding it, sixteen takes at most', async () => {
		const { engine, fetchImpl, faultsOf } = setup([], [], { takes: [cut] });
		await engine.synthesize(req('好'));
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(faultsOf).toHaveBeenCalledTimes(1);
		const bad = setup([], [], { takes: new Array(16).fill(cut) });
		await expect(bad.engine.synthesize(req('好'))).rejects.toThrow('好: cut off at the end');
		expect(bad.fetchImpl).toHaveBeenCalledTimes(16);
		expect(bad.faultsOf).not.toHaveBeenCalled();
	});

	it('keeps the accepted raw take and encodes it again without calling Azure', async () => {
		const rawDir = mkdtempSync(join(tmpdir(), 'azure-raw-'));
		const first = setup([], [], { takes: [cut], rawDir });
		await first.engine.synthesize(req('好'));
		expect(readdirSync(rawDir)).toHaveLength(1);
		const again = setup([], [], { rawDir });
		await again.engine.synthesize(req('好'));
		expect(again.fetchImpl).not.toHaveBeenCalled();
		expect(again.faultsOf).toHaveBeenCalledTimes(1);
	});

	it('replaces a kept raw take that is cut off with a fresh take', async () => {
		const rawDir = mkdtempSync(join(tmpdir(), 'azure-raw-'));
		await setup([], [], { rawDir }).engine.synthesize(req('好'));
		const [name] = readdirSync(rawDir);
		writeFileSync(join(rawDir, name), cut);
		const again = setup([], [], { takes: [cut, cut], rawDir });
		await again.engine.synthesize(req('好'));
		expect(again.fetchImpl).toHaveBeenCalledTimes(3);
		expect(readFileSync(join(rawDir, name))).toEqual(Buffer.from(ended));
	});

	it('keeps the trimmed encode for syllable cells and stores other clips as Azure returned them', async () => {
		const { engine } = setup([]);
		const text = async (r: ReturnType<typeof req>) =>
			new TextDecoder().decode(await engine.synthesize(r));
		expect(await text(req('bā', 'syllable'))).toBe(`mp3:${ended.length}:false`);
		expect(await text(req('nǐ hǎo', 'syllable'))).toBe(`plain:${ended.length}`);
		expect(await text(req('您', 'word'))).toBe(`plain:${ended.length}`);
	});

	it('asks again when Whisper misses a syllable and keeps the first take it hears in full', async () => {
		const { engine, fetchImpl, hear } = setup([], [], { missing: [1, 0] });
		await engine.synthesize(req('它现在起作用了。'));
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(hear).toHaveBeenLastCalledWith(expect.stringMatching(/\.wav$/), '它现在起作用了。');
	});

	it('keeps the take with the fewest missed syllables after six misheard takes', async () => {
		const takes = [1, 2, 3, 4, 5, 6].map((n) => wav([...tone(200 + n * 10), ...decay(200)]));
		const rawDir = mkdtempSync(join(tmpdir(), 'azure-raw-'));
		const { engine, fetchImpl } = setup([], [], {
			takes: [...takes],
			missing: [3, 2, 1, 2, 3, 2],
			rawDir
		});
		const body = await engine.synthesize(req('家父今年六十岁。'));
		expect(fetchImpl).toHaveBeenCalledTimes(6);
		expect(new TextDecoder().decode(body)).toBe(`plain:${takes[2].length}`);
		expect(readFileSync(join(rawDir, readdirSync(rawDir)[0]))).toEqual(Buffer.from(takes[2]));
	});

	it('replaces a kept raw take that Whisper mishears with a fresh take', async () => {
		const rawDir = mkdtempSync(join(tmpdir(), 'azure-raw-'));
		const fresh = wav([...tone(300), ...decay(200)]);
		await setup([], [], { rawDir }).engine.synthesize(req('好'));
		const again = setup([], [], { takes: [fresh], missing: [1, 0], rawDir });
		await again.engine.synthesize(req('好'));
		expect(again.fetchImpl).toHaveBeenCalledTimes(1);
		expect(readFileSync(join(rawDir, readdirSync(rawDir)[0]))).toEqual(Buffer.from(fresh));
	});

	it('does not ask Whisper about a syllable cell', async () => {
		const { engine, hear } = setup([]);
		await engine.synthesize(req('bā', 'syllable'));
		expect(hear).not.toHaveBeenCalled();
		await engine.synthesize(req('nǐ hǎo', 'syllable'));
		expect(hear).toHaveBeenCalledWith(expect.any(String), '你好');
	});

	it('lets a syllable clip be shorter than a word', async () => {
		const { engine, faultsOf } = setup([]);
		await engine.synthesize(req('bā', 'syllable'));
		await engine.synthesize(req('您', 'word'));
		expect(faultsOf.mock.calls.map((c) => c[2])).toEqual([0.15, undefined]);
	});

	it('refuses a word whose reading is not its hanzi without calling Azure', async () => {
		const { engine, fetchImpl } = setup([]);
		await expect(engine.synthesize({ ...req('行', 'word'), text: 'háng' })).rejects.toThrow(
			'Azure takes hanzi'
		);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('refuses a cell with no carrier without calling Azure', async () => {
		const { engine, fetchImpl } = setup([]);
		await expect(engine.synthesize(req('biā', 'syllable'))).rejects.toThrow('no carrier');
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
