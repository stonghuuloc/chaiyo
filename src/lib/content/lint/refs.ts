import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import type { LintRefs, Mnemonic } from './types';

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

const VAULT_SCRIPT = `
import sys, json
sys.path.insert(0, sys.argv[1])
import meo
print(json.dumps({c: r[3] for c, r in meo.index().items()}, ensure_ascii=False))
`;
const NEO = { HÌNH: 'hinh', ÂM: 'am', 'ĐỜI THẬT': 'doiThat', 'TƯƠNG PHẢN': 'tuongPhan' } as const;

export function loadVaultMnemonics(dir: string): Map<string, Mnemonic> | undefined {
	if (!existsSync(join(dir, 'meo.py'))) return undefined;
	try {
		const raw = JSON.parse(
			execFileSync('python3', ['-c', VAULT_SCRIPT, dir], { encoding: 'utf8', timeout: 30_000 })
		) as Record<string, Record<string, string>>;
		const map = new Map<string, Mnemonic>();
		for (const [char, neo] of Object.entries(raw)) {
			if (Object.keys(NEO).some((k) => !neo[k])) continue;
			map.set(char, {
				hinh: neo['HÌNH'],
				am: neo['ÂM'],
				doiThat: neo['ĐỜI THẬT'],
				tuongPhan: neo['TƯƠNG PHẢN']
			});
		}
		return map;
	} catch {
		return undefined;
	}
}

export function loadRefs(root = process.cwd()): { refs: LintRefs; notices: string[] } {
	const sources = join(root, 'data/sources');
	const polyphonesFile = join(sources, 'polyphones.yaml');
	const polyphones = new Map<string, string[]>(
		Object.entries(YAML.parse(readFileSync(polyphonesFile, 'utf8')) as Record<string, string[]>)
	);
	const syllabus = new Map<number, number>();
	const [header, ...rows] = parseCsv(readFileSync(join(sources, 'hsk30-grammar.csv'), 'utf8'));
	const no = header.indexOf('No');
	const level = header.indexOf('Level');
	for (const r of rows) if (r[no]) syllabus.set(Number(r[no]), parseInt(r[level], 10));
	const vault = process.env.CHAIYO_VAULT ?? join(homedir(), 'Documents/second-brain/mandarin');
	const mnemonics = loadVaultMnemonics(vault);
	return {
		refs: { polyphones, syllabus, mnemonics },
		notices: mnemonics ? [] : ['check 7 skipped: vault not found']
	};
}
