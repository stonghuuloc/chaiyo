import type { Question } from '../schemas';
import { audioKey } from './audio';
import type { ImportedContent, ImportedLesson, Sink } from './sink';

type Query = (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;

export type SqlClient = {
	query: Query;
	transaction<T>(fn: (query: Query) => Promise<T>): Promise<T>;
};

const questionIds = (qs: Question[]) => qs.map((q) => q.id);

const sectionsOf = (l: ImportedLesson) => {
	if ('kind' in l)
		return Object.fromEntries(
			Object.entries(l.sections).map(([k, s]) => [k, { ...s, drills: questionIds(s.drills) }])
		);
	const { grammar, dialogue, listenSpeak } = l.sections;
	return {
		...l.sections,
		grammar: { ...grammar, drills: questionIds(grammar.drills) },
		dialogue: { ...dialogue, questions: questionIds(dialogue.questions) },
		listenSpeak: { items: questionIds(listenSpeak.items) }
	};
};

const upsert = (
	q: Query,
	table: string,
	key: string,
	columns: string[],
	rows: Record<string, unknown>[]
) =>
	q(
		`insert into ${table} select * from jsonb_populate_recordset(null::${table}, $1::jsonb) on conflict (${key}) do update set ${columns.map((c) => `"${c}" = excluded."${c}"`).join(', ')}`,
		[JSON.stringify(rows)]
	);

const insert = (q: Query, table: string, rows: Record<string, unknown>[]) =>
	q(`insert into ${table} select * from jsonb_populate_recordset(null::${table}, $1::jsonb)`, [
		JSON.stringify(rows)
	]);

const prune = (q: Query, table: string, key: string, ids: string[]) =>
	q(`delete from ${table} where ${key} <> all($1::text[])`, [ids]);

export function createPostgresSink(sql: SqlClient): Sink {
	return {
		has: async (sha) => {
			const { rows } = await sql.query(
				'select sha from content_versions order by imported_at desc limit 1'
			);
			return (rows[0] as { sha: string } | undefined)?.sha === sha;
		},
		write: (content: ImportedContent) =>
			sql.transaction(async (q) => {
				await q('delete from lesson_words');
				await q('delete from lesson_grammar');
				await q('delete from word_chars');
				await prune(
					q,
					'sentences',
					'id',
					content.sentences.map((s) => s.id)
				);
				await prune(
					q,
					'words',
					'id',
					content.words.map((w) => w.id)
				);
				await prune(
					q,
					'grammar_points',
					'id',
					content.grammar.map((g) => g.id)
				);
				await prune(
					q,
					'chars',
					'hanzi',
					content.chars.map((c) => c.hanzi)
				);

				const lessonRows = content.lessons.map((l) => ({
					id: l.id,
					kind: 'kind' in l ? 'primer' : 'lesson',
					level: l.level,
					order: l.order,
					topic: 'topic' in l ? l.topic : null,
					title: l.title,
					title_hanzi: l.titleHanzi,
					sections: sectionsOf(l)
				}));
				await upsert(
					q,
					'lessons',
					'id',
					['kind', 'level', 'order', 'topic', 'title', 'title_hanzi', 'sections'],
					lessonRows
				);
				await upsert(
					q,
					'chars',
					'hanzi',
					['radical', 'ids', 'strokes', 'readings', 'mnemonic', 'traditional'],
					content.chars.map((c) => ({
						...c,
						mnemonic: c.mnemonic ?? null,
						traditional: c.traditional ?? null
					}))
				);
				await upsert(
					q,
					'grammar_points',
					'id',
					['level', 'std', 'title', 'pattern', 'data'],
					content.grammar.map(({ id, level, std, title, pattern, ...data }) => ({
						id,
						level,
						std,
						title,
						pattern,
						data
					}))
				);
				await upsert(
					q,
					'words',
					'id',
					['hanzi', 'pinyin', 'spoken', 'hanviet', 'level', 'taught_in', 'data'],
					content.words.map(({ id, hanzi, pinyin, spoken, hanviet, level, taughtIn, ...data }) => ({
						id,
						hanzi,
						pinyin,
						spoken,
						hanviet,
						level,
						taught_in: taughtIn ?? null,
						data
					}))
				);
				await upsert(
					q,
					'sentences',
					'id',
					['lesson_id', 'hanzi', 'pinyin', 'spoken', 'vi', 'seg', 'audio_key', 'data'],
					content.sentences.map(({ id, lessonId, hanzi, pinyin, spoken, vi, seg, ...data }) => ({
						id,
						lesson_id: lessonId ?? null,
						hanzi,
						pinyin,
						spoken,
						vi,
						seg,
						audio_key: audioKey(hanzi, data.speaker ?? 'narrator'),
						data
					}))
				);
				await prune(
					q,
					'lessons',
					'id',
					content.lessons.map((l) => l.id)
				);
				await insert(
					q,
					'word_chars',
					content.words.flatMap((w) =>
						[...w.hanzi].map((hanzi, pos) => ({ word_id: w.id, pos, hanzi }))
					)
				);
				await insert(
					q,
					'lesson_words',
					content.lessons.flatMap((l) =>
						'kind' in l
							? []
							: l.sections.words.ids.map((word_id, pos) => ({ lesson_id: l.id, word_id, pos }))
					)
				);
				await insert(
					q,
					'lesson_grammar',
					content.lessons.flatMap((l) =>
						'kind' in l
							? []
							: l.sections.grammar.ids.map((grammar_id, pos) => ({
									lesson_id: l.id,
									grammar_id,
									pos
								}))
					)
				);
				await upsert(
					q,
					'questions',
					'id',
					['lesson_id', 'role', 'body'],
					content.questions.map((x) => ({
						id: x.id,
						lesson_id: x.lessonId,
						role: x.role,
						body: x.body
					}))
				);
				await q(
					'insert into content_versions (sha) values ($1) on conflict (sha) do update set imported_at = now()',
					[content.sha]
				);
			})
	};
}
