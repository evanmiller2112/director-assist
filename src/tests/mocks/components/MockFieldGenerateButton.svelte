<script lang="ts">
	interface Props {
		disabled?: boolean;
		loading?: boolean;
		onGenerate: () => void;
	}

	let { disabled = false, loading = false, onGenerate }: Props = $props();
</script>

<button
	type="button"
	data-testid="field-generate-button"
	{disabled}
	onclick={onGenerate}
>
	{#if loading}
		Loading...
	{:else}
		Generate
	{/if}
</button>
