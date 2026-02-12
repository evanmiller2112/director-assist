<script lang="ts">
	/**
	 * PlayerFieldDisplay Component
	 * Issue #443: Read-only entity display components for player view
	 *
	 * Wraps FieldRenderer for player context. Handles entity-ref fields specially
	 * (uses playerDataStore instead of entitiesStore, links to /player/entity/{id}),
	 * delegates all other field types to FieldRenderer.
	 */

	import type { FieldDefinition, FieldValue } from '$lib/types';
	import FieldRenderer from '$lib/components/entity/FieldRenderer.svelte';
	import { playerDataStore } from '$lib/stores';
	import { resolvePlayerEntityName, resolvePlayerEntityType } from '$lib/utils/playerFieldUtils';

	interface Props {
		field: FieldDefinition;
		value: FieldValue;
		allFields?: Record<string, any>; // For computed field evaluation
		compact?: boolean;
	}

	let { field, value, allFields = {}, compact = false }: Props = $props();

	// Get all entities from player store for entity ref resolution
	const entities = $derived(playerDataStore.entities);

	// Check if this is an entity-ref field
	const isEntityRef = $derived(field.type === 'entity-ref');
	const isEntityRefs = $derived(field.type === 'entity-refs');

	// Format option labels (replace underscores with spaces)
	function formatOptionLabel(option: string): string {
		return option.replace(/_/g, ' ');
	}

	// Empty state text
	const emptyStateText = '—';
</script>

{#if isEntityRef}
	<!-- Custom rendering for entity-ref field -->
	<div class="field-renderer" class:compact>
		<div class="field-label text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
			{field.label}
		</div>
		<div class="field-value text-slate-900 dark:text-slate-100">
			{#if value}
				{@const entityId = value as string}
				{@const entityName = resolvePlayerEntityName(entityId, entities)}
				{@const entityType = resolvePlayerEntityType(entityId, entities)}
				<a
					href="/player/entity/{entityId}"
					class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
				>
					{entityName}
					{#if entityType}
						<span class="text-xs text-slate-500 dark:text-slate-400">
							({formatOptionLabel(entityType)})
						</span>
					{/if}
				</a>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		</div>
	</div>
{:else if isEntityRefs}
	<!-- Custom rendering for entity-refs field -->
	<div class="field-renderer" class:compact>
		<div class="field-label text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
			{field.label}
		</div>
		<div class="field-value text-slate-900 dark:text-slate-100">
			{#if Array.isArray(value) && value.length > 0}
				<div class="space-y-1">
					{#each value as entityId}
						{@const entityName = resolvePlayerEntityName(entityId, entities)}
						{@const entityType = resolvePlayerEntityType(entityId, entities)}
						<div>
							<a
								href="/player/entity/{entityId}"
								class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
							>
								{entityName}
								{#if entityType}
									<span class="text-xs text-slate-500 dark:text-slate-400">
										({formatOptionLabel(entityType)})
									</span>
								{/if}
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		</div>
	</div>
{:else}
	<!-- Delegate to FieldRenderer for all other field types -->
	<FieldRenderer {field} {value} {allFields} {compact} />
{/if}

<style>
	.field-renderer {
		@apply mb-4;
	}

	.field-renderer.compact {
		@apply mb-2;
	}

	.field-renderer.compact .field-label {
		@apply text-xs;
	}

	.field-renderer.compact .field-value {
		@apply text-sm;
	}
</style>
