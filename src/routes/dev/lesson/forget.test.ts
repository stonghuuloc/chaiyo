import { describe, expect, it } from 'vitest';
import { forget } from './forget';

function storage(entries: Record<string, string[]>) {
	const caches = new Map(
		Object.entries(entries).map(([name, urls]) => [name, new Set(urls)] as const)
	);
	return {
		caches,
		keys: async () => [...caches.keys()],
		open: async (name: string) => {
			const set = caches.get(name) ?? new Set<string>();
			return {
				keys: async () => [...set].map((u) => new Request(u)),
				delete: async (req: Request) => set.delete(req.url)
			} as unknown as Cache;
		}
	};
}

describe('forget', () => {
	it('Given_LessonAndShellEntries_When_Forget_Then_OnlyLessonEntriesDropped', async () => {
		// Arrange
		const s = storage({
			'shell-1': [
				'https://app.test/content/current.json',
				'https://app.test/content/abc/h1-01.json',
				'https://app.test/dev/lesson/h1-01',
				'https://app.test/today',
				'https://app.test/_app/a.js'
			],
			audio: ['https://clips.test/a.mp3']
		});

		// Act
		const dropped = await forget(s);

		// Assert
		expect(dropped).toBe(3);
		expect([...s.caches.get('shell-1')!]).toEqual([
			'https://app.test/today',
			'https://app.test/_app/a.js'
		]);
		expect([...s.caches.get('audio')!]).toEqual(['https://clips.test/a.mp3']);
	});
});
