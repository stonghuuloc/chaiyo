create table public.push_subscriptions (
	learner_id uuid not null default auth.uid() references auth.users on delete cascade,
	endpoint text not null check (length(endpoint) <= 2048),
	p256dh text not null,
	auth text not null,
	created_at timestamptz not null default now(),
	primary key (learner_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select on public.push_subscriptions for select to authenticated
	using (learner_id = (select auth.uid()));
create policy push_subscriptions_insert on public.push_subscriptions for insert to authenticated
	with check (learner_id = (select auth.uid()));
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated
	using (learner_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;
