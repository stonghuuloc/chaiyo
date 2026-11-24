import { m } from '#lib/paraglide/messages.js';

export function ago(at: string, now: Date): string {
	const min = Math.floor((now.getTime() - Date.parse(at)) / 60_000);
	if (min < 60) return m.chy54s1_ago_min({ n: Math.max(1, min) });
	if (min < 1440) return m.chy54s1_ago_hour({ n: Math.floor(min / 60) });
	if (min < 2880) return m.chy54s1_ago_yesterday();
	return m.chy54s1_ago_day({ n: Math.floor(min / 1440) });
}
