create table public.error_reports (
	id uuid primary key,
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	lesson_id text,
	step_id text,
	word_id text,
	content_sha text not null,
	category text not null check (category in ('meaning', 'pinyin', 'hanviet', 'audio', 'other')),
	note text check (note is null or length(note) between 1 and 1000),
	status text not null default 'new',
	created_at timestamptz not null,
	received_at timestamptz not null default now(),
	check ((lesson_id is null) = (step_id is null))
);

alter table public.error_reports enable row level security;

-- Insert-only: a learner files a report and cannot read back, edit or resolve it (inbox = M-10).
create policy error_reports_insert on public.error_reports for insert to authenticated
	with check (learner_id = (select auth.uid()) and status = 'new');

revoke all on public.error_reports from anon, authenticated;
grant insert on public.error_reports to authenticated;
