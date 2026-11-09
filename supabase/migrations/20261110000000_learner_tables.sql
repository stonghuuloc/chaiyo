create table profiles (
	learner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
	display_name text not null default '',
	photo_url text,
	hidden boolean not null default false,
	created_at timestamptz not null default now()
);

create table settings (
	learner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
	tz text not null default 'Asia/Ho_Chi_Minh',
	updated_at timestamptz not null default now()
);

create table follows (
	follower_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	followee_id uuid not null references auth.users (id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (follower_id, followee_id),
	check (follower_id <> followee_id)
);

create table attempts (
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	id text not null,
	question_id text not null,
	content_sha text not null,
	skill text check (skill in ('the', 'nghe', 'viet')),
	word text,
	correct boolean,
	answer jsonb,
	ms int not null check (ms >= 0),
	at timestamptz not null,
	received_at timestamptz not null default now(),
	primary key (learner_id, id),
	check ((skill is null) = (word is null))
);

create index attempts_learner_at on attempts (learner_id, at);

alter table profiles enable row level security;
alter table settings enable row level security;
alter table follows enable row level security;
alter table attempts enable row level security;

create policy settings_select on settings for select to authenticated
	using (learner_id = (select auth.uid()));
create policy settings_insert on settings for insert to authenticated
	with check (learner_id = (select auth.uid()));
create policy settings_update on settings for update to authenticated
	using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

create policy attempts_select on attempts for select to authenticated
	using (learner_id = (select auth.uid()));
create policy attempts_insert on attempts for insert to authenticated
	with check (learner_id = (select auth.uid()));

create policy follows_select on follows for select to authenticated
	using (follower_id = (select auth.uid()));
create policy follows_insert on follows for insert to authenticated
	with check (follower_id = (select auth.uid()));
create policy follows_delete on follows for delete to authenticated
	using (follower_id = (select auth.uid()));

create policy profiles_select on profiles for select to authenticated
	using (learner_id = (select auth.uid()) or hidden = false);
create policy profiles_insert on profiles for insert to authenticated
	with check (learner_id = (select auth.uid()));
create policy profiles_update on profiles for update to authenticated
	using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

revoke all on profiles, settings, follows, attempts from anon, authenticated;
grant select, insert, update, delete on profiles, settings, follows, attempts to authenticated;
