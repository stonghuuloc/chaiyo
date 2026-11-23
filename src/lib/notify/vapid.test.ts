import { describe, expect, it } from 'vitest';
import { base64UrlToBytes } from './subscribe';
import { generateVapidPair } from './vapid';

describe('generateVapidPair', () => {
	it('Given_Pair_When_Generate_Then_PublicKeyIs65BytesStarting04', async () => {
		const { publicKey } = await generateVapidPair();
		const bytes = base64UrlToBytes(publicKey);
		expect(bytes).toHaveLength(65);
		expect(bytes[0]).toBe(0x04);
	});

	it('Given_Pair_When_Generate_Then_PublicKeyMatchesJwkXY', async () => {
		const { vapidKeys, publicKey } = await generateVapidPair();
		const jwks = JSON.parse(vapidKeys) as { publicKey: JsonWebKey; privateKey: JsonWebKey };
		const bytes = base64UrlToBytes(publicKey);
		expect(Array.from(bytes.slice(1, 33))).toEqual(Array.from(base64UrlToBytes(jwks.publicKey.x!)));
		expect(Array.from(bytes.slice(33))).toEqual(Array.from(base64UrlToBytes(jwks.publicKey.y!)));
		expect(jwks.privateKey.x).toBe(jwks.publicKey.x);
		expect(jwks.privateKey.d).toBeTruthy();
	});
});
