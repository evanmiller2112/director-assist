<script lang="ts">
	import { Plus, Home, GripVertical, Pencil } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { getAllEntityTypes, getOrderedEntityTypes } from '$lib/config/entityTypes';
	import { entitiesStore, campaignStore } from '$lib/stores';
	import { getIconComponent } from '$lib/utils/icons';
	import QuickAddModal from './QuickAddModal.svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import {
		getSidebarEntityTypeOrder,
		setSidebarEntityTypeOrder,
		resetSidebarEntityTypeOrder
	} from '$lib/services/sidebarOrderService';
	import type { EntityTypeDefinition } from '$lib/types';
	import { onMount } from 'svelte';

	let quickAddOpen = $state(false);
	let editMode = $state(false);
	let orderedTypes = $state<EntityTypeDefinition[]>([]);
	const flipDurationMs = 200;

	// Transform orderedTypes to include id property for dndzone
	let orderedTypesWithId = $derived(orderedTypes.map(t => ({ ...t, id: t.type })));

	// Initialize ordered types on mount
	onMount(() => {
		const savedOrder = getSidebarEntityTypeOrder();
		orderedTypes = getOrderedEntityTypes(
			campaignStore.customEntityTypes,
			campaignStore.entityTypeOverrides,
			savedOrder
		);
	});

	// Update ordered types when campaign store changes
	$effect(() => {
		if (!editMode) {
			const savedOrder = getSidebarEntityTypeOrder();
			orderedTypes = getOrderedEntityTypes(
				campaignStore.customEntityTypes,
				campaignStore.entityTypeOverrides,
				savedOrder
			);
		}
	});

	function getEntityCount(type: string): number {
		const byType = entitiesStore.entitiesByType;
		return byType[type]?.length ?? 0;
	}

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	function handleDndConsider(e: CustomEvent<DndEvent<EntityTypeDefinition & { id: string }>>) {
		// Extract items and map back to original structure without id
		orderedTypes = e.detail.items.map(({ id, ...rest }) => rest);
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<EntityTypeDefinition & { id: string }>>) {
		// Extract items and map back to original structure without id
		orderedTypes = e.detail.items.map(({ id, ...rest }) => rest);
		// Save the new order
		const newOrder = orderedTypes.map((t) => t.type);
		setSidebarEntityTypeOrder(newOrder);
	}

	function toggleEditMode() {
		editMode = !editMode;
	}

	function resetToDefault() {
		resetSidebarEntityTypeOrder();
		orderedTypes = getOrderedEntityTypes(
			campaignStore.customEntityTypes,
			campaignStore.entityTypeOverrides,
			null
		);
		editMode = false;
	}

	function doneEditing() {
		editMode = false;
	}
</script>

<aside class="dashboard-sidebar flex flex-col bg-surface-secondary dark:bg-surface-dark-secondary">
	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-4">
		<!-- Home -->
		<a
			href="/"
			class="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors
				{isActive('/') && $page.url.pathname === '/'
				? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
				: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
		>
			<Home class="w-5 h-5" />
			<span class="font-medium">Dashboard</span>
		</a>

		<div class="border-t border-slate-200 dark:border-slate-700 my-4"></div>

		<div class="flex items-center justify-between mb-2 px-3">
			<h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
				Entities
			</h2>
			<button
				onclick={toggleEditMode}
				class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
				aria-label={editMode ? 'Exit edit mode' : 'Reorder entity types'}
				title={editMode ? 'Exit edit mode' : 'Reorder entity types'}
			>
				<Pencil class="w-4 h-4 text-slate-500 dark:text-slate-400" />
			</button>
		</div>

		<!-- Edit mode controls -->
		{#if editMode}
			<div class="flex gap-2 mb-3 px-3">
				<button
					onclick={doneEditing}
					class="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Done
				</button>
				<button
					onclick={resetToDefault}
					class="flex-1 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
				>
					Reset
				</button>
			</div>
		{/if}

		<!-- Entity type links -->
		{#if editMode}
			<section
				use:dndzone={{ items: orderedTypesWithId, flipDurationMs, type: 'entityTypes' }}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
			>
				{#each orderedTypesWithId as entityType (entityType.id)}
					{@const Icon = getIconComponent(entityType.icon)}
					{@const count = getEntityCount(entityType.type)}
					<div
						class="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-move"
					>
						<div class="drag-handle" aria-label="Drag to reorder">
							<GripVertical class="w-5 h-5 text-slate-400" />
						</div>
						<Icon class="w-5 h-5" style="color: var(--color-{entityType.color}, currentColor)" />
						<span class="flex-1">{entityType.labelPlural}</span>
						{#if count > 0}
							<span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
								{count}
							</span>
						{/if}
					</div>
				{/each}
			</section>
		{:else}
			{#each orderedTypes as entityType}
				{@const Icon = getIconComponent(entityType.icon)}
				{@const count = getEntityCount(entityType.type)}
				{@const href = `/entities/${entityType.type}`}
				<a
					{href}
					class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors
						{isActive(href)
						? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
						: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
				>
					<Icon class="w-5 h-5" style="color: var(--color-{entityType.color}, currentColor)" />
					<span class="flex-1">{entityType.labelPlural}</span>
					{#if count > 0}
						<span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
							{count}
						</span>
					{/if}
				</a>
			{/each}
		{/if}
	</nav>

	<!-- Quick Add Button -->
	<div class="p-4 border-t border-slate-200 dark:border-slate-700">
		<button
			class="btn btn-primary w-full"
			onclick={() => {
				quickAddOpen = true;
			}}
		>
			<Plus class="w-4 h-4" />
			Add Entity
		</button>
	</div>
</aside>

<QuickAddModal bind:open={quickAddOpen} />
