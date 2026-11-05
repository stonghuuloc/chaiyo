import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDictionary, type ThinEntry } from '../derive';
import { lintDir, type LintError, type LintRefs } from '../lint';
import { assemble } from './assemble';
import type { Sink } from './sink';

const byLocation = (a: LintError, b: LintError) =>
	a.file < b.file
		? -1
		: a.file > b.file
			? 1
			: a.path < b.path
				? -1
				: a.path > b.path
					? 1
					: a.check - b.check;

const deriveError = (path: string, message: string): LintError => ({
	file: 'dictionary.json',
	path,
	check: 10,
	name: 'Derive',
	message
});

const canonical = (v: unknown): string =>
	JSON.stringify(v, (_k, x) =>
		x && typeof x === 'object' && !Array.isArray(x)
			? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
			: x
	);

const loadDictionary = (
	dir: string
): { ok: true; value: Map<string, ThinEntry> } | { ok: false; errors: LintError[] } => {
	const file = join(dir, 'dictionary.json');
	if (!existsSync(file)) return { ok: true, value: new Map() };
	let rows: unknown;
	try {
		rows = JSON.parse(readFileSync(file, 'utf8'));
	} catch (e) {
		return { ok: false, errors: [deriveError('', e instanceof Error ? e.message : String(e))] };
	}
	const parsed = parseDictionary('dictionary.json', rows);
	if (parsed.ok) return parsed;
	return { ok: false, errors: parsed.errors.map((e) => deriveError(e.path, e.message)) };
};

export async function importContent(
	dir: string,
	sink: Sink,
	opts?: { refs?: LintRefs; only?: string[] }
): Promise<{ sha: string } | { errors: LintError[] }> {
	const { set, errors } = lintDir(dir, opts);
	if (errors.length) return { errors };
	const dictionary = loadDictionary(dir);
	if (!dictionary.ok) return { errors: dictionary.errors.sort(byLocation) };
	const built = assemble(set, dictionary.value);
	if ('errors' in built) return { errors: built.errors.sort(byLocation) };
	const sha = createHash('sha256').update(canonical(built.content)).digest('hex');
	if (!(await sink.has(sha))) await sink.write({ ...built.content, sha });
	return { sha };
}
