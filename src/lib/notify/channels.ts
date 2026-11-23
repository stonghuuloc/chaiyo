import type { Channel } from './channel';
import type { RemindResult } from './remind';

export function reminderChannels(o: {
	push: Channel | null;
	email: Channel | null;
	telegram: Channel | null;
}): Channel[] {
	return [o.push, o.email, o.telegram].filter((c): c is Channel => c !== null);
}

export function failedLines(r: RemindResult): string[] {
	return r.deliveries.filter((d) => !d.ok).map((d) => `remind ${d.id} ${d.channel}: ${d.error}`);
}
