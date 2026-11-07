import type { AudioEntry } from '../content/import/audio';

export type EngineRequest = Pick<AudioEntry, 'key' | 'kind' | 'voice' | 'hanzi'> & { text: string };

export type Bytes = Uint8Array<ArrayBuffer>;

export type Engine = {
	synthesize(req: EngineRequest): Promise<Bytes>;
};

export type Bucket = {
	has(name: string): Promise<boolean>;
	put(name: string, body: Bytes, contentType: string): Promise<void>;
};

export type RenderResult = { uploaded: number; skipped: number };

export type RenderFailure = { key: string; ref: string; message: string };

export class RenderError extends Error {
	constructor(
		readonly uploaded: number,
		readonly skipped: number,
		readonly failures: RenderFailure[]
	) {
		super(`${failures.length} clips failed`);
		this.name = 'RenderError';
	}
}
