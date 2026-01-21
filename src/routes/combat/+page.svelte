<script lang="ts">
	import { Swords, Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { combatStore } from '$lib/stores';
	import { formatDistanceToNow } from 'date-fns';

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
					<!-- Status Badge -->
					<div class="flex items-center justify-between mb-3">
						<span
							class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(combat.status)}`}
							data-testid="status-badge"
						>
							{combat.status.charAt(0).toUpperCase() + combat.status.slice(1)}
						</span>
						{#if combat.status === 'active' || combat.status === 'paused'}
							<span class="text-sm font-medium text-slate-600 dark:text-slate-400">
								Round {combat.currentRound}
							</span>
						{/if}
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
