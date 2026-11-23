create function public.search_learners(p_q text)
returns table (handle text, display_name text, photo_url text, hsk smallint, lesson smallint,
	following boolean)
language sql stable security definer set search_path = '' as $$
	select p.handle, p.display_name, p.photo_url, p.hsk, p.lesson,
		exists (
			select 1 from public.follows f
			where f.follower_id = auth.uid() and f.followee_id = p.learner_id
		)
	from public.profiles p,
		(select public.fold_vi(btrim(left(coalesce(p_q, ''), 40))) as q) s
	where length(s.q) >= 2
		and not p.hidden
		and p.learner_id <> auth.uid()
		and strpos(public.fold_vi(p.display_name), s.q) > 0
	order by public.fold_vi(p.display_name), p.handle
	limit 20
$$;

create function public.set_follow(p_handle text, p_on boolean)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare t public.profiles;
begin
	select * into t from public.profiles where handle = lower(p_handle);
	if p_on is null then
		raise exception 'p_on is required' using errcode = '22023';
	end if;
	if not p_on then
		delete from public.follows
		where follower_id = auth.uid() and followee_id = t.learner_id;
		return true;
	end if;
	if not found or t.hidden or t.learner_id = auth.uid() then return false; end if;
	insert into public.follows (follower_id, followee_id) values (auth.uid(), t.learner_id)
		on conflict do nothing;
	return true;
end $$;

create function public.is_hidden(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
	select coalesce((select hidden from public.profiles where learner_id = p_id), false)
$$;
revoke execute on function public.is_hidden(uuid) from public, anon;
grant execute on function public.is_hidden(uuid) to authenticated;

drop policy follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated
	with check (follower_id = auth.uid() and not public.is_hidden(followee_id));

revoke execute on function public.search_learners(text) from public, anon;
grant execute on function public.search_learners(text) to authenticated;
revoke execute on function public.set_follow(text, boolean) from public, anon;
grant execute on function public.set_follow(text, boolean) to authenticated;
