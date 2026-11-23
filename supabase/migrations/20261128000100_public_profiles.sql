alter table public.profiles
	add column handle text,
	add column streak int not null default 0 check (streak >= 0),
	add column words_week int not null default 0 check (words_week >= 0),
	add column words_known int not null default 0 check (words_known >= 0),
	add column hsk smallint not null default 1 check (hsk between 1 and 5),
	add column lesson smallint not null default 0 check (lesson >= 0),
	add column badges text[] not null default '{}';

create function public.fold_vi(t text) returns text language sql immutable parallel safe as $$
	select lower(translate(regexp_replace(normalize(t, NFD), '[̀-ͯ]', '', 'g'), 'đĐ', 'dd'))
$$;

create function public.profile_handle(p_name text, p_self uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare base text; h text; n int := 1;
begin
	base := left(regexp_replace(public.fold_vi(coalesce(substring(trim(p_name) from '(\S+)$'), '')),
		'[^a-z0-9]', '', 'g'), 36);
	if base = '' then base := 'ban'; end if;
	h := base;
	while exists (select 1 from public.profiles where handle = h and learner_id <> p_self) loop
		n := n + 1; h := base || n;
	end loop;
	return h;
end $$;

create function public.profiles_set_handle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
	new.handle := coalesce(new.handle, public.profile_handle(new.display_name, new.learner_id));
	return new;
end $$;

create trigger profiles_handle before insert on public.profiles
	for each row execute function public.profiles_set_handle();

do $$
declare r record;
begin
	for r in select learner_id, display_name from public.profiles where handle is null
		order by created_at, learner_id loop
		update public.profiles set handle = public.profile_handle(r.display_name, r.learner_id)
		where learner_id = r.learner_id;
	end loop;
end $$;

alter table public.profiles
	alter column handle set not null,
	add constraint handle_format check (handle ~ '^[a-z0-9]{1,40}$');
create unique index profiles_handle on public.profiles (handle);

revoke execute on function public.profile_handle(text, uuid) from public, anon, authenticated;
revoke execute on function public.profiles_set_handle() from public, anon, authenticated;
