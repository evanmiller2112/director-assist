<script lang="ts">
	import { X, EyeOff } from 'lucide-svelte';
	import type { BaseEntity, EntityLink } from '$lib/types';

	interface Props {
		sourceEntity: BaseEntity;
		targetEntity: BaseEntity;
		link: EntityLink;
		open?: boolean;
		onClose: () => void;
		onSave: (changes: {
			relationship: string;
			notes?: string;
			strength?: 'strong' | 'moderate' | 'weak';
			metadata?: { tags?: string[]; tension?: number };
			bidirectional?: boolean;
			playerVisible?: boolean;
		}) => Promise<void>;
	}

	let { sourceEntity, targetEntity, link, open = $bindable(false), onClose, onSave }: Props = $props();

	// Form state
	let relationship = $state(link.relationship);
	let strength = $state<'' | 'strong' | 'moderate' | 'weak'>(link.strength ?? '');
	let notes = $state(link.notes ?? '');
	let tension = $state(link.metadata?.tension ?? 0);
	let tags = $state<string[]>(link.metadata?.tags ?? []);
	let tagInput = $state('');
	let bidirectional = $state(link.bidirectional);
	let playerVisible = $state<boolean | undefined>(link.playerVisible);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let validationError = $state('');

	// Reset form when link changes
	$effect(() => {
		relationship = link.relationship;
		strength = link.strength ?? '';
		notes = link.notes ?? '';
		tension = link.metadata?.tension ?? 0;
		tags = link.metadata?.tags ?? [];
		tagInput = '';
		bidirectional = link.bidirectional;
		playerVisible = link.playerVisible;
		errorMessage = '';
		validationError = '';
	});

	function handleClose() {
		// Reset form to original values
		relationship = link.relationship;
		strength = link.strength ?? '';
		notes = link.notes ?? '';
		tension = link.metadata?.tension ?? 0;
		tags = link.metadata?.tags ?? [];
		tagInput = '';
		bidirectional = link.bidirectional;
		playerVisible = link.playerVisible;
		errorMessage = '';
		validationError = '';
		open = false;
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	function handleAddTag(e: KeyboardEvent) {
		if (e.key === 'Enter' && tagInput.trim()) {
			e.preventDefault();
			if (!tags.includes(tagInput.trim())) {
				tags = [...tags, tagInput.trim()];
			}
			tagInput = '';
		}
	}

	function handleRemoveTag(tagToRemove: string) {
		tags = tags.filter(t => t !== tagToRemove);
	}

	async function handleSubmit() {
		// Validation
		if (!relationship.trim()) {
			validationError = 'Relationship type is required';
			return;
		}

		// Clamp tension value
		const clampedTension = Math.max(0, Math.min(100, tension));

		isSubmitting = true;
		errorMessage = '';
		validationError = '';

		try {
			const changes: {
				relationship: string;
				notes?: string;
				strength?: 'strong' | 'moderate' | 'weak';
				metadata?: { tags?: string[]; tension?: number };
				bidirectional?: boolean;
				playerVisible?: boolean;
			} = {
				relationship: relationship.trim(),
			};

			// Add notes (can be empty string)
			changes.notes = notes.trim();

			// Add strength if not empty
			if (strength && strength !== '') {
				changes.strength = strength as 'strong' | 'moderate' | 'weak';
			}

			// Build metadata
			const metadata: { tags?: string[]; tension?: number } = {};
			if (tags.length > 0) {
				metadata.tags = tags;
			}
			if (clampedTension !== 0) {
				metadata.tension = clampedTension;
			}

			if (Object.keys(metadata).length > 0) {
				changes.metadata = metadata;
			}

			// Add bidirectional status
			changes.bidirectional = bidirectional;

			// Add playerVisible
			changes.playerVisible = playerVisible;

			await onSave(changes);
			handleClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update relationship';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.stopPropagation();
			}
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-relationship-title"
		tabindex="-1"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.stopPropagation();
				}
			}}
			role="button"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 id="edit-relationship-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Edit Relationship
				</h2>
				<button
					onclick={handleClose}
					class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					aria-label="Close"
					type="button"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-4">
				<!-- Entity names -->
				<div class="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
					<div class="text-sm text-slate-600 dark:text-slate-400">
						<span class="font-medium text-slate-900 dark:text-white">{sourceEntity.name}</span>
						<span class="mx-2">→</span>
						<span class="font-medium text-slate-900 dark:text-white">{targetEntity.name}</span>
					</div>
				</div>

				<!-- Relationship type -->
				<div>
					<label for="relationship-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
						Relationship Type
					</label>
					<input
						id="relationship-type"
						type="text"
						bind:value={relationship}
						placeholder="e.g., friend_of, knows, member_of"
						class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- Strength -->
				<div>
					<label for="strength" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
						Strength
					</label>
					<select
						id="strength"
						bind:value={strength}
						onchange={(e) => { strength = (e.currentTarget as HTMLSelectElement).value as '' | 'strong' | 'moderate' | 'weak'; }}
						class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="">None</option>
						<option value="strong">strong</option>
						<option value="moderate">moderate</option>
						<option value="weak">weak</option>
					</select>
				</div>

				<!-- Notes -->
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

				<!-- Tags -->
				<div>
					<label for="tag-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
						Tags
					</label>
					<input
						id="tag-input"
						type="text"
						bind:value={tagInput}
						onkeydown={handleAddTag}
						placeholder="Add a tag (press Enter)"
						class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					{#if tags.length > 0}
						<div class="flex flex-wrap gap-2 mt-2">
							{#each tags as tag}
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
									{tag}
									<button
										onclick={() => handleRemoveTag(tag)}
										class="hover:text-blue-900 dark:hover:text-blue-100"
										aria-label="Remove tag {tag}"
										type="button"
									>
										<X class="w-3 h-3" />
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Tension -->
				<div>
					<label for="tension" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
						Tension
					</label>
					<input
						id="tension"
						type="number"
						min="0"
						max="100"
						bind:value={tension}
						class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- Bidirectional -->
				<div>
					<label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
						<input
							id="bidirectional"
							type="checkbox"
							bind:checked={bidirectional}
							class="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
						/>
						<span>Bidirectional</span>
					</label>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
						Creates a reverse relationship on the target entity
					</p>
				</div>

				<!-- Player Visibility -->
				<div>
					<label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
						<input
							id="player-visible"
							type="checkbox"
							checked={playerVisible === false}
							onchange={(e) => {
								playerVisible = e.currentTarget.checked ? false : undefined;
							}}
							class="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
						/>
						<EyeOff class="w-4 h-4 text-amber-500" />
						<span>Hide from players (DM only)</span>
					</label>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
						When checked, this relationship will be hidden from players
					</p>
				</div>

				<!-- Validation Error -->
				{#if validationError}
					<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
						{validationError}
					</div>
				{/if}

				<!-- Error Message -->
				{#if errorMessage}
					<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
						{errorMessage}
					</div>
				{/if}

				<!-- Buttons -->
				<div class="flex gap-2 justify-end pt-2">
					<button
						onclick={handleClose}
						class="btn btn-ghost"
						disabled={isSubmitting}
						type="button"
					>
						Cancel
					</button>
					<button
						onclick={handleSubmit}
						class="btn btn-primary"
						disabled={isSubmitting}
						type="button"
					>
						{#if isSubmitting}
							Saving...
						{:else}
							Save
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
