import { getContext, setContext } from 'svelte';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Key = 'pinyin' | 'meaning';
export type Stored = { pinyin: boolean | null; meaning: boolean | null; unsent?: Key[] };
type Opts = {
	level: number;
	key: string;
	storage?: Storage;
	uid?: string;
	client?: Pick<SupabaseClient, 'from'>;
};

const col = { pinyin: 'show_pinyin', meaning: 'show_meaning' } as const;

export const showPinyin = (v: boolean | null, level: number) => v ?? level <= 2;
export const showMeaning = (v: boolean | null) => v ?? true;

export const PREFS = Symbol('prefs');
export const setPrefs = (prefs: DisplayPrefs) => setContext(PREFS, prefs);
export const getPrefs = () => getContext<DisplayPrefs | undefined>(PREFS) ?? null;

export class DisplayPrefs {
	stored = $state<Stored>({ pinyin: null, meaning: null });
	o: Opts;
	#touched = 0;

	constructor(o: Opts) {
		this.o = o;
		const raw = o.storage?.getItem(o.key);
		if (raw) this.stored = JSON.parse(raw) as Stored;
	}

	get pinyin() {
		return showPinyin(this.stored.pinyin, this.o.level);
	}

	get meaning() {
		return showMeaning(this.stored.meaning);
	}

	#keep() {
		this.o.storage?.setItem(this.o.key, JSON.stringify(this.stored));
	}

	async #push(keys: Key[]) {
		const { client, uid } = this.o;
		if (!client || !uid) return;
		const sent = Object.fromEntries(keys.map((k) => [k, this.stored[k]]));
		const row = Object.fromEntries(keys.map((k) => [col[k], sent[k]]));
		const { error } = await client
			.from('settings')
			.upsert({ learner_id: uid, ...row }, { onConflict: 'learner_id' });
		if (error) return;
		const unsent = (this.stored.unsent ?? []).filter(
			(k) => !(keys.includes(k) && this.stored[k] === sent[k])
		);
		this.stored = { ...this.stored, unsent };
		this.#keep();
	}

	async toggle(k: Key) {
		this.#touched++;
		const unsent = [...(this.stored.unsent ?? []).filter((u) => u !== k), k];
		this.stored = { ...this.stored, [k]: !this[k], unsent };
		this.#keep();
		await this.#push([k]).catch(() => {});
	}

	async load() {
		const { client, uid } = this.o;
		if (!client || !uid) return;
		if (this.stored.unsent?.length) return this.#push(this.stored.unsent).catch(() => {});
		const at = this.#touched;
		const { data } = await client
			.from('settings')
			.select(`${col.pinyin}, ${col.meaning}`)
			.eq('learner_id', uid)
			.maybeSingle()
			.then(
				(r) => r,
				() => ({ data: null })
			);
		if (!data || at !== this.#touched) return;
		const row = data as { show_pinyin: boolean | null; show_meaning: boolean | null };
		this.stored = { pinyin: row.show_pinyin, meaning: row.show_meaning };
		this.#keep();
	}
}
