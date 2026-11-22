import type { Component } from 'svelte';
import type { Step as ChoiceStep } from './steps/Choice.svelte';
import type { Step as GrammarStep } from './steps/Grammar.svelte';
import type { Step as OrderStep } from './steps/Order.svelte';
import type { Step as SpeakStep } from './steps/Speak.svelte';
import type { Step as ToneStep } from './steps/Tone.svelte';
import type { StepProps } from './types';

export type LessonStep = ChoiceStep | GrammarStep | OrderStep | SpeakStep | ToneStep;

type View = { default: Component<StepProps<LessonStep>>; kind: string };

const views = import.meta.glob<View>('./steps/*.svelte', { eager: true });

export const viewOf = (kind: LessonStep['kind']) => {
	const view = Object.entries(views).find(
		([path]) => path.slice(path.lastIndexOf('/') + 1, -'.svelte'.length).toLowerCase() === kind
	)?.[1];
	if (!view) throw new Error(`unknown step kind: ${kind}`);
	return view;
};
