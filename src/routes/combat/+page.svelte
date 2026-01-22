<script lang="ts">
	import { Swords, Plus, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { combatStore } from '$lib/stores';
	import { formatDistanceToNow } from 'date-fns';

	let confirmDeleteId = $state<string | null>(null);

	// Simple reactive access to combats that works with both real store and test mocks
	const combats = $derived(combatStore.getAll());

	// Sort combats: active first, then by most recently updated
	const sortedCombats = $derived.by(() => {
		return [...combats].sort((a, b) => {
			// Active combats first
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;

			// Then by updatedAt (most recent first)
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		});
	});

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
			case 'paused':
				return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
			case 'preparing':
				return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
			case 'completed':
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
			default:
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
		}
	}

	function handleNewCombat() {
		goto('/combat/new');
	}

	function handleCombatClick(combatId: string) {
		goto(`/combat/${combatId}`);
	}

	function handleCardKeydown(event: KeyboardEvent, combatId: string) {
		if (event.key === 'Enter') {
			goto(`/combat/${combatId}`);
		}
	}

	function handleDeleteClick(event: MouseEvent, combatId: string) {
		event.stopPropagation();
		confirmDeleteId = combatId;
	}

	async function handleConfirmDelete() {
		if (confirmDeleteId) {
			await combatStore.deleteCombat(confirmDeleteId);
			confirmDeleteId = null;
		}
	}

	function handleCancelDelete() {
		confirmDeleteId = null;
	}
</script>

<div class="combat-list-page p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<Swords class="w-8 h-8 text-slate-700 dark:text-slate-300" />
			<h1 class="text-3xl font-bold text-slate-900 dark:text-white">Combat Sessions</h1>
		</div>
		<button class="btn btn-primary" onclick={handleNewCombat}>
			<Plus class="w-4 h-4" />
			New Combat
		</button>
	</div>

	<!-- Combat Grid -->
	{#if sortedCombats.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16 px-4">
			<Swords class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
				No combat sessions yet
			</h2>
			<p class="text-slate-500 dark:text-slate-400 mb-6">
				Create your first combat session to get started
			</p>
			<button class="btn btn-primary" onclick={handleNewCombat}>
				<Plus class="w-4 h-4" />
				New Combat
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each sortedCombats as combat (combat.id)}
				<div
					class="combat-card p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
					data-testid="combat-card"
					role="button"
					tabindex="0"
					aria-label={`${combat.name} - ${combat.status}`}
					onclick={() => handleCombatClick(combat.id)}
					onkeydown={(e) => handleCardKeydown(e, combat.id)}
				>
					<!-- Status Badge and Delete Button -->
					<div class="flex items-center justify-between mb-3">
						<span
							class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(combat.status)}`}
							data-testid="status-badge"
						>
							{combat.status.charAt(0).toUpperCase() + combat.status.slice(1)}
						</span>
						<div class="flex items-center gap-2">
							{#if combat.status === 'active' || combat.status === 'paused'}
								<span class="text-sm font-medium text-slate-600 dark:text-slate-400">
									Round {combat.currentRound}
								</span>
							{/if}
							<button
								class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
								onclick={(e) => handleDeleteClick(e, combat.id)}
								aria-label="Delete combat"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>
					</div>

					<!-- Combat Name -->
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2 truncate">
						{combat.name}
					</h3>

					<!-- Description (if exists) -->
					{#if combat.description}
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
							{combat.description}
						</p>
					{/if}

					<!-- Combatants Count -->
					<div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
						<div>
							<span class="font-medium">{combat.combatants.length}</span>
							{combat.combatants.length === 1 ? 'combatant' : 'combatants'}
						</div>
						{#if combat.combatants.length > 0}
							<div>
								{combat.combatants.filter((c) => c.type === 'hero').length} heroes,
								{combat.combatants.filter((c) => c.type === 'creature').length} creatures
							</div>
						{/if}
					</div>

					<!-- Created Date -->
					<div class="text-xs text-slate-500 dark:text-slate-400">
						Created {formatDistanceToNow(new Date(combat.createdAt), { addSuffix: true })}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
{#if confirmDeleteId}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		onclick={handleCancelDelete}
		onkeydown={(e) => e.key === 'Escape' && handleCancelDelete()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-dialog-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="delete-dialog-title" class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
				Delete Combat?
			</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				This will permanently delete this combat session and all its data. This action cannot be undone.
			</p>
			<div class="flex justify-end gap-3">
				<button class="btn btn-secondary" onclick={handleCancelDelete}>
					Cancel
				</button>
				<button
					class="btn bg-red-600 hover:bg-red-700 text-white"
					onclick={handleConfirmDelete}
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
