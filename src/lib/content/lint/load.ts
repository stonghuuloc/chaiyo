import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { parseContent } from '../parse';
import type { ContentType } from '../schemas';
import { CHECK_NAMES, type ContentSet, type LintError } from './types';

const yamlFiles = (dir: string, sub: string, recursive: boolean): string[] => {
	const abs = join(dir, sub);
	try {
		if (!statSync(abs).isDirectory()) return [];
	} catch {
		return [];
	}
	return readdirSync(abs, { withFileTypes: true })
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.flatMap((e) => {
			const rel = `${sub}/${e.name}`;
			if (e.isDirectory()) return recursive ? yamlFiles(dir, rel, true) : [];
			return e.name.endsWith('.yaml') ? [rel] : [];
		});
};

const selected = (rel: string, only?: string[]) =>
	!only || only.some((o) => rel === o || rel.startsWith(o.replace(/\/$/, '') + '/'));

const isPrimer = (text: string) => {
	try {
		return YAML.parse(text)?.kind === 'primer';
	} catch {
		return false;
	}
};

export function loadContentDir(
	dir: string,
	opts: { only?: string[] } = {}
): { set: ContentSet; errors: LintError[] } {
	const set: ContentSet = {
		lessons: [],
		words: [],
		chars: [],
		grammar: [],
		sentences: [],
		syllables: []
	};
	const errors: LintError[] = [];
	const files: [string, ContentType | null][] = [
		...yamlFiles(dir, 'words', false).map((f): [string, ContentType | null] => [f, 'Word']),
		...yamlFiles(dir, 'chars', false).map((f): [string, ContentType | null] => [f, 'Char']),
		...yamlFiles(dir, 'grammar', false).map((f): [string, ContentType | null] => [
			f,
			'GrammarPoint'
		]),
		...yamlFiles(dir, 'lessons', true).map((f): [string, ContentType | null] => [f, null]),
		...yamlFiles(dir, 'sentences', false).map((f): [string, ContentType | null] => [
			f,
			'Sentences'
		]),
		...(selected('syllables.yaml', opts.only) && statSafe(join(dir, 'syllables.yaml'))
			? [['syllables.yaml', 'Syllables'] as [string, ContentType]]
			: [])
	];
	for (const [file, fixed] of files) {
		if (!selected(file, opts.only)) continue;
		const text = readFileSync(join(dir, file), 'utf8');
		const type = fixed ?? (isPrimer(text) ? 'Primer' : 'Lesson');
		const result = parseContent(type, file, text);
		if (!result.ok) {
			for (const e of result.errors) errors.push({ ...e, check: 0, name: CHECK_NAMES[0] });
			continue;
		}
		const value = result.value as never;
		if (type === 'Word') set.words.push({ file, value });
		else if (type === 'Char') set.chars.push({ file, value });
		else if (type === 'GrammarPoint') set.grammar.push({ file, value });
		else if (type === 'Sentences') set.sentences.push({ file, value });
		else if (type === 'Syllables') set.syllables = value;
		else set.lessons.push({ file, value });
	}
	return { set, errors };
}

function statSafe(path: string) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}
