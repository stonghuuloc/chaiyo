import { sectionName } from '#lib/lesson/done.js';
import { m } from '#lib/paraglide/messages.js';
import type { State } from '#lib/study/index.js';
import type { Hub } from './hub';

export function primerHub(hub: Hub, state: State, id: string): Hub {
	const rows = hub.rows.map((r) => ({ ...r, name: sectionName(r.id) }));
	const now = rows.find((r) => r.look === 'now');
	const todo = rows.find((r) => r.look !== 'done');
	const cta = now
		? { section: now.id, label: m.hub_resume({ name: now.name }) }
		: todo
			? { section: todo.id, label: m.hub_start({ name: todo.name }) }
			: state.lessons[id]?.passed
				? null
				: { section: 'gate', label: m.primer_hub_gate_cta() };
	return {
		...hub,
		meta: m.primer_hub_meta(),
		rows,
		cta,
		links: [{ id: 'pinyin', label: m.pinyin_title() }],
		testOut: state.lessons[id]?.passed ? null : { label: m.primer_gate_testout() },
		gate: { ...hub.gate, name: m.primer_hub_gate() }
	};
}
