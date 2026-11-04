import { issue } from '../util';
import type { ContentSet, LintError, LintRefs } from '../types';

const FIELDS = ['hinh', 'am', 'doiThat', 'tuongPhan'] as const;

export const mnemonic = (set: ContentSet, refs: LintRefs): LintError[] => {
	const vault = refs.mnemonics;
	if (!vault) return [];
	return set.chars.flatMap(({ file, value }) => {
		const authored = value.mnemonic;
		const source = vault.get(value.hanzi);
		if (!authored || !source) return [];
		return FIELDS.filter((f) => authored[f].trim() !== source[f].trim()).map((f) =>
			issue(7, file, `mnemonic.${f}`, `Char ${value.hanzi} mnemonic.${f} differs from the vault`)
		);
	});
};
