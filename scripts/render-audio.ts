import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AudioEntry } from '../src/lib/content/import/audio';
import { omniVoiceEngine, parseCast, pythonWorker } from '../src/lib/audio-renderer/omnivoice';
import { r2Bucket } from '../src/lib/audio-renderer/r2';
import { render } from '../src/lib/audio-renderer/render';
import { RenderError } from '../src/lib/audio-renderer/types';

const args = process.argv.slice(2);
const flag = (name: string) => {
	const at = args.indexOf(`--${name}`);
	if (at < 0) return undefined;
	const value = args.splice(at, 2)[1];
	if (value === undefined) {
		console.error(`render-audio: --${name} needs a value`);
		process.exit(1);
	}
	return value;
};
const kinds = flag('kind')?.split(',');
const KINDS = ['sentence', 'word', 'syllable'];
const badKind = kinds?.find((k) => !KINDS.includes(k));
if (badKind !== undefined) {
	console.error(`render-audio: unknown --kind "${badKind}" (use ${KINDS.join(', ')})`);
	process.exit(1);
}
const refPrefix = flag('ref-prefix');
const fromDir = flag('from-dir');
const prefix = flag('prefix');
const keyPrefix = prefix ? `${prefix.replace(/\/+$/, '')}/` : '';
const limit = flag('limit');
if (limit !== undefined && !/^[1-9]\d*$/.test(limit)) {
	console.error('render-audio: --limit needs a positive integer');
	process.exit(1);
}
const unknown = args.find((a) => a.startsWith('--'));
if (unknown) {
	console.error(`render-audio: unknown option ${unknown}`);
	process.exit(1);
}
const [manifestPath] = args;
if (!manifestPath) {
	console.error(
		'usage: render-audio <audio-manifest.json> [--kind sentence,word,syllable] [--ref-prefix <p>] [--limit N] [--from-dir <dir>] [--prefix <p>]'
	);
	process.exit(1);
}

if (existsSync('.env')) process.loadEnvFile('.env');
const env: Record<string, string> = {};
for (const name of [
	'R2_ACCOUNT_ID',
	'R2_AUDIO_BUCKET',
	'R2_AUDIO_ACCESS_KEY_ID',
	'R2_AUDIO_SECRET_ACCESS_KEY',
	'R2_PUBLIC_URL',
	'OMNIVOICE_PYTHON'
]) {
	env[name] = process.env[name] ?? '';
	if (!env[name]) {
		console.error(`${name} is missing or empty (set it in .env)`);
		process.exit(2);
	}
}

const { entries } = JSON.parse(readFileSync(manifestPath, 'utf8')) as { entries: AudioEntry[] };
const stagedFile = (key: string) => join(fromDir ?? '', `${key}.mp3`);
const picked = entries
	.filter((e) => !kinds || kinds.includes(e.kind))
	.filter((e) => !fromDir || existsSync(stagedFile(e.key)))
	.filter((e) => !refPrefix || e.ref.startsWith(refPrefix))
	.slice(0, limit ? Number(limit) : undefined);

const engine = omniVoiceEngine(parseCast(readFileSync('content/cast.yaml', 'utf8')), {
	startWorker: () => pythonWorker(env.OMNIVOICE_PYTHON),
	cacheDir: join('node_modules', '.cache', 'chaiyo-audio')
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
} finally {
	engine.close();
}
