create table content_versions (
	sha text primary key,
	imported_at timestamptz not null default now()
);

create table chars (
	hanzi text primary key,
	radical text not null,
	ids text not null,
	strokes int not null,
	readings jsonb not null,
	mnemonic jsonb,
	traditional text
);

create table lessons (
	id text primary key,
	kind text not null default 'lesson' check (kind in ('lesson', 'primer')),
	level int not null,
	"order" int not null,
	topic text,
	title text not null,
	title_hanzi text not null,
	sections jsonb not null,
	unique (level, "order") deferrable initially deferred
);

create table words (
	id text primary key,
	hanzi text not null,
	pinyin text not null,
	spoken text not null,
	hanviet text not null,
	level int not null,
	taught_in text references lessons (id),
	data jsonb not null
);

create table word_chars (
	word_id text not null references words (id) on delete cascade,
	pos int not null,
	hanzi text not null,
	primary key (word_id, pos)
);

create table sentences (
	id text primary key,
	lesson_id text references lessons (id),
	hanzi text not null,
	pinyin text not null,
	spoken text not null,
	vi text not null,
	seg text[] not null,
	audio_key text not null,
	data jsonb not null default '{}'
);

create table grammar_points (
	id text primary key,
	level int not null,
	std int[] not null,
	title text not null,
	pattern text not null,
	data jsonb not null
);

create table lesson_words (
	lesson_id text not null references lessons (id) on delete cascade,
	word_id text not null references words (id),
	pos int not null,
	primary key (lesson_id, word_id)
);

create table lesson_grammar (
	lesson_id text not null references lessons (id) on delete cascade,
	grammar_id text not null references grammar_points (id),
	pos int not null,
	primary key (lesson_id, grammar_id)
);

create table questions (
	id text primary key,
	lesson_id text not null,
	role text not null check (role in ('drill', 'dialogue', 'listen', 'gate', 'mock')),
	body jsonb not null
);

alter table content_versions enable row level security;
create policy content_versions_select on content_versions for select to authenticated using (true);

alter table chars enable row level security;
create policy chars_select on chars for select to authenticated using (true);

alter table lessons enable row level security;
create policy lessons_select on lessons for select to authenticated using (true);

alter table words enable row level security;
create policy words_select on words for select to authenticated using (true);

alter table word_chars enable row level security;
create policy word_chars_select on word_chars for select to authenticated using (true);

alter table sentences enable row level security;
create policy sentences_select on sentences for select to authenticated using (true);

alter table grammar_points enable row level security;
create policy grammar_points_select on grammar_points for select to authenticated using (true);

alter table lesson_words enable row level security;
create policy lesson_words_select on lesson_words for select to authenticated using (true);

alter table lesson_grammar enable row level security;
create policy lesson_grammar_select on lesson_grammar for select to authenticated using (true);

alter table questions enable row level security;
create policy questions_select on questions for select to authenticated using (true);
