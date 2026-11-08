import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const run = (...args: string[]) =>
	spawnSync(process.execPath, ['--import', 'tsx', 'scripts/render-audio.ts', ...args], {
		encoding: 'utf8',
		env: { PATH: process.env.PATH }
	});

describe('render-audio command line', () => {
	it('does not let --prefix swallow the next flag', () => {
		const r = run('manifest.json', '--prefix', '--kind', 'word', 'mv1');
		expect(r.status).toBe(1);
		expect(r.stderr).toContain('render-audio: --prefix needs a value');
	});

	it('rejects an unknown option', () => {
		const r = run('manifest.json', '--frm-dir', 'x');
		expect(r.status).toBe(1);
		expect(r.stderr).toContain('render-audio: unknown option --frm-dir');
	});
});
