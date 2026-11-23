import { base64UrlToBytes } from './subscribe';

const toBase64Url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replaceAll('=', '');

export async function generateVapidPair(): Promise<{ vapidKeys: string; publicKey: string }> {
	const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify'
	]);
	const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
	const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
	const point = new Uint8Array(65);
	point[0] = 0x04;
	point.set(base64UrlToBytes(publicJwk.x!), 1);
	point.set(base64UrlToBytes(publicJwk.y!), 33);
	return {
		vapidKeys: JSON.stringify({ publicKey: publicJwk, privateKey: privateJwk }),
		publicKey: toBase64Url(point)
	};
}
