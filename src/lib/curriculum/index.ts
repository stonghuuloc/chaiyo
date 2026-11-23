import type { Curriculum } from '#lib/study/index.js';
import type { CurriculumLesson, LevelOutline } from './build';
import lessons from './curriculum.json';
import levels from './levels.json';

export const LESSONS: CurriculumLesson[] = lessons;
export const LEVELS: LevelOutline[] = levels;
export const CURRICULUM: Curriculum = { lessons: LESSONS };

export const firstLessonId = (lessons: CurriculumLesson[]): string =>
	(lessons.find((l) => l.n === 1) ?? lessons[0]).id;
