create function public.profile_view(p_handle text)
returns table (status text, display_name text, photo_url text, handle text, streak int,
	words_known int, hsk smallint, lesson smallint, badges text[], following boolean, me boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare p public.profiles; v_today date;
begin
	select * into p from public.profiles where profiles.handle = lower(p_handle);
	if not found or (p.hidden and p.learner_id is distinct from auth.uid()) then
		return query select case when p.learner_id is null then 'missing' else 'hidden' end::text,
			null::text, null::text, null::text, null::int, null::int, null::smallint, null::smallint,
			null::text[], null::boolean, null::boolean;
		return;
	end if;
	v_today := (now() at time zone coalesce(
		(select s.tz from public.settings s where s.learner_id = p.learner_id),
		'Asia/Ho_Chi_Minh'))::date;
	return query select 'visible'::text, p.display_name, p.photo_url, p.handle,
		case when p.streak_until >= v_today then p.streak else 0 end, p.words_known, p.hsk, p.lesson,
		p.badges,
		exists (select 1 from public.follows f
			where f.follower_id = auth.uid() and f.followee_id = p.learner_id),
		p.learner_id = auth.uid();
end $$;

revoke execute on function public.profile_view(text) from public, anon;
grant execute on function public.profile_view(text) to authenticated;
