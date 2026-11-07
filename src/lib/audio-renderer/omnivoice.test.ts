import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { AudioEntry } from '../content/import/audio';
import { fakeBucket } from './fakes';
import { omniVoiceEngine, parseCast, type Cast, type RenderJob, type Worker } from './omnivoice';
import { render } from './render';

const key = (hanzi: string, voice: string) =>
	createHash('sha256')
		.update(hanzi + '|' + voice)
		.digest('hex');

const cast = parseCast(`
audition: 试音
voices:
  redpanda: { id: redpanda-1, instruct: "female", seed: 1401, pace: 0.85 }
  narrator: { id: narrator-1, instruct: "male", seed: 1403, pace: 0.75 }
overrides:
  ${key('您好！', 'narrator')}: { hanzi: "您好！", voice: narrator, say: "NIN2HAO3！", seed: 7 }
`);

const req = (hanzi: string, voice = 'narrator', kind: AudioEntry['kind'] = 'sentence') => ({
	text: hanzi,
	voice,
	key: key(hanzi, voice),
	kind,
	hanzi
});

function setup(
	opts: {
		said?: (text: string, seed: number) => string;
		faults?: string[][];
		cast?: Cast;
		cacheDir?: string;
	} = {}
) {
	const jobs: RenderJob[] = [];
	const transcribed: string[] = [];
	const faultQueue = [...(opts.faults ?? [])];
	const worker: Worker = {
		async render(job) {
			jobs.push(job);
			writeFileSync(job.out, 'wav');
		},
		async transcribe(mp3) {
			transcribed.push(mp3);
			const last = jobs[jobs.length - 1];
			return opts.said ? opts.said(last.text, last.seed) : last.text;
		},
		close() {}
	};
	const startWorker = vi.fn(() => worker);
	const engine = omniVoiceEngine(opts.cast ?? cast, {
		startWorker,
		cacheDir: opts.cacheDir ?? mkdtempSync(join(tmpdir(), 'chaiyo-test-')),
		encode: (_wav, mp3) => writeFileSync(mp3, 'mp3'),
		faults: () => faultQueue.shift() ?? []
	});
	const clips = () => jobs.filter((j) => j.ref_audio);
	return { engine, jobs, clips, transcribed, startWorker };
}

