import { describe, expect, it, vi } from 'vitest';
import { r2Bucket, signR2 } from './r2';

const cfg = {
	accountId: 'acct',
	bucket: 'b',
	accessKeyId: 'AKIDEXAMPLE',
	secretAccessKey: 'SECRETEXAMPLE'
};
const NOW = '20261108T040000Z';
const body = new Uint8Array([1, 2, 3]);

describe('signR2', () => {
	it('matches signatures computed independently with python hmac', () => {
		const put = signR2(cfg, 'PUT', 'k.mp3', body, NOW);
		expect(put.url).toBe('https://acct.r2.cloudflarestorage.com/b/k.mp3');
		expect(put.headers.authorization).toBe(
			'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20261108/auto/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=b18fed95bd1bc2ac148891b9cc81ea687db0ec684d672be57883beee53268858'
		);
		const head = signR2(cfg, 'HEAD', 'k.mp3', new Uint8Array(), NOW);
		expect(head.headers.authorization).toContain(
			'Signature=bd284ee9cf973416478d79baa0a4c5a302f17427f7b026ddbc8f4a6ee95264b8'
		);
	});
});

describe('r2Bucket', () => {
	const stub = (status: number) => vi.fn(async () => new Response(null, { status }));

	it('has: 200 is true, 404 is false, anything else throws', async () => {
		expect(await r2Bucket(cfg, stub(200)).has('k.mp3')).toBe(true);
		expect(await r2Bucket(cfg, stub(404)).has('k.mp3')).toBe(false);
		await expect(r2Bucket(cfg, stub(403)).has('k.mp3')).rejects.toThrow(
			'R2 HEAD k.mp3 answered 403'
		);
	});

	it('put sends the body as audio/mpeg with an immutable cache header', async () => {
		const fetchImpl = stub(200);
		await r2Bucket(cfg, fetchImpl).put('k.mp3', body, 'audio/mpeg');
		const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(url).toBe('https://acct.r2.cloudflarestorage.com/b/k.mp3');
		expect(init.method).toBe('PUT');
		expect(init.body).toBe(body);
		expect(headers['content-type']).toBe('audio/mpeg');
		expect(headers['cache-control']).toBe('public, max-age=31536000, immutable');
		expect(headers.authorization).toMatch(
			/^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/\d{8}\/auto\/s3\/aws4_request, /
		);
	});

	it('put throws on a failed upload without leaking the secret', async () => {
		const err = await r2Bucket(cfg, stub(500))
			.put('k.mp3', body, 'audio/mpeg')
			.catch((e) => e);
		expect(err.message).toBe('R2 PUT k.mp3 answered 500');
		expect(err.message).not.toContain('SECRETEXAMPLE');
	});
});
