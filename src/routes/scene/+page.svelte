<script lang="ts">
/**
 * Scene List Page (/scene)
 *
 * Displays all scenes from current campaign with:
 * - Status filter (all, planned, active, completed)
 * - Run Scene button for each scene
 * - New Scene button
 */

import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { db } from '$lib/db';
import { campaignStore } from '$lib/stores';
import SceneStatusBadge from '$lib/components/scene/SceneStatusBadge.svelte';
import { Play, Plus } from 'lucide-svelte';
import type { BaseEntity } from '$lib/types';

let scenes = $state<BaseEntity[]>([]);
let filteredScenes = $state<BaseEntity[]>([]);
let statusFilter = $state<'all' | 'planned' | 'active' | 'completed'>('all');
let loading = $state(true);

async function loadScenes() {
	loading = true;
	try {
		const allEntities = await db.entities.toArray();
		const currentCampaignId = campaignStore.campaign?.id;

		const sceneEntities = allEntities.filter(
			(entity) =>
				entity.type === 'scene' &&
				(entity.metadata as { campaignId?: string })?.campaignId === currentCampaignId
		);

		scenes = sceneEntities;
		applyFilter();
	} finally {
		loading = false;
	}
}

function applyFilter() {
	if (statusFilter === 'all') {
		filteredScenes = scenes;
	} else {
		filteredScenes = scenes.filter((scene) => {
			const status = (scene.fields.status as string | undefined) ?? 'planned';
			return status === statusFilter;
		});
	}
}

function handleStatusFilterChange(newFilter: typeof statusFilter) {
	statusFilter = newFilter;
	applyFilter();
}

function handleRunScene(sceneId: string) {
	goto(`/scene/${sceneId}`);
}

function handleNewScene() {
	goto('/entity/new?type=scene');
}

onMount(() => {
	loadScenes();
});

// Re-apply filter when scenes change
$effect(() => {
	scenes;
	applyFilter();
});
</script>

<div class="scene-list-page container mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-3xl font-bold">Scenes</h1>
		<button
			type="button"
			class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
			onclick={handleNewScene}
		>
			<Plus size={20} />
			New Scene
		</button>
	</div>

	<!-- Status Filter -->
	<div class="mb-6 flex gap-2">
		<button
			type="button"
			class="px-3 py-1 rounded-md {statusFilter === 'all'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
			onclick={() => handleStatusFilterChange('all')}
		>
			All
		</button>
		<button
			type="button"
			class="px-3 py-1 rounded-md {statusFilter === 'planned'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
			onclick={() => handleStatusFilterChange('planned')}
		>
			Planned
		</button>
		<button
			type="button"
			class="px-3 py-1 rounded-md {statusFilter === 'active'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
			onclick={() => handleStatusFilterChange('active')}
		>
			Active
		</button>
		<button
			type="button"
			class="px-3 py-1 rounded-md {statusFilter === 'completed'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
			onclick={() => handleStatusFilterChange('completed')}
		>
			Completed
		</button>
	</div>

	<!-- Scenes List -->
	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading scenes...</p>
	{:else if filteredScenes.length === 0}
		<p class="text-gray-500 dark:text-gray-400">
			No scenes found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
		</p>
	{:else}
		<div class="grid gap-4">
			{#each filteredScenes as scene (scene.id)}
				<div
					class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h2 class="text-lg font-semibold">{scene.name}</h2>
							<SceneStatusBadge status={(scene.fields.status as 'planned' | 'active' | 'completed') ?? 'planned'} />
						</div>
						{#if scene.description}
							<p class="text-sm text-gray-600 dark:text-gray-400">{scene.description}</p>
						{/if}
					</div>

					<button
						type="button"
						class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md ml-4"
						onclick={() => handleRunScene(scene.id)}
					>
						<Play size={16} />
						Run Scene
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
