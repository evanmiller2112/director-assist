<script lang="ts">
	import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-svelte';
	import { campaignStore, notificationStore } from '$lib/stores';
	import { getIconComponent } from '$lib/utils/icons';
	import { goto } from '$app/navigation';

	async function deleteType(type: string, label: string) {
		if (!confirm(`Are you sure you want to delete the "${label}" entity type? This cannot be undone.`)) {
			return;
		}

		try {
			await campaignStore.deleteCustomEntityType(type);
			notificationStore.success(`Deleted "${label}" entity type`);
		} catch (error) {
			notificationStore.error(error instanceof Error ? error.message : 'Failed to delete entity type');
		}
	}
</script>

<svelte:head>
	<title>Custom Entity Types - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<a href="/settings" class="btn btn-ghost p-2" title="Back to Settings">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Custom Entity Types</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400">
				Create custom entity types to organize your campaign content
			</p>
		</div>
		<a href="/settings/custom-entities/new" class="btn btn-primary">
			<Plus class="w-4 h-4" />
			New Type
		</a>
	</div>

	<!-- List of custom entity types -->
	{#if campaignStore.customEntityTypes.length === 0}
		<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
			<p class="text-slate-500 dark:text-slate-400 mb-4">
				You haven't created any custom entity types yet.
			</p>
			<a href="/settings/custom-entities/new" class="btn btn-primary">
				<Plus class="w-4 h-4" />
				Create Your First Type
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each campaignStore.customEntityTypes as entityType}
				{@const Icon = getIconComponent(entityType.icon)}
				<div
					class="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
				>
					<div
						class="w-10 h-10 rounded-lg flex items-center justify-center"
						style="background-color: var(--color-{entityType.color}, #64748b); color: white;"
					>
						<Icon class="w-5 h-5" />
					</div>
					<div class="flex-1">
						<h3 class="font-medium text-slate-900 dark:text-white">{entityType.label}</h3>
						<p class="text-sm text-slate-500 dark:text-slate-400">
							{entityType.fieldDefinitions.length} custom field{entityType.fieldDefinitions.length !== 1 ? 's' : ''}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<a
							href="/settings/custom-entities/{entityType.type}/edit"
							class="btn btn-ghost p-2"
							title="Edit"
						>
							<Edit class="w-4 h-4" />
						</a>
						<button
							class="btn btn-ghost p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
							onclick={() => deleteType(entityType.type, entityType.label)}
							title="Delete"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
