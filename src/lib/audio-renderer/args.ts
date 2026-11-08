export function parseArgs(
	argv: string[],
	names: string[]
): { flags: Record<string, string>; positional: string[] } {
	const flags: Record<string, string> = {};
	const positional: string[] = [];
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (!arg.startsWith('--')) {
			positional.push(arg);
			continue;
		}
		const name = arg.slice(2);
		if (!names.includes(name)) throw new Error(`unknown option ${arg}`);
		const value = argv[++i];
		if (value === undefined || value.startsWith('--')) throw new Error(`--${name} needs a value`);
		flags[name] = value;
	}
	return { flags, positional };
}
