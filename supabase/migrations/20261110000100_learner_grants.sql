revoke update, delete, truncate on attempts from anon, authenticated;

revoke insert, update, delete, truncate on
	content_versions, chars, lessons, words, word_chars, sentences,
	grammar_points, lesson_words, lesson_grammar, questions
from anon, authenticated;

grant select on
	content_versions, chars, lessons, words, word_chars, sentences,
	grammar_points, lesson_words, lesson_grammar, questions
to authenticated;
