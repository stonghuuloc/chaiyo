export function takeFlag(args: string[], name: string): string | undefined {
	const at = args.indexOf(`--${name}`);
	if (at < 0) return undefined;
	const value = args.splice(at, 2)[1];
	if (value === undefined || value.startsWith('--')) throw new Error(`--${name} needs a value`);
	return value;
}
