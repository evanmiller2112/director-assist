<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { negotiationStore } from '$lib/stores';
	import {
		NegotiationProgress,
		ArgumentControls,
		ArgumentCard,
		MotivationPitfallPanel,
		NegotiationOutcomeDisplay,
		NegotiationRulesReference,
		NegotiationSetup
	} from '$lib/components/negotiation';
	import { ArrowLeft, Play, StopCircle, RefreshCw } from 'lucide-svelte';
	import type { RecordArgumentInput, MotivationType } from '$lib/types/negotiation';

	const negotiationId = $derived($page.params.id);

	// Load the negotiation session
	onMount(async () => {
		if (negotiationId) {
			await negotiationStore.selectNegotiation(negotiationId);
		}
	});

	const negotiation = $derived(negotiationStore.activeNegotiation);
	const isLoading = $derived(negotiationStore.isLoading);

	// Transform motivations for MotivationPitfallPanel
	const npcMotivations = $derived.by(() => {
		if (!negotiation) return [];
		return negotiation.motivations.map((m) => ({
			type: m.type,
			isKnown: m.isKnown,
			used: m.timesUsed > 0
		}));
	});

	// Transform pitfalls for MotivationPitfallPanel
	const npcPitfalls = $derived.by(() => {
		if (!negotiation) return [];
		return negotiation.pitfalls.map((p) => ({
			type: p.description as MotivationType, // Using description as type for now
			isKnown: p.isKnown
		}));
	});

	// Used motivations for ArgumentControls
	const usedMotivations = $derived.by(() => {
		if (!negotiation) return [];
		return negotiation.motivations.filter((m) => m.timesUsed > 0).map((m) => m.type);
	});

	// Transform arguments for ArgumentCard
	const argumentCards = $derived.by(() => {
		if (!negotiation) return [];
		return negotiation.arguments.map((arg) => ({
			id: arg.id,
			argumentType: arg.type,
			tier: arg.tier,
			interestDelta: arg.interestChange,
			patienceDelta: arg.patienceChange,
			motivationType: arg.motivationType,
			playerName: arg.playerName,
			notes: arg.notes,
			createdAt: arg.createdAt
		}));
	});

	function handleBack() {
		goto('/negotiation');
	}

	async function handleStartNegotiation() {
		if (!negotiation) return;
		await negotiationStore.startNegotiation(negotiation.id);
	}

	async function handleRecordArgument(data: {
		argumentType: string;
		tier: number;
		motivationType?: string;
		playerName?: string;
		notes?: string;
	}) {
		if (!negotiation) return;

		const input: RecordArgumentInput = {
			type: data.argumentType as 'motivation' | 'no_motivation' | 'pitfall',
			tier: data.tier as 1 | 2 | 3,
			description: data.notes || `${data.argumentType} argument`,
			motivationType: data.motivationType as MotivationType | undefined,
			playerName: data.playerName,
			notes: data.notes
		};

		await negotiationStore.recordArgument(negotiation.id, input);
	}

	async function handleEndNegotiation() {
		if (!negotiation) return;
		await negotiationStore.completeNegotiation(negotiation.id);
	}

	async function handleReopenNegotiation() {
		if (!negotiation) return;
		await negotiationStore.reopenNegotiation(negotiation.id);
	}

	async function handleRevealMotivation(type: MotivationType) {
		if (!negotiation) return;
		const index = negotiation.motivations.findIndex((m) => m.type === type);
		if (index !== -1) {
			await negotiationStore.revealMotivation(negotiation.id, index);
		}
	}

	async function handleRevealPitfall(type: MotivationType) {
		if (!negotiation) return;
		// Find the pitfall by description matching the type
		const index = negotiation.pitfalls.findIndex((p) => p.description === type);
		if (index !== -1) {
			await negotiationStore.revealPitfall(negotiation.id, index);
		}
	}

	// For editing in preparing state - convert to setup format
	interface NegotiationSetupOutput {
		name: string;
		npcName: string;
		description?: string;
		interest: number;
		patience: number;
		motivations: Array<{ type: MotivationType; isKnown: boolean }>;
		pitfalls: Array<{ type: MotivationType; isKnown: boolean }>;
	}

	async function handleUpdateSetup(data: NegotiationSetupOutput) {
		if (!negotiation) return;

		await negotiationStore.updateNegotiation(negotiation.id, {
			name: data.name,
			npcName: data.npcName,
			description: data.description,
			motivations: negotiation.motivations.map((m, i) => ({
				...m,
				isKnown: data.motivations[i]?.isKnown ?? m.isKnown
			})),
			pitfalls: negotiation.pitfalls.map((p, i) => ({
				...p,
				isKnown: data.pitfalls[i]?.isKnown ?? p.isKnown
			}))
		});
	}

	// Convert negotiation to setup format for editing
	const setupInitialData = $derived.by(() => {
		if (!negotiation) return undefined;
		return {
			name: negotiation.name,
			npcName: negotiation.npcName,
			description: negotiation.description,
			interest: negotiation.interest,
			patience: negotiation.patience,
			motivations: negotiation.motivations.map((m) => ({
				type: m.type,
				isKnown: m.isKnown
			})),
			pitfalls: negotiation.pitfalls.map((p) => ({
				type: p.description as MotivationType,
				isKnown: p.isKnown
			}))
		};
	});
