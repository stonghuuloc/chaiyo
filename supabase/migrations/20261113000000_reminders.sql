alter table settings
	add column reminder_time time not null default '21:00',
	add column remind_push boolean not null default false,
	add column remind_email boolean not null default true,
	add column remind_telegram boolean not null default false;

alter table profiles
	add constraint photo_url_size check (length(photo_url) <= 100000);
