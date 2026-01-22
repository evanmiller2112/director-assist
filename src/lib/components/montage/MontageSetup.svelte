<script lang="ts">
	import type { CreateMontageInput, MontageDifficulty, PredefinedChallenge } from '$lib/types/montage';
	import PredefinedChallengeInput from './PredefinedChallengeInput.svelte';

	interface Props {
		onSubmit: (input: CreateMontageInput) => Promise<void>;
		onCancel?: () => void;
	}

	let { onSubmit, onCancel }: Props = $props();

	let name = $state('');
	let description = $state('');
	let difficulty = $state<MontageDifficulty>('moderate');
	let playerCount = $state(4);
	let predefinedChallenges = $state<Omit<PredefinedChallenge, 'id'>[]>([]);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function handlePredefinedChallengesUpdate(challenges: Omit<PredefinedChallenge, 'id'>[]) {
		predefinedChallenges = challenges;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;

		// Validation
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}

		if (playerCount < 1 || playerCount > 12) {
			error = 'Player count must be between 1 and 12';
			return;
		}

		error = null;
		isSubmitting = true;

		try {
			// Convert $state proxy to plain objects for IndexedDB
			const plainChallenges = predefinedChallenges.length > 0
				? predefinedChallenges.map(c => ({ ...c }))
				: undefined;

			await onSubmit({
				name: name.trim(),
				description: description.trim() || undefined,
				difficulty,
				playerCount,
				...(plainChallenges && { predefinedChallenges: plainChallenges })
			});
		} catch (err: any) {
			error = err.message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	{#if error}
		<div
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md"
			role="alert"
		>
			{error}
		</div>
	{/if}

	<div>
		<label for="name" class="block text-sm font-medium mb-1"> Montage Name * </label>
		<input
			id="name"
			type="text"
			bind:value={name}
			placeholder="e.g., Heist Preparation"
			required
			class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			disabled={isSubmitting}
		/>
	</div>

	<div>
		<label for="description" class="block text-sm font-medium mb-1"> Description </label>
		<textarea
			id="description"
			bind:value={description}
			placeholder="Optional description of the montage..."
			rows="3"
			class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
			disabled={isSubmitting}
		></textarea>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="difficulty" class="block text-sm font-medium mb-1"> Difficulty * </label>
			<select
				id="difficulty"
				bind:value={difficulty}
				required
				class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				disabled={isSubmitting}
			>
				<option value="easy">Easy</option>
				<option value="moderate">Moderate</option>
				<option value="hard">Hard</option>
			</select>
		</div>

		<div>
			<label for="playerCount" class="block text-sm font-medium mb-1"> Player Count * </label>
			<input
				id="playerCount"
				type="number"
				bind:value={playerCount}
				min="1"
				max="12"
				required
				class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				disabled={isSubmitting}
			/>
		</div>
	</div>

	<!-- Predefined Challenges -->
	<div>
		<PredefinedChallengeInput
			challenges={predefinedChallenges}
			onUpdate={handlePredefinedChallengesUpdate}
			disabled={isSubmitting}
		/>
	</div>

	<!-- Difficulty Info -->
	<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
		<h4 class="font-semibold mb-1">Draw Steel Montage Rules</h4>
		<ul class="text-xs space-y-1 opacity-90">
			{#if difficulty === 'easy'}
				<li>Success Limit: {playerCount}</li>
				<li>Failure Limit: {playerCount}</li>
				<li>Victory Points: 1 (Total Success), 0 (Partial Success)</li>
			{:else if difficulty === 'moderate'}
				<li>Success Limit: {playerCount + 1}</li>
				<li>Failure Limit: {Math.max(2, playerCount - 1)}</li>
				<li>Victory Points: 1 (Total Success), 0 (Partial Success)</li>
			{:else}
				<li>Success Limit: {playerCount + 2}</li>
				<li>Failure Limit: {Math.max(2, playerCount - 2)}</li>
				<li>Victory Points: 2 (Total Success), 1 (Partial Success)</li>
			{/if}
		</ul>
	</div>

	<div class="flex gap-3 pt-2">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="flex-1 px-4 py-2 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Cancel
			</button>
		{/if}
		<button
			type="submit"
			disabled={isSubmitting}
			class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{isSubmitting ? 'Creating...' : 'Create Montage'}
		</button>
	</div>
</form>
