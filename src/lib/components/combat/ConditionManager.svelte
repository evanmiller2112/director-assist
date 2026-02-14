<script lang="ts">
	import { Plus, Minus, X, AlertTriangle } from 'lucide-svelte';
	import type { Combatant, CombatCondition } from '$lib/types/combat';
	import ConditionBadge from './ConditionBadge.svelte';

	interface Props {
		combatant: Combatant;
		onAddCondition: (condition: Omit<CombatCondition, 'name'> & { name: string }) => void | Promise<void>;
		onRemoveCondition: (conditionName: string) => void | Promise<void>;
		onUpdateDuration: (conditionName: string, newDuration: number) => void | Promise<void>;
		showPresets?: boolean;
		sortByDuration?: boolean;
	}

	let {
		combatant,
		onAddCondition,
		onRemoveCondition,
		onUpdateDuration,
		showPresets = false,
		sortByDuration = false
	}: Props = $props();

	let showAddForm = $state(false);
	let newConditionName = $state('');
	let newConditionDuration = $state('1');
	let newConditionSource = $state('');
	let newConditionDescription = $state('');
	let editingDuration = $state<string | null>(null);
	let editDurationValue = $state('');
	let showRemoveConfirm = $state<string | null>(null);

	const commonConditions = [
		{ name: 'Stunned', description: 'Cannot take actions or move', duration: 1 },
		{ name: 'Slowed', description: 'Movement reduced', duration: 2 },
		{ name: 'Bleeding', description: 'Takes damage at turn start', duration: 3 },
		{ name: 'Poisoned', description: 'Disadvantage on attacks', duration: 3 },
		{ name: 'Blessed', description: 'Bonus to rolls', duration: 0 }
	];

	const sortedConditions = $derived(() => {
		const conditions = [...combatant.conditions];
		if (sortByDuration) {
			return conditions.sort((a, b) => {
				if (a.duration === -1) return 1;
				if (b.duration === -1) return -1;
				return a.duration - b.duration;
			});
		}
		return conditions;
	});

	function getDurationText(duration: number): string {
		if (duration === -1) return 'Permanent';
		if (duration === 0) return 'Until end of combat';
		return `${duration} ${duration === 1 ? 'round' : 'rounds'}`;
	}

	function isConditionExpiring(duration: number): boolean {
		return duration === 1;
	}

	async function handleAddCondition() {
		if (!newConditionName.trim()) return;

		await onAddCondition({
			name: newConditionName,
			duration: parseInt(newConditionDuration, 10),
			source: newConditionSource,
			description: newConditionDescription || undefined
		});

		// Reset form
		newConditionName = '';
		newConditionDuration = '1';
		newConditionSource = '';
		newConditionDescription = '';
		showAddForm = false;
	}

	async function handleRemove(conditionName: string, isPermanent: boolean) {
		if (isPermanent) {
			showRemoveConfirm = conditionName;
		} else {
			await onRemoveCondition(conditionName);
		}
	}

	async function confirmRemove(conditionName: string) {
		await onRemoveCondition(conditionName);
		showRemoveConfirm = null;
	}

	async function handleIncrementDuration(conditionName: string, currentDuration: number) {
		await onUpdateDuration(conditionName, currentDuration + 1);
	}

	async function handleDecrementDuration(conditionName: string, currentDuration: number) {
		if (currentDuration > 0) {
			await onUpdateDuration(conditionName, currentDuration - 1);
		}
	}

	function startEditingDuration(conditionName: string, currentDuration: number) {
		editingDuration = conditionName;
		editDurationValue = currentDuration.toString();
	}

	async function saveEditedDuration(conditionName: string) {
		const newDuration = parseInt(editDurationValue, 10);
		if (!isNaN(newDuration)) {
			await onUpdateDuration(conditionName, newDuration);
		}
		editingDuration = null;
	}

	function usePreset(preset: typeof commonConditions[0]) {
		newConditionName = preset.name;
		newConditionDescription = preset.description;
		newConditionDuration = preset.duration.toString();
	}

	const canSubmit = $derived(newConditionName.trim().length > 0);
</script>

