import { statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { PRODUCTION_ROOTS, scopeFor } from '../src/lib/content/import/scope';
import { lintDir, type LintError } from '../src/lib/content/lint';

const args = process.argv.slice(2);
const flag = (name: string) => {
	const at = args.indexOf(`--${name}`);
	if (at < 0) return undefined;
	const value = args.splice(at, 2)[1];
	if (value === undefined) {
		console.error(`lint-content: --${name} needs a value`);
		process.exit(1);
	}
	return value;
};
const only = flag('only');
const dir = args[0] ?? 'content';
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
	console.error(`lint-content: not a directory: ${dir}`);
	process.exit(1);
}

const oneLine = (s: string) => s.trimEnd().replace(/\r?\n/g, '\\n');
const finish = (errors: LintError[], notices: string[]) => {
	for (const n of notices) console.error(n);
	for (const e of errors)
		console.log(
			[
				oneLine(e.file),
				oneLine(e.path) || '-',
				`#${e.check} ${oneLine(e.name)}`,
				oneLine(e.message)
			].join('  ')
		);
	console.error(
		`${errors.length} errors${errors.length ? ` in ${new Set(errors.map((e) => e.file)).size} files` : ''}`
	);
	process.exitCode = errors.length ? 1 : 0;
};

// The first lesson of each HSK level is preview content until its curriculum is authored
// (issue #49), so its errors do not gate a bare run.
const skippedLesson = (file: string) =>
	file.startsWith('lessons/') &&
	!PRODUCTION_ROOTS.some((root) => {
		const rel = root.replace(/\/$/, '');
		return file === rel || file.startsWith(`${rel}/`);
	});

if (only !== undefined) {
	// --only names roots explicitly and expands to the files they reference, as import-content
	// does. A root that matches nothing is silently dropped by loadContentDir and scopeFor, so a
	// typo would lint only the shared files and pass: normalize each root to a directory-relative
	// path and reject one that is empty, outside dir, missing, or a no-op like `.`.
	const roots = only.split(',').map((root) => {
		const path = root.trim().replace(/\/$/, '');
		const abs = resolve(dir, path);
		const rel = relative(resolve(dir), abs);
		if (!path || !rel || rel.split(sep)[0] === '..' || !statSync(abs, { throwIfNoEntry: false })) {
			console.error(`lint-content: no such root in ${dir}: ${root.trim()}`);
			process.exit(1);
		}
		return rel;
	});
	console.error(`lint-content: scope = ${roots.join(', ')}`);
	const { errors, notices } = lintDir(dir, { only: scopeFor(dir, roots) });
	finish(errors, notices);
} else if (args[0] === undefined) {
	// A bare run lints every file, then drops the errors reported in the non-production lessons:
	// all shared words/grammar/sentences/chars are checked and their lesson references resolve,
	// while the preview lessons cannot gate the run before their curricula exist.
	const { set, errors, notices } = lintDir(dir);
	const folders = [
		...new Set(
			set.lessons
				.map(({ file }) => file)
				.filter(skippedLesson)
				.map((file) => file.split('/').slice(0, 2).join('/'))
		)
	].sort();
	console.error(`lint-content: scope = everything except ${folders.join(', ') || 'nothing'}`);
	const skipped = errors.filter((e) => skippedLesson(e.file));
	console.error(`lint-content: skipped ${skipped.length} errors in those lessons`);
	finish(
		errors.filter((e) => !skippedLesson(e.file)),
		notices
	);
} else {
	// An explicit directory is linted in full: that is how a content author checks every lesson.
	const { errors, notices } = lintDir(dir);
	finish(errors, notices);
}
