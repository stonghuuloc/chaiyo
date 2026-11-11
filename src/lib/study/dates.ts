export function localDate(d: Date, tz: string): string {
	const p = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
			.formatToParts(d)
			.map((x) => [x.type, x.value])
	);
	return `${p.year}-${p.month}-${p.day}`;
}
