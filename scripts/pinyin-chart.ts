import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { addTone, audioKey } from '../src/lib/content/import/audio';
import { NO_CLIP } from '../src/lib/audio-renderer/recorded';
import { SYL } from '../prototype/data/syllables.js';

type Row = { syllable: string; initial: string; final: string };
const rows = parse(readFileSync('content/syllables.yaml', 'utf8')) as Row[];
const hanzi = SYL as Record<string, { tones?: Record<number, { hz?: string }> }>;

const cells = rows
	.filter((r) => !NO_CLIP[r.syllable])
	.map((r) => ({
		syllable: r.syllable,
		initial: r.initial,
		final: r.final,
		tones: [1, 2, 3, 4].map((t) => {
			const text = addTone(r.syllable, t);
			return {
				text,
				key: audioKey(text, 'redpanda'),
				hanzi: hanzi[r.syllable]?.tones?.[t]?.hz ?? null
			};
		})
	}));

writeFileSync('src/routes/(app)/pinyin/chart.json', JSON.stringify(cells, null, '\t') + '\n');
const count = cells.flatMap((c) => c.tones).filter((t) => t.hanzi).length;
console.log(`pinyin-chart: ${cells.length} cells, ${cells.length * 4} clips, ${count} hanzi`);
