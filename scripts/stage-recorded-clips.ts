import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AudioEntry } from '../src/lib/content/import/audio';
import { encodeMp3 } from '../src/lib/audio-renderer/gate';
import { noClipReason, toneNumber } from '../src/lib/audio-renderer/recorded';

const args = process.argv.slice(2);
const alias: Record<string, string> = {};
for (let at = args.indexOf('--alias'); at >= 0; at = args.indexOf('--alias')) {
	const [from, to] = (args.splice(at, 2)[1] ?? '').split('=');
	if (!from || !to) {
		console.error('--alias needs <syllable>=<file syllable>, e.g. nve=nue');
		process.exit(1);
	}
	alias[from] = to;
}
const [corpus, template, manifestPath, out] = args;
if (!out || !template.includes('{cell}')) {
	console.error(
		'usage: stage-recorded-clips <mp3-dir> <file-template> <audio-manifest.json> <out-dir> [--alias nve=nue]...\n' +
			'  file-template names a recording by its cell, e.g. {cell}_FV3_MP3.mp3 or {cell}.mp3'
	);
	process.exit(1);
}
mkdirSync(out, { recursive: true });

const entries = (JSON.parse(readFileSync(manifestPath, 'utf8')).entries as AudioEntry[]).filter(
	(e) => e.kind === 'syllable'
);
let staged = 0;
let kept = 0;
let skipped = 0;
const absent: string[] = [];
for (const e of entries) {
	const cell = toneNumber(e.hanzi);
	if (!cell) continue;
	if (noClipReason(cell)) {
		skipped++;
		continue;
	}
	const dest = join(out, `${e.key}.mp3`);
	const syllable = cell.slice(0, -1);
	const src = join(
		corpus,
		template.replace('{cell}', (alias[syllable] ?? syllable) + cell.slice(-1))
	);
	if (!existsSync(src)) {
		if (existsSync(dest)) kept++;
		else absent.push(cell);
		continue;
	}
	encodeMp3(src, dest, 1);
	staged++;
}
console.log(
	`staged ${staged}, kept ${kept} already in ${out}, allow-listed ${skipped}, no recording ${absent.length}`
);
for (const cell of absent) console.log(`no recording: ${cell}`);
process.exitCode = absent.length ? 1 : 0;
