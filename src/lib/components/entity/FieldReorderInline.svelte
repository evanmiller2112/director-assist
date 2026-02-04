<script lang="ts">
	import { ChevronUp, ChevronDown } from 'lucide-svelte';
	import { campaignStore, notificationStore } from '$lib/stores';
	import type { FieldDefinition, EntityTypeOverride } from '$lib/types';

	interface Props {
		entityType: string;
		fieldDefinitions: FieldDefinition[];
		fieldIndex: number;
		totalFields: number;
	}

	let { entityType, fieldDefinitions, fieldIndex, totalFields }: Props = $props();

	// Get the current field order from the displayed fields
	// fieldDefinitions is already in the correct display order (parent applies overrides)
	function getCurrentFieldOrder(): string[] {
		return fieldDefinitions.map((f) => f.key);
	}

	async function moveField(direction: 'up' | 'down') {
		const swapIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

		// Validate bounds
		if (swapIndex < 0 || swapIndex >= totalFields) return;

		try {
			// Get current order from the displayed fields
			const newOrder = getCurrentFieldOrder();

			// Swap positions
			[newOrder[fieldIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[fieldIndex]];

			// Get existing override to preserve other settings
			const existingOverride = campaignStore.getEntityTypeOverride(entityType);

			// Build updated override
			const updatedOverride: EntityTypeOverride = {
				...existingOverride,
				type: entityType,
				fieldOrder: newOrder
			};

			// Save to store
			await campaignStore.setEntityTypeOverride(updatedOverride);
		} catch (error) {
			console.error('Failed to update field order:', error);
			notificationStore.error('Failed to update field order');
		}
	}
</script>

<div class="flex flex-col gap-0.5 mr-2">
	<button
		type="button"
		class="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
		onclick={() => moveField('up')}
		disabled={fieldIndex === 0}
		aria-label="Move field up"
	>
		<ChevronUp class="w-4 h-4 text-slate-500" />
	</button>
	<button
		type="button"
		class="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
		onclick={() => moveField('down')}
		disabled={fieldIndex === totalFields - 1}
		aria-label="Move field down"
	>
		<ChevronDown class="w-4 h-4 text-slate-500" />
	</button>
</div>
