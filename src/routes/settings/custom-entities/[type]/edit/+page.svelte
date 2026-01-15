<script lang="ts">
	import { goto } from '$app/navigation';
	import { campaignStore, notificationStore } from '$lib/stores';
	import { CustomEntityTypeForm } from '$lib/components/settings';
	import type { EntityTypeDefinition } from '$lib/types';

	interface Props {
		data: { type: string };
	}

	let { data }: Props = $props();

	const entityType = $derived(campaignStore.getCustomEntityType(data.type));

	async function handleSubmit(updatedType: EntityTypeDefinition) {
		try {
			await campaignStore.updateCustomEntityType(data.type, {
				label: updatedType.label,
				labelPlural: updatedType.labelPlural,
				icon: updatedType.icon,
				color: updatedType.color,
				fieldDefinitions: updatedType.fieldDefinitions,
				defaultRelationships: updatedType.defaultRelationships
			});
			notificationStore.success(`Updated "${updatedType.label}" entity type`);
			goto('/settings/custom-entities');
		} catch (error) {
			notificationStore.error(error instanceof Error ? error.message : 'Failed to update entity type');
		}
	}

	function handleCancel() {
		goto('/settings/custom-entities');
	}
</script>

<svelte:head>
	<title>Edit {entityType?.label ?? 'Entity Type'} - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	{#if entityType}
		<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-8">
			Edit {entityType.label}
		</h1>

		<CustomEntityTypeForm
			initialValue={entityType}
			isEditing={true}
			onsubmit={handleSubmit}
			oncancel={handleCancel}
		/>
	{:else}
		<div class="text-center py-12">
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Entity Type Not Found</h1>
			<p class="text-slate-500 dark:text-slate-400 mb-4">
				The entity type "{data.type}" does not exist or is a built-in type.
			</p>
			<a href="/settings/custom-entities" class="btn btn-primary">
				Back to Custom Types
			</a>
		</div>
	{/if}
</div>
