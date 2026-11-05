import { statSync } from 'node:fs';
import { createBundleSink, createMemorySink, importContent } from '../src/lib/content/import';
import { createPostgresSink } from '../src/lib/content/import/postgres-sink';
import { scopeFor } from '../src/lib/content/import/scope';
import { loadRefs } from '../src/lib/content/lint';
import { createPgClient } from './pg-client';

const fail = (message: string): never => {
	console.error(`import-content: ${message}`);
	process.exit(1);
};

const args = process.argv.slice(2);
const flag = (name: string) => {
	const at = args.indexOf(`--${name}`);
	if (at < 0) return undefined;
	const [value] = args.splice(at, 2).slice(1);
	return value ?? fail(`--${name} needs a value`);
};
const sinkName = flag('sink') ?? 'memory';
const outDir = flag('out') ?? 'static/content';
const only = flag('only');
const dir = args[0] ?? 'content';

if (!['memory', 'bundle', 'postgres'].includes(sinkName)) fail(`unknown sink: ${sinkName}`);
const url = process.env.SUPABASE_DB_URL;
if (sinkName === 'postgres' && !url) fail('--sink postgres needs SUPABASE_DB_URL');
if (sinkName === 'postgres' && only)
	fail('--only cannot be used with --sink postgres: the sink prunes rows outside the scope');
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) fail(`not a directory: ${dir}`);

const pgClient = sinkName === 'postgres' ? createPgClient(url!) : undefined;
const sink = pgClient
	? createPostgresSink(pgClient)
	: sinkName === 'bundle'
		? createBundleSink(outDir)
		: createMemorySink();

const oneLine = (s: string) => s.trimEnd().replace(/\r?\n/g, '\\n');
const { refs, notices } = loadRefs();
for (const n of notices) console.error(n);
const result = await importContent(dir, sink, {
	refs,
	...(only ? { only: scopeFor(dir, only.split(',')) } : {})
});
await pgClient?.close();
if ('errors' in result) {
	for (const e of result.errors)
		console.log(
			[
				oneLine(e.file),
				oneLine(e.path) || '-',
				`#${e.check} ${oneLine(e.name)}`,
				oneLine(e.message)
			].join('  ')
		);
	console.error(
		`${result.errors.length} errors in ${new Set(result.errors.map((e) => e.file)).size} files`
	);
	process.exit(1);
}
console.log(result.sha);
