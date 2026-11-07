import { statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { PRODUCTION_ROOTS, scopeFor } from '../src/lib/content/import/scope';
import { lintDir } from '../src/lib/content/lint';

// The first lesson of each HSK level is preview content until its curriculum is authored, so a
// bare `pnpm lint:content` checks the production roots; a directory lints that tree in full.
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
// No directory argument lints the production scope. A directory lints that tree in full;
// --only names roots explicitly and expands to the files they reference, as import-content
// does (so the shared words/chars/grammar/sentences stay loaded for the lessons).
const scope =
	only !== undefined
		? only.split(',').map((root) => root.trim())
		: args[0] === undefined
			? PRODUCTION_ROOTS
			: undefined;
// A root that matches nothing is silently dropped by loadContentDir and scopeFor, so a typo
// would lint only the shared files and pass: reject a root that does not exist under dir, or
// that resolves outside it.
for (const root of scope ?? []) {
	const path = root.replace(/\/$/, '');
	const abs = resolve(dir, path);
	const outside = relative(resolve(dir), abs).split(sep)[0] === '..';
	if (!path || outside || !statSync(abs, { throwIfNoEntry: false })) {
		console.error(`lint-content: no such root in ${dir}: ${root}`);
		process.exit(1);
	}
}
if (scope) console.error(`lint-content: scope = ${scope.join(', ')}`);
const { errors, notices } = lintDir(dir, scope ? { only: scopeFor(dir, scope) } : {});
const oneLine = (s: string) => s.trimEnd().replace(/\r?\n/g, '\\n');
for (const e of errors)
	console.log(
		[
			oneLine(e.file),
			oneLine(e.path) || '-',
			`#${e.check} ${oneLine(e.name)}`,
			oneLine(e.message)
		].join('  ')
	);
for (const n of notices) console.error(n);
console.error(
	`${errors.length} errors${errors.length ? ` in ${new Set(errors.map((e) => e.file)).size} files` : ''}`
);
process.exitCode = errors.length ? 1 : 0;
