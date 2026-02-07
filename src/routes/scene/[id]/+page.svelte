<script lang="ts">
/**
 * Scene Runner Page (/scene/[id])
 *
 * Main interface for running scenes with:
 * - Scene header with status and controls
 * - Setting display (read-aloud box)
 * - Context panel (location and NPCs)
 * - Notes capture with auto-save
 * - Start and Complete actions
 */

import { onMount } from 'svelte';
import { page } from '$app/stores';
import { entityRepository } from '$lib/db/entityRepository';
import { startScene, completeScene } from '$lib/services/sceneStatusService';
import SceneHeader from '$lib/components/scene/SceneHeader.svelte';
import SceneSettingDisplay from '$lib/components/scene/SceneSettingDisplay.svelte';
import SceneContextPanel from '$lib/components/scene/SceneContextPanel.svelte';
import SceneNoteCapture from '$lib/components/scene/SceneNoteCapture.svelte';
import SceneCompletionModal from '$lib/components/scene/SceneCompletionModal.svelte';
import type { BaseEntity } from '$lib/types';

let scene = $state<BaseEntity | null>(null);
let loading = $state(true);
let completionModalOpen = $state(false);
let sceneId = $derived($page.params.id);

async function loadScene() {
	loading = true;
	try {
		if (!sceneId) {
			scene = null;
			return;
		}
		const entity = await entityRepository.getById(sceneId);
		scene = entity || null;
	} finally {
		loading = false;
	}
}

async function handleStart() {
	if (!scene) return;

	try {
		await startScene(scene.id);
		// Reload scene to get updated status
		await loadScene();
	} catch (error) {
		console.error('Failed to start scene:', error);
	}
}

async function handleCompleteClick() {
	completionModalOpen = true;
}

async function handleCompleteConfirm(notes: string) {
	if (!scene) return;

	try {
		await completeScene(scene.id, notes);
		completionModalOpen = false;
		// Reload scene to get updated status
		await loadScene();
	} catch (error) {
		console.error('Failed to complete scene:', error);
	}
}

function handleCompleteCancel() {
	completionModalOpen = false;
}

async function handleNotesSave(sceneId: string, notes: string) {
	try {
		await entityRepository.update(sceneId, {
			fields: {
				...scene?.fields,
				whatHappened: notes
			}
		});
	} catch (error) {
		console.error('Failed to save notes:', error);
	}
}

onMount(() => {
	loadScene();
});
</script>

<div class="scene-runner-page container mx-auto p-6">
	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading scene...</p>
	{:else if !scene}
		<p class="text-red-500">Scene not found</p>
	{:else}
		<SceneHeader
			sceneId={scene.id}
			sceneName={scene.name}
			status={(scene.fields.status as 'planned' | 'active' | 'completed') ?? 'planned'}
			onStart={handleStart}
			onComplete={handleCompleteClick}
		/>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<!-- Setting Display -->
				<SceneSettingDisplay setting={scene.fields.setting as string | undefined} />

				<!-- Notes Capture -->
				<SceneNoteCapture
					sceneId={scene.id}
					initialNotes={(scene.fields.whatHappened as string) ?? ''}
					onSave={handleNotesSave}
				/>
			</div>

			<div class="lg:col-span-1">
				<!-- Context Panel -->
				<SceneContextPanel
					locationRef={scene.fields.locationRef as string | undefined}
					npcRefs={(scene.fields.npcRefs as string[]) ?? []}
				/>
			</div>
		</div>

		<!-- Completion Modal -->
		<SceneCompletionModal
			isOpen={completionModalOpen}
			sceneName={scene.name}
			currentNotes={(scene.fields.whatHappened as string) ?? ''}
			onConfirm={handleCompleteConfirm}
			onCancel={handleCompleteCancel}
		/>
	{/if}
</div>