</script>

<div class="negotiation-detail-page p-6 max-w-5xl mx-auto">
	{#if isLoading}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400">Loading negotiation...</div>
		</div>
	{:else if !negotiation}
		<div class="text-center py-16">
			<div class="text-lg text-slate-600 dark:text-slate-400 mb-4">Negotiation not found</div>
			<button class="btn btn-primary" onclick={handleBack}>
				<ArrowLeft class="w-4 h-4" />
				Back to List
			</button>
		</div>
	{:else}
		<!-- Back Button -->
		<button class="btn btn-secondary mb-6" onclick={handleBack} aria-label="Back to negotiation list">
			<ArrowLeft class="w-4 h-4" />
			Back
		</button>

		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-start justify-between gap-4 mb-2">
				<div>
					<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">
						{negotiation.npcName}
					</h1>
					{#if negotiation.name}
						<p class="text-lg text-slate-600 dark:text-slate-400">{negotiation.name}</p>
					{/if}
					{#if negotiation.description}
						<p class="text-slate-600 dark:text-slate-400 mt-2">{negotiation.description}</p>
					{/if}
				</div>

				<!-- Status Badge -->
				<div class="flex-shrink-0">
					{#if negotiation.status === 'preparing'}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
						>
							Preparing
						</span>
					{:else if negotiation.status === 'active'}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
						>
							Active
						</span>
					{:else}
						<span
							class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
						>
							Completed
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Preparing State -->
		{#if negotiation.status === 'preparing'}
			<!-- Setup Editor -->
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
					Setup Negotiation
				</h2>
				<NegotiationSetup
					initialData={setupInitialData}
					onCreate={handleUpdateSetup}
					onCancel={handleBack}
				/>
			</div>

			<!-- Ready to Start -->
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6 text-center"
			>
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">
					Ready to Start?
				</h2>
				<p class="text-slate-600 dark:text-slate-400 mb-6">
					Begin the negotiation with {negotiation.npcName}.
				</p>
				<button class="btn btn-primary" onclick={handleStartNegotiation}>
					<Play class="w-4 h-4" />
					Start Negotiation
				</button>
			</div>
		{/if}

		<!-- Active State -->
		{#if negotiation.status === 'active'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<!-- Left Column: Progress -->
				<div
					class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
				>
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
						Progress
					</h2>
					<NegotiationProgress interest={negotiation.interest} patience={negotiation.patience} />
				</div>

				<!-- Right Column: Motivations and Pitfalls -->
				<div
					class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
				>
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
						Motivations & Pitfalls
					</h2>
					<MotivationPitfallPanel
						motivations={npcMotivations}
						pitfalls={npcPitfalls}
						onRevealMotivation={handleRevealMotivation}
						onRevealPitfall={handleRevealPitfall}
					/>
				</div>
			</div>

			<!-- Record Argument -->
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
					Record Argument
				</h2>
				<ArgumentControls
					usedMotivations={usedMotivations}
					onRecord={handleRecordArgument}
				/>
			</div>

			<!-- Negotiation Rules Reference -->
			<div class="mb-6">
				<NegotiationRulesReference />
			</div>

			<!-- End Negotiation Button -->
			<div class="mb-6 text-center">
				<button class="btn btn-secondary" onclick={handleEndNegotiation}>
					<StopCircle class="w-4 h-4" />
					End Negotiation
				</button>
			</div>
		{/if}

		<!-- Completed State -->
		{#if negotiation.status === 'completed' && negotiation.outcome}
			<div class="mb-6">
				<NegotiationOutcomeDisplay outcome={negotiation.outcome} />
			</div>

			<!-- Action Buttons -->
			<div class="mb-6 flex gap-3 justify-center">
				<button class="btn btn-secondary" onclick={handleReopenNegotiation}>
					<RefreshCw class="w-4 h-4" />
					Reopen Negotiation
				</button>
				<button class="btn btn-primary" onclick={handleBack}>
					<ArrowLeft class="w-4 h-4" />
					Back to List
				</button>
			</div>
		{/if}

		<!-- Argument History -->
		{#if argumentCards.length > 0}
			<div
				class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
					Argument History
				</h2>
				<div class="space-y-3">
					{#each argumentCards as argument (argument.id)}
						<ArgumentCard {argument} />
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
