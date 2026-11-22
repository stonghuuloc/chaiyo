import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importContent } from '#lib/content/import/import.js';
import { PRODUCTION_ROOTS, scopeFor } from '#lib/content/import/scope.js';
import { createMemorySink, type ImportedContent } from '#lib/content/import/sink.js';

let cached: Promise<ImportedContent> | undefined;

export function realContent(): Promise<ImportedContent> {
	cached ??= (async () => {
		const prev = process.env.CHAIYO_VAULT;
		process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
		try {
			const sink = createMemorySink();
			const r = await importContent('content', sink, {
				only: scopeFor('content', PRODUCTION_ROOTS)
			});
			if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
			if (!sink.content) throw new Error('import wrote no content');
			return sink.content;
		} finally {
			if (prev === undefined) delete process.env.CHAIYO_VAULT;
			else process.env.CHAIYO_VAULT = prev;
		}
	})();
	return cached;
}