<div class="condition-manager space-y-4" role="status" aria-live="polite">
	<!-- Condition List -->
	{#if combatant.conditions.length > 0}
		<ul class="space-y-2" role="list" aria-label="Current conditions" data-testid="conditions-list">
			{#each sortedConditions() as condition}
				<li
					class={`condition-item p-3 rounded-lg border ${
						isConditionExpiring(condition.duration)
							? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 warning expiring'
							: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
					}`}
					data-testid="condition-item"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="flex-1 min-w-0">
							<div
								class="font-medium text-slate-900 dark:text-white truncate ellipsis"
								onmouseenter={(e) => {
									if (condition.description) {
										e.currentTarget.setAttribute('title', condition.description);
									}
								}}
							>
								{condition.name}
							</div>
							{#if condition.source}
								<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
									{condition.source}
								</div>
							{/if}
							<div class="text-sm text-slate-600 dark:text-slate-300 mt-1">
								{#if editingDuration === condition.name}
									<input
										type="number"
										class="input w-20 text-sm"
										bind:value={editDurationValue}
										onblur={() => saveEditedDuration(condition.name)}
										min="0"
										step="1"
									/>
								{:else}
									<button
										class="text-left hover:underline"
										onclick={() => startEditingDuration(condition.name, condition.duration)}
									>
										{getDurationText(condition.duration)}
									</button>
								{/if}
							</div>
							{#if condition.description}
								<div
									class="text-xs text-slate-500 dark:text-slate-400 mt-1"
									onmouseenter={() => {}}
								>
									{condition.description}
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-1">
							{#if condition.duration > 0}
								<button
									class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
									onclick={() => handleIncrementDuration(condition.name, condition.duration)}
									aria-label="+"
									title="Increase duration"
								>
									<Plus class="w-4 h-4" aria-hidden="true" />
									<span class="sr-only">+</span>
								</button>
								<button
									class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
									onclick={() => handleDecrementDuration(condition.name, condition.duration)}
									disabled={condition.duration === 0}
									aria-label="-"
									title="Decrease duration"
								>
									<Minus class="w-4 h-4" aria-hidden="true" />
									<span class="sr-only">-</span>
								</button>
							{/if}
							<button
								class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
								onclick={() => handleRemove(condition.name, condition.duration === -1)}
								aria-label={`Remove ${condition.name} condition`}
								title="Remove condition"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
			No conditions applied
		</p>
	{/if}

	<!-- Add Condition Button -->
	{#if !showAddForm}
		<button class="btn btn-secondary w-full" onclick={() => (showAddForm = true)}>
			<Plus class="w-4 h-4" />
			Add Condition
		</button>
	{/if}

	<!-- Add Condition Form -->
	{#if showAddForm}
		<div class="add-condition-form p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
			<h3 class="text-sm font-medium text-slate-900 dark:text-white mb-3">Add Condition</h3>

			{#if showPresets}
				<div class="mb-3">
					<label class="label text-xs">Common Conditions</label>
					<div class="flex flex-wrap gap-2">
						{#each commonConditions as preset}
							<button
								class="text-xs px-2 py-1 rounded text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
								onclick={() => usePreset(preset)}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div class="space-y-3">
				<div>
					<label for="condition-name" class="label">Condition Name</label>
					<input
						id="condition-name"
						type="text"
						class="input"
						bind:value={newConditionName}
						placeholder="e.g., Stunned"
						aria-label="Condition name"
					/>
				</div>

				<div>
					<label for="condition-duration" class="label">Duration</label>
					<input
						id="condition-duration"
						type="number"
						class="input"
						bind:value={newConditionDuration}
						min="-1"
						step="1"
						aria-label="Duration in rounds"
					/>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
						-1 = Permanent, 0 = Until end of combat, 1+ = Rounds
					</p>
				</div>

				<div>
					<label for="condition-source" class="label">Source</label>
					<input
						id="condition-source"
						type="text"
						class="input"
						bind:value={newConditionSource}
						placeholder="e.g., Spell, Weapon"
						aria-label="Condition source"
					/>
				</div>

				<div>
					<label for="condition-description" class="label">Description (optional)</label>
					<textarea
						id="condition-description"
						class="input"
						bind:value={newConditionDescription}
						placeholder="Effect description"
						rows="2"
						aria-label="Condition description"
					></textarea>
				</div>

				<div class="flex gap-2">
					<button
						class="btn btn-primary flex-1"
						onclick={handleAddCondition}
						disabled={!canSubmit}
					>
						Save
					</button>
					<button class="btn btn-secondary" onclick={() => (showAddForm = false)}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Remove Confirmation Dialog -->
	{#if showRemoveConfirm}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			role="dialog"
			aria-modal="true"
		>
			<div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4">
				<div class="flex items-center gap-3 mb-4">
					<AlertTriangle class="w-6 h-6 text-amber-500" />
					<h3 class="text-lg font-medium text-slate-900 dark:text-white">
						Are you sure?
					</h3>
				</div>
				<p class="text-sm text-slate-600 dark:text-slate-300 mb-6">
					This is a permanent condition. Remove it anyway?
				</p>
				<div class="flex gap-3 justify-end">
					<button class="btn btn-secondary" onclick={() => (showRemoveConfirm = null)}>
						Cancel
					</button>
					<button
						class="btn bg-red-600 text-white hover:bg-red-700"
						onclick={() => showRemoveConfirm && confirmRemove(showRemoveConfirm)}
					>
						Remove
					</button>
				</div>
			</div>
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
