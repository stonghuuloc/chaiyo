export const progress = (index: number, total: number) => ({
	label: `${Math.min(index + 1, total)}/${total}`
});
