import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { AUDIO_VERSION, SYLLABLE_VERSION } from '../src/lib/audio/version';
import { noClipReason } from '../src/lib/audio-renderer/recorded';
import { addTone, audioKey, type AudioEntry } from '../src/lib/content/import/audio';

const fail = (message: string): never => {
	console.error(message);
	process.exit(2);
};

if (existsSync('.env')) process.loadEnvFile('.env');
const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
if (!base) fail('R2_PUBLIC_URL is missing or empty (set it in .env)');
if (!URL.canParse(base)) fail('R2_PUBLIC_URL is not a valid URL');

const argv = process.argv.slice(2);
const tones = argv.includes('--tones');
const all = argv.includes('--all');
const prefixAt = argv.indexOf('--prefix');
const prefixValue = prefixAt >= 0 ? argv.splice(prefixAt, 2)[1] : undefined;
if (prefixAt >= 0 && (!prefixValue || prefixValue.startsWith('--'))) fail('--prefix needs a value');
const tidy = (p: string) => `${p.replace(/\/+$/, '')}/`;
const unknownFlag = argv.find((a) => a.startsWith('--') && a !== '--tones' && a !== '--all');
if (unknownFlag) fail(`unknown option ${unknownFlag}`);
let manifestPath = argv.find((a) => !a.startsWith('--'));
if (!manifestPath) {
	const { sha } = existsSync('static/content/current.json')
		? JSON.parse(readFileSync('static/content/current.json', 'utf8'))
		: { sha: '' };
	manifestPath = `static/content/${sha}/audio-manifest.json`;
}
if (!existsSync(manifestPath))
	fail('no audio manifest: run pnpm import:content content --sink bundle --only lessons/hsk1');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')).entries as AudioEntry[];
const syllables = manifest.filter((e) => e.kind === 'syllable');
const rows = parse(readFileSync('content/syllables.yaml', 'utf8')) as { syllable: string }[];

const labelOf = new Map<string, string>();
const prefixOf = (e: AudioEntry) =>
	prefixValue ? tidy(prefixValue) : tidy(labelOf.has(e.key) ? SYLLABLE_VERSION : AUDIO_VERSION);
const lost: string[] = [];
const manifestKeys = new Set(syllables.map((e) => e.key));
const noClip = new Map<string, string>();
for (const { syllable } of rows)
	for (const tone of [1, 2, 3, 4]) {
		const key = audioKey(addTone(syllable, tone), 'redpanda');
		const reason = noClipReason(`${syllable}${tone}`);
		if (reason) noClip.set(key, `${syllable}${tone}`);
		labelOf.set(key, `${syllable}${tone}`);
		if (!manifestKeys.has(key)) lost.push(`${syllable}${tone}`);
	}
for (const label of lost) console.log(`not in manifest: ${label}`);
const entries = (all ? manifest : syllables).filter((e) => !noClip.has(e.key));

const retry = async <T>(run: () => Promise<T>): Promise<T> => {
	for (let attempt = 0; ; attempt++) {
		try {
			return await run();
		} catch (err) {
			if (attempt === 3) throw err;
			await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
		}
	}
};

type Verdict = 'present' | 'missing' | 'unreachable';
const probe = async (e: AudioEntry): Promise<[Verdict, string]> => {
	let why = '';
	for (let attempt = 0; attempt < 4; attempt++) {
		if (attempt) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
		try {
			const res = await fetch(`${base}/${prefixOf(e)}${e.key}.mp3`, {
				method: 'HEAD',
				signal: AbortSignal.timeout(10_000)
			});
			if (res.status === 200)
				return [res.headers.get('content-length') === '0' ? 'missing' : 'present', ''];
			if (res.status === 404) return ['missing', ''];
			why = String(res.status);
		} catch (err) {
			why = err instanceof Error ? err.message : String(err);
		}
	}
	return ['unreachable', why];
};

const verdicts: [Verdict, string][] = new Array(entries.length);
let next = 0;
let down = 0;
let gaveUp = false;
await Promise.all(
	Array.from({ length: 8 }, async () => {
		while (next < entries.length && !gaveUp) {
			const i = next++;
			verdicts[i] = await probe(entries[i]);
			if (verdicts[i][0] === 'unreachable' && ++down === 5) gaveUp = true;
		}
	})
);

