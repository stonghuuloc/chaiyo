import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const run = (dir: string) => {
	const res = spawnSync('pnpm', ['-s', 'lint:content', dir], {
		encoding: 'utf8',
		env: { ...process.env, CHAIYO_VAULT: '/nonexistent' }
	});
	return { status: res.status, out: res.stdout, err: res.stderr };
};

describe('lint:content CLI', () => {
	it('prints one stdout line per error and exits 1', { timeout: 20_000 }, () => {
		const { status, out, err } = run('src/lib/content/lint/fixtures/cli-three');
		const lines = out.trimEnd().split('\n');
		expect(status).toBe(1);
		expect(lines).toHaveLength(3);
		for (const line of lines) expect(line).toMatch(/^\S+ {2}\S+ {2}#\d \S.* {2}.+$/);
		expect(new Set(lines.map((l) => l.split('  ')[0])).size).toBe(2);
		expect(err.trimEnd().split('\n').at(-1)).toBe('3 errors in 2 files');
	});

	it('keeps a multi-line parse error on one stdout line', { timeout: 20_000 }, () => {
		const { status, out } = run('src/lib/content/lint/fixtures/cli-malformed');
		expect(status).toBe(1);
		expect(out.trimEnd().split('\n')).toHaveLength(1);
	});

	it('exits 0 with empty stdout on a clean tree', { timeout: 20_000 }, () => {
		const { status, out, err } = run('src/lib/content/lint/fixtures/clean');
		expect(status).toBe(0);
		expect(out).toBe('');
		expect(err.trimEnd().split('\n').at(-1)).toBe('0 errors');
	});

	it.each(['nope', 'package.json'])(
		'exits 1 with one stderr line for %s',
		{ timeout: 20_000 },
		(dir) => {
			const { status, out, err } = run(dir);
			expect(status).toBe(1);
			expect(out).toBe('');
			expect(err.trimEnd().split('\n')).toHaveLength(1);
			expect(err).toContain(dir);
		}
	);
});
