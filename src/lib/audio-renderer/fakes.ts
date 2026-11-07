import type { Bucket, Bytes, Engine, EngineRequest } from './types';

export function fakeEngine(impl?: (req: EngineRequest) => Bytes) {
	const calls: EngineRequest[] = [];
	const engine: Engine = {
		async synthesize(req) {
			calls.push(req);
			return impl ? impl(req) : new TextEncoder().encode(`mp3:${req.text}|${req.voice}`);
		}
	};
	return Object.assign(engine, { calls });
}

export function fakeBucket() {
	const objects = new Map<string, { body: Bytes; contentType: string }>();
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
