<script lang="ts">
/**
 * SceneContextPanel Component
 *
 * Displays context information for the scene:
 * - Location reference (clickable)
 * - NPC references (clickable list)
 */

import { entityRepository } from '$lib/db/entityRepository';
import type { BaseEntity } from '$lib/types';

interface Props {
	locationRef?: string;
	npcRefs?: string[];
	onEntityClick?: (entityId: string, entityType: string) => void;
}

let { locationRef, npcRefs = [], onEntityClick }: Props = $props();

let location = $state<BaseEntity | null>(null);
let npcs = $state<BaseEntity[]>([]);
let locationLoading = $state(false);
let npcsLoading = $state(false);

// Load location entity
async function loadLocation() {
	if (!locationRef) {
		location = null;
		return;
	}

	locationLoading = true;
	try {
		const entity = await entityRepository.getById(locationRef);
		location = entity || null;
	} finally {
		locationLoading = false;
	}
}

// Load NPC entities
async function loadNpcs() {
	if (!npcRefs || npcRefs.length === 0) {
		npcs = [];
		return;
	}

	npcsLoading = true;
	try {
		const loadedNpcs: BaseEntity[] = [];
		for (const npcId of npcRefs) {
			const entity = await entityRepository.getById(npcId);
			if (entity) {
				loadedNpcs.push(entity);
			}
		}
		npcs = loadedNpcs;
	} finally {
		npcsLoading = false;
	}
}

// React to prop changes
$effect(() => {
	loadLocation();
});

$effect(() => {
	loadNpcs();
});

function handleEntityClick(entityId: string, entityType: string) {
	onEntityClick?.(entityId, entityType);
}

const hasContext = $derived(!!locationRef || (npcRefs && npcRefs.length > 0));
</script>

<div class="scene-context-panel border border-gray-300 dark:border-gray-600 rounded-lg p-4">
	<h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Scene Context</h3>

	{#if !hasContext}
		<p class="text-gray-500 dark:text-gray-400 text-sm">No context information defined</p>
	{:else}
		<!-- Location Section -->
		{#if locationRef}
			<div class="mb-4">
				<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>

				{#if locationLoading}
					<p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
				{:else if location}
					<button
						class="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
						onclick={() => handleEntityClick(location!.id, location!.type)}
						type="button"
					>
						{location.name}
					</button>
				{:else}
					<p class="ml-2 text-sm text-red-500">Location not found</p>
				{/if}
			</div>
		{/if}

		<!-- NPCs Section -->
		{#if npcRefs && npcRefs.length > 0}
			<div>
				<span class="text-sm font-medium text-gray-600 dark:text-gray-400">NPCs:</span>

				{#if npcsLoading}
					<p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
				{:else if npcs.length > 0}
					<ul class="list-disc list-inside ml-2 mt-1">
						{#each npcs as npc}
							<li>
								<button
									class="text-blue-600 dark:text-blue-400 hover:underline"
									onclick={() => handleEntityClick(npc.id, npc.type)}
									type="button"
								>
									{npc.name}
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="ml-2 text-sm text-gray-500">No NPCs found</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
