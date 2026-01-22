<script lang="ts">
	import type { PredefinedChallenge, MontageChallenge } from '$lib/types/montage';
	import { CheckCircle, XCircle, SkipForward, Circle } from 'lucide-svelte';

	interface Props {
		predefinedChallenges: PredefinedChallenge[];
		recordedChallenges: MontageChallenge[];
		onSelectChallenge: (challenge: PredefinedChallenge) => void;
		selectedChallengeId?: string;
		disabled?: boolean;
	}

	let { predefinedChallenges, recordedChallenges, onSelectChallenge, selectedChallengeId, disabled = false }: Props = $props();

	/**
	 * Get the status of a predefined challenge based on recorded challenges.
	 * Returns the most recent result and attempt count.
	 */
	function getChallengeStatus(challengeId: string): { result: 'success' | 'failure' | 'skip' | 'pending'; attempts: number } {
		const attempts = recordedChallenges.filter(
			(c) => c.predefinedChallengeId === challengeId
		);

		if (attempts.length === 0) {
			return { result: 'pending', attempts: 0 };
		}

		// Get most recent result
		const mostRecent = attempts[attempts.length - 1];
		return {
			result: mostRecent.result === 'pending' ? 'pending' : mostRecent.result,
			attempts: attempts.length
		};
	}

	/**
	 * Get styling classes based on challenge status.
	 */
	function getStatusClasses(result: 'success' | 'failure' | 'skip' | 'pending', isSelected: boolean): string {
		const baseClasses = 'w-full text-left p-4 rounded-lg border-2 transition-all';
		const selectedClasses = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : '';

		let statusClasses = '';
		switch (result) {
			case 'success':
				statusClasses = 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30';
				break;
			case 'failure':
				statusClasses = 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30';
				break;
			case 'skip':
				statusClasses = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
				break;
			default:
				statusClasses = 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700';
		}

		return `${baseClasses} ${statusClasses} ${selectedClasses}`;
	}

	/**
	 * Get icon component based on result.
	 */
	function getStatusIcon(result: 'success' | 'failure' | 'skip' | 'pending') {
		switch (result) {
			case 'success':
				return CheckCircle;
			case 'failure':
				return XCircle;
			case 'skip':
				return SkipForward;
			default:
				return Circle;
		}
	}

	/**
	 * Get status text for accessibility.
	 */
	function getStatusText(result: 'success' | 'failure' | 'skip' | 'pending', attempts: number): string {
		if (attempts === 0) {
			return 'Pending';
		}
		const attemptText = attempts > 1 ? ` (${attempts} attempts)` : '';
		return `${result.charAt(0).toUpperCase() + result.slice(1)}${attemptText}`;
	}

	function handleSelect(challenge: PredefinedChallenge) {
		if (!disabled) {
			onSelectChallenge(challenge);
		}
	}
</script>

<div class="space-y-3">
	<div>
		<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
			Predefined Challenges
		</h3>
		<p class="text-xs text-slate-500 dark:text-slate-400">
			Click a challenge to select it for recording
		</p>
	</div>

	{#if predefinedChallenges.length === 0}
		<div class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
			No predefined challenges for this montage
		</div>
	{:else}
		<div class="space-y-2">
			{#each predefinedChallenges as challenge (challenge.id)}
				{@const status = getChallengeStatus(challenge.id)}
				{@const isSelected = selectedChallengeId === challenge.id}
				{@const StatusIcon = getStatusIcon(status.result)}
				{@const statusText = getStatusText(status.result, status.attempts)}

				<button
					type="button"
					onclick={() => handleSelect(challenge)}
					disabled={disabled}
					aria-label="Select {challenge.name} - {statusText}"
					aria-disabled={disabled}
					class={getStatusClasses(status.result, isSelected)}
				>
					<div class="flex items-start gap-3">
						<!-- Status Icon -->
						<div class="flex-shrink-0 mt-0.5">
							<StatusIcon
								class="h-5 w-5 {status.result === 'success' ? 'text-green-600 dark:text-green-400' :
								status.result === 'failure' ? 'text-red-600 dark:text-red-400' :
								status.result === 'skip' ? 'text-yellow-600 dark:text-yellow-500' :
								'text-slate-400 dark:text-slate-500'}"
							/>
						</div>

						<!-- Challenge Content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-2">
								<div class="font-medium text-sm text-slate-900 dark:text-white">
									{challenge.name}
								</div>
								{#if status.attempts > 1}
									<span
										class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
									>
										{status.attempts} attempts
									</span>
								{/if}
							</div>

							{#if challenge.description}
								<div class="text-xs text-slate-600 dark:text-slate-400 mt-1">
									{challenge.description}
								</div>
							{/if}

							{#if challenge.suggestedSkills && challenge.suggestedSkills.length > 0}
								<div class="flex flex-wrap gap-1 mt-2">
									<span class="text-xs text-slate-500 dark:text-slate-400">Suggested:</span>
									{#each challenge.suggestedSkills as skill}
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
										>
											{skill}
										</span>
									{/each}
								</div>
							{/if}

							<!-- Status text for screen readers -->
							<span class="sr-only">{statusText}</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
