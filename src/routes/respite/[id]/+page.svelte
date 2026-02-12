<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { respiteStore } from '$lib/stores';
	import {
		RespiteProgress,
		HeroRecoveryPanel,
		ActivityControls,
		RespiteActivityCard,
		KitSwapTracker,
		VictoryPointsConverter,
		RespiteRulesReference,
		RespiteSetup
	} from '$lib/components/respite';
	import { ArrowLeft, Play, StopCircle } from 'lucide-svelte';
	import type { RecordActivityInput } from '$lib/types/respite';

	const respiteId = $derived($page.params.id);

	onMount(async () => {
		if (respiteId) {
			await respiteStore.selectRespite(respiteId);
		}
	});

	const respite = $derived(respiteStore.activeRespite);
	const isLoading = $derived(respiteStore.isLoading);

	function handleBack() {
		goto('/respite');
	}

	async function handleStartRespite() {
		if (!respite) return;
		await respiteStore.startRespite(respite.id);
	}

	async function handleCompleteRespite() {
		if (!respite) return;
		await respiteStore.completeRespite(respite.id);
	}

	async function handleRecordActivity(data: RecordActivityInput) {
		if (!respite) return;
		await respiteStore.recordActivity(respite.id, data);
	}

	async function handleStartActivity(activityId: string) {
		if (!respite) return;
		await respiteStore.updateActivity(respite.id, activityId, { status: 'in_progress' });
	}

	async function handleCompleteActivity(activityId: string) {
		if (!respite) return;
		await respiteStore.completeActivity(respite.id, activityId);
	}

	async function handleUpdateRecovery(heroId: string, gained: number) {
		if (!respite) return;
		const hero = respite.heroes.find((h) => h.id === heroId);
		if (!hero) return;
		const newCurrent = Math.min(
			hero.recoveries.max,
			hero.recoveries.current - hero.recoveries.gained + gained
		);
		await respiteStore.updateHero(respite.id, heroId, {
			recoveries: { current: newCurrent, max: hero.recoveries.max, gained }
		});
	}

	async function handleConvertVP(amount: number) {
		if (!respite) return;
		await respiteStore.convertVictoryPoints(respite.id, amount);
	}

	async function handleKitSwap(swap: { heroId: string; from: string; to: string; reason?: string }) {
		if (!respite) return;
		await respiteStore.recordKitSwap(respite.id, swap);
	}

	// For editing in preparing state
	interface RespiteSetupOutput {
		name: string;
		description?: string;
		heroes: Array<{
			name: string;
			heroId?: string;
			recoveries: { current: number; max: number };
		}>;
		victoryPointsAvailable: number;
	}

	async function handleUpdateSetup(data: RespiteSetupOutput) {
		if (!respite) return;
		await respiteStore.updateRespite(respite.id, {
			name: data.name,
			description: data.description,
			victoryPointsAvailable: data.victoryPointsAvailable
		});
	}

	const setupInitialData = $derived.by(() => {
		if (!respite) return undefined;
		return {
			name: respite.name,
			description: respite.description,
			heroes: respite.heroes.map((h) => ({
				name: h.name,
				heroId: h.heroId,
				recoveries: { current: h.recoveries.current, max: h.recoveries.max }
			})),
			victoryPointsAvailable: respite.victoryPointsAvailable
		};
	});
</script>

