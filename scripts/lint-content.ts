import { statSync } from 'node:fs';
import { lintDir } from '../src/lib/content/lint';

const dir = process.argv[2] ?? 'content';
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
	console.error(`lint-content: not a directory: ${dir}`);
	process.exit(1);
}
const { errors, notices } = lintDir(dir);
for (const e of errors)
	console.log(
		`${e.file}  ${e.path || '-'}  #${e.check} ${e.name}  ${e.message.replace(/\s+/g, ' ')}`
	);
for (const n of notices) console.error(n);
console.error(
	`${errors.length} errors${errors.length ? ` in ${new Set(errors.map((e) => e.file)).size} files` : ''}`
);
process.exitCode = errors.length ? 1 : 0;
