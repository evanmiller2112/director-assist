<script lang="ts">
	import { goto } from '$app/navigation';
	import { campaignStore, notificationStore } from '$lib/stores';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';
	import { ChevronLeft, Search, X, Eye, EyeOff, RotateCcw } from 'lucide-svelte';

	// Store subscriptions
	let campaign = $derived(campaignStore.campaign);
	let entityTypeOverrides = $derived(campaignStore.entityTypeOverrides);

	// Search and filter state
	let searchQuery = $state('');
	let showOnlyCustomized = $state(false);
	let showConfirmResetAll = $state(false);

	// Filter entity types
	const filteredTypes = $derived.by(() => {
		let types = BUILT_IN_ENTITY_TYPES;

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			types = types.filter(t =>
				t.label.toLowerCase().includes(query) ||
				t.labelPlural.toLowerCase().includes(query) ||
				t.type.toLowerCase().includes(query)
			);
		}

		// Filter by customization status
		if (showOnlyCustomized) {
			types = types.filter(t =>
				entityTypeOverrides.some(o => o.type === t.type)
			);
		}

		return types;
	});

	// Helper to get override for a type
	function getOverride(type: string): EntityTypeOverride | undefined {
		return entityTypeOverrides.find(o => o.type === type);
	}

	// Helper to check if type has customizations
	function hasCustomizations(type: string): boolean {
		const override = getOverride(type);
		return override !== undefined;
	}

	// Helper to get customization summary
	function getCustomizationSummary(type: string): string[] {
		const override = getOverride(type);
		if (!override) return [];

		const summary: string[] = [];

		if (override.hiddenFields && override.hiddenFields.length > 0) {
			summary.push(`${override.hiddenFields.length} field${override.hiddenFields.length === 1 ? '' : 's'} hidden`);
		}

		if (override.fieldOrder && override.fieldOrder.length > 0) {
			summary.push('Custom order');
		}

		if (override.additionalFields && override.additionalFields.length > 0) {
			summary.push(`+${override.additionalFields.length} custom field${override.additionalFields.length === 1 ? '' : 's'}`);
		}

		if (override.hiddenFromSidebar) {
			summary.push('Hidden from sidebar');
		}

		return summary;
	}

	// Get field count for entity type
	function getFieldCount(typeDef: EntityTypeDefinition): number {
		return typeDef.fieldDefinitions.length;
	}

	function navigateToEdit(type: string) {
		goto(`/settings/built-in-entities/${type}/edit`);
	}

	function clearSearch() {
		searchQuery = '';
	}

	async function resetAllCustomizations() {
		showConfirmResetAll = false;

		try {
			// Remove all entity type overrides
			for (const override of entityTypeOverrides) {
				await campaignStore.removeEntityTypeOverride(override.type);
			}
			notificationStore.success('All customizations reset to defaults');
		} catch (error) {
			console.error('Failed to reset customizations:', error);
			notificationStore.error('Failed to reset customizations');
		}
	}

	// Get icon emoji for entity type
	function getIconEmoji(icon: string): string {
		const iconMap: Record<string, string> = {
			'user': '👤',
			'users': '👥',
			'map-pin': '📍',
			'flag': '🚩',
			'package': '📦',
			'swords': '⚔️',
			'calendar': '📅',
			'sun': '☀️',
			'clock': '🕐',
			'book': '📖',
			'user-circle': '👤',
			'book-open': '📖'
		};
		return iconMap[icon] || '📋';
	}
</script>

<div class="container max-w-6xl mx-auto p-6">
	<!-- Header -->
	<div class="mb-6">
		<button
			type="button"
			class="btn btn-ghost mb-4"
			onclick={() => goto('/settings')}
		>
			<ChevronLeft class="w-4 h-4" />
			Back to Settings
		</button>

		<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
			Customize Built-in Entity Types
		</h1>
		<p class="text-slate-600 dark:text-slate-400">
			Customize the default entity types by hiding fields, reordering them, adding custom fields, or hiding types from the sidebar.
		</p>
	</div>

	<!-- Empty state: No campaign -->
	{#if !campaign}
		<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				No campaign selected. Please create or select a campaign to customize entity types.
			</p>
			<button
				type="button"
				class="btn btn-primary"
				onclick={() => goto('/')}
			>
				Go to Home
			</button>
		</div>
	{:else}
		<!-- Search and filters -->
		<div class="flex flex-col sm:flex-row gap-4 mb-6">
			<div class="flex-1 relative">
				<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search entity types..."
					class="input pl-10 pr-10"
				/>
				{#if searchQuery}
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
						onclick={clearSearch}
						aria-label="Clear search"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>

			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={showOnlyCustomized}
					class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
				/>
				<span class="text-sm text-slate-700 dark:text-slate-300">
					Show only customized
				</span>
			</label>

			{#if entityTypeOverrides.length > 0}
				<button
					type="button"
					class="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
					onclick={() => showConfirmResetAll = true}
				>
					<RotateCcw class="w-4 h-4" />
					Reset All
				</button>
			{/if}
		</div>

		<!-- Entity type grid -->
		{#if filteredTypes.length === 0}
			<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
				<p class="text-slate-600 dark:text-slate-400">
					{#if searchQuery}
						No entity types found matching "{searchQuery}"
					{:else if showOnlyCustomized}
						No customized entity types yet
					{:else}
						No entity types found
					{/if}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredTypes as entityType}
					{@const override = getOverride(entityType.type)}
					{@const customized = hasCustomizations(entityType.type)}
					{@const summary = getCustomizationSummary(entityType.type)}

					<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
						<!-- Card header -->
						<div class="flex items-start gap-3 mb-3">
							<div class="text-3xl" role="img" aria-label="{entityType.label} icon">
								{getIconEmoji(entityType.icon)}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-slate-900 dark:text-white truncate">
									{entityType.label}
								</h3>
								<p class="text-sm text-slate-600 dark:text-slate-400">
									{entityType.labelPlural}
								</p>
								<p class="text-xs text-slate-500 dark:text-slate-500 mt-1">
									{getFieldCount(entityType)} field{getFieldCount(entityType) === 1 ? '' : 's'}
								</p>
							</div>
						</div>

						<!-- Customization status -->
						<div class="mb-3 min-h-[60px]">
							{#if customized}
								<div class="space-y-1">
									<div class="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
										Customized
									</div>
									{#each summary as item}
										<div class="text-xs text-slate-600 dark:text-slate-400">
											• {item}
										</div>
									{/each}
								</div>
							{:else}
								<div class="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
									No customizations
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<button
							type="button"
							class="btn btn-secondary w-full"
							onclick={() => navigateToEdit(entityType.type)}
							aria-label="{customized ? 'Edit' : 'Customize'} {entityType.label}"
						>
							{customized ? 'Edit' : 'Customize'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Reset All Confirmation Modal -->
{#if showConfirmResetAll}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
				Reset All Customizations?
			</h3>
			<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
				This will remove all customizations for all entity types:
			</p>
			<ul class="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-1">
				{#each entityTypeOverrides as override}
					{@const typeDef = BUILT_IN_ENTITY_TYPES.find(t => t.type === override.type)}
					{#if typeDef}
						<li>• {typeDef.label}</li>
					{/if}
				{/each}
			</ul>
			<p class="text-sm text-amber-600 dark:text-amber-400 mb-4">
				⚠️ This action cannot be undone.
			</p>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => showConfirmResetAll = false}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary bg-red-600 hover:bg-red-700"
					onclick={resetAllCustomizations}
				>
					Reset All
				</button>
			</div>
		</div>
	</div>
{/if}
