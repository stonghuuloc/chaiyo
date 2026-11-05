import * as nodeFs from 'node:fs';
import { join } from 'node:path';
import { buildBundle } from './bundle';
import type { Sink } from './sink';

type Fs = Pick<
	typeof nodeFs,
	'existsSync' | 'mkdirSync' | 'readFileSync' | 'renameSync' | 'rmSync' | 'writeFileSync'
>;

export function createBundleSink(outDir: string, fs: Fs = nodeFs): Sink {
	const currentFile = join(outDir, 'current.json');
	const readCurrent = (): string | undefined => {
		if (!fs.existsSync(currentFile)) return undefined;
		try {
			return JSON.parse(fs.readFileSync(currentFile, 'utf8')).sha;
		} catch {
			return undefined;
		}
	};
	const writeCurrent = (sha: string) => {
		const tmp = join(outDir, '.tmp-current.json');
		fs.writeFileSync(tmp, JSON.stringify({ sha }));
		fs.renameSync(tmp, currentFile);
	};

	return {
		has: async (sha) => readCurrent() === sha && fs.existsSync(join(outDir, sha, 'manifest.json')),
		write: async (content) => {
			const { sha } = content;
			if (fs.existsSync(join(outDir, sha, 'manifest.json'))) return writeCurrent(sha);
			const tmp = join(outDir, `.tmp-${sha}`);
			try {
				fs.rmSync(tmp, { recursive: true, force: true });
				fs.mkdirSync(tmp, { recursive: true });
				const lessons = content.lessons.map((l) => {
					const body = JSON.stringify(buildBundle(content, l.id));
					const file = `${l.id}.json`;
					fs.writeFileSync(join(tmp, file), body);
					return { id: l.id, file, bytes: Buffer.byteLength(body) };
				});
				fs.writeFileSync(join(tmp, 'manifest.json'), JSON.stringify({ sha, lessons }));
				fs.writeFileSync(
					join(tmp, 'audio-manifest.json'),
					JSON.stringify({ sha, entries: content.audio })
				);
				fs.rmSync(join(outDir, sha), { recursive: true, force: true });
				fs.renameSync(tmp, join(outDir, sha));
			} catch (e) {
				fs.rmSync(tmp, { recursive: true, force: true });
				throw e;
			}
			writeCurrent(sha);
		}
	};
}
