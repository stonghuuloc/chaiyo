import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
const MIN_SECONDS_PER_SYLLABLE = 0.13;
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
	say?: string;
	seed?: number;
};
type Candidate = { id: string; instruct: string };
type Spec = {
	voices: {
		engine: string;
		audition: string;
		seeds: Record<Role, number>;
		chosen: Record<Role, string>;
		pace: Record<Role, number>;
		candidates: Record<Role, Candidate[]>;
	};
	items: Item[];
};
type Order = { n: number; A: Mode }[];

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
	for (const r of ROLES)
		if (
			!set.voices?.candidates?.[r]?.some((c) => c.id === set.voices.chosen?.[r]) ||
			!set.voices.pace?.[r]
		)
			out.push(`voice not pinned: ${r}`);
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

function audioFaults(file: string, hanzi?: number): string[] {
	const r = spawnSync(
		'ffmpeg',
		[
			'-hide_banner',
			'-i',
			file,
			'-af',
			'silencedetect=noise=-35dB:d=0.1,volumedetect',
			'-f',
			'null',
			'-'
		],
		{ encoding: 'utf8' }
	);
	const log = r.stderr;
	const dur = log
		.match(/time=(\d+):(\d+):([\d.]+)/g)
		?.pop()
		?.match(/(\d+):(\d+):([\d.]+)/);
	const total = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
	const out: string[] = [];
	const name = file.replace(DIR + '/', '');
	const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
	const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
	const spans = starts.map((st, i) => [st, ends[i] ?? total] as const);
	const silent = spans.reduce((acc, [st, en]) => acc + en - st, 0);
	const speech = total - silent;
	const peak = +(log.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? -99);
	if (total < 0.3) out.push(`broken: ${name} too short (${total.toFixed(2)} s)`);
	if (total > 0 && silent / total > 0.8) out.push(`broken: ${name} mostly silence`);
	if (peak > -0.1) out.push(`broken: ${name} clipping (peak ${peak} dB)`);
	if (hanzi && speech / hanzi < MIN_SECONDS_PER_SYLLABLE)
		out.push(
			`broken: ${name} rushed (${(speech / hanzi).toFixed(2)} s/syllable, min ${MIN_SECONDS_PER_SYLLABLE})`
		);
	return out;
}

