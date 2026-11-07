import { createHash, createHmac } from 'node:crypto';
import type { Bucket, Bytes } from './types';

export type R2Config = {
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
};

const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
const hmac = (key: string | Buffer, data: string) =>
	createHmac('sha256', key).update(data).digest();

export function signR2(
	cfg: R2Config,
	method: 'HEAD' | 'PUT',
	name: string,
	body: Bytes,
	now: string
) {
	const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
	const path = `/${cfg.bucket}/${name}`;
	const payload = sha256(body);
	const date = now.slice(0, 8);
	const scope = `${date}/auto/s3/aws4_request`;
	const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
	const canonical = [
		method,
		path,
		'',
		`host:${host}\nx-amz-content-sha256:${payload}\nx-amz-date:${now}\n`,
		signedHeaders,
		payload
	].join('\n');
	const toSign = ['AWS4-HMAC-SHA256', now, scope, sha256(canonical)].join('\n');
	const key = [date, 'auto', 's3', 'aws4_request'].reduce(
		(k, part) => hmac(k, part),
		Buffer.from(`AWS4${cfg.secretAccessKey}`)
	);
	const signature = createHmac('sha256', key).update(toSign).digest('hex');
	return {
		url: `https://${host}${path}`,
		headers: {
			'x-amz-date': now,
			'x-amz-content-sha256': payload,
			authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
		}
	};
}

export function r2Bucket(cfg: R2Config, fetchImpl: typeof fetch = fetch): Bucket {
	const stamp = () => new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
	return {
		async has(name) {
			const { url, headers } = signR2(cfg, 'HEAD', name, new Uint8Array(), stamp());
			const res = await fetchImpl(url, { method: 'HEAD', headers });
			if (res.status === 200) return true;
			if (res.status === 404) return false;
			throw new Error(`R2 HEAD ${name} answered ${res.status}`);
		},
		async put(name, body, contentType) {
			const { url, headers } = signR2(cfg, 'PUT', name, body, stamp());
			const res = await fetchImpl(url, {
				method: 'PUT',
				headers: {
					...headers,
					'content-type': contentType,
					'cache-control': 'public, max-age=31536000, immutable'
				},
				body
			});
			if (!res.ok) throw new Error(`R2 PUT ${name} answered ${res.status}`);
		}
	};
}
