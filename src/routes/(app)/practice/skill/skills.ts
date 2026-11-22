import { m } from '#lib/paraglide/messages.js';

export const SKILL_KEYS = ['noi', 'doan', 'thi'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const skillKey = (raw: string | null): SkillKey =>
	SKILL_KEYS.find((k) => k === raw) ?? 'noi';

type Text = () => string;

export type Entry = {
	icon: string;
	label: Text;
	title: Text;
	lead: Text;
	steps: [Text, Text, Text];
	sample: { label: Text; hanzi: Text; gloss: Text };
	note: Text;
};

export const ENTRIES: Record<SkillKey, Entry> = {
	noi: {
		icon: 'i-fill-microphone',
		label: m.skill_noi_label,
		title: m.skill_noi_title,
		lead: m.skill_noi_lead,
		steps: [m.skill_noi_step1, m.skill_noi_step2, m.skill_noi_step3],
		sample: {
			label: m.skill_noi_sample_label,
			hanzi: m.skill_noi_sample_hanzi,
			gloss: m.skill_noi_sample_gloss
		},
		note: m.skill_noi_note
	},
	doan: {
		icon: 'i-fill-notebook',
		label: m.skill_doan_label,
		title: m.skill_doan_title,
		lead: m.skill_doan_lead,
		steps: [m.skill_doan_step1, m.skill_doan_step2, m.skill_doan_step3],
		sample: {
			label: m.skill_doan_sample_label,
			hanzi: m.skill_doan_sample_hanzi,
			gloss: m.skill_doan_sample_gloss
		},
		note: m.skill_doan_note
	},
	thi: {
		icon: 'i-fill-diploma',
		label: m.skill_thi_label,
		title: m.skill_thi_title,
		lead: m.skill_thi_lead,
		steps: [m.skill_thi_step1, m.skill_thi_step2, m.skill_thi_step3],
		sample: {
			label: m.skill_thi_sample_label,
			hanzi: m.skill_thi_sample_hanzi,
			gloss: m.skill_thi_sample_gloss
		},
		note: m.skill_thi_note
	}
};
