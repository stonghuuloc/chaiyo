create table public.telegram_links (
	user_id uuid primary key references auth.users on delete cascade,
	chat_id bigint not null,
	linked_at timestamptz not null default now()
);

alter table public.telegram_links enable row level security;

create policy telegram_links_select on public.telegram_links for select to authenticated
	using (user_id = (select auth.uid()));
create policy telegram_links_delete on public.telegram_links for delete to authenticated
	using (user_id = (select auth.uid()));

revoke all on public.telegram_links from anon, authenticated;
grant select, delete on public.telegram_links to authenticated;

create table public.telegram_link_tokens (
	token text primary key check (token ~ '^[0-9a-f]{32}$'),
	user_id uuid not null references auth.users on delete cascade,
	expires_at timestamptz not null default now() + interval '15 minutes'
);

alter table public.telegram_link_tokens enable row level security;

revoke all on public.telegram_link_tokens from anon, authenticated;

create function public.telegram_link_token() returns text
language sql security definer set search_path = '' as $$
	with gone as (delete from public.telegram_link_tokens where user_id = auth.uid())
	insert into public.telegram_link_tokens (token, user_id)
	values (replace(gen_random_uuid()::text, '-', ''), auth.uid())
	returning token
$$;

create function public.claim_telegram_link(p_token text, p_chat_id bigint) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
	delete from public.telegram_link_tokens
	where token = p_token and expires_at > now()
	returning user_id into uid;
	if uid is null then return null; end if;
	insert into public.telegram_links (user_id, chat_id) values (uid, p_chat_id)
	on conflict (user_id) do update set chat_id = excluded.chat_id, linked_at = now();
	insert into public.settings (learner_id, remind_telegram) values (uid, true)
	on conflict (learner_id) do update set remind_telegram = true;
	return uid;
end $$;

revoke execute on function public.claim_telegram_link(text, bigint) from public, anon, authenticated;
grant execute on function public.claim_telegram_link(text, bigint) to service_role;

revoke execute on function public.telegram_link_token() from public, anon;
grant execute on function public.telegram_link_token() to authenticated;
