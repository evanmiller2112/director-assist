<script lang="ts">
	import { Heart, Skull, Pencil } from 'lucide-svelte';
	import type { Combatant } from '$lib/types/combat';
	import { tick } from 'svelte';

	interface Props {
		combatant: Combatant;
		onApplyDamage: (amount: number) => void | Promise<void>;
		onApplyHealing: (amount: number) => void | Promise<void>;
		onSetTempHp: (amount: number) => void | Promise<void>;
		onUpdateMaxHp?: (newMaxHp: number) => void | Promise<void>;
		showQuickActions?: boolean;
		showPreview?: boolean;
	}

	let {
		combatant,
		onApplyDamage,
		onApplyHealing,
		onSetTempHp,
		onUpdateMaxHp,
		showQuickActions = false,
		showPreview = false
	}: Props = $props();

	let damageValue = $state('');
	let healingValue = $state('');
	let tempHpValue = $state('');
	let isEditingMaxHp = $state(false);
	let maxHpEditValue = $state('');
	let maxHpInputElement = $state<HTMLInputElement | undefined>(undefined);

	// Only calculate bloodied/critical if maxHp is defined
	const isBloodied = $derived(
		combatant.maxHp !== undefined && combatant.hp <= combatant.maxHp / 2
	);
	const isDefeated = $derived(combatant.hp <= 0);
	const isCritical = $derived(
		combatant.maxHp !== undefined && combatant.hp <= combatant.maxHp * 0.25
	);
	const isAtMaxHp = $derived(
		combatant.maxHp !== undefined && combatant.hp >= combatant.maxHp
	);
	const hpPercentage = $derived(
		combatant.maxHp !== undefined && combatant.maxHp > 0
			? (Math.max(0, combatant.hp) / combatant.maxHp) * 100
			: 0
	);

	function getHpBarClass(): string {
		if (isDefeated) return 'bg-slate-400 dark:bg-slate-600';
		if (isCritical) return 'bg-red-500 dark:bg-red-600 critical';
		if (isBloodied) return 'bg-yellow-500 dark:bg-yellow-600 bloodied warning';
		return 'bg-green-500 dark:bg-green-600 healthy';
	}

	async function handleApplyDamage() {
		const amount = parseInt(damageValue, 10);
		if (amount > 0) {
			await onApplyDamage(amount);
			damageValue = '';
		}
	}

	async function handleApplyHealing() {
		const amount = parseInt(healingValue, 10);
		if (amount > 0) {
			await onApplyHealing(amount);
			healingValue = '';
		}
	}

	async function handleSetTempHp() {
		const amount = parseInt(tempHpValue, 10);
		if (tempHpValue !== '') {
			await onSetTempHp(amount);
			tempHpValue = '';
		}
	}

	async function handleQuickDamage(amount: number) {
		await onApplyDamage(amount);
	}

	async function handleQuickHeal(amount: number) {
		await onApplyHealing(amount);
	}

	const damageButtonDisabled = $derived(!damageValue || parseInt(damageValue, 10) <= 0);
	const healingButtonDisabled = $derived(!healingValue || parseInt(healingValue, 10) <= 0);
	const tempHpButtonDisabled = $derived(tempHpValue === '');

	const previewHealedHp = $derived(() => {
		if (!showPreview || !healingValue || combatant.maxHp === undefined) return null;
		const amount = parseInt(healingValue, 10);
		return Math.min(combatant.hp + amount, combatant.maxHp);
	});

	// Max HP editing functions
	async function startEditingMaxHp() {
		maxHpEditValue = combatant.maxHp?.toString() ?? '';
		isEditingMaxHp = true;
		await tick();
		maxHpInputElement?.focus();
	}

	function cancelEditingMaxHp() {
		isEditingMaxHp = false;
		maxHpEditValue = '';
	}

	async function saveMaxHp() {
		const newMaxHp = parseInt(maxHpEditValue, 10);
		if (newMaxHp > 0 && onUpdateMaxHp) {
			await onUpdateMaxHp(newMaxHp);
			isEditingMaxHp = false;
			maxHpEditValue = '';
		}
	}

	function handleMaxHpKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveMaxHp();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditingMaxHp();
		}
	}

	const saveMaxHpButtonDisabled = $derived(
		!maxHpEditValue || parseInt(maxHpEditValue, 10) <= 0
	);

	// Show edit/add button based on whether maxHp exists and onUpdateMaxHp is provided
	const showMaxHpEditButton = $derived(onUpdateMaxHp && combatant.maxHp !== undefined);
	const showAddMaxHpButton = $derived(onUpdateMaxHp && combatant.maxHp === undefined);
</script>

