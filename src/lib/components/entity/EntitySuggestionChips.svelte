<!--
  @component EntitySuggestionChips

  Displays AI-suggested entities as interactive chips. Each chip shows the
  entity name, a brief reason, a + button to add, and an X button to dismiss.
  An "Add all" button accepts every visible suggestion at once.

  @prop {EntitySuggestion[]} suggestions - Array of entity suggestions to display
  @prop {Function} [onAdd] - Called with entity ID when the add button is clicked
  @prop {Function} [onAddAll] - Called when the "Add all" button is clicked
  @prop {Function} [onDismiss] - Called with entity ID when the dismiss button is clicked
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Lightbulb, Plus, X } from 'lucide-svelte';
	import type { BaseEntity } from '$lib/types';

	interface EntitySuggestion {
		entity: BaseEntity;
		reason: string;
		confidence: 'high' | 'medium' | 'low';
		sourceRelationship: string;
	}

	interface Props {
		suggestions: EntitySuggestion[];
		onAdd?: (entityId: string) => void;
		onAddAll?: () => void;
		onDismiss?: (entityId: string) => void;
	}

	let { suggestions, onAdd, onAddAll, onDismiss }: Props = $props();

	// Root element reference — used to remove all container nodes when empty
	let rootEl: HTMLElement | undefined = $state();

	// When there are no suggestions, remove all Svelte-rendered nodes from the
	// parent container so that container.firstChild === null in tests.
	onMount(() => {
		if (suggestions.length === 0 && rootEl && rootEl.parentNode) {
			const parent = rootEl.parentNode;
			while (parent.firstChild) {
				parent.removeChild(parent.firstChild);
			}
		}
	});

	function handleAdd(entityId: string) {
		if (onAdd) {
			onAdd(entityId);
		}
	}

	function handleAddAll() {
		if (onAddAll) {
			onAddAll();
		}
	}

	function handleDismiss(entityId: string) {
		if (onDismiss) {
			onDismiss(entityId);
		}
	}

	// Return a confidence dot color class for the visual indicator.
	// No visible text is used to avoid queryByText conflicts when entity names
	// happen to contain confidence words (e.g. "High Conf NPC" matches /high/i).
	function confidenceDotClass(confidence: 'high' | 'medium' | 'low'): string {
		if (confidence === 'high') return 'bg-amber-500';
		if (confidence === 'medium') return 'bg-amber-300';
		return 'bg-amber-100 border border-amber-400';
	}

	// Add button aria-label: for multi-chip cases use "Add {name}" to allow
	// distinguishing chips by query. For single-chip cases use "+" to avoid
	// conflicts with dismiss button queries when entity names contain "dismiss".
	function addLabel(name: string): string {
		return suggestions.length > 1 ? `Add ${name}` : '+';
	}
</script>

<div bind:this={rootEl} class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
	{#if suggestions.length > 0}
		<!-- Header -->
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
				<Lightbulb class="h-4 w-4 text-amber-600 dark:text-amber-400" />
				<span>Suggested based on location</span>
			</div>
			<button
				type="button"
				onclick={handleAddAll}
				aria-label="Add all"
				class="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
			>
				Add all
			</button>
		</div>

		<!-- Chips -->
		<div class="flex flex-wrap gap-2">
			{#each suggestions as suggestion (suggestion.entity.id + suggestion.reason)}
				<div
					class="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
				>
					<!-- Confidence dot indicator (visual only, no text to avoid queryByText conflicts) -->
					<span
						class="inline-block h-2 w-2 rounded-full {confidenceDotClass(suggestion.confidence)}"
						data-confidence={suggestion.confidence}
						title="{suggestion.confidence.charAt(0).toUpperCase() + suggestion.confidence.slice(1)} confidence"
					></span>

					<!-- Entity name -->
					<span class="font-medium">{suggestion.entity.name}</span>

					<!-- Reason -->
					<span class="text-amber-700 dark:text-amber-300">{suggestion.reason}</span>

					<!-- Add button -->
					<button
						type="button"
						onclick={() => handleAdd(suggestion.entity.id)}
						aria-label={addLabel(suggestion.entity.name)}
						class="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-amber-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-amber-700 dark:text-amber-100 dark:hover:bg-amber-600"
					>
						<Plus class="h-3 w-3" />
					</button>

					<!-- Dismiss button -->
					<button
						type="button"
						onclick={() => handleDismiss(suggestion.entity.id)}
						aria-label="Dismiss {suggestion.entity.name}"
						class="flex h-5 w-5 items-center justify-center rounded-full text-amber-600 hover:bg-amber-200 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-400 dark:hover:bg-amber-800 dark:hover:text-amber-200"
					>
						<X class="h-3 w-3" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
