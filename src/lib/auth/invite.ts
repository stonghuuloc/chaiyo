const KEY = 'chaiyo:invite';
const HANDLE = /^[a-z0-9]{1,40}$/;

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function rememberInvite(store: Store, handle: string) {
	const h = handle.toLowerCase();
	if (HANDLE.test(h)) store.setItem(KEY, h);
}

export function takeInvite(store: Store): string | null {
	const h = store.getItem(KEY);
	store.removeItem(KEY);
	return h && HANDLE.test(h) ? h : null;
}
