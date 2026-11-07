import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const DIR = process.env.SPIKE_DIR ?? 'spike';
const MODES = ['design', 'refclip'] as const;
const ROLES = ['redpanda', 'takin', 'narrator'] as const;
const CASES = [
	'hang',
	'xing',
	'bu-t4',
	'bu',
	'yi',
	't33',
	'redpanda',
	'takin',
	'poly',
	'force',
	'syllable'
];
const pad = (n: number) => String(n).padStart(2, '0');

type Mode = (typeof MODES)[number];
type Role = (typeof ROLES)[number];
type Item = {
	n: number;
	hanzi: string;
	voice: string;
	cases: string[];
	expected: string;
	force?: string;
};
type Candidate = { id: string; instruct: string };
type Spec = {
	voices: {
		engine: string;
		audition: string;
		seeds: Record<Role, number>;
		candidates: Record<Role, Candidate[]>;
	};
	items: Item[];
};
type Order = { n: number; A: Mode }[];
type Job = {
	group: string;
	id: string;
	wav: string;
	mp3: string;
	text: string;
	seed: number;
	instruct?: string;
	ref?: { id: string; wav: string };
	control: 'pinyin' | 'none';
};

const load = (): Spec => parse(readFileSync(join(DIR, 'sentences.yaml'), 'utf8'));
const loadOrder = (): Order | undefined =>
	existsSync(join(DIR, 'order.json'))
		? JSON.parse(readFileSync(join(DIR, 'order.json'), 'utf8'))
		: undefined;
const otherSide = (m: Mode): Mode => (m === 'design' ? 'refclip' : 'design');

function testSetFaults(set: Spec): string[] {
	const out: string[] = [];
	const items = set.items ?? [];
	if (items.length !== 30) out.push(`items: ${items.length}, want 30`);
	const seen = new Map<number, number>();
	for (const it of items) seen.set(it.n, (seen.get(it.n) ?? 0) + 1);
	for (const [n, c] of seen) if (c > 1) out.push(`duplicate n: ${n}`);
	for (const it of items) {
		if (!Number.isInteger(it.n) || it.n < 1 || it.n > 30) out.push(`n out of range: ${it.n}`);
		if (!(ROLES as readonly string[]).includes(it.voice))
			out.push(`unknown voice: ${it.voice} (n=${it.n})`);
		for (const c of it.cases) if (!CASES.includes(c)) out.push(`unknown case: ${c} (n=${it.n})`);
		if (it.cases.includes('force') !== !!it.force) out.push(`force mismatch (n=${it.n})`);
	}
	const has = (c: string, reading: string) =>
		items.some((it) => it.cases.includes(c) && it.expected.includes(reading));
	for (const [c, r] of [
		['hang', 'yín háng'],
		['xing', 'bù xíng'],
		['bu-t4', 'bú'],
		['t33', 'ní hǎo']
	])
		if (!has(c, r)) out.push(`case missing: ${c}`);
	for (const r of ['yī', 'yí', 'yì']) if (!has('yi', r)) out.push(`case missing: yi (${r})`);
	for (const v of ['redpanda', 'takin'])
		if (!items.some((it) => it.cases.includes(v) && it.voice === v)) out.push(`case missing: ${v}`);
	for (const r of ROLES)
		if (!set.voices?.candidates?.[r]?.length || !set.voices?.seeds?.[r])
			out.push(`voices missing: ${r}`);
	return out;
}

function folderFaults(name: string, want: string[]): string[] {
	const dir = join(DIR, name);
	const have = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mp3')) : [];
	return [
		...want.filter((f) => !have.includes(f)).map((f) => `missing: ${name}/${f}`),
		...have.filter((f) => !want.includes(f)).map((f) => `extra: ${name}/${f}`)
	];
}

