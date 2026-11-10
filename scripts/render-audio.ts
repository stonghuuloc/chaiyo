import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AudioEntry } from '../src/lib/content/import/audio';
import { AUDIO_VERSION } from '../src/lib/audio/version';
import { parseArgs } from '../src/lib/audio-renderer/args';
import { azureEngine, azureRequest, billable, parseCast } from '../src/lib/audio-renderer/azure';
import { recordedOnly } from '../src/lib/audio-renderer/recorded';
import { r2Bucket } from '../src/lib/audio-renderer/r2';
import { render } from '../src/lib/audio-renderer/render';
import { RenderError } from '../src/lib/audio-renderer/types';

let parsed: ReturnType<typeof parseArgs>;
try {
	parsed = parseArgs(process.argv.slice(2), [
		'kind',
		'ref-prefix',
		'from-dir',
		'prefix',
		'limit',
		'state',
		'count'
	]);
} catch (err) {
	console.error(`render-audio: ${(err as Error).message}`);
	process.exit(1);
}
const { flags, positional } = parsed;
const kinds = flags.kind?.split(',');
const KINDS = ['sentence', 'word', 'syllable'];
const badKind = kinds?.find((k) => !KINDS.includes(k));
if (badKind !== undefined) {
	console.error(`render-audio: unknown --kind "${badKind}" (use ${KINDS.join(', ')})`);
	process.exit(1);
}
const refPrefix = flags['ref-prefix'];
const fromDir = flags['from-dir'];
const keyPrefix = `${(flags.prefix ?? AUDIO_VERSION).replace(/\/+$/, '')}/`;
const limit = flags.limit;
if (limit !== undefined && !/^[1-9]\d*$/.test(limit)) {
	console.error('render-audio: --limit needs a positive integer');
	process.exit(1);
}
if (flags.count !== undefined && flags.count !== 'only') {
	console.error('render-audio: use --count only');
	process.exit(1);
}
const [manifestPath] = positional;
if (!manifestPath) {
	console.error(
		'usage: render-audio <audio-manifest.json> [--kind sentence,word,syllable] [--ref-prefix <p>] [--limit N] [--prefix <p>] [--state <dir>] [--count only] [--from-dir <dir>]'
	);
	process.exit(1);
}

const cast = parseCast(readFileSync('content/cast.yaml', 'utf8'));
const { entries } = JSON.parse(readFileSync(manifestPath, 'utf8')) as { entries: AudioEntry[] };
const stagedFile = (key: string) => join(fromDir ?? '', `${key}.mp3`);
const requestOf = (e: AudioEntry) => azureRequest(cast, e);
const renderable = fromDir
	? recordedOnly(entries, (key) => existsSync(stagedFile(key)))
	: entries.filter((e) => requestOf(e) !== undefined);
const picked = renderable
	.filter((e) => !kinds || kinds.includes(e.kind))
	.filter((e) => !refPrefix || e.ref.startsWith(refPrefix))
	.slice(0, limit ? Number(limit) : undefined);

if (flags.count) {
	const chars = fromDir ? 0 : picked.reduce((n, e) => n + billable(requestOf(e)!.body), 0);
	console.log(
		`${picked.length} clips, ${chars} billable characters, ${entries.length - renderable.length} without a carrier`
	);
	process.exit(0);
}

if (existsSync('.env')) process.loadEnvFile('.env');
const env: Record<string, string> = {};
for (const name of [
	'R2_ACCOUNT_ID',
	'R2_AUDIO_BUCKET',
	'R2_AUDIO_ACCESS_KEY_ID',
	'R2_AUDIO_SECRET_ACCESS_KEY',
	'R2_PUBLIC_URL',
	...(fromDir ? [] : ['AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION'])
]) {
	env[name] = process.env[name] ?? '';
	if (!env[name]) {
		console.error(`${name} is missing or empty (set it in .env)`);
		process.exit(2);
	}
}

const state = flags.state ?? join(homedir(), '.capy', 'work', 'chaiyo-audio');
mkdirSync(state, { recursive: true });
const lock = join(state, 'render.lock');
try {
	closeSync(openSync(lock, 'wx'));
} catch {
	console.error(`render-audio: another render holds ${lock} (delete it if no render is running)`);
	process.exit(1);
}
process.on('exit', () => rmSync(lock, { force: true }));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => process.exit(130));

const engine = azureEngine(cast, {
	key: env.AZURE_SPEECH_KEY,
	region: env.AZURE_SPEECH_REGION,
	cacheDir: join(state, 'clips')
});
const bucket = r2Bucket({
	accountId: env.R2_ACCOUNT_ID,
	bucket: env.R2_AUDIO_BUCKET,
	accessKeyId: env.R2_AUDIO_ACCESS_KEY_ID,
	secretAccessKey: env.R2_AUDIO_SECRET_ACCESS_KEY
});

try {
	const recorded = fromDir
		? (key: string) => new Uint8Array(readFileSync(stagedFile(key)))
		: undefined;
	const { uploaded, skipped } = await render(picked, {
		engine,
		bucket,
		recorded,
		prefix: keyPrefix
	});
	console.log(`${uploaded} uploaded, ${skipped} skipped`);
	if (picked[0])
		console.log(`e.g. ${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${keyPrefix}${picked[0].key}.mp3`);
} catch (e) {
	if (!(e instanceof RenderError || (e instanceof Error && e.message.startsWith('key mismatch'))))
		throw e;
	if (e instanceof RenderError) {
		for (const f of e.failures) console.log(`failed: ${f.ref} ${f.message}`);
		console.log(`${e.uploaded} uploaded, ${e.skipped} skipped, ${e.failures.length} failed`);
	} else console.error(e.message);
	process.exitCode = 1;
}
