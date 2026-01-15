<script lang="ts">
	import { goto } from '$app/navigation';
	import { campaignStore, notificationStore } from '$lib/stores';
	import { CustomEntityTypeForm } from '$lib/components/settings';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import type { EntityTypeDefinition } from '$lib/types';

	async function handleSubmit(entityType: EntityTypeDefinition) {
		// Check if type key conflicts with built-in types
		const isBuiltInType = BUILT_IN_ENTITY_TYPES.some((t) => t.type === entityType.type);
		if (isBuiltInType) {
			notificationStore.error(`Type key "${entityType.type}" conflicts with a built-in entity type`);
			return;
		}

		try {
			await campaignStore.addCustomEntityType(entityType);
			notificationStore.success(`Created "${entityType.label}" entity type`);
			goto('/settings/custom-entities');
		} catch (error) {
			notificationStore.error(error instanceof Error ? error.message : 'Failed to create entity type');
		}
	}

	function handleCancel() {
		goto('/settings/custom-entities');
	}
</script>

<svelte:head>
	<title>New Custom Entity Type - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-8">Create Custom Entity Type</h1>

	<CustomEntityTypeForm onsubmit={handleSubmit} oncancel={handleCancel} />
</div>
