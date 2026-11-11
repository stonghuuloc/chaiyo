import { writeFileSync } from 'node:fs';
import { buildCurriculum } from '../src/lib/curriculum/build';

const lessons = buildCurriculum('content');
writeFileSync('src/lib/curriculum/curriculum.json', JSON.stringify(lessons, null, '\t') + '\n');
console.log(`build-curriculum: ${lessons.length} lessons`);
