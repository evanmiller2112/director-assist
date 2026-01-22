<script lang="ts">
	import type { PredefinedChallenge } from '$lib/types/montage';
	import { X, Plus, Save } from 'lucide-svelte';

	interface Props {
		challenges: Omit<PredefinedChallenge, 'id'>[];
		onUpdate: (challenges: Omit<PredefinedChallenge, 'id'>[]) => void;
		disabled?: boolean;
	}

	let { challenges, onUpdate, disabled = false }: Props = $props();

	let isAdding = $state(false);
	let newName = $state('');
	let newDescription = $state('');
	let newSkills = $state('');

	function handleAddClick() {
		isAdding = true;
	}

	function handleCancel() {
		isAdding = false;
		newName = '';
		newDescription = '';
		newSkills = '';
	}

	function handleSave() {
		const trimmedName = newName.trim();
		if (!trimmedName) {
			return; // Name is required
		}

		const newChallenge: Omit<PredefinedChallenge, 'id'> = {
			name: trimmedName,
			...(newDescription.trim() && { description: newDescription.trim() }),
			...(newSkills.trim() && {
				suggestedSkills: newSkills
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			})
		};

		// Convert existing challenges to plain objects to avoid $state proxy issues with IndexedDB
		const plainChallenges = challenges.map(c => ({ ...c }));
		onUpdate([...plainChallenges, newChallenge]);

		// Reset form
		isAdding = false;
		newName = '';
		newDescription = '';
		newSkills = '';
	}

	function handleRemove(index: number) {
		// Convert to plain objects to avoid $state proxy issues with IndexedDB
		const updated = challenges.filter((_, i) => i !== index).map(c => ({ ...c }));
		onUpdate(updated);
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">
			Predefined Challenges
		</h3>
		<span class="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
	</div>

	<!-- Challenge List -->
	{#if challenges.length > 0}
		<div class="space-y-2">
			{#each challenges as challenge, index (index)}
				<div
					class="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700"
				>
					<div class="flex-1 min-w-0">
						<div class="font-medium text-sm text-slate-900 dark:text-white">
							{challenge.name}
						</div>
						{#if challenge.description}
							<div class="text-xs text-slate-600 dark:text-slate-400 mt-1">
								{challenge.description}
							</div>
						{/if}
						{#if challenge.suggestedSkills && challenge.suggestedSkills.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each challenge.suggestedSkills as skill}
									<span
										class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
									>
										{skill}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					<button
						type="button"
						onclick={() => handleRemove(index)}
						{disabled}
						aria-label="Remove {challenge.name}"
						class="flex-shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<X class="h-4 w-4 text-slate-600 dark:text-slate-400" />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add Form -->
	{#if isAdding}
		<div
			class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 space-y-3"
		>
			<div>
				<label for="challenge-name" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
					Name *
				</label>
				<input
					id="challenge-name"
					type="text"
					bind:value={newName}
					placeholder="Challenge name"
					required
					class="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="challenge-description" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
					Description
				</label>
				<textarea
					id="challenge-description"
					bind:value={newDescription}
					placeholder="Optional description..."
					rows="2"
					class="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
				></textarea>
			</div>

			<div>
				<label for="challenge-skills" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
					Suggested Skills
				</label>
				<input
					id="challenge-skills"
					type="text"
					bind:value={newSkills}
					placeholder="Suggested skills (comma-separated)"
					class="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={handleSave}
					class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
				>
					<Save class="h-3.5 w-3.5" />
					Save
				</button>
				<button
					type="button"
					onclick={handleCancel}
					class="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm rounded transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Add Button -->
	{#if !isAdding}
		<button
			type="button"
			onclick={handleAddClick}
			{disabled}
			class="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<Plus class="h-4 w-4" />
			Add Challenge
		</button>
	{/if}
</div>
