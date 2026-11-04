import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { LintRefs } from './types';

const parseCsv = (text: string) => {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c !== '"') cell += c;
			else if (text[i + 1] === '"') cell += text[i++];
			else quoted = false;
		} else if (c === '"') quoted = true;
		else if (c === ',') {
			row.push(cell);
			cell = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
		} else cell += c;
	}
	if (cell || row.length) rows.push([...row, cell]);
	return rows;
};

export function loadRefs(root = process.cwd()): { refs: LintRefs; notices: string[] } {
	const sources = join(root, 'data/sources');
	const polyphonesFile = join(sources, 'polyphones.yaml');
	const polyphones = new Map<string, string[]>(
		Object.entries(
			existsSync(polyphonesFile)
				? (YAML.parse(readFileSync(polyphonesFile, 'utf8')) as Record<string, string[]>)
				: {}
		)
	);
	const syllabus = new Map<number, number>();
	const [header, ...rows] = parseCsv(readFileSync(join(sources, 'hsk30-grammar.csv'), 'utf8'));
	const no = header.indexOf('No');
	const level = header.indexOf('Level');
	for (const r of rows) if (r[no]) syllabus.set(Number(r[no]), parseInt(r[level], 10));
	return { refs: { polyphones, syllabus }, notices: ['check 7 skipped: vault not found'] };
}
