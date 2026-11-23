const formats = new Map<string, Intl.DateTimeFormat>();

export function localMinutes(d: Date, tz: string): number {
	let fmt = formats.get(tz);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			hour: 'numeric',
			minute: 'numeric',
			hourCycle: 'h23'
		});
		formats.set(tz, fmt);
	}
	const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
	return Number(p.hour) * 60 + Number(p.minute);
}

export function isDue(now: Date, tz: string, remindAt: string): boolean {
	const [h, m] = remindAt.split(':').map(Number);
	return localMinutes(now, tz) >= Math.floor((h * 60 + m) / 15) * 15;
}
