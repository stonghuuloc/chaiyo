alter table public.profiles add column streak_until date, add column week_of date;

revoke insert, update on public.profiles from authenticated;
grant insert (learner_id, display_name, photo_url, hidden),
	update (learner_id, display_name, photo_url, hidden)
	on public.profiles to authenticated;

revoke insert on public.attempts, public.lexicon_saves from authenticated;
grant insert (learner_id, id, question_id, content_sha, skill, word, correct, answer, ms, at, step, tone)
	on public.attempts to authenticated;
grant insert (learner_id, word, saved_at) on public.lexicon_saves to authenticated;

create function public.publish_stats(p_streak int, p_streak_until date, p_words_week int,
	p_words_known int, p_hsk int, p_lesson int, p_badges text[]) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
	v_uid uuid := auth.uid();
	v_tz text;
	v_today date;
	v_monday date;
	v_known int;
	v_week int;
	v_days int;
	v_level int;
	v_lessons int;
begin
	if num_nulls(p_streak, p_streak_until, p_words_week, p_words_known, p_hsk, p_lesson, p_badges) > 0
		or p_streak < 0 or p_words_week < 0 or p_words_known < 0 or p_lesson < 0
		or p_hsk not between 1 and 5
		or not p_badges <@ array['first', 'streak7', 'streak30', 'streak100', 'words100', 'words300',
			'write50', 'hsk1', 'hsk2']
	then
		raise exception 'bad stats' using errcode = '22023';
	end if;
	v_tz := coalesce((select s.tz from public.settings s where s.learner_id = v_uid), 'Asia/Ho_Chi_Minh');
	v_today := (now() at time zone v_tz)::date;
	v_monday := date_trunc('week', v_today)::date;
	with ev as (
		select a.word, a.at, a.question_id from public.attempts a
		where a.learner_id = v_uid and a.at between a.received_at - interval '3 days' and a.received_at
	)
	select
		(select count(*) from (
			select e.word from ev e join public.words w on w.id = e.word
			union
			select l.word from public.lexicon_saves l join public.words w on w.id = l.word
			where l.learner_id = v_uid
				and l.saved_at between l.received_at - interval '3 days' and l.received_at
		) k),
		(select count(*) from (
			select e.word from ev e join public.words w on w.id = e.word group by e.word
			having min(e.at) >= (v_monday::timestamp at time zone v_tz)
		) k),
		(select count(distinct (e.at at time zone v_tz)::date) from ev e),
		(select coalesce(max(l.level), 1) from ev e
			join public.questions q on q.id = e.question_id join public.lessons l on l.id = q.lesson_id),
		(select count(distinct l.id) from ev e
			join public.questions q on q.id = e.question_id join public.lessons l on l.id = q.lesson_id
			where l.kind = 'lesson')
	into v_known, v_week, v_days, v_level, v_lessons;
	update public.profiles set
		streak = least(p_streak, v_days),
		streak_until = least(p_streak_until, v_today + 3),
		week_of = v_monday,
		words_known = least(p_words_known, v_known),
		words_week = least(p_words_week, v_week, p_words_known, v_known),
		hsk = least(p_hsk, v_level),
		lesson = least(p_lesson, case when v_lessons = 0 then 0 else v_lessons + 1 end),
		badges = p_badges
	where learner_id = v_uid;
	return found;
end $$;

revoke execute on function public.publish_stats(int, date, int, int, int, int, text[]) from public, anon;
grant execute on function public.publish_stats(int, date, int, int, int, int, text[]) to authenticated;

create function public.friends_board()
returns table (handle text, display_name text, photo_url text, lesson smallint, streak int,
	words_week int, me boolean)
language sql stable security definer set search_path = '' as $$
	select p.handle, p.display_name, p.photo_url, p.lesson,
		case when p.streak_until >= d.today then p.streak else 0 end,
		case when p.week_of = date_trunc('week', d.today)::date then p.words_week else 0 end,
		p.learner_id = auth.uid()
	from public.profiles p
	left join public.settings s on s.learner_id = p.learner_id
	cross join lateral (
		select (now() at time zone coalesce(s.tz, 'Asia/Ho_Chi_Minh'))::date as today
	) d
	where p.learner_id = auth.uid()
		or (not p.hidden and exists (
			select 1 from public.follows f
			where f.follower_id = auth.uid() and f.followee_id = p.learner_id
		))
$$;

revoke execute on function public.friends_board() from public, anon;
grant execute on function public.friends_board() to authenticated;
