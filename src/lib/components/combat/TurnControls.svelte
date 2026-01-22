<script lang="ts">
	import {
		SkipForward,
		SkipBack,
		Play,
		Pause,
		Square,
		Loader2,
		ChevronRight,
		ChevronLeft,
		RotateCcw
	} from 'lucide-svelte';
	import type { CombatSession } from '$lib/types/combat';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		combat: CombatSession;
		onNextTurn: () => void | Promise<void>;
		onPreviousTurn: () => void | Promise<void>;
		onStartCombat?: () => void | Promise<void>;
		onPauseCombat?: () => void | Promise<void>;
		onResumeCombat?: () => void | Promise<void>;
		onEndCombat?: () => void | Promise<void>;
		onReopenCombat?: () => void | Promise<void>;
		loading?: boolean;
		showRoundAdvance?: boolean;
	}

	let {
		combat,
		onNextTurn,
		onPreviousTurn,
		onStartCombat,
		onPauseCombat,
		onResumeCombat,
		onEndCombat,
		onReopenCombat,
		loading = false,
		showRoundAdvance = false
	}: Props = $props();

	const isActive = $derived(combat.status === 'active');
	const isPaused = $derived(combat.status === 'paused');
	const isPreparing = $derived(combat.status === 'preparing');
	const isCompleted = $derived(combat.status === 'completed');

	const canGoNext = $derived(isActive && !loading && combat.combatants.length > 0);
	const canGoPrevious = $derived(
		isActive && !loading && !(combat.currentRound === 1 && combat.currentTurn === 0)
	);
	const canStart = $derived(isPreparing && combat.combatants.length > 0);

	const currentCombatant = $derived(combat.combatants[combat.currentTurn]);
	const isLastTurn = $derived(combat.currentTurn === combat.combatants.length - 1);

	function handleKeydown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (event.key === 'ArrowRight' && canGoNext) {
			event.preventDefault();
			onNextTurn();
		} else if (event.key === 'ArrowLeft' && canGoPrevious) {
			event.preventDefault();
			onPreviousTurn();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});

	function getNextButtonTitle(): string {
		if (showRoundAdvance && isLastTurn) {
			return 'Next Turn (will advance to next round) - Arrow Right';
		}
		return 'Next Turn - Arrow Right';
	}

	function getStartButtonTitle(): string {
		if (combat.combatants.length === 0) {
			return 'Add combatants to start combat';
		}
		return 'Start combat';
	}
</script>

<div class="turn-controls p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
	<!-- Round and Turn Info -->
	<div class="text-center mb-4">
		{#if isPreparing || combat.currentRound === 0}
			<div class="text-lg font-semibold text-slate-600 dark:text-slate-400">
				Preparing for combat
			</div>
		{:else}
			<div class="text-sm text-slate-600 dark:text-slate-400 mb-1" aria-live="polite">
				Round {combat.currentRound}
			</div>
			{#if currentCombatant}
				<div class="text-lg font-semibold text-slate-900 dark:text-white">
					{currentCombatant.name}'s Turn
				</div>
			{/if}
			{#if combat.combatants.length > 0}
				<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
					Turn {combat.currentTurn + 1} of {combat.combatants.length}
				</div>
			{/if}
		{/if}
	</div>

	<!-- Loading Indicator -->
	{#if loading}
		<div class="flex justify-center mb-4" data-testid="loading-spinner">
			<Loader2 class="w-6 h-6 animate-spin text-blue-600" />
		</div>
	{/if}

	<!-- Main Controls -->
	<div class="flex gap-3 mb-3">
		<!-- Previous Turn -->
		<button
			class="btn btn-secondary flex-1"
			onclick={onPreviousTurn}
			disabled={!canGoPrevious || loading}
			aria-label="Previous Turn - Arrow Left"
			title="Previous Turn - Arrow Left"
		>
			<SkipBack class="w-4 h-4" />
			Previous Turn
		</button>

		<!-- Next Turn -->
		<button
			class="btn btn-primary primary accent flex-1"
			onclick={onNextTurn}
			disabled={!canGoNext || loading}
			aria-label="Next Turn - Arrow Right"
			title={getNextButtonTitle()}
		>
			Next Turn
			<SkipForward class="w-4 h-4" />
		</button>
	</div>

	<!-- Combat State Controls -->
	<div class="flex gap-2">
		{#if isPreparing && onStartCombat}
			<button
				class="btn btn-primary flex-1"
				onclick={onStartCombat}
				disabled={!canStart}
				aria-label="Start Combat"
				title={getStartButtonTitle()}
			>
				<Play class="w-4 h-4" />
				Start Combat
			</button>
		{/if}

		{#if isActive && onPauseCombat}
			<button
				class="btn btn-secondary"
				onclick={onPauseCombat}
				aria-label="Pause Combat"
				title="Pause combat"
			>
				<Pause class="w-4 h-4" />
				Pause
			</button>
		{/if}

		{#if isPaused && onResumeCombat}
			<button
				class="btn btn-primary"
				onclick={onResumeCombat}
				aria-label="Resume Combat"
				title="Resume combat"
			>
				<Play class="w-4 h-4" />
				Resume
			</button>
		{/if}

		{#if (isActive || isPaused) && onEndCombat}
			<button
				class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
				onclick={onEndCombat}
				aria-label="End Combat"
				title="End combat"
			>
				<Square class="w-4 h-4" />
				End Combat
			</button>
		{/if}

		{#if isCompleted && onReopenCombat}
			<button
				class="btn btn-primary flex-1"
				onclick={onReopenCombat}
				aria-label="Reopen Combat"
				title="Reopen this combat session"
			>
				<RotateCcw class="w-4 h-4" />
				Reopen Combat
			</button>
		{/if}
	</div>
</div>

<style>
	.turn-controls {
		@apply shadow-lg;
	}
</style>
