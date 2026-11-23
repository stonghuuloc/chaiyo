export type Marks = { claim(learnerId: string, day: string): Promise<boolean> };

export function memoryMarks(): Marks & { keys: Set<string> } {
	const keys = new Set<string>();
	return {
		keys,
		async claim(learnerId, day) {
			const key = `${learnerId}|${day}`;
			if (keys.has(key)) return false;
			keys.add(key);
			return true;
		}
	};
}
