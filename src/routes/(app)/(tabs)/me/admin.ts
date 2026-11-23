import { PUBLIC_ADMIN_EMAILS } from '$app/env/public';

export const isAdmin = (email: string | undefined, list = PUBLIC_ADMIN_EMAILS) =>
	!!email &&
	(list ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean)
		.includes(email.toLowerCase());
