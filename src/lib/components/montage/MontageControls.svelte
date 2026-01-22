<script lang="ts">
	import type { MontageSession, RecordChallengeResultInput } from '$lib/types/montage';
	import { CheckCircle, XCircle, SkipForward } from 'lucide-svelte';

	interface Props {
		montage: MontageSession;
		onRecordChallenge: (input: RecordChallengeResultInput) => Promise<void>;
		disabled?: boolean;
	}

	let { montage, onRecordChallenge, disabled = false }: Props = $props();

	let description = $state('');
	let playerName = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);

	async function recordResult(result: 'success' | 'failure' | 'skip') {
		if (isSubmitting || disabled) return;

		isSubmitting = true;
		try {
			await onRecordChallenge({
				result,
				description: description.trim() || undefined,
				playerName: playerName.trim() || undefined,
				notes: notes.trim() || undefined
			});

			// Clear form
			description = '';
			playerName = '';
			notes = '';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-4" role="form" aria-label="Record challenge result">
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
