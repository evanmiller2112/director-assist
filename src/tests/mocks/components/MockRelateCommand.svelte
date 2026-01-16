<script lang="ts">
	import { onMount } from 'svelte';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		sourceEntity: BaseEntity;
		open?: boolean;
		onClose?: () => void;
	}

	let { sourceEntity, open = $bindable(false), onClose }: Props = $props();

	let selectedTarget = $state<string | null>(null);
	let relationship = $state('');
	let errorMessage = $state('');

	function handleClose() {
		open = false;
		onClose?.();
		// Reset form
		selectedTarget = null;
		relationship = '';
		errorMessage = '';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	async function handleSubmit() {
		if (!selectedTarget || !relationship) {
			errorMessage = 'Please select an entity and enter a relationship';
			return;
		}

		try {
			// Import and call the entities store
			const { entitiesStore } = await import('$lib/stores');
			await entitiesStore.addLink(
				sourceEntity.id,
				selectedTarget,
				relationship,
				true,
				`${sourceEntity.id}-${selectedTarget}`
			);
			handleClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create link';
		}
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
			aria-labelledby="relate-command-title"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="relate-command-title">Link Entity to {sourceEntity.name}</h2>
			<button onclick={handleClose} aria-label="Close">Close</button>
			<button onclick={handleClose}>Cancel</button>

			<!-- Mock entity selection buttons (filter out source entity) -->
			{#if sourceEntity.name !== 'Gandalf'}
				<button onclick={() => selectedTarget = 'npc-2'}>Gandalf</button>
			{/if}
			{#if sourceEntity.name !== 'Aragorn'}
				<button onclick={() => selectedTarget = 'npc-1'}>Aragorn</button>
			{/if}

			<!-- Mock relationship form -->
			<label for="relationship">Relationship</label>
			<input id="relationship" type="text" bind:value={relationship} />

			<button onclick={handleSubmit}>Create Link</button>

			<!-- Error display area -->
			<div id="error-message">{errorMessage}</div>
		</div>
	</div>
{/if}
