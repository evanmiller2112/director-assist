<script lang="ts">
	interface Props {
		open?: boolean;
		onimport?: () => void;
		oncancel?: () => void;
	}

	let { open = $bindable(false), onimport, oncancel }: Props = $props();

	let importSuccessful = $state(false);

	function handleClose() {
		open = false;
		oncancel?.();
		importSuccessful = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	async function handleImport() {
		// Simulate successful import
		importSuccessful = true;
		onimport?.();
	}

	$effect(() => {
		if (open) {
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	});
</script>

{#if open}
	<div role="presentation" onclick={handleClose}>
		<div
			role="dialog"
			aria-labelledby="forge-steel-import-title"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="forge-steel-import-title">Import from Forge Steel</h2>
			<button onclick={handleClose} aria-label="Close">Close</button>
			<button onclick={handleClose}>Cancel</button>
			<button onclick={handleImport}>Import Character</button>

			{#if importSuccessful}
				<div role="status">Import successful!</div>
			{/if}
		</div>
	</div>
{/if}
