export type Marks = {
	claim(learnerId: string, day: string): Promise<boolean>;
	release(learnerId: string, day: string): Promise<void>;
};

export function memoryMarks(): Marks & { keys: Set<string> } {
	const keys = new Set<string>();
	return {
		keys,
		async claim(learnerId, day) {
			const key = `${learnerId}|${day}`;
			if (keys.has(key)) return false;
			keys.add(key);
			return true;
		},
		async release(learnerId, day) {
			keys.delete(`${learnerId}|${day}`);
		}
	};
}