describe('omniVoiceEngine', () => {
	it('sends the override say text and seed for its key', async () => {
		const { engine, clips } = setup();
		await engine.synthesize(req('您好！'));
		expect(clips()).toMatchObject([{ text: 'NIN2HAO3！', seed: 7, ref_text: '试音' }]);
	});

	it('uses the cast seed and the entry text without an override', async () => {
		const { engine, clips } = setup();
		const mp3 = await engine.synthesize(req('谢谢', 'redpanda'));
		expect(clips()).toMatchObject([{ text: '谢谢', seed: 1401 }]);
		expect(new TextDecoder().decode(mp3)).toBe('mp3');
	});

	it('renders each reference clip once and reuses it', async () => {
		const { engine, jobs, clips } = setup();
		await engine.synthesize(req('谢谢', 'redpanda'));
		await engine.synthesize(req('再见', 'redpanda'));
		expect(jobs.filter((j) => j.instruct)).toMatchObject([
			{ text: '试音', seed: 1401, instruct: 'female' }
		]);
		expect(new Set(clips().map((j) => j.ref_audio)).size).toBe(1);
	});

	it('rejects an unknown voice', async () => {
		const { engine } = setup();
		await expect(engine.synthesize(req('谢谢', 'nobody'))).rejects.toThrow('unknown voice: nobody');
	});

	it('retries a gate failure with the cumulative seeds, then fails', async () => {
		const { engine, clips } = setup({
			faults: [[], ['rushed'], ['rushed'], ['rushed'], ['rushed']]
		});
		await expect(engine.synthesize(req('谢谢'))).rejects.toThrow('谢谢: rushed');
		expect(clips().map((j) => j.seed)).toEqual([1403, 2403, 4403, 7403]);
	});

	it('retries when Whisper hears other hanzi', async () => {
		const { engine, clips } = setup({ said: (text, seed) => (seed === 1403 ? '一行' : text) });
		await engine.synthesize(req('银行'));
		expect(clips().map((j) => j.seed)).toEqual([1403, 2403]);
	});

	it('attempts an override once, without Whisper', async () => {
		const { engine, clips, transcribed } = setup({ faults: [[], ['rushed']] });
		await expect(engine.synthesize(req('您好！'))).rejects.toThrow('rushed');
		expect(clips()).toHaveLength(1);
		expect(transcribed).toHaveLength(0);
	});

	it('never sends a syllable to Whisper', async () => {
		const { engine, transcribed } = setup();
		await engine.synthesize(req('mǎ', 'narrator', 'syllable'));
		expect(transcribed).toHaveLength(0);
	});

	it('renders a failing audition once and fails the voice clips with its error', async () => {
		const { engine, jobs } = setup({ faults: [['mostly silence']] });
		await expect(engine.synthesize(req('谢谢', 'redpanda'))).rejects.toThrow(
			'audition for redpanda failed: mostly silence'
		);
		await expect(engine.synthesize(req('再见', 'redpanda'))).rejects.toThrow(
			'audition for redpanda'
		);
		expect(jobs).toHaveLength(1);
	});

	it('never starts the worker when every entry is already in the bucket', async () => {
		const { engine, startWorker } = setup();
		const bucket = fakeBucket();
		const entry: AudioEntry = {
			key: key('谢谢', 'narrator'),
			kind: 'sentence',
			ref: 's-1',
			voice: 'narrator',
			hanzi: '谢谢'
		};
		await bucket.put(entry.key + '.mp3', new Uint8Array([1]), 'audio/mpeg');
		expect(await render([entry], { engine, bucket })).toEqual({ uploaded: 0, skipped: 1 });
		expect(startWorker).not.toHaveBeenCalled();
	});

	it('compares Whisper with the hanzi, not the pinyin reading of a split Word', async () => {
		const { engine, clips } = setup({ said: () => '打' });
		const split = { ...req('打', 'narrator', 'word'), text: 'dá' };
		await engine.synthesize(split);
		expect(clips()).toMatchObject([{ text: 'dá' }]);
	});

	it.each([
		['say only', '{ hanzi: "再见", voice: narrator, say: "ZAI4JIAN4" }'],
		['seed only', '{ hanzi: "再见", voice: narrator, seed: 9 }']
	])('attempts an override with %s once and skips Whisper', async (_name, entry) => {
		const pinnedCast = parseCast(`
audition: 试音
voices:
  narrator: { id: narrator-1, instruct: "male", seed: 1403, pace: 0.75 }
overrides:
  ${key('再见', 'narrator')}: ${entry}
`);
		const { engine, clips, transcribed } = setup({ cast: pinnedCast, faults: [[], ['rushed']] });
		await expect(engine.synthesize(req('再见'))).rejects.toThrow('rushed');
		expect(clips()).toHaveLength(1);
		expect(transcribed).toHaveLength(0);
	});

	it('misses the reference cache when instruct changes', async () => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'chaiyo-cache-'));
		const first = setup({ cacheDir });
		await first.engine.synthesize(req('谢谢', 'redpanda'));
		const edited = parseCast(
			'audition: 试音\nvoices:\n  redpanda: { id: redpanda-1, instruct: "female, bright", seed: 1401, pace: 0.85 }\n'
		);
		const second = setup({ cacheDir, cast: edited });
		await second.engine.synthesize(req('谢谢', 'redpanda'));
		expect(first.jobs.filter((j) => j.instruct)).toHaveLength(1);
		expect(second.jobs.filter((j) => j.instruct)).toMatchObject([{ instruct: 'female, bright' }]);
	});

	it('misses the reference cache when the audition text changes', async () => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'chaiyo-cache-'));
		const first = setup({ cacheDir });
		await first.engine.synthesize(req('谢谢', 'redpanda'));
		const edited = parseCast(
			'audition: 新试音\nvoices:\n  redpanda: { id: redpanda-1, instruct: "female", seed: 1401, pace: 0.85 }\n'
		);
		const second = setup({ cacheDir, cast: edited });
		await second.engine.synthesize(req('谢谢', 'redpanda'));
		expect(second.jobs.filter((j) => j.instruct)).toMatchObject([{ text: '新试音' }]);
	});
});
