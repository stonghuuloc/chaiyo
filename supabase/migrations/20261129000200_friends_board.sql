alter table public.profiles add column streak_until date, add column week_of date;

revoke insert, update on public.profiles from authenticated;
grant insert (learner_id, display_name, photo_url, hidden),
	update (learner_id, display_name, photo_url, hidden)
	on public.profiles to authenticated;

revoke insert on public.attempts, public.lexicon_saves from authenticated;
grant insert (learner_id, id, question_id, content_sha, skill, word, correct, answer, ms, at, step, tone)
	on public.attempts to authenticated;
grant insert (learner_id, word, saved_at) on public.lexicon_saves to authenticated;
