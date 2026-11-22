import { describe, expect, it } from 'vitest';
import type { CatalogWord, LookupHit } from '#lib/catalog/index.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { lookupView } from './lookup';

const hit = (hanzi: string): LookupHit => ({
	hanzi,
	pinyin: 'xièxie',
	hanviet: 'tạ tạ',
	meaning: 'cảm ơn',
	sentenceId: 's-1',
	start: 0
});

const taught = { id: '谢谢', taughtIn: 'h1-01' } as CatalogWord;

const withLexicon = (lexicon: State['lexicon']): State => ({
	...initialState({ curriculum: CURRICULUM, tz: 'Asia/Ho_Chi_Minh' }),
	lexicon
});

describe('lookupView', () => {
	it('Given_TaughtWordNotInLexicon_When_View_Then_TaughtWithoutAdd', () => {
		// Arrange
		const state = withLexicon({});
		// Act
		const view = lookupView(hit('谢谢'), taught, state);
		// Assert
		expect(view).toEqual({
			mode: 'taught',
			canAdd: false,
			selfAdded: false,
			chars: ['谢', '谢']
		});
	});

	it('Given_UntaughtWordNotInLexicon_When_View_Then_CanAdd', () => {
		// Arrange
		const state = withLexicon({});
		// Act
		const view = lookupView(hit('咖啡'), null, state);
		// Assert
		expect(view).toMatchObject({ mode: 'untaught', canAdd: true, selfAdded: false });
	});

	it('Given_SavedWord_When_View_Then_SelfAddedWithoutAdd', () => {
		// Arrange
		const state = withLexicon({ 咖啡: { saved: true, cards: {} } });
		// Act
		const view = lookupView(hit('咖啡'), null, state);
		// Assert
		expect(view).toMatchObject({ mode: 'saved', canAdd: false, selfAdded: true });
	});

	it('Given_WordInLexiconNotSaved_When_View_Then_NoAddNoBadge', () => {
		// Arrange
		const state = withLexicon({ 好: { saved: false, cards: {} } });
		// Act
		const view = lookupView(hit('好'), null, state);
		// Assert
		expect(view).toEqual({ mode: 'saved', canAdd: false, selfAdded: false, chars: [] });
	});

	it('Given_TaughtWordAlsoSaved_When_View_Then_TaughtWithBadge', () => {
		// Arrange
		const state = withLexicon({ 谢谢: { saved: true, cards: {} } });
		// Act
		const view = lookupView(hit('谢谢'), taught, state);
		// Assert
		expect(view).toMatchObject({ mode: 'taught', canAdd: false, selfAdded: true });
	});
});