function check() {
	const set = load();
	const faults = testSetFaults(set);
	const names = Array.from({ length: 30 }, (_, i) => `${pad(i + 1)}.mp3`);
	const voices = ROLES.flatMap((r) => (set.voices.candidates[r] ?? []).map((c) => `${c.id}.mp3`));
	for (const m of MODES) faults.push(...folderFaults(m, names));
	faults.push(...folderFaults('voices', voices));
	const order = loadOrder();
	if (order) {
		const a = order.filter((o) => o.A === 'design').length;
		if (order.length !== 30 || a !== 15)
			faults.push(`order.json: ${order.length} entries, ${a} design first, want 30 with 15`);
	}
	for (const f of faults) console.log(f);
	if (faults.length) process.exit(1);
	console.log(`design 30/30 · refclip 30/30 · voices ${voices.length}/${voices.length}`);
}

function encode(wav: string, out: string) {
	mkdirSync(join(out, '..'), { recursive: true });
	const r = spawnSync(
		'ffmpeg',
		[
			'-y',
			'-loglevel',
			'error',
			'-i',
			wav,
			'-af',
			'loudnorm=I=-16:TP=-1.5:LRA=11',
			'-ac',
			'1',
			'-ar',
			'24000',
			'-b:a',
			'48k',
			out
		],
		{ encoding: 'utf8' }
	);
	if (r.status === 0) return;
	console.error(r.stderr);
	process.exit(1);
}

function render() {
	const python = process.env.OMNIVOICE_PYTHON ?? '';
	if (!python) {
		console.error('OMNIVOICE_PYTHON is missing or empty (set it in .env)');
		process.exit(2);
	}
	const set = load();
	const wavDir = resolve(DIR, '_wav');
	const first = (r: Role) => set.voices.candidates[r][0];
	const jobs: Job[] = [];
	for (const r of ROLES)
		for (const c of set.voices.candidates[r])
			jobs.push({
				group: 'voices',
				id: c.id,
				wav: join(wavDir, 'voices', `${c.id}.wav`),
				mp3: join(DIR, 'voices', `${c.id}.mp3`),
				text: set.voices.audition,
				seed: set.voices.seeds[r],
				instruct: c.instruct,
				control: 'none'
			});
	for (const m of MODES)
		for (const it of set.items) {
			const r = it.voice as Role;
			jobs.push({
				group: m,
				id: pad(it.n),
				wav: join(wavDir, m, `${pad(it.n)}.wav`),
				mp3: join(DIR, m, `${pad(it.n)}.mp3`),
				text: it.force ?? it.hanzi,
				seed: set.voices.seeds[r],
				...(m === 'design'
					? { instruct: first(r).instruct }
					: { ref: { id: first(r).id, wav: join(wavDir, 'voices', `${first(r).id}.wav`) } }),
				control: it.force ? 'pinyin' : 'none'
			});
		}
	const had = new Set(jobs.filter((j) => existsSync(j.mp3)).map((j) => j.mp3));
	const pending = jobs.filter((j) => !had.has(j.mp3) && !existsSync(j.wav));
	if (pending.length) {
		const run = spawnSync(python, [join(DIR, 'omnivoice_render.py')], {
			input: JSON.stringify(
				jobs
					.filter((j) => !had.has(j.mp3))
					.map((j) => ({
						out: j.wav,
						text: j.text,
						seed: j.seed,
						instruct: j.instruct,
						ref_audio: j.ref?.wav,
						ref_text: j.ref && set.voices.audition
					}))
			),
			stdio: ['pipe', 'inherit', 'inherit'],
			encoding: 'utf8'
		});
		if (run.status !== 0) console.error(`omnivoice exited with ${run.status}`);
	}
	let failed = 0;
	for (const g of ['voices', ...MODES]) {
		let r = 0;
		let s = 0;
		let f = 0;
		const done: Job[] = [];
		for (const j of jobs.filter((x) => x.group === g)) {
			if (had.has(j.mp3)) s++;
			else if (existsSync(j.wav)) {
				encode(j.wav, j.mp3);
				r++;
			} else {
				f++;
				continue;
			}
			done.push(j);
		}
		failed += f;
		console.log(`${g}: ${r} rendered, ${s} skipped, ${f} failed`);
		const entries = done.map((j) => ({
			id: j.id,
			text: j.text,
			control: j.control,
			seed: j.seed,
			...(j.instruct ? { instruct: j.instruct } : {}),
			...(j.ref ? { ref: j.ref.id } : {})
		}));
		mkdirSync(join(DIR, g), { recursive: true });
		writeFileSync(join(DIR, g, 'inputs.json'), JSON.stringify(entries, null, '\t') + '\n');
	}
	if (failed) process.exit(1);
}