<div class="hp-tracker p-4 space-y-4">
	<!-- HP Display -->
	<div
		class="hp-display-section"
		data-testid="hp-display"
		aria-live="polite"
		aria-label={combatant.maxHp !== undefined
			? `${Math.max(0, combatant.hp)} out of ${combatant.maxHp} stamina`
			: `${Math.max(0, combatant.hp)} stamina`}
	>
		<div class="flex items-center justify-between mb-2">
			<div class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
				{#if isEditingMaxHp}
					<!-- Editing Max HP -->
					<div class="flex items-center gap-2">
						<span>{Math.max(0, combatant.hp)} /</span>
						<label for="max-hp-input" class="sr-only">Max Stamina</label>
						<input
							bind:this={maxHpInputElement}
							id="max-hp-input"
							type="number"
							min="1"
							step="1"
							class="input w-20 text-sm"
							bind:value={maxHpEditValue}
							onkeydown={handleMaxHpKeydown}
						/>
						<button
							class="btn btn-primary text-xs py-1 px-2"
							onclick={saveMaxHp}
							disabled={saveMaxHpButtonDisabled}
							aria-label="Save"
						>
							Save
						</button>
						<button
							class="btn btn-secondary text-xs py-1 px-2"
							onclick={cancelEditingMaxHp}
							aria-label="Cancel"
						>
							Cancel
						</button>
					</div>
				{:else if combatant.maxHp !== undefined}
					<!-- Display with Edit Button -->
					<span>{Math.max(0, combatant.hp)} / {combatant.maxHp}</span>
					<span class="text-xs text-slate-500 dark:text-slate-400 ml-2">Stamina</span>
					{#if showMaxHpEditButton}
						<button
							class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
							onclick={startEditingMaxHp}
							data-icon="edit-max-hp"
						>
							<Pencil class="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
							<span class="sr-only">Edit max HP</span>
						</button>
					{/if}
				{:else}
					<!-- No Max HP -->
					<span>{Math.max(0, combatant.hp)}</span>
					<span class="text-xs text-slate-500 dark:text-slate-400 ml-2">Stamina</span>
					{#if showAddMaxHpButton}
						<button
							class="btn btn-secondary text-xs py-1 px-2"
							onclick={startEditingMaxHp}
							aria-label="Add Max HP"
						>
							Add Max HP
						</button>
					{/if}
				{/if}
			</div>
			{#if isBloodied && !isDefeated}
				<span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">Bloodied</span>
			{/if}
			{#if isDefeated}
				<span class="text-xs font-medium text-red-600 dark:text-red-400">Defeated</span>
			{/if}
		</div>

		<!-- HP Bar (only show when maxHp is defined) -->
		{#if combatant.maxHp !== undefined}
			<div class="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<div
					data-testid="hp-bar"
					class={`h-full transition-all duration-300 ${getHpBarClass()}`}
					style={`width: ${hpPercentage}%`}
				></div>
			</div>
		{/if}

		<!-- Temp HP -->
		{#if combatant.tempHp > 0}
			<div class="mt-2 text-sm text-blue-600 dark:text-blue-400">
				Temp Stamina: {combatant.tempHp}
			</div>
		{/if}
	</div>

	<!-- Damage Controls -->
	<div class="damage-section">
		<label for="damage-input" class="label">
			<Skull class="inline-block w-4 h-4 mr-1" aria-hidden="true" />
			Damage
		</label>
		<div class="flex gap-2">
			<input
				id="damage-input"
				type="number"
				min="0"
				step="1"
				class="input flex-1"
				bind:value={damageValue}
				placeholder="Amount"
			/>
			<button
				class="btn btn-secondary"
				onclick={handleApplyDamage}
				disabled={damageButtonDisabled}
				aria-label="Apply damage"
				aria-describedby="damage-help"
			>
				Apply Damage
			</button>
		</div>
		<span id="damage-help" class="sr-only">Enter damage amount and click to apply</span>

		{#if showQuickActions}
			<div class="flex gap-2 mt-2">
				<button class="btn btn-secondary text-sm" onclick={() => handleQuickDamage(5)}>-5</button>
				<button class="btn btn-secondary text-sm" onclick={() => handleQuickDamage(10)}>-10</button>
			</div>
		{/if}
	</div>

	<!-- Healing Controls -->
	<div class="healing-section">
		<label for="healing-input" class="label">
			<Heart class="inline-block w-4 h-4 mr-1" aria-hidden="true" />
			Healing
		</label>
		{#if isAtMaxHp}
			<p class="text-sm text-slate-500 dark:text-slate-400">At max Stamina</p>
		{:else}
			<div class="flex gap-2">
				<input
					id="healing-input"
					type="number"
					min="0"
					step="1"
					class="input flex-1"
					bind:value={healingValue}
					placeholder="Amount"
					disabled={isAtMaxHp}
				/>
				<button
					class="btn btn-secondary"
					onclick={handleApplyHealing}
					disabled={healingButtonDisabled}
					aria-label="Apply healing"
					aria-describedby="healing-help"
				>
					Apply Healing
				</button>
			</div>
			<span id="healing-help" class="sr-only">Enter healing amount and click to apply</span>

			{#if showPreview && previewHealedHp() !== null}
				<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
					Will be {previewHealedHp()} Stamina
				</p>
			{/if}

			{#if showQuickActions}
				<div class="flex gap-2 mt-2">
					<button class="btn btn-secondary text-sm" onclick={() => handleQuickHeal(5)}>+5</button>
					<button class="btn btn-secondary text-sm" onclick={() => handleQuickHeal(10)}>+10</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Temp HP Controls -->
	<div class="temp-hp-section">
		<label for="temp-hp-input" class="label">Temp Stamina</label>
		<div class="flex gap-2">
			<input
				id="temp-hp-input"
				type="number"
				min="0"
				step="1"
				class="input flex-1"
				bind:value={tempHpValue}
				placeholder={combatant.tempHp > 0 ? `${combatant.tempHp}` : 'Amount'}
			/>
			<button
				class="btn btn-secondary"
				onclick={handleSetTempHp}
				disabled={tempHpButtonDisabled}
				aria-label="Set temporary Stamina"
			>
				Set Temp Stamina
			</button>
		</div>
	</div>
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
