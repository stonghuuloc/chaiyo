import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { buildCurriculum, buildLevels } from '../src/lib/curriculum/build';

const write = async (file: string, data: unknown) =>
	writeFileSync(
		file,
		await format(JSON.stringify(data), { ...(await resolveConfig(file)), filepath: file })
	);

const lessons = buildCurriculum('content');
await write('src/lib/curriculum/curriculum.json', lessons);
const levels = buildLevels('content');
await write('src/lib/curriculum/levels.json', levels);
console.log(`build-curriculum: ${lessons.length} lessons, ${levels.length} levels`);
