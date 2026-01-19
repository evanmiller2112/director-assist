<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { campaignStore, notificationStore } from '$lib/stores';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';
	import BuiltInTypeOverrideForm from '$lib/components/settings/BuiltInTypeOverrideForm.svelte';
	import { ChevronLeft } from 'lucide-svelte';

	// Get the entity type from the URL parameter
	let typeParam = $derived($page.params.type);

	// Find the entity type definition
	let entityType = $derived<EntityTypeDefinition | undefined>(
		BUILT_IN_ENTITY_TYPES.find(t => t.type === typeParam)
	);

	// Get existing override for this type
	let existingOverride = $derived<EntityTypeOverride | undefined>(
		campaignStore.entityTypeOverrides.find(o => o.type === typeParam)
	);

	// Handle save
	async function handleSave(override: EntityTypeOverride) {
		try {
			await campaignStore.setEntityTypeOverride(override);
			notificationStore.success('Customization saved successfully!');
			goto('/settings/built-in-entities');
		} catch (error) {
			console.error('Failed to save customization:', error);
			notificationStore.error('Failed to save customization');
			throw error;
		}
	}

	// Handle cancel
	function handleCancel() {
		goto('/settings/built-in-entities');
	}
</script>

<div class="container max-w-4xl mx-auto p-6">
	<!-- Back button -->
	<button
		type="button"
		class="btn btn-ghost mb-4"
		onclick={() => goto('/settings/built-in-entities')}
	>
		<ChevronLeft class="w-4 h-4" />
		Back to Entity Types
	</button>

	{#if !entityType}
		<!-- Entity type not found -->
		<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
			<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
				Entity Type Not Found
			</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				The entity type "{typeParam}" does not exist.
			</p>
			<button
				type="button"
				class="btn btn-primary"
				onclick={() => goto('/settings/built-in-entities')}
			>
				Return to Entity Types
			</button>
		</div>
	{:else}
		<!-- Form -->
		<BuiltInTypeOverrideForm
			{entityType}
			{existingOverride}
			onsubmit={handleSave}
			oncancel={handleCancel}
		/>
	{/if}
</div>
