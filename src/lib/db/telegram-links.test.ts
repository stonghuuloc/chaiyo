import { PGlite } from '@electric-sql/pglite';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const CHAT = 777000111;

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}');
		insert into telegram_links (user_id, chat_id) values ('${NAM}', 555000999)`);
});
afterEach(() => db.close());

const linkCount = (user: string) =>
	db
		.query<{ n: number }>('select count(*)::int as n from telegram_links where user_id = $1', [
			user
		])
		.then((r) => r.rows[0].n);
const issue = () =>
	db
		.query<{ telegram_link_token: string }>('select telegram_link_token()')
		.then((r) => r.rows[0].telegram_link_token);
const claim = (token: string, chat: number) =>
	db
		.query<{ claim_telegram_link: string | null }>('select claim_telegram_link($1, $2)', [
			token,
			chat
		])
		.then((r) => r.rows[0].claim_telegram_link);

describe('telegram_links', () => {
	it('Given_Linh_When_SelectNams_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		const r = await db.query('select * from telegram_links where user_id = $1', [NAM]);
		expect(r.rows).toHaveLength(0);
	});

	it('Given_Linh_When_DeleteNams_Then_ZeroAffected', async () => {
		await asLearner(db, LINH);
		const r = await db.query('delete from telegram_links where user_id = $1', [NAM]);
		expect(r.affectedRows).toBe(0);
		await asOwner(db);
		expect(await linkCount(NAM)).toBe(1);
	});

	it('Given_Linh_When_InsertOwn_Then_Denied', async () => {
		await asLearner(db, LINH);
		await expect(
			db.query('insert into telegram_links (user_id, chat_id) values ($1, 42)', [LINH])
		).rejects.toMatchObject({ code: '42501' });
	});

	it('Given_Linh_When_DeleteOwn_Then_Gone', async () => {
		await asOwner(db);
		await db.query('insert into telegram_links (user_id, chat_id) values ($1, $2)', [LINH, CHAT]);
		await asLearner(db, LINH);
		const r = await db.query('delete from telegram_links where user_id = $1', [LINH]);
		expect(r.affectedRows).toBe(1);
	});
});

describe('telegram_link_token', () => {
	it('Given_Linh_When_IssueTwice_Then_OneLiveToken32Hex15Min', async () => {
		await asLearner(db, LINH);
		const first = await issue();
		const second = await issue();
		expect(first).toMatch(/^[0-9a-f]{32}$/);
		expect(second).toMatch(/^[0-9a-f]{32}$/);
		expect(second).not.toBe(first);
		await asOwner(db);
		const r = await db.query<{ n: number; lo: number; hi: number }>(
			`select count(*)::int as n,
				extract(epoch from min(expires_at) - now())::float as lo,
				extract(epoch from max(expires_at) - now())::float as hi
			 from telegram_link_tokens where user_id = $1`,
			[LINH]
		);
		expect(r.rows[0].n).toBe(1);
		expect(r.rows[0].lo).toBeGreaterThan(14 * 60);
		expect(r.rows[0].hi).toBeLessThanOrEqual(15 * 60);
	});

	it('Given_Anon_When_Issue_Then_Denied', async () => {
		await db.exec('set role anon');
		await expect(issue()).rejects.toMatchObject({ code: '42501' });
	});
});

describe('claim_telegram_link', () => {
	const issueFor = async (user: string) => {
		await asLearner(db, user);
		const token = await issue();
		await asOwner(db);
		return token;
	};

	it('Given_LiveToken_When_Claim_Then_LinkAndFlag', async () => {
		const token = await issueFor(LINH);
		await db.exec('set role service_role');
		expect(await claim(token, CHAT)).toBe(LINH);
		await asOwner(db);
		const link = await db.query('select user_id, chat_id from telegram_links where user_id = $1', [
			LINH
		]);
		expect(link.rows).toEqual([{ user_id: LINH, chat_id: CHAT }]);
		const flag = await db.query('select remind_telegram from settings where learner_id = $1', [
			LINH
		]);
		expect(flag.rows).toEqual([{ remind_telegram: true }]);
	});

	it('Given_UsedToken_When_ClaimAgain_Then_Null', async () => {
		const token = await issueFor(LINH);
		await db.exec('set role service_role');
		await claim(token, CHAT);
		expect(await claim(token, 888000222)).toBeNull();
		await asOwner(db);
		const link = await db.query('select chat_id from telegram_links where user_id = $1', [LINH]);
		expect(link.rows).toEqual([{ chat_id: CHAT }]);
	});

	it('Given_ExpiredToken_When_Claim_Then_NullNoLink', async () => {
		const token = await issueFor(LINH);
		await db.query(
			"update telegram_link_tokens set expires_at = now() - interval '1 second' where token = $1",
			[token]
		);
		await db.exec('set role service_role');
		expect(await claim(token, CHAT)).toBeNull();
		await asOwner(db);
		expect(await linkCount(LINH)).toBe(0);
	});

	it('Given_UnknownToken_When_Claim_Then_Null', async () => {
		await db.exec('set role service_role');
		expect(await claim('f'.repeat(32), CHAT)).toBeNull();
		await asOwner(db);
		expect(await linkCount(LINH)).toBe(0);
	});

	it('Given_Linked_When_ClaimNewChat_Then_ChatReplaced', async () => {
		const first = await issueFor(LINH);
		await db.exec('set role service_role');
		await claim(first, CHAT);
		await asOwner(db);
		const second = await issueFor(LINH);
		await db.exec('set role service_role');
		await claim(second, 888000222);
		await asOwner(db);
		const link = await db.query('select chat_id from telegram_links where user_id = $1', [LINH]);
		expect(link.rows).toEqual([{ chat_id: 888000222 }]);
	});
});

describe('claim_telegram_link execute grant', () => {
	let dir: string;
	let supabaseLike: PGlite;
	beforeEach(async () => {
		dir = mkdtempSync(join(tmpdir(), 'tg-migrations-'));
		cpSync(join(import.meta.dirname, '../../../supabase/migrations'), dir, { recursive: true });
		writeFileSync(
			join(dir, '00000000000000_default_privileges.sql'),
			'alter default privileges in schema public grant execute on functions to authenticated;'
		);
		supabaseLike = new PGlite();
		await migrate(supabaseLike, dir);
		await supabaseLike.exec(`insert into auth.users (id) values ('${LINH}')`);
	});
	afterEach(async () => {
		await supabaseLike.close();
		rmSync(dir, { recursive: true, force: true });
	});

	it('Given_Linh_When_CallClaim_Then_42501', async () => {
		await asLearner(supabaseLike, LINH);
		await expect(
			supabaseLike.query('select claim_telegram_link($1, $2)', ['f'.repeat(32), CHAT])
		).rejects.toMatchObject({ code: '42501' });
	});
});
