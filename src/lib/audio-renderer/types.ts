export type Engine = {
	synthesize(req: { text: string; voice: string }): Promise<Uint8Array>;
};

export type Bucket = {
	has(name: string): Promise<boolean>;
	put(name: string, body: Uint8Array, contentType: string): Promise<void>;
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
