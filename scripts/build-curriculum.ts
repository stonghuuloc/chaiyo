import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { buildCurriculum } from '../src/lib/curriculum/build';

const file = 'src/lib/curriculum/curriculum.json';
const lessons = buildCurriculum('content');
writeFileSync(
	file,
	await format(JSON.stringify(lessons), { ...(await resolveConfig(file)), filepath: file })
);
console.log(`build-curriculum: ${lessons.length} lessons`);
