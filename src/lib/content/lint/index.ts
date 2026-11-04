import { hanviet } from './checks/1-hanviet';
import { polyphones } from './checks/2-polyphones';
import { toneMarks } from './checks/3-tone-marks';
import { sandhi } from './checks/4-sandhi';
import { knownChars } from './checks/5-known-chars';
import { realGlyphs } from './checks/6-real-glyphs';
import { mnemonic } from './checks/7-mnemonic';
import { references } from './checks/8-references';
import { audio } from './checks/9-audio';
import { loadRefs } from './refs';
import { loadContentDir } from './load';
import type { ContentSet, LintError, LintRefs } from './types';

export type { ContentSet, LintError, LintRefs } from './types';
export { loadContentDir } from './load';
export { loadRefs } from './refs';

const checks: ((set: ContentSet, refs: LintRefs) => LintError[])[] = [
	hanviet,
	polyphones,
	toneMarks,
	sandhi,
	knownChars,
	realGlyphs,
	mnemonic,
	references,
	audio
];

const byLocation = (a: LintError, b: LintError) =>
	a.file < b.file
		? -1
		: a.file > b.file
			? 1
			: a.path < b.path
				? -1
				: a.path > b.path
					? 1
					: a.check - b.check;

export const lint = (set: ContentSet, refs: LintRefs): LintError[] =>
	checks.flatMap((check) => check(set, refs)).sort(byLocation);

export function lintDir(
	dir: string,
	opts: { refs?: LintRefs; only?: string[] } = {}
): { set: ContentSet; errors: LintError[]; notices: string[] } {
	const { set, errors: loadErrors } = loadContentDir(dir, { only: opts.only });
	const { refs, notices } = opts.refs ? { refs: opts.refs, notices: [] } : loadRefs();
	return { set, errors: [...loadErrors, ...lint(set, refs)].sort(byLocation), notices };
}
