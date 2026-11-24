create table public.admins (
	user_id uuid primary key references auth.users (id) on delete cascade,
	added_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
	select exists (select 1 from public.admins where user_id = auth.uid())
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.error_reports
	add column resolved_at timestamptz,
	add constraint error_reports_status_check check (status in ('new', 'resolved'));

create policy error_reports_admin_select on public.error_reports for select to authenticated
	using ((select public.is_admin()));

grant select on public.error_reports to authenticated;

create function public.list_error_reports()
returns table (id uuid, lesson_id text, step_id text, word_id text, category text, note text,
	status text, created_at timestamptz, resolved_at timestamptz, reporter text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
	if not public.is_admin() then
		raise exception 'not admin' using errcode = '42501';
	end if;
	return query select r.id, r.lesson_id, r.step_id, r.word_id, r.category, r.note, r.status,
		r.created_at, r.resolved_at, nullif(p.display_name, '')
	from public.error_reports r
	left join public.profiles p on p.learner_id = r.learner_id
	order by r.created_at desc, r.id;
end $$;

revoke execute on function public.list_error_reports() from public, anon;
grant execute on function public.list_error_reports() to authenticated;

create function public.set_error_report_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
	if not public.is_admin() then
		raise exception 'not admin' using errcode = '42501';
	end if;
	if p_status is null or p_status not in ('new', 'resolved') then
		raise exception 'bad status' using errcode = '22023';
	end if;
	update public.error_reports r
	set status = p_status, resolved_at = case when p_status = 'resolved' then now() end
	where r.id = p_id;
	if not found then
		raise exception 'no report' using errcode = 'P0002';
	end if;
end $$;

revoke execute on function public.set_error_report_status(uuid, text) from public, anon;
grant execute on function public.set_error_report_status(uuid, text) to authenticated;