<div class="respite-detail-page p-6 max-w-5xl mx-auto">
	{#if isLoading}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400">Loading respite...</div>
		</div>
	{:else if !respite}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400 mb-4">Respite not found</div>
			<button class="btn btn-primary" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4" />
				Back to List
			</button>
		</div>
	{:else}
		<!-- Back Button -->
		<button class="btn btn-secondary mb-6" onclick={handleBack} aria-label="Back to respite list">
			<ArrowLeft class="w-4 h-4" />
			Back
		</button>

		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-start justify-between gap-4 mb-2">
				<div>
					<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">
						{respite.name}
					</h1>
					{#if respite.description}
						<p class="text-slate-600 dark:text-slate-400 mt-2">{respite.description}</p>
					{/if}
				</div>

				<!-- Status Badge -->
				<div class="flex-shrink-0">
					{#if respite.status === 'preparing'}
						<span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
							Preparing
						</span>
					{:else if respite.status === 'active'}
						<span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
							Active
						</span>
					{:else}
						<span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
							Completed
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Preparing State -->
		{#if respite.status === 'preparing'}
			<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Setup Respite</h2>
				<RespiteSetup
					initialData={setupInitialData}
					onCreate={handleUpdateSetup}
					onCancel={handleBack}
				/>
			</div>

			<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6 text-center">
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">Ready to Start?</h2>
				<p class="text-slate-600 dark:text-slate-400 mb-6">
					Begin the respite for your heroes.
				</p>
				<button class="btn btn-primary" onclick={handleStartRespite}>
					<Play class="w-4 h-4" />
					Start Respite
				</button>
			</div>
		{/if}

		<!-- Active State -->
		{#if respite.status === 'active'}
			<!-- Progress Overview -->
			<div class="mb-6">
				<RespiteProgress {respite} />
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
				<!-- Column 1: Heroes -->
				<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Heroes</h2>
					<HeroRecoveryPanel
						heroes={respite.heroes}
						onUpdateRecovery={handleUpdateRecovery}
					/>
				</div>

				<!-- Column 2: Activities -->
				<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Activities</h2>

					<!-- Activity List -->
					{#if respite.activities.length > 0}
						<div class="space-y-3 mb-4">
							{#each respite.activities as activity (activity.id)}
								<RespiteActivityCard
									{activity}
									onComplete={handleCompleteActivity}
									onStart={handleStartActivity}
								/>
							{/each}
						</div>
					{/if}

					<!-- Add Activity Form -->
					<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
						<h3 class="text-sm font-medium text-slate-900 dark:text-white mb-3">Add Activity</h3>
						<ActivityControls onRecord={handleRecordActivity} />
					</div>
				</div>

				<!-- Column 3: VP & Kit Swaps -->
				<div class="space-y-6">
					<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
						<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Victory Points</h2>
						<VictoryPointsConverter
							available={respite.victoryPointsAvailable}
							converted={respite.victoryPointsConverted}
							onConvert={handleConvertVP}
						/>
					</div>

					<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
						<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Kit Swaps</h2>
						<KitSwapTracker
							kitSwaps={respite.kitSwaps}
							heroes={respite.heroes}
							onSwap={handleKitSwap}
						/>
					</div>
				</div>
			</div>

			<!-- Rules Reference -->
			<div class="mb-6">
				<RespiteRulesReference />
			</div>

			<!-- Complete Respite -->
			<div class="mb-6 text-center">
				<button class="btn btn-secondary" onclick={handleCompleteRespite}>
					<StopCircle class="w-4 h-4" />
					Complete Respite
				</button>
			</div>
		{/if}

		<!-- Completed State -->
		{#if respite.status === 'completed'}
			<!-- Summary -->
			<div class="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6 mb-6">
				<h2 class="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">Respite Complete</h2>
				<div class="space-y-2 text-sm text-green-800 dark:text-green-200">
					<p>{respite.heroes.length} heroes rested</p>
					<p>{respite.activities.filter((a) => a.status === 'completed').length} activities completed</p>
					<p>{respite.victoryPointsConverted} VP converted to XP</p>
					<p>{respite.kitSwaps.length} kit swaps recorded</p>
				</div>
			</div>

			<!-- Read-only views -->
			<div class="mb-6">
				<RespiteProgress {respite} />
			</div>

			{#if respite.heroes.length > 0}
				<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Heroes</h2>
					<HeroRecoveryPanel heroes={respite.heroes} />
				</div>
			{/if}

			{#if respite.activities.length > 0}
				<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Activities</h2>
					<div class="space-y-3">
						{#each respite.activities as activity (activity.id)}
							<RespiteActivityCard {activity} />
						{/each}
					</div>
				</div>
			{/if}

			<div class="mb-6 text-center">
				<button class="btn btn-primary" onclick={handleBack}>
					<ArrowLeft class="w-4 h-4" />
					Back to List
				</button>
			</div>
		{/if}
	{/if}
</div>
