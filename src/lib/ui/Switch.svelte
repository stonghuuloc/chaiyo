<script lang="ts">
	type Props = { checked: boolean; label: string; disabled?: boolean; onchange: () => void };
	let { checked, label, disabled = false, onchange }: Props = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	class="group grid h-11 w-[52px] place-items-center disabled:opacity-50"
	onclick={onchange}
>
	<span
		class="relative block h-8 w-[52px] rounded-full bg-ruled-line transition-colors group-aria-checked:bg-ink motion-reduce:transition-none"
	>
		<span
			class="absolute top-[3px] left-[3px] size-[26px] rounded-full bg-white transition-transform group-aria-checked:translate-x-5 motion-reduce:transition-none"
		></span>
	</span>
</button>