function mulberry32(a: number) {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function sheet() {
	const set = load();
	const file = join(DIR, 'order.json');
	if (!existsSync(file)) {
		const rnd = mulberry32(
			[...'CHY-14'].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)
		);
		const sides: Mode[] = [...Array(15).fill('design'), ...Array(15).fill('refclip')];
		for (let i = sides.length - 1; i > 0; i--) {
			const j = Math.floor(rnd() * (i + 1));
			[sides[i], sides[j]] = [sides[j], sides[i]];
		}
		writeFileSync(
			file,
			JSON.stringify(
				sides.map((A, i) => ({ n: i + 1, A })),
				null,
				'\t'
			) + '\n'
		);
	}
	const data = {
		order: loadOrder(),
		items: set.items.map(({ n, hanzi, voice, expected, force }) => ({
			n,
			hanzi,
			voice,
			expected,
			force: force ?? null
		})),
		candidates: set.voices.candidates
	};
	const template = readFileSync(join(DIR, 'sheet.template.html'), 'utf8');
	writeFileSync(
		join(DIR, 'sheet.html'),
		template.replace('__DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'))
	);
}

function tally(path: string | undefined) {
	const faults: string[] = [];
	const res = JSON.parse(readFileSync(path ?? join(DIR, 'results.json'), 'utf8'));
	const order = loadOrder() ?? [];
	const picks: { n: number; pick: string; engine: string; said?: string[] }[] = res.picks ?? [];
	if (picks.length !== 30 || new Set(picks.map((p) => p.n)).size !== 30)
		faults.push(`picks: ${picks.length}, want 30 distinct`);
	const count: Record<Mode, number> = { design: 0, refclip: 0 };
	for (const p of picks) {
		const o = order.find((x) => x.n === p.n);
		const engine = o && (p.pick === 'A' ? o.A : otherSide(o.A));
		if (p.engine !== engine) faults.push(`engine mismatch: n=${p.n}`);
		if (p.engine in count) count[p.engine as Mode]++;
	}
	if (res.tally?.design !== count.design || res.tally?.refclip !== count.refclip)
		faults.push('tally disagrees with picks');
	if (!(MODES as readonly string[]).includes(res.winner)) faults.push('winner missing or unknown');
	for (const n of [28, 29])
		if (!Array.isArray(picks.find((p) => p.n === n)?.said)) faults.push(`said missing: n=${n}`);
	const set = load();
	for (const r of ['takin', 'narrator'] as const)
		if (!set.voices.candidates[r].some((c) => c.id === res.voices?.[r]))
			faults.push(`voice not chosen: ${r}`);
	for (const f of faults) console.log(f);
	if (faults.length) process.exit(1);
	console.log(
		`design ${count.design} · refclip ${count.refclip} · winner ${res.winner} · takin ${res.voices.takin} · narrator ${res.voices.narrator}`
	);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'check') check();
else if (cmd === 'render') render();
else if (cmd === 'sheet') sheet();
else if (cmd === 'tally') tally(arg);
else {
	console.error('usage: tts-spike <render|check|sheet|tally [results.json]>');
	process.exit(1);
}
