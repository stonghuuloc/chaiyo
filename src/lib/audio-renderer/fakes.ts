import type { Bucket, Engine } from './types';

type Request = Parameters<Engine['synthesize']>[0];

export function fakeEngine(impl?: (req: Request) => Uint8Array) {
	const calls: Request[] = [];
	const engine: Engine = {
		async synthesize(req) {
			calls.push(req);
			return impl ? impl(req) : new TextEncoder().encode(`mp3:${req.text}|${req.voice}`);
		}
	};
	return Object.assign(engine, { calls });
}

export function fakeBucket() {
	const objects = new Map<string, { body: Uint8Array; contentType: string }>();
	const bucket: Bucket = {
		async has(name) {
			return objects.has(name);
		},
		async put(name, body, contentType) {
			objects.set(name, { body, contentType });
		}
	};
	return Object.assign(bucket, { objects });
}
