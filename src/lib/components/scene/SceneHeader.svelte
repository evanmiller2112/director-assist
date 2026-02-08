<script lang="ts">
/**
 * SceneHeader Component
 *
 * Displays scene information and control buttons:
 * - Scene name
 * - Status badge
 * - Edit, Back, Start, and Complete buttons
 */

import { goto } from '$app/navigation';
import SceneStatusBadge from './SceneStatusBadge.svelte';
import { ArrowLeft, Edit, Play, CheckCircle } from 'lucide-svelte';

interface Props {
	sceneId: string;
	sceneName: string;
	status: 'planned' | 'in_progress' | 'completed';
	onStart?: () => void;
	onComplete?: () => void;
}

let { sceneId, sceneName, status, onStart, onComplete }: Props = $props();

function handleBack() {
	goto('/scene');
}

function handleEdit() {
	goto(`/entity/${sceneId}`);
}

function handleStart() {
	onStart?.();
}

function handleComplete() {
	onComplete?.();
}
</script>

<header class="scene-header border-b border-gray-300 dark:border-gray-600 pb-4 mb-6">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
				onclick={handleBack}
				aria-label="Back to scene list"
			>
				<ArrowLeft size={20} />
			</button>

			<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{sceneName}</h1>

			<SceneStatusBadge {status} />
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
				onclick={handleEdit}
			>
				<Edit size={16} />
				Edit
			</button>

			{#if status === 'planned' && onStart}
				<button
					type="button"
					class="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
					onclick={handleStart}
				>
					<Play size={16} />
					Start Scene
				</button>
			{/if}

			{#if status === 'in_progress' && onComplete}
				<button
					type="button"
					class="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
					onclick={handleComplete}
				>
					<CheckCircle size={16} />
					Complete Scene
				</button>
			{/if}
		</div>
	</div>
</header>
