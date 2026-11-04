import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeFailure, loadRefs } from './refs';

beforeEach(() => vi.stubEnv('CHAIYO_VAULT', join(tmpdir(), 'no-such-vault')));
afterEach(() => vi.unstubAllEnvs());

describe('loadRefs', () => {
	it('reads the grammar syllabus levels from the CSV', () => {
		const { refs } = loadRefs();
		expect(refs.syllabus.get(1)).toBe(1);
		expect(refs.syllabus.get(277)).toBe(4);
		expect(refs.syllabus.size).toBe(573);
	});

	it('reads the polyphone table', () => {
		expect(loadRefs().refs.polyphones.get('行')).toEqual(['xíng', 'háng']);
	});

	it('skips check 7 with one notice when the vault is missing', () => {
		const { refs, notices } = loadRefs();
		expect(refs.mnemonics).toBeUndefined();
		expect(notices).toEqual(['check 7 skipped: vault not found']);
	});

	it('reports a vault that is present but fails to load', () => {
		const dir = mkdtempSync(join(tmpdir(), 'vault-'));
		try {
			writeFileSync(join(dir, 'meo.py'), 'raise RuntimeError("vault broke")\n');
			vi.stubEnv('CHAIYO_VAULT', dir);
			const { refs, notices } = loadRefs();
			expect(refs.mnemonics).toBeUndefined();
			expect(notices).toHaveLength(1);
			expect(notices[0]).toContain('vault failed to load');
			expect(notices[0]).toContain('RuntimeError: vault broke');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('describeFailure takes the last stderr line and survives a non-string stderr', () => {
		expect(describeFailure({ stderr: 'Traceback\nRuntimeError: x\n' })).toBe('RuntimeError: x');
		expect(describeFailure(Object.assign(new Error('boom'), { stderr: Buffer.from('x') }))).toBe(
			'boom'
		);
		expect(describeFailure(Object.assign(new Error('boom'), { stderr: '' }))).toBe('boom');
		expect(describeFailure('plain')).toBe('plain');
		expect(describeFailure(null)).toBe('null');
		expect(describeFailure(undefined)).toBe('undefined');
		expect(describeFailure(42)).toBe('42');
	});

	it('reads the four anchors from a vault with meo.py', () => {
		const dir = mkdtempSync(join(tmpdir(), 'vault-'));
		try {
			writeFileSync(
				join(dir, 'meo.py'),
				"def index():\n    return {'你': ('L1', 'nǐ', 'nhĩ', {'HÌNH': 'a', 'ÂM': 'b', 'ĐỜI THẬT': 'c', 'TƯƠNG PHẢN': 'd'}), '好': ('L1', 'hǎo', 'hảo', {'HÌNH': 'x'})}\n"
			);
			vi.stubEnv('CHAIYO_VAULT', dir);
			const { refs, notices } = loadRefs();
			expect(notices).toEqual([]);
			expect([...refs.mnemonics!]).toEqual([
				['你', { hinh: 'a', am: 'b', doiThat: 'c', tuongPhan: 'd' }]
			]);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
