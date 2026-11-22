create table public.streak_rollovers (
	learner_id uuid not null references auth.users on delete cascade,
	day date not null,
	count int not null,
	freezes int not null,
	events jsonb not null,
	at timestamptz not null default now(),
	primary key (learner_id, day)
);

alter table public.streak_rollovers enable row level security;
revoke all on public.streak_rollovers from anon, authenticated;

do $$
begin
	if exists (select 1 from pg_available_extensions where name = 'pg_cron')
		and exists (select 1 from pg_available_extensions where name = 'pg_net') then
		create extension if not exists pg_cron;
		create extension if not exists pg_net;
		perform cron.schedule(
			'notify',
			'*/15 * * * *',
			$c$
			select net.http_post(
				url := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_url'),
				headers := jsonb_build_object(
					'content-type', 'application/json',
					'x-notify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret')
				),
				body := '{}'::jsonb
			)
			$c$
		);
	end if;
end
$$;
