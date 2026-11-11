import type { Curriculum } from '#lib/study/index.js';
import type { CurriculumLesson } from './build';
import lessons from './curriculum.json';

export const LESSONS: CurriculumLesson[] = lessons;
export const CURRICULUM: Curriculum = { lessons: LESSONS };
