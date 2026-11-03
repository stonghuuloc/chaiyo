export async function networkFirst(
	request: Request,
	cache: Pick<Cache, 'put' | 'match'>,
	fetchFn: typeof fetch
): Promise<Response> {
	try {
		const res = await fetchFn(request);
		if (res.ok) await cache.put(request, res.clone()).catch(() => {});
		return res;
	} catch (err) {
		const hit = await cache.match(request);
		if (hit) return hit;
		throw err;
	}
}
