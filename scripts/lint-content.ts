import { statSync } from 'node:fs';
import { lintDir } from '../src/lib/content/lint';

const dir = process.argv[2] ?? 'content';
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
	console.error(`lint-content: not a directory: ${dir}`);
	process.exit(1);
}
const oneLine = (s: string) => s.trimEnd().replace(/\r?\n/g, '\\n');
const { errors, notices } = lintDir(dir);
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
