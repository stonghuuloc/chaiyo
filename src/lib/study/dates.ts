const formats = new Map<string, Intl.DateTimeFormat>();

export function localDate(d: Date, tz: string): string {
	let fmt = formats.get(tz);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		formats.set(tz, fmt);
	}
	const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
	return `${p.year}-${p.month}-${p.day}`;
}
