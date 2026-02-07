<script lang="ts">
	/**
	 * ArgumentControls Component
	 *
	 * Issue #382: Implement Negotiation UI components (TDD - GREEN phase)
	 *
	 * Provides controls for recording negotiation arguments:
	 * - Argument type selector (motivation, no_motivation, pitfall)
	 * - Motivation type dropdown (12 options, disables used ones)
	 * - Tier buttons (1, 2, 3)
	 * - Optional player name input
	 * - Optional notes textarea
	 * - Preview panel showing expected outcome
	 * - Validation and record button
	 */

	import type { MotivationType } from '$lib/types/negotiation';

	interface Props {
		usedMotivations: string[];
		onRecord?: (data: {
			argumentType: string;
			tier: number;
			motivationType?: string;
			playerName?: string;
			notes?: string;
		}) => void;
	}

	let { usedMotivations, onRecord }: Props = $props();

	// Form state
	let argumentType = $state<'motivation' | 'no_motivation' | 'pitfall'>('motivation');
	let selectedMotivation = $state<string>('benevolence');
	let selectedTier = $state<1 | 2 | 3>(1);
	let playerName = $state('');
	let notes = $state('');

	// All 12 motivation types
	const allMotivations: MotivationType[] = [
		'benevolence',
		'discovery',
		'freedom',
		'greed',
		'higher_authority',
		'justice',
		'legacy',
		'peace',
		'power',
		'protection',
		'revelry',
		'vengeance'
	];

	// Check if a motivation is disabled
	const isMotivationDisabled = (motivation: string) => usedMotivations.includes(motivation);

	// Check if all motivations are used
	const allMotivationsUsed = $derived(
		allMotivations.every((m) => usedMotivations.includes(m))
	);

	// Calculate outcome preview based on argument type and tier
	// Draw Steel rules:
	// - Motivation Appeal: Tier 1 = +0 interest/-1 patience, Tier 2 = +1 interest/-1 patience, Tier 3 = +1 interest/+0 patience
	// - No Motivation: Tier 1 = -1 interest/-1 patience, Tier 2 = +0 interest/-1 patience, Tier 3 = +1 interest/-1 patience
	// - Pitfall: Always -1 interest/-1 patience
	const outcomePreview = $derived(() => {
		if (argumentType === 'motivation') {
			if (selectedTier === 1) return { interest: '+0', patience: '-1' };
			if (selectedTier === 2) return { interest: '+1', patience: '-1' };
			return { interest: '+1', patience: '+0' };
		} else if (argumentType === 'no_motivation') {
			if (selectedTier === 1) return { interest: '-1', patience: '-1' };
			if (selectedTier === 2) return { interest: '+0', patience: '-1' };
			return { interest: '+1', patience: '-1' };
		} else {
			// pitfall
			return { interest: '-1', patience: '-1' };
		}
	});

	// Check if record button should be disabled
	const isRecordDisabled = $derived(() => {
		if (argumentType === 'motivation' || argumentType === 'pitfall') {
			return allMotivationsUsed;
		}
		return false;
	});

	// Handle record button click
	function handleRecord() {
		const data: any = {
			argumentType,
			tier: selectedTier
		};

		if (argumentType === 'motivation' || argumentType === 'pitfall') {
			data.motivationType = selectedMotivation;
		}

		if (playerName.trim()) {
			data.playerName = playerName.trim();
		}

		if (notes.trim()) {
			data.notes = notes.trim();
		}

		onRecord?.(data);
	}

	// Format motivation type for display
	function formatMotivationType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="space-y-4">
	<!-- Argument Type Selector -->
	<div>
		<label for="argument-type" class="block text-sm font-medium mb-1">
			Argument Type
		</label>
		<select
			id="argument-type"
			bind:value={argumentType}
			class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
		>
			<option value="motivation">Motivation</option>
			<option value="no_motivation">Generic (No Motivation)</option>
			<option value="pitfall">Pitfall</option>
		</select>
	</div>

	<!-- Motivation Type Dropdown (shown for motivation and pitfall only) -->
	{#if argumentType === 'motivation'}
		<div>
			<label for="motivation-type" class="block text-sm font-medium mb-1">
				Motivation Type
			</label>
			<select
				id="motivation-type"
				bind:value={selectedMotivation}
				required
				class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
			>
				{#each allMotivations as motivation}
					<option
						value={motivation}
						disabled={isMotivationDisabled(motivation)}
						aria-disabled={isMotivationDisabled(motivation)}
					>
						{formatMotivationType(motivation)}
						{#if isMotivationDisabled(motivation)}(Used){/if}
					</option>
				{/each}
			</select>
		</div>
	{:else if argumentType === 'pitfall'}
		<div>
			<label for="motivation-type" class="block text-sm font-medium mb-1">
				Pitfall Type
			</label>
			<select
				id="motivation-type"
				bind:value={selectedMotivation}
				required
				class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
			>
				{#each allMotivations as motivation}
					<option
						value={motivation}
						disabled={isMotivationDisabled(motivation)}
						aria-disabled={isMotivationDisabled(motivation)}
					>
						{formatMotivationType(motivation)}
						{#if isMotivationDisabled(motivation)}(Used){/if}
					</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- All Motivations Used Warning -->
	{#if allMotivationsUsed && (argumentType === 'motivation' || argumentType === 'pitfall')}
		<div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
			All motivations have been used
		</div>
	{/if}

	<!-- Tier Buttons -->
	<div>
		<label class="block text-sm font-medium mb-2">Tier</label>
		<div role="group" aria-label="Tier selection" class="flex gap-2">
			<button
				type="button"
				onclick={() => (selectedTier = 1)}
				aria-pressed={selectedTier === 1}
				class="flex-1 rounded-md border px-4 py-2 font-medium transition-colors {selectedTier === 1
					? 'border-blue-500 bg-blue-500 text-white selected active primary'
					: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
			>
				Tier 1
			</button>
			<button
				type="button"
				onclick={() => (selectedTier = 2)}
				aria-pressed={selectedTier === 2}
				class="flex-1 rounded-md border px-4 py-2 font-medium transition-colors {selectedTier === 2
					? 'border-blue-500 bg-blue-500 text-white selected active primary'
					: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
			>
				Tier 2
			</button>
			<button
				type="button"
				onclick={() => (selectedTier = 3)}
				aria-pressed={selectedTier === 3}
				class="flex-1 rounded-md border px-4 py-2 font-medium transition-colors {selectedTier === 3
					? 'border-blue-500 bg-blue-500 text-white selected active primary'
					: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
			>
				Tier 3
			</button>
		</div>
	</div>

	<!-- Player Name Input -->
	<div>
		<label for="player-name" class="block text-sm font-medium mb-1">
			Player Name
		</label>
		<input
			id="player-name"
			type="text"
			bind:value={playerName}
			placeholder="Optional"
			class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
		/>
	</div>

	<!-- Notes Input -->
	<div>
		<label for="notes" class="block text-sm font-medium mb-1">
			Notes
		</label>
		<textarea
			id="notes"
			bind:value={notes}
			rows="3"
			placeholder="Optional"
			class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
		></textarea>
	</div>

	<!-- Outcome Preview -->
	<div class="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
		<h4 class="text-sm font-medium mb-2">Expected Outcome:</h4>
		<div class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
			<div>{outcomePreview().interest} Interest</div>
			<div>{outcomePreview().patience} Patience</div>
		</div>
	</div>

	<!-- Record Button -->
	<button
		type="button"
		onclick={handleRecord}
		disabled={isRecordDisabled()}
		class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
	>
		Record Argument
	</button>
</div>
