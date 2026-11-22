const CACHED = ['/content/', '/dev/lesson/'];

/** Drops every cached lesson bundle and harness page, so each lesson counts as never opened. */
export async function forget(storage: Pick<CacheStorage, 'keys' | 'open'>): Promise<number> {
	let dropped = 0;
	for (const name of await storage.keys()) {
		const cache = await storage.open(name);
		for (const req of await cache.keys()) {
			if (!CACHED.some((p) => new URL(req.url).pathname.startsWith(p))) continue;
			if (await cache.delete(req)) dropped++;
		}
	}
	return dropped;
}
