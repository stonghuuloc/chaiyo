export const progress = (index: number, total: number) => ({
	on: index,
	label: `${Math.min(index + 1, total)}/${total}`
});
