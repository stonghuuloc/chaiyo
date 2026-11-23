alter table settings
	add column hanzi_style text not null default 'kai' check (hanzi_style in ('kai', 'xing'));
