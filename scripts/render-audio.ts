import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AudioEntry } from '../src/lib/content/import/audio';
import { takeFlag } from '../src/lib/audio-renderer/args';
import { recordedOnly } from '../src/lib/audio-renderer/recorded';
import { omniVoiceEngine, parseCast, pythonWorker } from '../src/lib/audio-renderer/omnivoice';
import { r2Bucket } from '../src/lib/audio-renderer/r2';
import { render } from '../src/lib/audio-renderer/render';
import { RenderError } from '../src/lib/audio-renderer/types';

const args = process.argv.slice(2);
const flag = (name: string) => {
	try {
		return takeFlag(args, name);
	} catch (err) {
		console.error(`render-audio: ${(err as Error).message}`);
		process.exit(1);
	}
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
if (!fromDir && kinds?.includes('syllable')) {
	console.error('render-audio: syllable clips are recorded, pass --from-dir <staged dir>');
	process.exit(1);
}
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