import type { Attempt, State, WordSaved } from '#lib/study/index.js';

export type Input = Attempt | WordSaved;

export type Store = {
	push(inputs: Input[]): Promise<void>;
	pull(): Promise<Input[]>;
};

export type Ledger = {
	record(input: Input): Promise<void>;
	state(): State;
	subscribe(fn: (state: State) => void): () => void;
	sync(): Promise<void>;
	pending(): number;
};
