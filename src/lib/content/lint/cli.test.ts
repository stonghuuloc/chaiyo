import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const cli = (...args: string[]) => {
	const res = spawnSync('pnpm', ['-s', 'lint:content', ...args], {
		encoding: 'utf8',
		env: { ...process.env, CHAIYO_VAULT: '/nonexistent' }
	});
	return { status: res.status, out: res.stdout, err: res.stderr };
};

describe('lint:content CLI', () => {
	it('prints one stdout line per error and exits 1', { timeout: 20_000 }, () => {
		const { status, out, err } = cli('src/lib/content/lint/fixtures/cli-three');
		const lines = out.trimEnd().split('\n');
		expect(status).toBe(1);
		expect(lines).toHaveLength(3);
		for (const line of lines) expect(line).toMatch(/^\S+ {2}\S+ {2}#\d \S.* {2}.+$/);
		expect(new Set(lines.map((l) => l.split('  ')[0])).size).toBe(2);
		expect(err.trimEnd().split('\n').at(-1)).toBe('3 errors in 2 files');
	});

	it('keeps a multi-line parse error on one stdout line', { timeout: 20_000 }, () => {
		const { status, out } = cli('src/lib/content/lint/fixtures/cli-malformed');
		expect(status).toBe(1);
		expect(out.trimEnd().split('\n')).toHaveLength(1);
		expect(out).toMatch(/^words\/坏\.yaml {2}- {2}#0 schema {2}.+\\n/);
		expect(out).not.toMatch(/ \n$/);
	});

	it('keeps a newline-bearing content key on one stdout line', { timeout: 20_000 }, () => {
		const { status, out } = cli('src/lib/content/lint/fixtures/cli-newline-key');
		expect(status).toBe(1);
		expect(out.trimEnd().split('\n')).toHaveLength(1);
		expect(out).toMatch(/^chars\/你\.yaml {2}bad\\nkey {2}/);
	});

	it('exits 0 with empty stdout on a clean tree', { timeout: 20_000 }, () => {
		const { status, out, err } = cli('src/lib/content/lint/fixtures/clean');
		expect(status).toBe(0);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n').at(-1)).toBe('0 errors');
	});

	it('lints all content except the non-production lessons by default', { timeout: 120_000 }, () => {
		const { status, out, err } = cli();
		expect(status).toBe(0);
		expect(out).toBe('');
		expect(err).toContain(
			'scope = everything except lessons/hsk2, lessons/hsk3, lessons/hsk4, lessons/hsk5'
		);
		expect(err).toMatch(/skipped \d+ errors in those lessons/);
		expect(err.trimEnd().split('\n').at(-1)).toBe('0 errors');
	});

	it('--only keeps the files the roots reference loaded', { timeout: 20_000 }, () => {
		const { status, out, err } = cli(
			'src/lib/content/lint/fixtures/clean',
			'--only',
			'lessons/hsk1'
		);
		expect(status).toBe(0);
		expect(out).toBe('');
		expect(err).toContain('scope = lessons/hsk1');
		expect(err.trimEnd().split('\n').at(-1)).toBe('0 errors');
	});

	it('--only selects the named root and drops the rest', { timeout: 20_000 }, () => {
		const words = cli('src/lib/content/lint/fixtures/cli-three', '--only', 'words');
		expect(words.status).toBe(1);
		expect(words.out).toContain('words/你好.yaml');
		const chars = cli('src/lib/content/lint/fixtures/cli-three', '--only', 'chars');
		expect(chars.status).toBe(1);
		expect(chars.out).toContain('chars/你.yaml');
		expect(chars.out).not.toContain('words/你好.yaml');
	});

	it('rejects --only without a value', { timeout: 20_000 }, () => {
		const { status, out, err } = cli('src/lib/content/lint/fixtures/clean', '--only');
		expect(status).toBe(1);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n')).toHaveLength(1);
		expect(err).toContain('--only needs a value');
	});

	it('rejects an --only root that does not exist', { timeout: 20_000 }, () => {
		const { status, out, err } = cli(
			'src/lib/content/lint/fixtures/clean',
			'--only',
			'lessons/hsk1, lessons/hskl'
		);
		expect(status).toBe(1);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n')).toHaveLength(1);
		expect(err).toContain('no such root in src/lib/content/lint/fixtures/clean: lessons/hskl');
	});

	it('rejects an --only root outside the linted directory', { timeout: 20_000 }, () => {
		const { status, out, err } = cli('src/lib/content/lint/fixtures/clean', '--only', '..');
		expect(status).toBe(1);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n')).toHaveLength(1);
		expect(err).toContain('no such root in src/lib/content/lint/fixtures/clean: ..');
	});

	it('rejects an --only root the loader cannot match', { timeout: 20_000 }, () => {
		const { status, out, err } = cli('src/lib/content/lint/fixtures/clean', '--only', '.');
		expect(status).toBe(1);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n')).toHaveLength(1);
		expect(err).toContain('no such root in src/lib/content/lint/fixtures/clean: .');
	});

	it.each(['nope', 'package.json'])(
		'exits 1 with one stderr line for %s',
		{ timeout: 20_000 },
		(dir) => {
			const { status, out, err } = cli(dir);
			expect(status).toBe(1);
			expect(out).toBe('');
			expect(err.trimEnd().split('\n')).toHaveLength(1);
			expect(err).toContain(dir);
		}
	);
});
