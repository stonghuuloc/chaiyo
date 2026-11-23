export type HanziStyle = 'kai' | 'xing';

export const HANZI_KEY = 'chaiyo:hanzi-style';

type Doc = { documentElement: { dataset: DOMStringMap } };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function applyHanziStyle(
	style: HanziStyle,
	doc: Doc = document,
	storage: Store = localStorage
) {
	if (style === 'xing') doc.documentElement.dataset.hanzi = 'xing';
	else delete doc.documentElement.dataset.hanzi;
	try {
		if (style === 'xing') storage.setItem(HANZI_KEY, 'xing');
		else storage.removeItem(HANZI_KEY);
	} catch {
		return;
	}
}

export async function bootHanziStyle(o: {
	doc: Doc;
	storage: Store;
	read: () => Promise<HanziStyle | null>;
}) {
	let cached: string | null;
	try {
		cached = o.storage.getItem(HANZI_KEY);
	} catch {
		cached = null;
	}
	applyHanziStyle(cached === 'xing' ? 'xing' : 'kai', o.doc, o.storage);
	const account = await o.read().catch(() => null);
	if (account) applyHanziStyle(account, o.doc, o.storage);
}
