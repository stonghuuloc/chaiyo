import { PGlite } from '@electric-sql/pglite';
import { migrate } from './migrate';

let template: Promise<PGlite> | undefined;

export function freshDb(): Promise<PGlite> {
	template ??= (async () => {
		const db = new PGlite();
		await migrate(db);
		return db;
	})();
	return template.then((t) => t.clone() as Promise<PGlite>);
}
