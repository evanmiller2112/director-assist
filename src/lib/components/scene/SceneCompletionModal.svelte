<script lang="ts">
/**
 * SceneCompletionModal Component
 *
 * Modal for confirming scene completion with optional final notes.
 */

interface Props {
	isOpen: boolean;
	sceneName: string;
	currentNotes: string;
	onConfirm: (notes: string) => void;
	onCancel: () => void;
}

let { isOpen, sceneName, currentNotes, onConfirm, onCancel }: Props = $props();

let notes = $state(currentNotes);

// Sync notes with prop changes
$effect(() => {
	notes = currentNotes;
});

function handleConfirm() {
	onConfirm(notes);
}

function handleCancel() {
	onCancel();
}

function handleBackdropClick(event: MouseEvent) {
	if (event.target === event.currentTarget) {
		handleCancel();
	}
}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="completion-modal-title"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="completion-modal-title" class="text-xl font-semibold mb-4">
				Complete "{sceneName}"
			</h2>

			<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				Mark this scene as completed? You can add or edit notes before confirming.
			</p>

			<div class="mb-6">
				<label for="completion-notes" class="block text-sm font-medium mb-2">
					Final Notes (Optional)
				</label>
				<textarea
					id="completion-notes"
					class="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					bind:value={notes}
					placeholder="Add final notes about what happened..."
				></textarea>
			</div>

			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button
					type="button"
					class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
					onclick={handleConfirm}
				>
					Complete Scene
				</button>
			</div>
		</div>
	</div>
{/if}
