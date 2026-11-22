const BUNDLE = /^\/content\/(current|[0-9a-f]{64}\/[^/]+)\.json$/;

export async function networkFirst(
	request: Request,
	cache: Pick<Cache, 'put' | 'match'>,
	fetchFn: typeof fetch,
	waitUntil: (p: Promise<unknown>) => void
): Promise<Response> {
	try {
		const res = await fetchFn(request);
		if (res.ok) {
			const put = cache.put(request, res.clone()).catch(() => {});
			if (BUNDLE.test(new URL(request.url).pathname)) await put;
			else waitUntil(put);
		}
		return res;
	} catch (err) {
		const hit = await cache.match(request);
		if (hit) return hit;
		throw err;
	}
}
