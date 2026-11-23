create table public.reminders_sent (
	learner_id uuid not null references auth.users on delete cascade,
	day date not null,
	at timestamptz not null default now(),
	primary key (learner_id, day)
);

alter table public.reminders_sent enable row level security;
revoke all on public.reminders_sent from anon, authenticated;
