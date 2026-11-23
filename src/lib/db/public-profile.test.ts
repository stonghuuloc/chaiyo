import { PGlite } from '@electric-sql/pglite';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
	for (const [id, name] of [
		[LINH, 'Linh'],
		[NAM, 'Tống Lộc']
	]) {
		await asLearner(db, id);
		await db.query('insert into profiles (display_name) values ($1)', [name]);
		await asOwner(db);
	}
	await db.query('update profiles set hidden = true where learner_id = $1', [NAM]);
});
afterEach(() => db.close());

describe('public columns on profiles', () => {
	it('Given_NamHidden_When_LinhSelectsNam_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		const r = await db.query('select * from profiles where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(0);
	});

	it('Given_NamHidden_When_NamSelectsOwn_Then_RowWithHandleAndStats', async () => {
		await asLearner(db, NAM);
		const r = await db.query<{ streak: number; badges: string[] }>(
			'select handle, streak, words_week, words_known, hsk, lesson, badges from profiles where learner_id = $1',
			[NAM]
		);
		expect(r.rows).toHaveLength(1);
		expect(r.rows[0]).toMatchObject({
			streak: 0,
			words_week: 0,
			words_known: 0,
			hsk: 1,
			lesson: 0,
			badges: []
		});
		expect(r.fields.map((f) => f.name)).toContain('handle');
	});

	it('Given_NamUnhidden_When_LinhSelectsNam_Then_OneRow', async () => {
		await db.query('update profiles set hidden = false where learner_id = $1', [NAM]);
		await asLearner(db, LINH);
		const r = await db.query('select streak from profiles where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(1);
	});
});

describe('leaderboard join', () => {
	const joined = async () =>
		(
			await db.query(
				'select p.learner_id from follows f join profiles p on f.followee_id = p.learner_id'
			)
		).rows;

	it('Given_LinhFollowsHiddenNam_When_JoinFollowsProfiles_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		await db.query('insert into follows (followee_id) values ($1)', [NAM]);
		expect(await joined()).toHaveLength(0);
	});

	it('Given_NamUnhidden_When_JoinFollowsProfiles_Then_OneRow', async () => {
		await asLearner(db, LINH);
		await db.query('insert into follows (followee_id) values ($1)', [NAM]);
		await asOwner(db);
		await db.query('update profiles set hidden = false where learner_id = $1', [NAM]);
		await asLearner(db, LINH);
		expect(await joined()).toHaveLength(1);
	});
});

const THREE = '33333333-3333-3333-3333-333333333333';
const MIGRATIONS = join(import.meta.dirname, '../../../supabase/migrations');
const NEW_MIGRATION = '20261128000100_public_profiles.sql';

const signUp = async (id: string, name: string) => {
	await asOwner(db);
	await db.query('insert into auth.users (id) values ($1)', [id]);
	await asLearner(db, id);
	await db.query('insert into profiles (display_name) values ($1)', [name]);
	await asOwner(db);
};
const handleOf = async (id: string) =>
	(await db.query<{ handle: string }>('select handle from profiles where learner_id = $1', [id]))
		.rows[0].handle;
const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

