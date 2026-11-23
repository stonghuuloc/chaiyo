alter table public.profiles
	add column handle text,
	add column streak int not null default 0 check (streak >= 0),
	add column words_week int not null default 0 check (words_week >= 0),
	add column words_known int not null default 0 check (words_known >= 0),
	add column hsk smallint not null default 1 check (hsk between 1 and 5),
	add column lesson smallint not null default 0 check (lesson >= 0),
	add column badges text[] not null default '{}';
