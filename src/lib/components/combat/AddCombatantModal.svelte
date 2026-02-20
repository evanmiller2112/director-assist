<script lang="ts">
	import { X, User, Skull } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';
	import type { BaseEntity } from '$lib/types';
	import type { AddHeroCombatantInput, AddCreatureCombatantInput, AddQuickCombatantInput } from '$lib/types/combat';

	type AddCombatantData = AddHeroCombatantInput | AddCreatureCombatantInput | AddQuickCombatantInput;

	interface Props {
		open: boolean;
		onAdd?: (data: AddCombatantData) => void;
		onClose?: () => void;
	}

	let { open = false, onAdd, onClose }: Props = $props();

	let addMode = $state<'quick' | 'entity'>('entity');
	let combatantType = $state<'hero' | 'creature'>('hero');
	let selectedEntity = $state<BaseEntity | null>(null);
	let searchQuery = $state('');
	let hp = $state('');
	let maxHp = $state('');
	let ac = $state('');
	let initiative = $state('');

	// Quick-add fields
	let quickName = $state('');
	let quickHp = $state('');
	let quickType = $state<'hero' | 'creature'>('creature');
	let quickThreat = $state('1');

	// Token indicator field (shared between modes)
	let tokenIndicator = $state('');

	// Hero-specific fields
	let resourceName = $state('');
	let resourceCurrent = $state('');
	let resourceMax = $state('');

	// Creature-specific fields
	let threat = $state('1');

	// Validation errors
	let errors = $state<Record<string, string>>({});

	// Get entities based on type
	const availableEntities = $derived.by(() => {
		const entities = entitiesStore.entities;
		const filtered =
			combatantType === 'hero'
				? entities.filter((e) => e.type === 'character')
				: entities.filter((e) => e.type === 'npc');

		if (!searchQuery.trim()) return filtered;

		return filtered.filter((e) =>
			e.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	const canSubmit = $derived.by(() => {
		if (addMode === 'quick') {
			return quickName.trim() !== '' && quickHp !== '' && parseInt(quickHp, 10) > 0;
		}
		// Entity mode - only require hp, not maxHp
		if (!selectedEntity) return false;
		if (!hp) return false;
		return Object.keys(errors).length === 0;
	});

	// Reset form when type or mode changes
	$effect(() => {
		if (combatantType || addMode) {
			selectedEntity = null;
			clearForm();
		}
	});

	// Reset form when modal closes
	$effect(() => {
		if (!open) {
			addMode = 'entity';
			combatantType = 'hero';
			selectedEntity = null;
			clearForm();
		}
	});

	// Validate fields
	$effect(() => {
		const newErrors: Record<string, string> = {};

		const hpNum = parseInt(hp, 10);
		const maxHpNum = parseInt(maxHp, 10);

		if (hp && hpNum < 0) {
			newErrors.hp = 'HP must be positive';
		}

		if (maxHp && maxHpNum <= 0) {
			newErrors.maxHp = 'Max HP must be greater than 0';
		}

		// Only validate HP <= maxHp if both are provided
		if (hp && maxHp && maxHpNum > 0 && hpNum > maxHpNum) {
			newErrors.hp = 'HP cannot exceed Max HP';
		}

		if (combatantType === 'hero') {
			const currentNum = parseInt(resourceCurrent, 10);
			const maxNum = parseInt(resourceMax, 10);

			if (resourceCurrent && resourceMax && currentNum > maxNum) {
				newErrors.resourceCurrent = 'Current cannot exceed max';
			}
		}

		errors = newErrors;
	});

	function clearForm() {
		searchQuery = '';
		hp = '';
		maxHp = '';
		ac = '';
		initiative = '';
		resourceName = '';
		resourceCurrent = '';
		resourceMax = '';
		threat = '1';
		quickName = '';
		quickHp = '';
		quickThreat = '1';
		tokenIndicator = '';
		errors = {};
	}

	function handleEntitySelect(entity: BaseEntity) {
		selectedEntity = entity;
	}

	function handleSubmit() {
		if (!canSubmit) return;

		if (addMode === 'quick') {
			const quickData: AddQuickCombatantInput = {
				type: quickType,
				name: quickName.trim(),
				hp: parseInt(quickHp, 10),
				threat: quickType === 'creature' ? (() => {
					// Read from DOM to ensure we get the latest value even if binding hasn't updated
					const threatElement = document.getElementById('quick-threat-level') as HTMLSelectElement;
					const threatValue = threatElement ? threatElement.value : quickThreat;
					return parseInt(threatValue, 10);
				})() : undefined,
				tokenIndicator: tokenIndicator.trim() || undefined
			};

			onAdd?.(quickData);
			onClose?.();
			return;
		}

		if (!selectedEntity) return;

		if (combatantType === 'hero') {
			const heroData: AddHeroCombatantInput = {
				name: selectedEntity.name,
				entityId: selectedEntity.id,
				hp: parseInt(hp, 10),
				maxHp: maxHp ? parseInt(maxHp, 10) : undefined,
				ac: ac ? parseInt(ac, 10) : undefined,
				tokenIndicator: tokenIndicator.trim() || undefined,
				heroicResource: resourceName ? {
					name: resourceName,
					current: resourceCurrent ? parseInt(resourceCurrent, 10) : 0,
					max: resourceMax ? parseInt(resourceMax, 10) : 0
				} : undefined
			};
			onAdd?.(heroData);
		} else {
			const creatureData: AddCreatureCombatantInput = {
				name: selectedEntity.name,
				entityId: selectedEntity.id,
				hp: parseInt(hp, 10),
				maxHp: maxHp ? parseInt(maxHp, 10) : undefined,
				ac: ac ? parseInt(ac, 10) : undefined,
				tokenIndicator: tokenIndicator.trim() || undefined,
				threat: parseInt(threat, 10)
			};
			onAdd?.(creatureData);
		}

		onClose?.();
	}

	function handleClose() {
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	// Focus management
	let searchInputRef: HTMLInputElement | undefined;

	$effect(() => {
		if (open && searchInputRef) {
			setTimeout(() => searchInputRef?.focus(), 100);
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<h2 id="modal-title" class="text-xl font-bold text-slate-900 dark:text-white">
					Add Combatant
				</h2>
				<button
					class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
					onclick={handleClose}
					aria-label="Close modal"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6">
				<!-- Add Method Toggle -->
				<div>
					<label class="label">Add Method</label>
					<div class="flex gap-2">
						<button
							class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
								addMode === 'quick'
									? 'bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-700 dark:text-purple-300 active selected'
									: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
							}`}
							onclick={() => (addMode = 'quick')}
							role="button"
							aria-pressed={addMode === 'quick'}
						>
							Quick Add
						</button>
						<button
							class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
								addMode === 'entity'
									? 'bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-700 dark:text-purple-300 active selected'
									: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
							}`}
							onclick={() => (addMode = 'entity')}
							role="button"
							aria-pressed={addMode === 'entity'}
						>
							From Entity
						</button>
					</div>
				</div>

				{#if addMode === 'quick'}
					<!-- Quick-Add Form -->
					<div class="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
						<!-- Quick Type Toggle -->
						<div>
							<label class="label">Type</label>
							<div class="flex gap-2">
								<button
									class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
										quickType === 'hero'
											? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
											: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
									}`}
									onclick={() => (quickType = 'hero')}
									role="button"
									aria-pressed={quickType === 'hero'}
								>
									<User class="inline-block w-4 h-4 mr-2" />
									Hero
								</button>
								<button
									class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
										quickType === 'creature'
											? 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 active selected'
											: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
									}`}
									onclick={() => (quickType = 'creature')}
									role="button"
									aria-pressed={quickType === 'creature'}
								>
									<Skull class="inline-block w-4 h-4 mr-2" />
									Creature
								</button>
							</div>
						</div>

						<!-- Quick Name -->
						<div>
							<label for="quick-name" class="label">Name</label>
							<input
								id="quick-name"
								type="text"
								class="input"
								bind:value={quickName}
								placeholder="e.g., Goblin, Guard, Dragon"
								aria-label="Combatant name"
							/>
						</div>

						<!-- Quick HP -->
						<div>
							<label for="quick-hp" class="label">HP</label>
							<input
								id="quick-hp"
								type="number"
								class="input"
								bind:value={quickHp}
								min="1"
								step="1"
								placeholder="Current HP"
								aria-label="HP"
							/>
						</div>

						<!-- Quick Threat Level (for creatures only) -->
						{#if quickType === 'creature'}
							<div>
								<label for="quick-threat-level" class="label">Threat Level</label>
								<select id="quick-threat-level" class="input" bind:value={quickThreat} aria-label="Threat level">
									<option value="1">1 - Standard</option>
									<option value="2">2 - Elite</option>
									<option value="3">3 - Boss</option>
								</select>
							</div>
						{/if}

						<!-- Token Indicator -->
						<div>
							<label for="quick-token-indicator" class="label">Token Indicator (optional)</label>
							<input
								id="quick-token-indicator"
								type="text"
								class="input"
								bind:value={tokenIndicator}
								placeholder="e.g., 1, A, red base"
								aria-label="Token Indicator"
							/>
						</div>
					</div>
				{:else}
					<!-- Entity Mode -->
					<!-- Type Toggle -->
					<div>
						<label class="label">Type</label>
						<div class="flex gap-2">
							<button
								class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
									combatantType === 'hero'
										? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
										: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
								}`}
								onclick={() => (combatantType = 'hero')}
								role="button"
								aria-pressed={combatantType === 'hero'}
							>
								<User class="inline-block w-4 h-4 mr-2" />
								Hero
							</button>
							<button
								class={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
									combatantType === 'creature'
										? 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 active selected'
										: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
								}`}
								onclick={() => (combatantType = 'creature')}
								role="button"
								aria-pressed={combatantType === 'creature'}
							>
								<Skull class="inline-block w-4 h-4 mr-2" />
								Creature
							</button>
						</div>
					</div>

					<!-- Entity Search -->
					<div>
						<label for="entity-search" class="label">Search Entity</label>
						<input
							id="entity-search"
							type="text"
							class="input"
							bind:value={searchQuery}
							bind:this={searchInputRef}
							placeholder={`Search ${combatantType === 'hero' ? 'characters' : 'NPCs'}...`}
							aria-label="Search entity"
						/>
					</div>

					<!-- Entity List -->
					<div>
						{#if availableEntities.length === 0}
							<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
								{#if searchQuery}
									No entities found
								{:else}
									No {combatantType === 'hero' ? 'characters' : 'NPCs'} available
								{/if}
							</p>
						{:else}
							<div class="space-y-2 max-h-48 overflow-y-auto">
								{#each availableEntities as entity (entity.id)}
									<button
										class={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
											selectedEntity?.id === entity.id
												? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 selected active'
												: 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
										}`}
										onclick={() => handleEntitySelect(entity)}
									>
										{entity.name}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Stats -->
					<div class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
						<!-- HP -->
						<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="hp" class="label">Hit Points</label>
									<input
										id="hp"
										type="number"
										class="input"
										bind:value={hp}
										min="0"
										step="1"
										aria-label="Hit Points"
									/>
									{#if errors.hp}
										<p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors.hp}</p>
									{/if}
								</div>
								<div>
									<label for="max-hp" class="label">Max HP (optional)</label>
									<input
										id="max-hp"
										type="number"
										class="input"
										bind:value={maxHp}
										min="1"
										step="1"
										placeholder="Optional"
										aria-label="Maximum"
									/>
									{#if errors.maxHp}
										<p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxHp}</p>
									{/if}
								</div>
						</div>

						<!-- AC and Initiative -->
						<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="ac" class="label">AC (Armor Class)</label>
									<input
										id="ac"
										type="number"
										class="input"
										bind:value={ac}
										min="0"
										step="1"
										aria-label="AC"
									/>
								</div>
								<div>
									<label for="initiative" class="label">Initiative</label>
									<input
										id="initiative"
										type="number"
										class="input"
										bind:value={initiative}
										step="1"
										aria-label="Initiative"
									/>
								</div>
						</div>

						<!-- Hero-specific: Heroic Resource -->
						{#if combatantType === 'hero'}
								<div class="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<h3 class="font-medium text-blue-900 dark:text-blue-100">Heroic Resource (optional)</h3>

									<div>
										<label for="resource-name" class="label">Resource Name</label>
										<input
											id="resource-name"
											type="text"
											class="input"
											bind:value={resourceName}
											placeholder="e.g., Victories, Focus"
											aria-label="Resource name"
											list="resource-suggestions"
										/>
										<datalist id="resource-suggestions">
											<option value="Victories"></option>
											<option value="Focus"></option>
											<option value="Fury"></option>
											<option value="Resolve"></option>
										</datalist>
									</div>

									<div class="grid grid-cols-2 gap-4">
										<div>
											<label for="resource-current" class="label">Current</label>
											<input
												id="resource-current"
												type="number"
												class="input"
												bind:value={resourceCurrent}
												min="0"
												step="1"
												aria-label="Current"
											/>
											{#if errors.resourceCurrent}
												<p class="text-xs text-red-600 dark:text-red-400 mt-1">
													{errors.resourceCurrent}
												</p>
											{/if}
										</div>
										<div>
											<label for="resource-max" class="label">Max</label>
											<input
												id="resource-max"
												type="number"
												class="input"
												bind:value={resourceMax}
												min="0"
												step="1"
												aria-label="Max"
											/>
										</div>
									</div>
							</div>
						{/if}

						<!-- Creature-specific: Threat Level -->
						{#if combatantType === 'creature'}
								<div>
									<label for="threat-level" class="label">Threat Level</label>
									<select id="threat-level" class="input" bind:value={threat} aria-label="Threat level">
										<option value="1">1 - Standard</option>
										<option value="2">2 - Elite</option>
										<option value="3">3 - Boss</option>
									</select>
							</div>
						{/if}
					</div>

					<!-- Token Indicator (always visible in entity mode) -->
					<div>
						<label for="token-indicator" class="label">Token Indicator (optional)</label>
						<input
							id="token-indicator"
							type="text"
							class="input"
							bind:value={tokenIndicator}
							placeholder="e.g., 1, A, red base"
							aria-label="Token Indicator"
						/>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
				<button class="btn btn-secondary flex-1" onclick={handleClose}>Cancel</button>
				<button class="btn btn-primary flex-1" onclick={handleSubmit} disabled={!canSubmit}>
					Add
				</button>
			</div>
		</div>
	</div>
{/if}