const label = (e: AudioEntry) =>
	labelOf.get(e.key) ?? (e.kind === 'syllable' ? e.hanzi : `${e.ref} ${e.hanzi} (${e.voice})`);
const unreachable = entries.flatMap((e, i) => (verdicts[i]?.[0] === 'unreachable' ? [i] : []));
if (unreachable.length) {
	for (const i of unreachable) console.log(`unreachable: ${label(entries[i])} ${verdicts[i][1]}`);
	console.log(`unreachable: ${unreachable.length}`);
	process.exitCode = 2;
} else {
	const missing = entries.filter((_, i) => verdicts[i][0] === 'missing');
	const cells = entries.filter((e) => labelOf.has(e.key)).length;
	const chips = entries.filter((e) => e.kind === 'syllable').length - cells;
	console.log(
		all
			? `manifest clips: ${entries.length} (${cells} cells, ${chips} chips, ${entries.length - cells - chips} words and sentences)`
			: `syllable clips: ${entries.length} (${cells} cells, ${chips} chips)`
	);
	if (noClip.size)
		console.log(
			`no clip (no recording): ${noClip.size} ${[...noClip.values()].join(' ')}`
		);
	for (const e of missing) console.log(`missing: ${label(e)}`);
	console.log(`missing: ${missing.length}`);

	const sample = entries
		.filter((e, i) => labelOf.has(e.key) && verdicts[i][0] === 'present')
		.filter((_, i, all) => i % Math.max(1, Math.floor(all.length / 20)) === 0)
		.slice(0, 20);
	let badHeaders = 0;
	for (const e of sample) {
		const res = await retry(() =>
			fetch(`${base}/${prefixOf(e)}${e.key}.mp3`, {
				method: 'HEAD',
				signal: AbortSignal.timeout(10_000)
			})
		);
		const type = res.headers.get('content-type') ?? '';
		const cache = res.headers.get('cache-control') ?? '';
		if (res.status === 200 && type.startsWith('audio/mpeg') && cache.includes('immutable'))
			continue;
		badHeaders++;
		console.log(`headers: ${label(e)} ${res.status} ${type} ${cache}`);
	}
	console.log(`header sample: ${sample.length}, bad: ${badHeaders}`);
	process.exitCode = missing.length || lost.length || badHeaders ? 1 : 0;
	if (tones && !process.exitCode) {
		const dir = mkdtempSync(join(tmpdir(), 'chaiyo-tones-'));
		process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
		const cellEntries = entries.filter((e) => labelOf.has(e.key));
		let at = 0;
		await Promise.all(
			Array.from({ length: 8 }, async () => {
				while (at < cellEntries.length) {
					const e = cellEntries[at++];
					const res = await retry(() =>
						fetch(`${base}/${prefixOf(e)}${e.key}.mp3`, { signal: AbortSignal.timeout(30_000) })
					);
					if (!res.ok) fail(`tone check: ${e.key} answered ${res.status}`);
					writeFileSync(join(dir, `${e.key}.mp3`), new Uint8Array(await res.arrayBuffer()));
				}
			})
		);
		const files = cellEntries.map((e) => join(dir, `${e.key}.mp3`));
		const run = spawnSync(
			'uv',
			[
				'run',
				'--with',
				'praat-parselmouth',
				'--with',
				'numpy',
				'python',
				'scripts/syllable-f0.py',
				...files
			],
			{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
		);
		if (run.status !== 0) fail(`tone scoring failed: ${run.error?.message ?? run.stderr.trim()}`);
		const heard = new Map(
			run.stdout
				.trim()
				.split('\n')
				.map((l) => l.split('\t') as [string, string])
		);
		let mismatches = 0;
		for (const e of cellEntries) {
			const want = labelOf.get(e.key)!.slice(-1);
			const got = heard.get(e.key);
			if (got === want) continue;
			mismatches++;
			console.log(`tone: ${labelOf.get(e.key)} heard ${got}`);
		}
		console.log(`tone mismatches: ${mismatches}`);
		process.exitCode = mismatches ? 1 : 0;
	}
}
