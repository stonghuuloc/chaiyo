import type { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SHIM = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
	select coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;`;

export async function migrate(
	db: PGlite,
	dir = join(import.meta.dirname, '../../../supabase/migrations')
): Promise<string[]> {
	await db.exec(SHIM);
	const files = readdirSync(dir)
		.filter((f) => f.endsWith('.sql'))
		.sort();
	for (const f of files) {
		try {
			await db.exec(readFileSync(join(dir, f), 'utf8'));
		} catch (e) {
			throw new Error(`${f}: ${(e as Error).message}`, { cause: e });
		}
	}
	return files;
}

export const asLearner = (db: PGlite, id: string) =>
	db.exec(
		`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${id}"}', false)`
	);

export const asOwner = (db: PGlite) => db.exec('reset role');