describe('handle', () => {
	it('Given_TongLoc_When_Insert_Then_HandleLoc', async () => {
		expect(await handleOf(NAM)).toBe('loc');
		expect(await handleOf(LINH)).toBe('linh');
	});

	it('Given_SecondLoc_When_Insert_Then_HandleLoc2', async () => {
		await db.query('update profiles set hidden = false where learner_id = $1', [NAM]);
		await signUp(THREE, 'Lộc');
		expect(await handleOf(THREE)).toBe('loc2');
	});

	it('Given_HiddenLocExists_When_LinhInsertsLoc_Then_HandleLoc2', async () => {
		const other = '44444444-4444-4444-4444-444444444444';
		await db.query('insert into auth.users (id) values ($1)', [other]);
		await asLearner(db, other);
		await db.query('insert into profiles (display_name) values ($1)', ['Lộc']);
		await asOwner(db);
		expect(await handleOf(other)).toBe('loc2');
	});

	it('Given_NguyenThiNgoc_When_Insert_Then_HandleNgoc', async () => {
		await signUp(THREE, 'Nguyễn Thị Ngọc');
		expect(await handleOf(THREE)).toBe('ngoc');
	});

	it('Given_EmptyName_When_Insert_Then_HandleBan', async () => {
		await signUp(THREE, '');
		expect(await handleOf(THREE)).toBe('ban');
	});

	it('Given_Rename_When_Update_Then_HandleKept', async () => {
		await asLearner(db, LINH);
		await db.query("update profiles set display_name = 'Mai'");
		await asOwner(db);
		expect(await handleOf(LINH)).toBe('linh');
	});

	it('Given_BadHandle_When_Update_Then_23514', async () => {
		await asLearner(db, LINH);
		expect(await code(db.query("update profiles set handle = 'Bad Handle'"))).toBe('23514');
		expect(await code(db.query("update profiles set handle = ''"))).toBe('23514');
		expect(await code(db.query(`update profiles set handle = '${'a'.repeat(41)}'`))).toBe('23514');
	});

	it('Given_TakenHandle_When_Update_Then_23505', async () => {
		await asLearner(db, LINH);
		const own = await code(db.query("update profiles set handle = 'loc'"));
		expect(own).toBe('23505');
	});

	it('Given_DangNgoc_When_FoldVi_Then_dang_ngoc', async () => {
		const r = await db.query<{ f: string }>("select public.fold_vi('Đặng Ngọc') as f");
		expect(r.rows[0].f).toBe('dang ngoc');
	});

	it('Given_RowsBeforeMigration_When_Migrate_Then_Backfilled', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
		for (const f of readdirSync(MIGRATIONS))
			if (f !== NEW_MIGRATION) cpSync(join(MIGRATIONS, f), join(dir, f));
		const old = new PGlite();
		await migrate(old, dir);
		await old.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
		await old.query(
			"insert into profiles (learner_id, display_name, created_at) values ($1, 'Lộc', '2026-01-02'), ($2, 'Lộc', '2026-01-01')",
			[LINH, NAM]
		);
		await old.exec(readFileSync(join(MIGRATIONS, NEW_MIGRATION), 'utf8'));
		const r = await old.query<{ learner_id: string; handle: string }>(
			'select learner_id, handle from profiles order by created_at'
		);
		expect(r.rows.map((x) => [x.learner_id, x.handle])).toEqual([
			[NAM, 'loc'],
			[LINH, 'loc2']
		]);
		await old.close();
		rmSync(dir, { recursive: true });
	});
});

describe('public_profile', () => {
	type Row = Record<string, unknown>;
	const call = async (handle: string) =>
		(await db.query<Row>('select * from public.public_profile($1)', [handle])).rows;

	it('Given_Linh_When_PublicProfileLoc_Then_HiddenAllNull', async () => {
		await asLearner(db, LINH);
		const rows = await call('loc');
		expect(rows).toHaveLength(1);
		const { status, ...rest } = rows[0];
		expect(status).toBe('hidden');
		expect(Object.values(rest).every((v) => v === null)).toBe(true);
		expect(Object.keys(rest)).toHaveLength(9);
	});

	it('Given_Linh_When_PublicProfileLinh_Then_VisibleFields', async () => {
		await asLearner(db, LINH);
		const rows = await call('linh');
		expect(rows).toEqual([
			{
				status: 'visible',
				display_name: 'Linh',
				photo_url: null,
				handle: 'linh',
				streak: 0,
				words_week: 0,
				words_known: 0,
				hsk: 1,
				lesson: 0,
				badges: []
			}
		]);
	});

	it('Given_Linh_When_PublicProfileKhongco_Then_Missing', async () => {
		await asLearner(db, LINH);
		const rows = await call('khongco');
		expect(rows).toHaveLength(1);
		const { status, ...rest } = rows[0];
		expect(status).toBe('missing');
		expect(Object.values(rest).every((v) => v === null)).toBe(true);
	});

	it('Given_Upper_When_PublicProfileLOC_Then_SameAsLoc', async () => {
		await asLearner(db, LINH);
		expect(await call('LOC')).toEqual(await call('loc'));
	});

	it('Given_Nam_When_PublicProfileOwnHidden_Then_Visible', async () => {
		await asLearner(db, NAM);
		const rows = await call('loc');
		expect(rows[0]).toMatchObject({ status: 'visible', display_name: 'Tống Lộc', handle: 'loc' });
	});

	it('Given_Anon_When_PublicProfile_Then_42501', async () => {
		await db.exec('set role anon');
		expect(await code(call('loc'))).toBe('42501');
	});
});