const countHanzi = (text: string) => (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
const itemText = (it: Item) => it.say ?? (it.force ? toneDigits(it.force) : it.hanzi);

function check() {
	const set = load();
	const faults = testSetFaults(set);
	const names = Array.from({ length: 30 }, (_, i) => `${pad(i + 1)}.mp3`);
	const voices = ROLES.flatMap((r) => (set.voices.candidates[r] ?? []).map((c) => `${c.id}.mp3`));
	faults.push(...folderFaults('refclip', names), ...folderFaults('voices', voices));
	const inputs = readInputs('refclip');
	for (const it of set.items ?? []) {
		const f = join(DIR, 'refclip', `${pad(it.n)}.mp3`);
		if (!existsSync(f)) continue;
		faults.push(...audioFaults(f, countHanzi(it.hanzi)));
		const e = inputs.get(pad(it.n));
		const role = it.voice as Role;
		if (
			e?.ref !== set.voices.chosen?.[role] ||
			e?.tempo !== set.voices.pace?.[role] ||
			e?.text !== itemText(it) ||
			(it.seed !== undefined && e?.seed !== it.seed)
		)
			faults.push(
				`stale: refclip/${pad(it.n)}.mp3 ref ${e?.ref} tempo ${e?.tempo}, want ${set.voices.chosen?.[role]} ${set.voices.pace?.[role]}`
			);
	}
	for (const r of ROLES)
		for (const c of set.voices.candidates[r] ?? []) {
			const f = join(DIR, 'voices', `${c.id}.mp3`);
			if (existsSync(f)) faults.push(...audioFaults(f));
		}
	const order = loadOrder();
	if (order) {
		const a = order.filter((o) => o.A === 'design').length;
		if (order.length !== 30 || a !== 15)
			faults.push(`order.json: ${order.length} entries, ${a} design first, want 30 with 15`);
	}
	for (const f of faults) console.log(f);
	if (faults.length) process.exit(1);
	console.log(`refclip 30/30 · voices ${voices.length}/${voices.length}`);
}

type Input = {
	id: string;
	text: string;
	control: string;
	seed: number;
	ref?: string;
	instruct?: string;
	tempo: number;
};
function readInputs(group: string): Map<string, Input> {
	const file = join(DIR, group, 'inputs.json');
	const list: Input[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
	return new Map(list.map((e) => [e.id, e]));
}

const TONE_MARKS: Record<string, [string, number]> = {};
for (const [v, marks] of Object.entries({
	a: 'āáǎà',
	e: 'ēéěè',
	i: 'īíǐì',
	o: 'ōóǒò',
	u: 'ūúǔù',
	ü: 'ǖǘǚǜ'
}))
	[...marks].forEach((m, i) => (TONE_MARKS[m] = [v, i + 1]));
const toneDigits = (pinyin: string) => {
	let tone = 5;
	const plain = [...pinyin]
		.map((c) => {
			if (!TONE_MARKS[c]) return c;
			tone = TONE_MARKS[c][1];
			return TONE_MARKS[c][0];
		})
		.join('');
	return `${plain.replace('ü', 'v').toUpperCase()}${tone}`;
};

function encode(wav: string, out: string, tempo: number) {
	mkdirSync(join(out, '..'), { recursive: true });
	const filter = (tempo === 1 ? '' : `atempo=${tempo},`) + 'loudnorm=I=-16:TP=-1.5:LRA=11';
	const r = spawnSync(
		'ffmpeg',
		[
			'-y',
			'-loglevel',
			'error',
			'-i',
			wav,
			'-af',
			filter,
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

type Job = {
	group: string;
	id: string;
	wav: string;
	mp3: string;
	text: string;
	seed: number;
	instruct?: string;
	ref?: string;
	tempo: number;
	hanzi?: number;
	pinned?: boolean;
	expect?: string;
	control: 'pinyin' | 'say' | 'none';
};
const MAX_ATTEMPTS = 4;
const DIGITS = '零一二三四五六七八九';
const heard = (t: string) =>
	[...t]
		.map((c) => (/[0-9]/.test(c) ? DIGITS[+c] : c === '您' ? '你' : c === '對' ? '对' : c))
		.filter((c) => /[一-鿿]/.test(c))
		.join('');

function transcribe(python: string, mp3s: string[]): Record<string, string> {
	const r = spawnSync(python, [join(DIR, 'asr_check.py')], {
		input: JSON.stringify(mp3s.map((mp3) => ({ mp3 }))),
		encoding: 'utf8'
	});
	if (r.status !== 0) return {};
	return JSON.parse(r.stdout.trim().split('\n').pop()!);
}

function render() {
	const python = process.env.OMNIVOICE_PYTHON ?? '';
	if (!python) {
		console.error('OMNIVOICE_PYTHON is missing or empty (set it in .env)');
		process.exit(2);
	}
	const set = load();
	const wavDir = resolve(DIR, '_wav');
	const refWav = (id: string) => join(wavDir, 'voices', `${id}.wav`);
	const jobs: Job[] = [];
	for (const r of ROLES)
		for (const c of set.voices.candidates[r])
			jobs.push({
				group: 'voices',
				id: c.id,
				wav: refWav(c.id),
				mp3: join(DIR, 'voices', `${c.id}.mp3`),
				text: set.voices.audition,
				seed: set.voices.seeds[r],
				instruct: c.instruct,
				pinned: true,
				tempo: 1,
				control: 'none'
			});
	const prevByGroup: Record<string, Map<string, Input>> = {
		voices: readInputs('voices'),
		refclip: readInputs('refclip')
	};
	const prev = prevByGroup.refclip;
	for (const it of set.items) {
		const r = it.voice as Role;
		const text = itemText(it);
		const job: Job = {
			group: 'refclip',
			id: pad(it.n),
			wav: join(wavDir, 'refclip', `${pad(it.n)}.wav`),
			mp3: join(DIR, 'refclip', `${pad(it.n)}.mp3`),
			text,
			seed: it.seed ?? set.voices.seeds[r],
			pinned: it.seed !== undefined,
			ref: set.voices.chosen[r],
			tempo: set.voices.pace[r],
			hanzi: countHanzi(it.hanzi),
			expect: it.force || it.say ? undefined : heard(it.hanzi),
			control: it.say ? 'say' : it.force ? 'pinyin' : 'none'
		};
		const e = prev.get(job.id);
		if (
			existsSync(job.mp3) &&
			(e?.ref !== job.ref ||
				e?.tempo !== job.tempo ||
				e?.text !== job.text ||
				(job.pinned && e?.seed !== job.seed))
		) {
			rmSync(job.mp3);
			rmSync(job.wav, { force: true });
		}
		jobs.push(job);
	}
	const had = new Set(jobs.filter((j) => existsSync(j.mp3)).map((j) => j.mp3));
	const failed = new Map<string, string[]>();
	const attempts = new Map<Job, number>();
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const pending = jobs.filter((j) => !existsSync(j.mp3) && !(j.pinned && attempt > 0));
		if (!pending.length) break;
		for (const j of pending) {
			j.seed = j.seed + (attempts.get(j) ?? 0) * 1000;
			attempts.set(j, attempt + 1);
		}
		const todo = pending.filter((j) => !existsSync(j.wav));
		if (todo.length) {
			const run = spawnSync(python, [join(DIR, 'omnivoice_render.py')], {
				input: JSON.stringify(
					[
						...jobs.filter((j) => j.group === 'voices' && !existsSync(j.wav)),
						...todo.filter((j) => j.group !== 'voices')
					].map((j) => ({
						out: j.wav,
						text: j.text,
						seed: j.seed,
						instruct: j.instruct,
						ref_audio: j.ref && refWav(j.ref),
						ref_text: j.ref && set.voices.audition
					}))
				),
				stdio: ['pipe', 'inherit', 'inherit'],
				encoding: 'utf8'
			});
			if (run.status !== 0) console.error(`omnivoice exited with ${run.status}`);
		}
		for (const j of pending) {
			if (!existsSync(j.wav)) {
				failed.set(j.mp3, ['no audio']);
				continue;
			}
			encode(j.wav, j.mp3, j.tempo);
			const faults = audioFaults(j.mp3, j.hanzi);
			failed.set(j.mp3, faults);
			if (faults.length) {
				rmSync(j.mp3);
				rmSync(j.wav);
			}
		}
		const checked = pending.filter((j) => j.expect && existsSync(j.mp3));
		const text = checked.length
			? transcribe(
					python,
					checked.map((j) => j.mp3)
				)
			: {};
		for (const j of checked) {
			if (text[j.mp3] === undefined || heard(text[j.mp3]) === j.expect) continue;
			failed.set(j.mp3, [`Whisper heard "${text[j.mp3]}", want "${j.expect}"`]);
			rmSync(j.mp3);
			rmSync(j.wav);
		}
		for (const j of pending)
			if (existsSync(j.mp3) && !failed.get(j.mp3)?.length) failed.delete(j.mp3);
	}
	let bad = 0;
	for (const g of ['voices', 'refclip']) {
		const mine = jobs.filter((j) => j.group === g);
		const f = mine.filter((j) => failed.has(j.mp3));
		const s = mine.filter((j) => had.has(j.mp3)).length;
		bad += f.length;
		console.log(`${g}: ${mine.length - s - f.length} rendered, ${s} skipped, ${f.length} failed`);
		for (const j of f) console.log(`  ${j.mp3}: ${failed.get(j.mp3)!.join('; ')}`);
		const entries = mine
			.filter((j) => existsSync(j.mp3))
			.map((j) => ({
				id: j.id,
				text: j.text,
				control: j.control,
				seed: had.has(j.mp3) ? (prevByGroup[g].get(j.id)?.seed ?? j.seed) : j.seed,
				tempo: j.tempo,
				...(j.instruct ? { instruct: j.instruct } : {}),
				...(j.ref ? { ref: j.ref } : {})
			}));
		mkdirSync(join(DIR, g), { recursive: true });
		writeFileSync(join(DIR, g, 'inputs.json'), JSON.stringify(entries, null, '\t') + '\n');
	}
	if (bad) process.exit(1);
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
