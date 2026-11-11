import { writeFileSync } from 'node:fs';
import { audioKey, WORD_STYLE, type AudioEntry } from '../src/lib/content/import/audio';
import { BLOCKS } from '../src/lib/placement/bank';

const [manifestOut] = process.argv.slice(2);
if (!manifestOut) {
	console.error('usage: placement-clips <manifest-out.json>');
	process.exit(1);
}

const hanzis = BLOCKS.flatMap((b) => b.listen.map(([hanzi]) => hanzi));
const key = (hanzi: string) => audioKey(hanzi, 'redpanda', WORD_STYLE, 'words');
const entries: AudioEntry[] = hanzis.map((hanzi) => ({
	key: key(hanzi),
	kind: 'word',
	ref: `pl-${hanzi}`,
	voice: 'redpanda',
	style: WORD_STYLE,
	folder: 'words',
	hanzi
}));

writeFileSync(
	'src/lib/placement/clips.json',
	JSON.stringify(Object.fromEntries(hanzis.map((h) => [h, key(h)])), null, '\t') + '\n'
);
writeFileSync(manifestOut, JSON.stringify({ entries }, null, 2) + '\n');
console.log(`placement-clips: ${entries.length} entries`);
