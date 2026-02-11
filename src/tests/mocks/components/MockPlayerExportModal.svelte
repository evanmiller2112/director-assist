<script lang="ts">
	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = false, onclose }: Props = $props();
</script>

{#if open}
	<div data-testid="mock-player-export-modal">Mock PlayerExportModal</div>
{/if}
