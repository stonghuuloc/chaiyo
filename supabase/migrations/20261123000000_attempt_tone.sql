alter table public.attempts add column tone smallint check (tone between 1 and 4);
