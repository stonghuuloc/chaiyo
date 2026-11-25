create index attempts_at on public.attempts (at) where step is not null;

create function public.admin_usage(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
	v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
	v_d1 timestamptz := v_today::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_d7 timestamptz := (v_today - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_d30 timestamptz := (v_today - 29)::timestamp at time zone 'Asia/Ho_Chi_Minh';
	v_from timestamptz;
	v_active jsonb;
	v_gates jsonb;
	v_dropoff jsonb;
begin
	if not public.is_admin() then
		raise exception 'not admin' using errcode = '42501';
	end if;
	if p_days is null or p_days not in (7, 30) then
		raise exception 'bad days' using errcode = '22023';
	end if;
	v_from := case p_days when 7 then v_d7 else v_d30 end;

	select jsonb_build_object(
		'today', count(distinct a.learner_id) filter (where a.at >= v_d1),
		'd7', count(distinct a.learner_id) filter (where a.at >= v_d7),
		'd30', count(distinct a.learner_id)
	) into v_active
	from public.attempts a
	where a.step is not null and a.at >= v_d30 and a.step ? 'lesson';

	with w as (
		select a.learner_id, a.step
		from public.attempts a
		where a.step is not null and a.at >= v_d30 and a.step ? 'lesson' and a.at >= v_from
	),
	k as (
		select distinct w.learner_id, w.step->>'run' as run
		from w
		where w.step->>'kind' = 'gate'
	),
	g as (
		select a.learner_id, a.step->>'run' as run, a.step->>'lesson' as lesson,
			a.question_id, a.correct, a.at, a.id,
			case when jsonb_typeof(a.step->'of') = 'number' then (a.step->>'of')::numeric end as of_n
		from public.attempts a
		join k on k.learner_id = a.learner_id and k.run = a.step->>'run'
		where a.step->>'kind' = 'gate'
	),
	first_answer as (
		select distinct on (g.learner_id, g.run, g.question_id) g.*
		from g
		where g.of_n is not null and g.of_n >= 1
		order by g.learner_id, g.run, g.question_id, g.at, g.id
	),
	runs as (
		select f.learner_id, f.run, f.lesson,
			max(f.of_n) as of_n,
			count(*) as n,
			count(*) filter (where f.correct is true) as right_n,
			max(f.at) as last_at
		from first_answer f
		group by f.learner_id, f.run, f.lesson
	),
	closed as (
		select r.lesson, r.right_n, r.of_n
		from runs r
		where r.n >= r.of_n and r.last_at >= v_from
	)
	select coalesce(jsonb_agg(jsonb_build_object('lesson', c.lesson, 'runs', c.runs, 'fails', c.fails)
		order by c.lesson), '[]'::jsonb) into v_gates
	from (
		select lesson, count(*) as runs, count(*) filter (where right_n * 100 < 80 * of_n) as fails
		from closed
		group by lesson
	) c;

	with w as (
		select a.learner_id, a.step
		from public.attempts a
		where a.step is not null and a.at >= v_d30 and a.step ? 'lesson' and a.at >= v_from
	),
	s as (
		select w.step->>'lesson' as lesson,
			coalesce(case when w.step->>'kind' = 'gate' then 'gate' end, w.step->>'section') as key,
			count(distinct w.learner_id) as n
		from w
		group by 1, 2
	),
	st as (
		select w.step->>'lesson' as lesson, count(distinct w.learner_id) as started
		from w
		group by 1
	)
	select coalesce(jsonb_agg(jsonb_build_object(
		'lesson', st.lesson,
		'started', st.started,
		'sections', (select coalesce(jsonb_object_agg(s.key, s.n), '{}'::jsonb)
			from s where s.lesson = st.lesson and s.key is not null)
	) order by st.lesson), '[]'::jsonb) into v_dropoff
	from st;

	return jsonb_build_object('active', v_active, 'gates', v_gates, 'dropoff', v_dropoff);
end $$;

revoke execute on function public.admin_usage(int) from public, anon;
grant execute on function public.admin_usage(int) to authenticated;
