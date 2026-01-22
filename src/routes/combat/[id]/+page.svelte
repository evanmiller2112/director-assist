<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Plus, Minus, UserMinus, GripVertical } from 'lucide-svelte';
	import { combatStore } from '$lib/stores';
	import InitiativeTracker from '$lib/components/combat/InitiativeTracker.svelte';
	import TurnControls from '$lib/components/combat/TurnControls.svelte';
	import HpTracker from '$lib/components/combat/HpTracker.svelte';
	import ConditionManager from '$lib/components/combat/ConditionManager.svelte';
	import AddCombatantModal from '$lib/components/combat/AddCombatantModal.svelte';
	import type { Combatant } from '$lib/types/combat';

	const combatId = $derived($page.params.id);
	let selectedCombatant = $state<Combatant | null>(null);
	let showAddCombatantModal = $state(false);

	// Resizable panel state
	const MIN_PANEL_WIDTH = 280;
	const MAX_PANEL_WIDTH = 600;
	const DEFAULT_PANEL_WIDTH = 320;
	const STORAGE_KEY = 'combat-panel-width';

	let panelWidth = $state(DEFAULT_PANEL_WIDTH);
	let isResizing = $state(false);

	// Load saved width from localStorage
	onMount(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const width = parseInt(saved, 10);
			if (!isNaN(width) && width >= MIN_PANEL_WIDTH && width <= MAX_PANEL_WIDTH) {
				panelWidth = width;
			}
		}
	});

	function startResize(e: MouseEvent) {
		isResizing = true;
		e.preventDefault();
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, e.clientX));
		panelWidth = newWidth;
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		// Save to localStorage
		localStorage.setItem(STORAGE_KEY, String(panelWidth));
	}

	// Load the combat session
	onMount(async () => {
		if (combatId) {
			await combatStore.selectCombat(combatId);
		}
	});

	const combat = $derived(combatStore.activeCombat);
	const isLoading = $derived(combatStore.isLoading);

	// Update selected combatant when combat changes
	$effect(() => {
		if (combat && selectedCombatant) {
			const updated = combat.combatants.find((c) => c.id === selectedCombatant.id);
			if (updated) {
				selectedCombatant = updated;
			}
		}
	});

	function handleCombatantClick(combatant: Combatant) {
		selectedCombatant = combatant;
	}

	async function handleNextTurn() {
		if (!combat) return;
		await combatStore.nextTurn(combat.id);
	}

	async function handlePreviousTurn() {
		if (!combat) return;
		await combatStore.previousTurn(combat.id);
	}

	async function handleStartCombat() {
		if (!combat) return;
		await combatStore.startCombat(combat.id);
	}

	async function handlePauseCombat() {
		if (!combat) return;
		await combatStore.pauseCombat(combat.id);
	}

	async function handleResumeCombat() {
		if (!combat) return;
		await combatStore.resumeCombat(combat.id);
	}

	async function handleEndCombat() {
		if (!combat) return;
		await combatStore.endCombat(combat.id);
	}

	async function handleReopenCombat() {
		if (!combat) return;
		await combatStore.reopenCombat(combat.id);
	}

	async function handleApplyDamage(amount: number) {
		if (!combat || !selectedCombatant) return;
		await combatStore.applyDamage(combat.id, selectedCombatant.id, amount);
	}

	async function handleApplyHealing(amount: number) {
		if (!combat || !selectedCombatant) return;
		await combatStore.applyHealing(combat.id, selectedCombatant.id, amount);
	}

	async function handleSetTempHp(amount: number) {
		if (!combat || !selectedCombatant) return;
		await combatStore.addTemporaryHp(combat.id, selectedCombatant.id, amount);
	}

	async function handleAddCondition(condition: any) {
		if (!combat || !selectedCombatant) return;
		await combatStore.addCondition(combat.id, selectedCombatant.id, condition);
	}

	async function handleRemoveCondition(conditionName: string) {
		if (!combat || !selectedCombatant) return;
		await combatStore.removeCondition(combat.id, selectedCombatant.id, conditionName);
	}

	async function handleRemoveCombatant() {
		if (!combat || !selectedCombatant) return;
		await combatStore.removeCombatant(combat.id, selectedCombatant.id);
		selectedCombatant = null;
	}

	async function handleReorderCombatant(combatantId: string, newPosition: number) {
		if (!combat) return;
		await combatStore.moveCombatantToPosition(combat.id, combatantId, newPosition);
	}

	async function handleTurnOrderChange(combatantId: string, newTurnOrder: number) {
		if (!combat) return;
		await combatStore.updateTurnOrder(combat.id, combatantId, newTurnOrder);
	}

	async function handleUpdateConditionDuration(conditionName: string, newDuration: number) {
		if (!combat || !selectedCombatant) return;
		// Find the condition and update it
		const condition = selectedCombatant.conditions.find((c) => c.name === conditionName);
		if (!condition) return;

		// Remove old condition and add updated one
		await combatStore.removeCondition(combat.id, selectedCombatant.id, conditionName);
		await combatStore.addCondition(combat.id, selectedCombatant.id, {
			...condition,
			duration: newDuration
		});
	}

	async function handleSpendHeroPoint() {
		if (!combat) return;
		await combatStore.spendHeroPoint(combat.id);
	}

	async function handleAddHeroPoint() {
		if (!combat) return;
		await combatStore.addHeroPoints(combat.id, 1);
	}

	async function handleAddVictoryPoint() {
		if (!combat) return;
		await combatStore.addVictoryPoints(combat.id, 1);
	}

	async function handleSubtractVictoryPoint() {
		if (!combat) return;
		await combatStore.removeVictoryPoints(combat.id, 1);
	}

	async function handleAddCombatant(data: any) {
		if (!combat) return;

		// Handle quick-add (ad-hoc) combatants
		if (data.isAdHoc) {
			await combatStore.addQuickCombatant(combat.id, {
				name: data.name,
				hp: data.hp,
				type: data.type
			});
		} else if (data.type === 'hero') {
			await combatStore.addHero(combat.id, {
				name: data.name,
				entityId: data.entityId,
				hp: data.hp,
				maxHp: data.maxHp,
				ac: data.ac,
				heroicResource: data.heroicResource
			});
		} else {
			await combatStore.addCreature(combat.id, {
				name: data.name,
				entityId: data.entityId,
				hp: data.hp,
				maxHp: data.maxHp,
				ac: data.ac,
				threat: data.threat
			});
		}

		showAddCombatantModal = false;
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center h-screen">
		<div class="text-lg text-slate-600 dark:text-slate-400">Loading combat...</div>
	</div>
{:else if !combat}
	<div class="flex items-center justify-center h-screen">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Combat not found</h1>
			<p class="text-slate-600 dark:text-slate-400">
				The combat session you're looking for doesn't exist.
			</p>
		</div>
	</div>
{:else}
	<div class="combat-runner-page h-screen flex flex-col">
		<!-- Header -->
		<div class="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-slate-900 dark:text-white">{combat.name}</h1>
					<div
						class="text-sm text-slate-600 dark:text-slate-400 mt-1"
						role="status"
						aria-live="polite"
					>
						Round {combat.currentRound}
					</div>
				</div>

				<div class="flex items-center gap-4">
					<!-- Status Badge -->
					<span
						class={`px-3 py-1 rounded-full text-sm font-medium ${
							combat.status === 'active'
								? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
								: combat.status === 'paused'
									? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
									: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
						}`}
					>
						{combat.status.charAt(0).toUpperCase() + combat.status.slice(1)}
					</span>

					<!-- Hero Points -->
					<div class="flex items-center gap-2">
						<span class="text-sm text-slate-600 dark:text-slate-400">Hero Points:</span>
						<button
							class="btn btn-secondary px-2 py-1"
							onclick={handleSpendHeroPoint}
							disabled={combat.heroPoints === 0}
							aria-label="Spend Hero Point"
						>
							<Minus class="w-4 h-4" />
						</button>
						<span class="text-lg font-bold text-slate-900 dark:text-white">{combat.heroPoints}</span>
						<button
							class="btn btn-secondary px-2 py-1"
							onclick={handleAddHeroPoint}
							aria-label="Add Hero Point"
						>
							<Plus class="w-4 h-4" />
						</button>
					</div>

					<!-- Victory Points -->
					<div class="flex items-center gap-2">
						<span class="text-sm text-slate-600 dark:text-slate-400">Victory Points:</span>
						<button
							class="btn btn-secondary px-2 py-1"
							onclick={handleSubtractVictoryPoint}
							disabled={combat.victoryPoints === 0}
							aria-label="Subtract Victory Point"
						>
							<Minus class="w-4 h-4" />
						</button>
						<span class="text-lg font-bold text-slate-900 dark:text-white">
							{combat.victoryPoints}
						</span>
						<button
							class="btn btn-secondary px-2 py-1"
							onclick={handleAddVictoryPoint}
							aria-label="Add Victory Point"
						>
							<Plus class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Initiative Tracker (Left Side) -->
			<div
				class="border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0"
				style="width: {panelWidth}px"
			>
				<div class="p-4 border-b border-slate-200 dark:border-slate-700">
					<button class="btn btn-primary w-full" onclick={() => (showAddCombatantModal = true)}>
						<Plus class="w-4 h-4" />
						Add Combatant
					</button>
				</div>

				{#if combat.combatants.length === 0}
					<div class="flex-1 flex items-center justify-center p-8 text-center">
						<div>
							<p class="text-slate-500 dark:text-slate-400 mb-4">No combatants yet</p>
							<button
								class="btn btn-secondary"
								onclick={() => (showAddCombatantModal = true)}
							>
								<Plus class="w-4 h-4" />
								Add First Combatant
							</button>
						</div>
					</div>
				{:else}
					<div class="flex-1 overflow-hidden">
						<InitiativeTracker
							{combat}
							onCombatantClick={handleCombatantClick}
							onReorder={handleReorderCombatant}
							onTurnOrderChange={handleTurnOrderChange}
						/>
					</div>
				{/if}

				<!-- Turn Controls -->
				<TurnControls
					{combat}
					onNextTurn={handleNextTurn}
					onPreviousTurn={handlePreviousTurn}
					onStartCombat={handleStartCombat}
					onPauseCombat={handlePauseCombat}
					onResumeCombat={handleResumeCombat}
					onEndCombat={handleEndCombat}
					onReopenCombat={handleReopenCombat}
					loading={isLoading}
				/>
			</div>

			<!-- Resize Handle -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="w-2 flex-shrink-0 cursor-col-resize flex items-center justify-center transition-colors group {isResizing ? 'bg-blue-300 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-200 dark:hover:bg-blue-900'}"
				onmousedown={startResize}
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize panel"
			>
				<GripVertical class="w-4 h-4 transition-colors {isResizing ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}" />
			</div>

			<!-- Detail Panel (Right Side) -->
			<div class="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
				{#if selectedCombatant}
					<div class="max-w-2xl mx-auto space-y-6">
						<!-- Combatant Header -->
						<div class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
							<div class="flex items-start justify-between">
								<div>
									<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
										{selectedCombatant.name}
									</h2>
									<div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
										<div>
											<span class="font-medium">Type:</span>
											{selectedCombatant.type === 'hero' ? 'Hero' : 'Creature'}
										</div>
										<div>
											<span class="font-medium">Initiative:</span>
											{selectedCombatant.initiative}
										</div>
										{#if selectedCombatant.ac}
											<div>
												<span class="font-medium">AC:</span>
												{selectedCombatant.ac}
											</div>
										{/if}
									</div>
								</div>
								<button
									class="btn btn-secondary text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
									onclick={handleRemoveCombatant}
									aria-label="Remove combatant from combat"
								>
									<UserMinus class="w-4 h-4" />
									Remove
								</button>
							</div>
						</div>

						<!-- HP Tracker -->
						<div
							class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
							data-testid="hp-tracker"
						>
							<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hit Points</h3>
							<HpTracker
								combatant={selectedCombatant}
								onApplyDamage={handleApplyDamage}
								onApplyHealing={handleApplyHealing}
								onSetTempHp={handleSetTempHp}
								showQuickActions={true}
							/>
						</div>

						<!-- Condition Manager -->
						<div
							class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
							data-testid="condition-manager"
						>
							<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Conditions</h3>
							<ConditionManager
								combatant={selectedCombatant}
								onAddCondition={handleAddCondition}
								onRemoveCondition={handleRemoveCondition}
								onUpdateDuration={handleUpdateConditionDuration}
								showPresets={true}
							/>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-center h-full">
						<p class="text-lg text-slate-500 dark:text-slate-400">
							Select a combatant to view details
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Add Combatant Modal -->
	<AddCombatantModal
		open={showAddCombatantModal}
		onAdd={handleAddCombatant}
		onClose={() => (showAddCombatantModal = false)}
	/>
{/if}
