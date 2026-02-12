<script lang="ts">
	import { entitiesStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';
	import { X, Search, Check, EyeOff } from 'lucide-svelte';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		sourceEntity: BaseEntity;
		open?: boolean;
		onClose?: () => void;
	}

	let { sourceEntity, open = $bindable(false), onClose }: Props = $props();

	let searchQuery = $state('');
	let selectedEntity = $state<BaseEntity | null>(null);
	let relationship = $state('');
	let notes = $state('');
	let bidirectional = $state(true);
	let strength = $state<'none' | 'strong' | 'moderate' | 'weak'>('none');
	let tags = $state('');
	let tension = $state(0);
	let showAsymmetricOptions = $state(false);
	let reverseRelationship = $state('');
	let playerVisible = $state<boolean | undefined>(undefined);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	// Common relationship options
	const commonRelationships = [
		'member_of',
		'has_member',
		'located_at',
		'contains',
		'owns',
		'owned_by',
		'allied_with',
		'enemy_of',
		'parent_of',
		'child_of',
		'knows',
		'friend_of',
		'created_by',
		'leads'
	];

	// Filter entities based on search and exclude source entity only
	const filteredEntities = $derived.by(() => {
		const query = searchQuery.toLowerCase();

		return entitiesStore.entities.filter((e) => {
			// Exclude source entity itself
			if (e.id === sourceEntity.id) return false;

			// Apply search filter
			if (query) {
				return (
					e.name.toLowerCase().includes(query) ||
					e.description.toLowerCase().includes(query) ||
					e.type.toLowerCase().includes(query)
				);
			}

			return true;
		});
	});

	// Compute link counts for each entity
	const linkCountsByEntity = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const link of sourceEntity.links) {
			counts.set(link.targetId, (counts.get(link.targetId) || 0) + 1);
		}
		return counts;
	});

	// Get existing links to the selected entity
	const existingLinksToSelected = $derived.by(() => {
		const entity = selectedEntity;
		if (!entity) return [];
		return sourceEntity.links.filter((l) => l.targetId === entity.id);
	});

	function handleClose() {
		searchQuery = '';
		selectedEntity = null;
		relationship = '';
		notes = '';
		bidirectional = true;
		strength = 'none';
		tags = '';
		tension = 0;
		showAsymmetricOptions = false;
		reverseRelationship = '';
		playerVisible = undefined;
		errorMessage = '';
		open = false;
		onClose?.();
	}

	function selectEntity(entity: BaseEntity) {
		selectedEntity = entity;
		searchQuery = '';
	}

	async function handleSubmit() {
		if (!selectedEntity || !relationship.trim()) {
			errorMessage = 'Please select an entity and enter a relationship';
			return;
		}

		// Check for duplicate relationship type
		const isDuplicate = sourceEntity.links.some(
			(l) => l.targetId === selectedEntity!.id && l.relationship === relationship.trim()
		);
		if (isDuplicate) {
			errorMessage = `A "${relationship.trim()}" relationship already exists with ${selectedEntity!.name}`;
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			// Parse strength: convert "none" to undefined
			const finalStrength = strength === 'none' ? undefined : strength;

			// Parse tags: split by comma, trim, and filter out empty strings
			const parsedTags = tags.trim()
				? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
				: [];

			// Build metadata object
			const metadata: Record<string, any> = {};
			if (parsedTags.length > 0) {
				metadata.tags = parsedTags;
			}
			// Always include tension (even if 0)
			if (tension !== 0) {
				metadata.tension = tension;
			}

			// Parse reverseRelationship: pass trimmed value if asymmetric is enabled and non-empty
			const finalReverseRelationship = showAsymmetricOptions && reverseRelationship.trim()
				? reverseRelationship.trim()
				: undefined;

			await entitiesStore.addLink(
				sourceEntity.id,
				selectedEntity.id,
				relationship,
				bidirectional,
				notes.trim(),
				finalStrength,
				metadata,
				finalReverseRelationship,
				playerVisible
			);
			handleClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create link';
		} finally {
			isSubmitting = false;
		}
	}

	// Clear reverseRelationship when showAsymmetricOptions is unchecked
	$effect(() => {
		if (!showAsymmetricOptions) {
			reverseRelationship = '';
		}
	});

	// Track previous relationship value to detect changes
	let previousRelationship = $state('');

	// Clear "already exists" error when relationship input changes
	$effect(() => {
		if (relationship !== previousRelationship && errorMessage.includes('already exists')) {
			errorMessage = '';
		}
		previousRelationship = relationship;
	});

	// Close on escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleClose}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="relate-command-title"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 id="relate-command-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Link Entity to {sourceEntity.name}
				</h2>
				<button
					onclick={handleClose}
					class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4">
				{#if !selectedEntity}
					<!-- Search for entity -->
					<div class="mb-4">
						<label for="entity-search-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
							Search for entity to link
						</label>
						<div class="relative">
							<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<input
								id="entity-search-input"
								type="text"
								bind:value={searchQuery}
								placeholder="Search entities..."
								class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								autofocus
							/>
						</div>
					</div>

					<!-- Entity list -->
					<div class="max-h-[400px] overflow-y-auto space-y-2">
						{#if filteredEntities.length === 0}
							<p class="text-center text-slate-500 dark:text-slate-400 py-8">
								{searchQuery ? 'No entities found' : 'No available entities to link'}
							</p>
						{:else}
							{#each filteredEntities as entity}
								{@const typeDefinition = getEntityTypeDefinition(
									entity.type,
									campaignStore.customEntityTypes,
									campaignStore.entityTypeOverrides
								)}
								<button
									onclick={() => selectEntity(entity)}
									class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
								>
									<div class="flex items-center gap-3">
										<div
											class="w-2 h-2 rounded-full flex-shrink-0"
											style="background-color: {typeDefinition?.color ?? '#94a3b8'}"
										></div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-slate-900 dark:text-white truncate">
												{entity.name}
											</div>
											<div class="text-sm text-slate-500 dark:text-slate-400 truncate">
												{typeDefinition?.label ?? entity.type}
												{#if entity.description}
													&bull; {entity.description.substring(0, 100)}
												{/if}
											</div>
										</div>
										{#if linkCountsByEntity.get(entity.id)}
											<span
												data-testid="link-count-badge"
												class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex-shrink-0"
											>
												{linkCountsByEntity.get(entity.id)}
											</span>
										{/if}
									</div>
								</button>
							{/each}
						{/if}
					</div>
				{:else}
					<!-- Selected entity and relationship form -->
					<div class="space-y-4">
						<!-- Selected entity -->
						{#if selectedEntity}
							{@const typeDefinition = getEntityTypeDefinition(
								selectedEntity.type,
								campaignStore.customEntityTypes,
								campaignStore.entityTypeOverrides
							)}
							<div class="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium text-slate-900 dark:text-white">
											{selectedEntity.name}
										</div>
										<div class="text-sm text-slate-500 dark:text-slate-400">
											{typeDefinition?.label ?? selectedEntity.type}
										</div>
									</div>
									<button
										onclick={() => (selectedEntity = null)}
										class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
										aria-label="Clear selection"
									>
										<X class="w-5 h-5" />
									</button>
								</div>
							</div>
						{/if}

						<!-- Existing relationships display -->
						{#if existingLinksToSelected.length > 0}
							<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
								<p class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
									Existing links ({existingLinksToSelected.length})
								</p>
								<div class="flex flex-wrap gap-2">
									{#each existingLinksToSelected as link}
										<span class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
											{link.relationship}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Relationship input -->
						<div>
							<label for="relationship" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Relationship
							</label>
							<input
								id="relationship"
								type="text"
								bind:value={relationship}
								placeholder="e.g., member_of, knows, located_at"
								list={existingLinksToSelected.length > 0 ? undefined : "common-relationships"}
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							{#if existingLinksToSelected.length === 0}
								<datalist id="common-relationships">
									{#each commonRelationships as rel}
										<option value={rel}>{rel.replace(/_/g, ' ')}</option>
									{/each}
								</datalist>
							{/if}
							<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
								How {sourceEntity.name} relates to {selectedEntity.name}
							</p>
						</div>

						<!-- Notes textarea -->
						<div>
							<label for="notes" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Notes
							</label>
							<textarea
								id="notes"
								bind:value={notes}
								placeholder="Optional notes about this relationship..."
								rows="3"
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
							></textarea>
						</div>

						<!-- Strength selector -->
						<div>
							<label for="strength" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Strength
							</label>
							<select
								id="strength"
								bind:value={strength}
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="none">None</option>
								<option value="strong">Strong</option>
								<option value="moderate">Moderate</option>
								<option value="weak">Weak</option>
							</select>
						</div>

						<!-- Tags input -->
						<div>
							<label for="tags" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Tags
							</label>
							<input
								id="tags"
								type="text"
								bind:value={tags}
								placeholder="Enter comma-separated tags..."
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<!-- Tension slider -->
						<div>
							<label for="tension" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Tension: {tension}
							</label>
							<input
								id="tension"
								type="range"
								min="0"
								max="100"
								bind:value={tension}
								class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
							/>
						</div>

						<!-- Bidirectional checkbox -->
						<div class="flex items-center gap-2">
							<input
								id="bidirectional"
								type="checkbox"
								bind:checked={bidirectional}
								class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
							/>
							<label for="bidirectional" class="text-sm text-slate-700 dark:text-slate-300">
								Bidirectional (also create reverse link)
							</label>
						</div>

						<!-- Asymmetric relationship options (only shown when bidirectional is true and no existing links) -->
						{#if bidirectional && existingLinksToSelected.length === 0}
							<div class="flex items-center gap-2">
								<input
									id="asymmetric"
									type="checkbox"
									bind:checked={showAsymmetricOptions}
									class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
								/>
								<label for="asymmetric" class="text-sm text-slate-700 dark:text-slate-300">
									Use different relationship for reverse link
								</label>
							</div>

							{#if showAsymmetricOptions}
								<div>
									<label for="reverse-relationship" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
										Reverse Relationship
									</label>
									<input
										id="reverse-relationship"
										type="text"
										bind:value={reverseRelationship}
										placeholder="Reverse direction (e.g., has_member, employs)"
										class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
										How {selectedEntity.name} relates back to {sourceEntity.name}
									</p>
								</div>
							{/if}
						{/if}

						<!-- Player Visibility -->
						<div class="flex items-center gap-2">
							<input
								id="player-visible"
								type="checkbox"
								checked={playerVisible === false}
								onchange={(e) => {
									playerVisible = e.currentTarget.checked ? false : undefined;
								}}
								class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
							/>
							<label for="player-visible" class="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
								<EyeOff class="w-4 h-4 text-amber-500" />
								Hide from players (DM only)
							</label>
						</div>

						{#if errorMessage}
							<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
								{errorMessage}
							</div>
						{/if}

						<!-- Submit buttons -->
						<div class="flex gap-2 justify-end">
							<button onclick={handleClose} class="btn btn-ghost" disabled={isSubmitting}>
								Cancel
							</button>
							<button
								onclick={handleSubmit}
								class="btn btn-primary"
								disabled={!relationship.trim() || isSubmitting}
							>
								{#if isSubmitting}
									Creating...
								{:else}
									<Check class="w-4 h-4" />
									Create Link
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
