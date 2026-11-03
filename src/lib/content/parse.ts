import YAML, { YAMLParseError } from 'yaml';
import { schemas, type ContentType } from './schemas';

export type ContentError = {
	file: string;
	path: string;
	message: string;
	line?: number;
	col?: number;
};
export type ParseResult = { ok: true; value: unknown } | { ok: false; errors: ContentError[] };

const formatPath = (path: PropertyKey[]) =>
	path.map((k, i) => (typeof k === 'number' ? `[${k}]` : (i ? '.' : '') + String(k))).join('');

export function parseContent(type: ContentType, file: string, text: string): ParseResult {
	let data: unknown;
	try {
		data = YAML.parse(text);
	} catch (e) {
		const { line, col } = e instanceof YAMLParseError ? (e.linePos?.[0] ?? {}) : {};
		return {
			ok: false,
			errors: [{ file, path: '', line, col, message: e instanceof Error ? e.message : String(e) }]
		};
	}
	const result = schemas[type].safeParse(data);
	if (result.success) return { ok: true, value: result.data };
	return {
		ok: false,
		errors: result.error.issues.flatMap((issue) =>
			issue.code === 'unrecognized_keys'
				? issue.keys.map((key) => ({
						file,
						path: formatPath([...issue.path, key]),
						message: 'unknown key'
					}))
				: [{ file, path: formatPath(issue.path), message: issue.message }]
		)
	};
}
