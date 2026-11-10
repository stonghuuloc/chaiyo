import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AudioEntry } from '../content/import/audio';
import { fakeBucket, fakeEngine } from './fakes';
import { render } from './render';
import { RenderError, type Bytes, type Engine } from './types';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const entry = (hanzi: string, voice: string): AudioEntry => ({
	key: sha(hanzi + '|' + voice),
	kind: 'sentence',
	ref: `${hanzi}@${voice}`,
	voice,
	hanzi
});
const three = () => [
	entry('你好！', 'redpanda'),
	entry('你好！', 'takin'),
	entry('谢谢', 'redpanda')
];
const call = (hanzi: string, voice: string) => ({
	text: hanzi,
	voice,
	key: sha(hanzi + '|' + voice),
	kind: 'sentence',
	hanzi
});
const names = (entries: AudioEntry[]) => entries.map((e) => e.key + '.mp3').sort();

describe('render', () => {
	it('uploads every clip on a first run', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		expect(await render(three(), { engine, bucket })).toEqual({ uploaded: 3, skipped: 0 });
		expect([...bucket.objects.keys()].sort()).toEqual(names(three()));
		for (const o of bucket.objects.values()) expect(o.contentType).toBe('audio/mpeg');
		expect(engine.calls).toEqual([
			call('你好！', 'redpanda'),
			call('你好！', 'takin'),
			call('谢谢', 'redpanda')
		]);
	});

	it('uploads nothing on a re-run', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		await render(three(), { engine, bucket });
		engine.calls.length = 0;
		expect(await render(three(), { engine, bucket })).toEqual({ uploaded: 0, skipped: 3 });
		expect(engine.calls).toHaveLength(0);
	});

	it('renders only the new entry', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		await render(three(), { engine, bucket });
		engine.calls.length = 0;
		expect(await render([...three(), entry('再见', 'redpanda')], { engine, bucket })).toEqual({
			uploaded: 1,
			skipped: 3
		});
		expect(engine.calls).toEqual([call('再见', 'redpanda')]);
	});

	it('keys on sha256 of text and voice, one object per key', async () => {
		const bucket = fakeBucket();
		const entries = [...three(), entry('谢谢', 'redpanda')];
		const engine = fakeEngine();
		expect(await render(entries, { engine, bucket })).toEqual({ uploaded: 3, skipped: 0 });
		expect(engine.calls).toHaveLength(3);
		expect([...bucket.objects.keys()].sort()).toEqual(names(three()));
	});

	it('keys a split Word on its id and speaks its reading', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		const split: AudioEntry = {
			key: sha('打-da2|redpanda'),
			kind: 'word',
			ref: '打-da2',
			voice: 'redpanda',
			hanzi: '打',
			reading: 'dá',
			split: true
		};
		await render([split], { engine, bucket });
		expect([...bucket.objects.keys()]).toEqual([sha('打-da2|redpanda') + '.mp3']);
		expect(engine.calls).toEqual([
			{ text: 'dá', voice: 'redpanda', key: split.key, kind: 'word', hanzi: '打' }
		]);
	});

	it('rejects a tampered key before any engine call', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		const bad = { ...entry('谢谢', 'redpanda'), key: sha('x') };
		await expect(render([entry('你好！', 'takin'), bad], { engine, bucket })).rejects.toThrow(
			'key mismatch: 谢谢@redpanda'
		);
		expect(engine.calls).toHaveLength(0);
		expect(bucket.objects.size).toBe(0);
	});

	it('keeps going after an engine failure, then throws, and a re-run finishes', async () => {
		const bucket = fakeBucket();
		const broken = fakeEngine((req) => {
			if (req.voice === 'takin') throw new Error('boom');
			return new Uint8Array([1]);
		});
		const err = await render(three(), { engine: broken, bucket }).catch((e) => e);
		expect(err).toBeInstanceOf(RenderError);
		expect(err.uploaded).toBe(2);
		expect(err.skipped).toBe(0);
		expect(err.failures).toEqual([
			{ key: sha('你好！|takin'), ref: '你好！@takin', message: 'boom' }
		]);
		expect(bucket.objects.has(sha('谢谢|redpanda') + '.mp3')).toBe(true);
		expect(bucket.objects.size).toBe(2);
		expect(await render(three(), { engine: fakeEngine(), bucket })).toEqual({
			uploaded: 1,
			skipped: 2
		});
	});

	it('treats 0 bytes as a failure and puts nothing', async () => {
		const bucket = fakeBucket();
		const err = await render([entry('谢谢', 'redpanda')], {
			engine: fakeEngine(() => new Uint8Array()),
			bucket
		}).catch((e) => e);
		expect(err).toBeInstanceOf(RenderError);
		expect(err.failures[0].message).toBe('engine returned 0 bytes');
		expect(bucket.objects.size).toBe(0);
	});

	it('records a non-Error throw as a failure and keeps going', async () => {
		const bucket = fakeBucket();
		const engine = fakeEngine((req) => {
			if (req.voice === 'takin') throw 'plain string';
			return new Uint8Array([1]);
		});
		const err = await render(three(), { engine, bucket }).catch((e) => e);
		expect(err).toBeInstanceOf(RenderError);
		expect(err.failures[0].message).toBe('plain string');
		expect(err.uploaded).toBe(2);
	});

	it('keeps going after a bucket put failure and reports it', async () => {
		const bucket = fakeBucket();
		const flaky = {
			has: bucket.has,
			async put(name: string, body: Bytes, contentType: string) {
				if (name === sha('你好！|takin') + '.mp3') throw new Error('r2 down');
				return bucket.put(name, body, contentType);
			}
		};
		const err = await render(three(), { engine: fakeEngine(), bucket: flaky }).catch((e) => e);
		expect(err).toBeInstanceOf(RenderError);
		expect(err.uploaded).toBe(2);
		expect(err.skipped).toBe(0);
		expect(err.failures).toEqual([
			{ key: sha('你好！|takin'), ref: '你好！@takin', message: 'r2 down' }
		]);
		expect(bucket.objects.size).toBe(2);
	});

	it('uploads a recorded clip without calling the engine, and renders the rest', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		const clip = new TextEncoder().encode('human') as Bytes;
		const [a, b] = [entry('谢谢', 'redpanda'), entry('再见', 'redpanda')];
		const result = await render([a, b], {
			engine,
			bucket,
			recorded: (key) => (key === a.key ? clip : undefined)
		});
		expect(result).toEqual({ uploaded: 2, skipped: 0 });
		expect(engine.calls.map((c) => c.hanzi)).toEqual(['再见']);
		expect(bucket.objects.get(a.key + '.mp3')?.body).toEqual(clip);
	});

	it('skips a recorded clip already in the bucket', async () => {
		const engine = fakeEngine();
		const bucket = fakeBucket();
		const a = entry('谢谢', 'redpanda');
		const recorded = () => new Uint8Array([1]) as Bytes;
		await render([a], { engine, bucket, recorded });
		expect(await render([a], { engine, bucket, recorded })).toEqual({ uploaded: 0, skipped: 1 });
	});

	it('stores each clip under the prefix', async () => {
		const bucket = fakeBucket();
		const a = entry('谢谢', 'redpanda');
		await render([a], { engine: fakeEngine(), bucket, prefix: 'mv1/' });
		expect([...bucket.objects.keys()]).toEqual([`mv1/${a.key}.mp3`]);
	});
	it('renders up to `concurrency` clips at once, each key once', async () => {
		let running = 0;
		let peak = 0;
		const engine: Engine = {
			async synthesize(req) {
				peak = Math.max(peak, ++running);
				await new Promise((r) => setTimeout(r, 5));
				running--;
				return new TextEncoder().encode(req.key);
			}
		};
		const bucket = fakeBucket();
		const many = [...Array(10)].map((_, n) => entry(`句${n}`, 'redpanda'));
		expect(await render([...many, many[0]], { engine, bucket, concurrency: 4 })).toEqual({
			uploaded: 10,
			skipped: 0
		});
		expect(peak).toBe(4);
		expect([...bucket.objects.keys()].sort()).toEqual(names(many));
	});
});
