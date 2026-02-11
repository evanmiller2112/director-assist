<script lang="ts">
/**
 * SceneNoteCapture Component
 *
 * Allows DM to record "what happened" during a scene with auto-save functionality (debounced to 1000ms).
 */

interface Props {
	sceneId: string;
	initialNotes: string;
	onSave: (sceneId: string, notes: string) => void;
}

let { sceneId, initialNotes, onSave }: Props = $props();

let notes = $state(initialNotes);
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = $state(false);
let lastSaved = $state<Date | null>(null);

// Debounced save with 1000ms delay
// Use $effect to watch notes changes and trigger save
$effect(() => {
	// Skip if notes haven't changed from initial or are empty
	if (notes === initialNotes || notes === '') {
		return;
	}

	// Clear existing timer
	if (saveTimer) {
		clearTimeout(saveTimer);
	}

	// Set new timer
	saveTimer = setTimeout(() => {
		saveNotes();
	}, 1000);

	// Cleanup function
	return () => {
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
	};
});

async function saveNotes() {
	if (!notes || notes === initialNotes) {
		return;
	}

	isSaving = true;
	try {
		await onSave(sceneId, notes);
		lastSaved = new Date();
	} finally {
		isSaving = false;
	}
}
</script>

<div class="scene-note-capture">
	<label for="scene-notes-{sceneId}" class="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
		What Happened
	</label>

	<textarea
		id="scene-notes-{sceneId}"
		class="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
		bind:value={notes}
		placeholder="Record what happened during this scene..."
		data-testid="scene-notes-textarea"
	></textarea>

	{#if isSaving}
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="save-indicator">
			Saving...
		</p>
	{:else if lastSaved}
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="save-indicator">
			Saved at {lastSaved.toLocaleTimeString()}
		</p>
	{/if}
</div>
