create table public.notify_sends (
	id uuid primary key,
	learner_id uuid not null references auth.users on delete cascade,
	day date not null,
	channel text not null check (channel in ('push', 'email', 'telegram')),
	sent_at timestamptz not null default now(),
	opened_at timestamptz,
	unique (learner_id, day, channel)
);

create table public.notify_opens (
	id uuid primary key,
	learner_id uuid not null references auth.users on delete cascade,
	opened_at timestamptz not null default now()
);

alter table public.notify_opens enable row level security;
revoke all on public.notify_opens from anon, authenticated;

create index notify_sends_sent_at on public.notify_sends (sent_at);

alter table public.notify_sends enable row level security;
revoke all on public.notify_sends from anon, authenticated;

create function public.admin_reminders(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
	v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
	v_d1 timestamptz := v_today::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_d7 timestamptz := (v_today - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_d30 timestamptz := (v_today - 29)::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_from timestamptz;
	v_rows jsonb;
begin
	if not public.is_admin() then
		raise exception 'not admin' using errcode = '42501';
	end if;
	if p_days is null or p_days not in (7, 30) then
		raise exception 'bad days' using errcode = '22023';
	end if;
	v_from := case p_days when 7 then v_d7 else v_d30 end;

	select jsonb_agg(jsonb_build_object(
		'channel', t.channel, 'sent', t.sent, 'opened', t.opened, 'studied', t.studied
	) order by t.ord) into v_rows
	from (
		select c.channel, c.ord,
			count(s.id) as sent,
			count(s.id) filter (where s.opened_at is not null or exists (
				select 1 from public.notify_opens o where o.id = s.id and o.learner_id = s.learner_id
			)) as opened,
			count(s.id) filter (where exists (
				select 1 from public.attempts a
				where a.learner_id = s.learner_id and a.step is not null and a.at >= s.sent_at
					and a.at < s.sent_at + interval '24 hours'
			)) as studied
		from (values ('email', 1), ('telegram', 2), ('push', 3)) c(channel, ord)
		left join public.notify_sends s on s.channel = c.channel
			and s.sent_at >= v_from and s.sent_at < v_d1 + interval '1 day'
		group by c.channel, c.ord
	) t;

	return v_rows;
end $$;

create function public.mark_reminder_opened(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
	insert into public.notify_opens (id, learner_id) values (p_id, auth.uid()) on conflict do nothing;
	update public.notify_sends set opened_at = now()
	where id = p_id and learner_id = auth.uid() and opened_at is null;
end $$;

revoke execute on function public.admin_reminders(int) from public, anon;
grant execute on function public.admin_reminders(int) to authenticated;
revoke execute on function public.mark_reminder_opened(uuid) from public, anon;
grant execute on function public.mark_reminder_opened(uuid) to authenticated;
