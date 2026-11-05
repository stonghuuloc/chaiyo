import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const OK = join(__dirname, 'fixtures/ok');
const temps: string[] = [];
afterEach(() => {
	for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});
const copy = () => {
	const dir = mkdtempSync(join(tmpdir(), 'cli-'));
	temps.push(dir);
	cpSync(OK, dir, { recursive: true });
	return dir;
};
const run = (...args: string[]) => {
	const res = spawnSync('pnpm', ['-s', 'import:content', ...args], {
		encoding: 'utf8',
		timeout: 20_000,
		env: { ...process.env, CHAIYO_VAULT: '/nonexistent', SUPABASE_DB_URL: '' }
	});
	return { status: res.status, out: res.stdout, err: res.stderr };
};
const lastLine = (s: string) => s.trimEnd().split('\n').at(-1);

describe('import:content CLI', () => {
	it('memory sink: exits 0 and prints the sha last', { timeout: 30_000 }, () => {
		const { status, out } = run(copy());
		expect(status).toBe(0);
		expect(lastLine(out)).toMatch(/^[0-9a-f]{64}$/);
	});

	it('a missing directory exits 1 with one stderr line and no stdout', { timeout: 30_000 }, () => {
		const dir = join(copy(), 'nope');
		const { status, out, err } = run(dir);
		expect(status).toBe(1);
		expect(out).toBe('');
		expect(err.trimEnd()).toBe(`import-content: not a directory: ${dir}`);
	});

	it(
		'prints lint errors as file  path  #check name  message and exits 1',
		{ timeout: 30_000 },
		() => {
			const dir = copy();
			const f = join(dir, 'words/你好.yaml');
			writeFileSync(f, readFileSync(f, 'utf8').replace('pinyin: nǐ hǎo', 'pinyin: ni hao'));
			const { status, out } = run(dir);
			expect(status).toBe(1);
			expect(out).toMatch(/^words\/你好\.yaml {2}pinyin {2}#3 Tone marks .+$/m);
		}
	);

	it(
		'--only passes the scope: a broken lessons/hsk2 file fails without it, not with it',
		{ timeout: 60_000 },
		() => {
			const clean = run(copy());
			const dir = copy();
			mkdirSync(join(dir, 'lessons/hsk2'));
			writeFileSync(join(dir, 'lessons/hsk2/x.yaml'), 'id: [\n');
			expect(run(dir).status).toBe(1);
			const scoped = run(dir, '--only', 'lessons/hsk1');
			expect(scoped.status).toBe(0);
			expect(lastLine(scoped.out)).toBe(lastLine(clean.out));
		}
	);

	it(
		'--sink postgres without SUPABASE_DB_URL exits 1 before reading any file',
		{ timeout: 30_000 },
		() => {
			const { status, out, err } = run(join(tmpdir(), 'cli-nonexistent-dir'), '--sink', 'postgres');
			expect(status).toBe(1);
			expect(out).toBe('');
			expect(err).toContain('SUPABASE_DB_URL');
			expect(err).not.toContain('not a directory');
		}
	);

	it('--sink bundle --out writes the bundle folder', { timeout: 30_000 }, () => {
		const out = mkdtempSync(join(tmpdir(), 'cli-out-'));
		temps.push(out);
		const res = run(copy(), '--sink', 'bundle', '--out', out);
		expect(res.status).toBe(0);
		const sha = lastLine(res.out)!;
		expect(JSON.parse(readFileSync(join(out, sha, 'manifest.json'), 'utf8')).sha).toBe(sha);
		expect(JSON.parse(readFileSync(join(out, 'current.json'), 'utf8'))).toEqual({ sha });
	});
});
