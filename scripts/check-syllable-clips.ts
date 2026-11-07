import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { addTone, audioKey, type AudioEntry } from '../src/lib/content/import/audio';

const fail = (message: string): never => {
	console.error(message);
	process.exit(2);
};

if (existsSync('.env')) process.loadEnvFile('.env');
const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
if (!base) fail('R2_PUBLIC_URL is missing or empty (set it in .env)');
if (!URL.canParse(base)) fail('R2_PUBLIC_URL is not a valid URL');

let manifestPath = process.argv[2];
if (!manifestPath) {
	const { sha } = existsSync('static/content/current.json')
		? JSON.parse(readFileSync('static/content/current.json', 'utf8'))
		: { sha: '' };
	manifestPath = `static/content/${sha}/audio-manifest.json`;
}
if (!existsSync(manifestPath))
	fail('no audio manifest: run pnpm import:content content --sink bundle --only lessons/hsk1');

const entries = (JSON.parse(readFileSync(manifestPath, 'utf8')).entries as AudioEntry[]).filter(
	(e) => e.kind === 'syllable'
);
const rows = parse(readFileSync('content/syllables.yaml', 'utf8')) as { syllable: string }[];

const labelOf = new Map<string, string>();
const lost: string[] = [];
const manifestKeys = new Set(entries.map((e) => e.key));
for (const { syllable } of rows)
	for (const tone of [1, 2, 3, 4]) {
		const key = audioKey(addTone(syllable, tone), 'narrator');
		labelOf.set(key, `${syllable}${tone}`);
		if (!manifestKeys.has(key)) lost.push(`${syllable}${tone}`);
	}
for (const label of lost) console.log(`not in manifest: ${label}`);

type Verdict = 'present' | 'missing' | 'unreachable';
const probe = async (e: AudioEntry): Promise<[Verdict, string]> => {
	let why = '';
	for (let attempt = 0; attempt < 4; attempt++) {
		if (attempt) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
		try {
			const res = await fetch(`${base}/${e.key}.mp3`, { method: 'HEAD' });
			if (res.status === 200)
				return [Number(res.headers.get('content-length')) > 0 ? 'present' : 'missing', ''];
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

const label = (e: AudioEntry) => labelOf.get(e.key) ?? e.hanzi;
const unreachable = entries.flatMap((e, i) => (verdicts[i]?.[0] === 'unreachable' ? [i] : []));
if (unreachable.length) {
	for (const i of unreachable) console.log(`unreachable: ${label(entries[i])} ${verdicts[i][1]}`);
	console.log(`unreachable: ${unreachable.length}`);
	process.exitCode = 2;
} else {
	const missing = entries.filter((_, i) => verdicts[i][0] === 'missing');
	const cells = entries.filter((e) => labelOf.has(e.key)).length;
	console.log(
		`syllable clips: ${entries.length} (${cells} cells, ${entries.length - cells} chips)`
	);
	for (const e of missing) console.log(`missing: ${label(e)}`);
	console.log(`missing: ${missing.length}`);
	process.exitCode = missing.length || lost.length ? 1 : 0;
}
