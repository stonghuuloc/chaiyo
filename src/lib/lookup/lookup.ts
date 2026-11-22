import type { CatalogWord, LookupHit } from '#lib/catalog/index.js';
import type { State } from '#lib/study/index.js';

export type LookupView = {
	mode: 'taught' | 'saved' | 'untaught';
	canAdd: boolean;
	selfAdded: boolean;
	chars: string[];
};

export function lookupView(hit: LookupHit, word: CatalogWord | null, state: State): LookupView {
	const taught = word?.taughtIn != null;
	const inLexicon = Object.hasOwn(state.lexicon, hit.hanzi);
	const chars = [...hit.hanzi];
	return {
		mode: taught ? 'taught' : inLexicon ? 'saved' : 'untaught',
		canAdd: !taught && !inLexicon,
		selfAdded: state.lexicon[hit.hanzi]?.saved === true,
		chars: chars.length > 1 ? chars : []
	};
}
