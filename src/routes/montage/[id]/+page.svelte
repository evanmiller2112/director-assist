<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { montageStore } from '$lib/stores';
	import {
		MontageProgress,
		MontageControls,
		ChallengeCard,
		OutcomeDisplay,
		PredefinedChallengeList
	} from '$lib/components/montage';
	import { ArrowLeft, Play, RefreshCw } from 'lucide-svelte';
	import type { RecordChallengeResultInput, PredefinedChallenge } from '$lib/types/montage';

	const montageId = $derived($page.params.id);

	// Load the montage session
	onMount(async () => {
		if (montageId) {
			await montageStore.selectMontage(montageId);
		}
	});

	const montage = $derived(montageStore.activeMontage);
	const isLoading = $derived(montageStore.isLoading);
	const round1Challenges = $derived(montageStore.round1Challenges);
	const round2Challenges = $derived(montageStore.round2Challenges);

	let selectedPredefinedChallenge = $state<PredefinedChallenge | null>(null);

	function handleSelectPredefinedChallenge(challenge: PredefinedChallenge) {
		selectedPredefinedChallenge = challenge;
	}

	function handleClearSelection() {
		selectedPredefinedChallenge = null;
	}

	function handleBack() {
		goto('/montage');
	}

	async function handleStartMontage() {
		if (!montage) return;
		await montageStore.startMontage(montage.id);
	}

	async function handleRecordChallenge(input: RecordChallengeResultInput) {
		if (!montage) return;
		await montageStore.recordChallengeResult(montage.id, input);
		// Clear selection after recording
		selectedPredefinedChallenge = null;
	}

	async function handleReopenMontage() {
		if (!montage) return;
		await montageStore.reopenMontage(montage.id);
	}
</script>

<div class="montage-detail-page p-6 max-w-5xl mx-auto">
	{#if isLoading}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400">Loading montage...</div>
		</div>
	{:else if !montage}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400 mb-4">Montage not found</div>
			<button class="btn btn-primary" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4" />
				Back to List
			</button>
		</div>
	{:else}
		<!-- Back Button -->
		<button class="btn btn-secondary mb-6" onclick={handleBack} aria-label="Back to montage list">
			<ArrowLeft class="w-4 h-4" />
			Back
		</button>

		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-start justify-between gap-4 mb-2">
				<div>
					<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">
						{montage.name}
					</h1>
					{#if montage.description}
						<p class="text-slate-600 dark:text-slate-400">{montage.description}</p>
					{/if}
				</div>

				<!-- Status Badge -->
				<div class="flex-shrink-0">
					{#if montage.status === 'preparing'}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
						>
							Preparing
						</span>
					{:else if montage.status === 'active'}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
						>
							Active
						</span>
					{:else}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
						>
							Completed
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Preparing State -->
		{#if montage.status === 'preparing'}
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6 text-center"
			>
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">
					Ready to Start?
				</h2>
				<p class="text-slate-600 dark:text-slate-400 mb-6">
					This {montage.difficulty} montage requires {montage.successLimit} successes to win, and will
					fail at {montage.failureLimit} failures.
				</p>
				<button class="btn btn-primary" onclick={handleStartMontage}>
					<Play class="w-4 h-4" />
					Start Montage
				</button>
			</div>
		{/if}

		<!-- Active State -->
		{#if montage.status === 'active'}
			<!-- Predefined Challenges List -->
			{#if montage.predefinedChallenges && montage.predefinedChallenges.length > 0}
				<div
					class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6"
				>
					<PredefinedChallengeList
						predefinedChallenges={montage.predefinedChallenges}
						recordedChallenges={montage.challenges}
						onSelectChallenge={handleSelectPredefinedChallenge}
						selectedChallengeId={selectedPredefinedChallenge?.id}
					/>
				</div>
			{/if}

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<!-- Left Column: Progress -->
				<div
					class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
				>
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
						Progress
					</h2>
					<MontageProgress {montage} />
				</div>

				<!-- Right Column: Record Challenge -->
				<div
					class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
				>
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
						Record Challenge
					</h2>
					<MontageControls
						{montage}
						onRecordChallenge={handleRecordChallenge}
						selectedPredefinedChallenge={selectedPredefinedChallenge}
						onClearSelection={handleClearSelection}
					/>
				</div>
			</div>
		{/if}

		<!-- Completed State -->
		{#if montage.status === 'completed' && montage.outcome}
			<div class="mb-6">
				<OutcomeDisplay outcome={montage.outcome} victoryPoints={montage.victoryPoints} />
			</div>

			<!-- Reopen Button -->
			<div class="mb-6 text-center">
				<button class="btn btn-secondary" onclick={handleReopenMontage}>
					<RefreshCw class="w-4 h-4" />
					Reopen Montage
				</button>
			</div>

			<!-- Progress Summary -->
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
					Final Results
				</h2>
				<MontageProgress {montage} />
			</div>
		{/if}

		<!-- Challenge History -->
		{#if montage.challenges.length > 0}
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
					Challenge History
				</h2>

				<!-- Round 1 -->
				{#if round1Challenges.length > 0}
					<div class="mb-6">
						<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
							Round 1
						</h3>
						<div class="space-y-2">
							{#each round1Challenges as challenge, idx (challenge.id)}
								<ChallengeCard {challenge} index={idx + 1} />
							{/each}
						</div>
					</div>
				{/if}

				<!-- Round 2 -->
				{#if round2Challenges.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
							Round 2
						</h3>
						<div class="space-y-2">
							{#each round2Challenges as challenge, idx (challenge.id)}
								<ChallengeCard {challenge} index={round1Challenges.length + idx + 1} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
