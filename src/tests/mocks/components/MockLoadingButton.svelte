<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
		loading?: boolean;
		disabled?: boolean;
		loadingText?: string;
		onclick?: () => void;
		children?: Snippet;
		leftIcon?: Snippet;
	}

	let {
		variant = 'primary',
		loading = false,
		disabled = false,
		loadingText = 'Loading...',
		onclick,
		children,
		leftIcon
	}: Props = $props();
</script>

<button {disabled} {onclick} data-testid="mock-loading-button">
	{#if children}
		{@render children()}
	{/if}
</button>
