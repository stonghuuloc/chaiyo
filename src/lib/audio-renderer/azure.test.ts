import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { azureEngine, azureRequest, billable, endLevel, parseCast, ssml } from './azure';

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
const ended = wav([...tone(200), ...silence(100)]);
const cut = wav(tone(200));
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

describe('endLevel', () => {
	it('reads the last 10 ms against the loudest 10 ms', () => {
		expect(endLevel(ended)).toBeLessThan(-100);
		expect(endLevel(cut)).toBeGreaterThan(-1);
	});
});

describe('azureEngine', () => {
	const setup = (
		statuses: number[],
		faults: string[][] = [],
		{
			takes = [] as Uint8Array<ArrayBuffer>[],
			rawDir
		}: { takes?: Uint8Array<ArrayBuffer>[]; rawDir?: string } = {}
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
		const engine = azureEngine(cast, {
			key: 'k',
			region: 'r',
			cacheDir,
			rawDir,
			fetchImpl: fetchImpl as unknown as typeof fetch,
			encode: (wav, mp3, cut) => writeFileSync(mp3, `mp3:${readFileSync(wav).length}:${cut}`),
			faults: faultsOf,
			sleep,
			minIntervalMs: 0
		});
		return { engine, fetchImpl, sleep, faultsOf, cacheDir };
	};

	it('posts SSML to the region endpoint and caches the clip by key and request', async () => {
		const { engine, fetchImpl, cacheDir } = setup([]);
		const body = await engine.synthesize(req('你好！'));
		expect(new TextDecoder().decode(body)).toBe(`mp3:${ended.length}:false`);
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

	it('asks again when the take is cut off at the end, before encoding it', async () => {
		const { engine, fetchImpl, faultsOf } = setup([], [], { takes: [cut] });
		await engine.synthesize(req('好'));
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(faultsOf).toHaveBeenCalledTimes(1);
		const bad = setup([], [], { takes: [cut, cut, cut] });
		await expect(bad.engine.synthesize(req('好'))).rejects.toThrow('好: cut off at the end');
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

	it('replaces a kept raw take that fails, with three fresh takes left', async () => {
		const rawDir = mkdtempSync(join(tmpdir(), 'azure-raw-'));
		await setup([], [], { rawDir }).engine.synthesize(req('好'));
		const [name] = readdirSync(rawDir);
		writeFileSync(join(rawDir, name), cut);
		const again = setup([], [], { takes: [cut, cut], rawDir });
		await again.engine.synthesize(req('好'));
		expect(again.fetchImpl).toHaveBeenCalledTimes(3);
		expect(readFileSync(join(rawDir, name))).toEqual(Buffer.from(ended));
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
