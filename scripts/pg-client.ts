import pg from 'pg';
import type { SqlClient } from '../src/lib/content/import/postgres-sink';

export function createPgClient(url: string): SqlClient & { close(): Promise<void> } {
	const client = new pg.Client({ connectionString: url });
	const connected = client.connect();
	const query: SqlClient['query'] = async (sql, params) => {
		await connected;
		return client.query(sql, params);
	};
	return {
		query,
		transaction: async (fn) => {
			await query('begin');
			try {
				const result = await fn(query);
				await query('commit');
				return result;
			} catch (e) {
				await query('rollback').catch(() => {});
				throw e;
			}
		},
		close: async () => {
			await connected;
			await client.end();
		}
	};
}
