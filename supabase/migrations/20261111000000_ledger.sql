create table public.lexicon_saves (
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	word text not null,
	saved_at timestamptz not null,
	received_at timestamptz not null default now(),
	primary key (learner_id, word)
);

alter table public.lexicon_saves enable row level security;

create policy lexicon_saves_select on public.lexicon_saves for select to authenticated
	using (learner_id = (select auth.uid()));
create policy lexicon_saves_insert on public.lexicon_saves for insert to authenticated
	with check (learner_id = (select auth.uid()));

revoke all on public.lexicon_saves from anon, authenticated;
grant select, insert on public.lexicon_saves to authenticated;

alter table public.attempts add column step jsonb;
