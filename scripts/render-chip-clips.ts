import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	CHIP_HANZI,
	chipEntries,
	chipWaveform,
	encodeChipMp3
} from '../src/lib/audio-renderer/chips';
import { audioKey, type AudioEntry } from '../src/lib/content/import/audio';

function fail(message: string): never {
	console.error(`render-chip-clips: ${message}`);
	process.exit(2);
}

const argv = process.argv.slice(2);
const outAt = argv.indexOf('--out');
const outDir: string | undefined = outAt >= 0 ? argv.splice(outAt, 2)[1] : undefined;
if (outAt >= 0 && (!outDir || outDir.startsWith('--')))
	fail('--out needs a value (the directory that render:audio --from-dir reads)');
const unknown = argv.find((a) => a.startsWith('--'));
if (unknown) fail(`unknown option ${unknown}`);
let [manifestPath] = argv;
if (!manifestPath) {
	const { sha } = existsSync('static/content/current.json')
		? (JSON.parse(readFileSync('static/content/current.json', 'utf8')) as { sha: string })
		: { sha: '' };
	manifestPath = `static/content/${sha}/audio-manifest.json`;
}

const KEY = process.env.AZURE_SPEECH_KEY ?? '';
const REGION = process.env.AZURE_SPEECH_REGION ?? '';
if (!KEY)
	fail('AZURE_SPEECH_KEY is missing or empty (export it; this script reads the environment only)');
if (!REGION)
	fail(
		'AZURE_SPEECH_REGION is missing or empty (export it; this script reads the environment only)'
	);
if (!outDir) fail('usage: render-chip-clips [<audio-manifest.json>] --out <dir>');
if (!existsSync(manifestPath)) fail(`no audio manifest at ${manifestPath}`);

const entries = (JSON.parse(readFileSync(manifestPath, 'utf8')) as { entries: AudioEntry[] })
	.entries;
const chips = chipEntries(entries);
if (!chips.length) fail('the manifest has no multi-syllable syllable entries');
const unmapped = chips.filter((e) => !(e.hanzi in CHIP_HANZI));
for (const e of unmapped) console.error(`no chip text: ${e.hanzi}`);
if (unmapped.length) fail(`${unmapped.length} manifest chips are not in CHIP_HANZI`);
const badKey = chips.filter((e) => e.key !== audioKey(e.hanzi, 'narrator'));
if (badKey.length) fail(`${badKey.length} syllable entries are not sha256(hanzi|narrator)`);

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'chaiyo-chips-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

let rendered = 0;
let skipped = 0;
for (const chip of chips) {
	const out = join(outDir, `${chip.key}.mp3`);
	if (existsSync(out)) {
		skipped++;
		continue;
	}
	const wav = join(tmp, `${chip.key}.wav`);
	writeFileSync(wav, await chipWaveform({ key: KEY, region: REGION }, CHIP_HANZI[chip.hanzi]));
	encodeChipMp3(wav, out);
	rmSync(wav);
	rendered++;
}

console.log(`chips: ${chips.length} (rendered ${rendered}, skipped ${skipped})`);
console.log(`upload: pnpm render:audio ${manifestPath} --kind syllable --from-dir ${outDir}`);
console.log(
	`upload MV1: pnpm render:audio ${manifestPath} --kind syllable --from-dir ${outDir} --prefix mv1`
);
