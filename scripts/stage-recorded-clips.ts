import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AudioEntry } from '../src/lib/content/import/audio';
import { encodeMp3 } from '../src/lib/audio-renderer/gate';
import { noClipReason, toneNumber } from '../src/lib/audio-renderer/recorded';

const args = process.argv.slice(2);
const [corpus, speaker, manifestPath, out] = args;
if (!out) {
	console.error(
		'usage: stage-recorded-clips <tone-perfect-mp3-dir> <speaker> <audio-manifest.json> <out-dir>'
	);
	process.exit(1);
}
mkdirSync(out, { recursive: true });

const entries = (JSON.parse(readFileSync(manifestPath, 'utf8')).entries as AudioEntry[]).filter(
	(e) => e.kind === 'syllable'
);
let staged = 0;
let skipped = 0;
const absent: string[] = [];
for (const e of entries) {
	const cell = toneNumber(e.hanzi);
	if (!cell) continue;
	if (noClipReason(cell)) {
		skipped++;
		continue;
	}
	const src = join(corpus, `${cell}_${speaker}_MP3.mp3`);
	if (!existsSync(src)) {
		absent.push(cell);
		continue;
	}
	encodeMp3(src, join(out, `${e.key}.mp3`), 1);
	staged++;
}
console.log(`staged ${staged}, allow-listed ${skipped}, no recording ${absent.length}`);
for (const cell of absent) console.log(`no recording: ${cell}`);
process.exitCode = absent.length ? 1 : 0;
