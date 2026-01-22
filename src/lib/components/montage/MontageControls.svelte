<script lang="ts">
	import type { MontageSession, RecordChallengeResultInput, PredefinedChallenge } from '$lib/types/montage';
	import { CheckCircle, XCircle, SkipForward, X } from 'lucide-svelte';

	interface Props {
		montage: MontageSession;
		onRecordChallenge: (input: RecordChallengeResultInput) => Promise<void>;
		selectedPredefinedChallenge?: PredefinedChallenge | null;
		onClearSelection?: () => void;
		disabled?: boolean;
	}

	let { montage, onRecordChallenge, selectedPredefinedChallenge, onClearSelection, disabled = false }: Props = $props();

	let description = $state('');
	let playerName = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);

	// Auto-fill description when a predefined challenge is selected
	$effect(() => {
		if (selectedPredefinedChallenge) {
			description = selectedPredefinedChallenge.name;
		}
	});

	async function recordResult(result: 'success' | 'failure' | 'skip') {
		if (isSubmitting || disabled) return;

		isSubmitting = true;
		try {
			await onRecordChallenge({
				result,
				description: description.trim() || undefined,
				playerName: playerName.trim() || undefined,
				notes: notes.trim() || undefined,
				...(selectedPredefinedChallenge && { predefinedChallengeId: selectedPredefinedChallenge.id })
			});

			// Clear form
			description = '';
			playerName = '';
			notes = '';

			// Clear selection after recording
			if (onClearSelection) {
				onClearSelection();
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-4" role="form" aria-label="Record challenge result">
	<!-- Selected Challenge Banner -->
	{#if selectedPredefinedChallenge}
		<div
			class="flex items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
		>
			<div class="flex-1 min-w-0">
				<div class="text-xs font-medium text-blue-800 dark:text-blue-200 mb-0.5">
					Selected Challenge:
				</div>
				<div class="font-medium text-sm text-blue-900 dark:text-blue-100">
					{selectedPredefinedChallenge.name}
				</div>
				{#if selectedPredefinedChallenge.suggestedSkills && selectedPredefinedChallenge.suggestedSkills.length > 0}
					<div class="flex flex-wrap gap-1 mt-1">
						<span class="text-xs text-blue-700 dark:text-blue-300">Suggested:</span>
						{#each selectedPredefinedChallenge.suggestedSkills as skill}
							<span
								class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
							>
								{skill}
							</span>
						{/each}
					</div>
				{/if}
			</div>
			{#if onClearSelection}
				<button
					type="button"
					onclick={onClearSelection}
					disabled={disabled || isSubmitting}
					aria-label="Clear selected challenge"
					class="flex-shrink-0 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<X class="h-4 w-4 text-blue-700 dark:text-blue-300" />
				</button>
			{/if}
		</div>
	{/if}
	<!-- Input Fields -->
	<div class="space-y-3">
		<div>
			<label for="description" class="block text-sm font-medium mb-1">
				Challenge Description
			</label>
			<input
				id="description"
				type="text"
				bind:value={description}
				placeholder="What is the challenge?"
				class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				disabled={disabled || isSubmitting}
			/>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="playerName" class="block text-sm font-medium mb-1"> Player Name </label>
				<input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Optional"
					class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={disabled || isSubmitting}
				/>
			</div>

			<div>
				<label for="notes" class="block text-sm font-medium mb-1"> Notes </label>
				<input
					id="notes"
					type="text"
					bind:value={notes}
					placeholder="Optional"
					class="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={disabled || isSubmitting}
				/>
			</div>
		</div>
	</div>

	<!-- Result Buttons -->
	<div class="flex gap-3">
		<button
			type="button"
			onclick={() => recordResult('success')}
			disabled={disabled || isSubmitting}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<CheckCircle class="h-5 w-5" />
			Success
		</button>

		<button
			type="button"
			onclick={() => recordResult('failure')}
			disabled={disabled || isSubmitting}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<XCircle class="h-5 w-5" />
			Failure
		</button>

		<button
			type="button"
			onclick={() => recordResult('skip')}
			disabled={disabled || isSubmitting}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<SkipForward class="h-5 w-5" />
			Skip
		</button>
	</div>
</div>
