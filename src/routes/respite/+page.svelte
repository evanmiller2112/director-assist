<script lang="ts">
	import { Coffee, Plus, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { respiteStore } from '$lib/stores';
	import { formatDistanceToNow } from 'date-fns';

	let confirmDeleteId = $state<string | null>(null);

	const respites = $derived(respiteStore.respites);

	// Sort respites: active first, then by most recently updated
	const sortedRespites = $derived.by(() => {
		return [...respites].sort((a, b) => {
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		});
	});

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
			case 'preparing':
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
			case 'completed':
				return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
			default:
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
		}
	}

	function handleNewRespite() {
		goto('/respite/new');
	}

	function handleRespiteClick(respiteId: string) {
		goto(`/respite/${respiteId}`);
	}

	function handleCardKeydown(event: KeyboardEvent, respiteId: string) {
		if (event.key === 'Enter') {
			goto(`/respite/${respiteId}`);
		}
	}

	function handleDeleteClick(event: MouseEvent, respiteId: string) {
		event.stopPropagation();
		confirmDeleteId = respiteId;
	}

	async function handleConfirmDelete() {
		if (confirmDeleteId) {
			await respiteStore.deleteRespite(confirmDeleteId);
			confirmDeleteId = null;
		}
	}

	function handleCancelDelete() {
		confirmDeleteId = null;
	}
</script>

<div class="respite-list-page p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<Coffee class="w-8 h-8 text-slate-700 dark:text-slate-300" />
			<h1 class="text-3xl font-bold text-slate-900 dark:text-white">Respites</h1>
		</div>
		<button class="btn btn-primary" onclick={handleNewRespite}>
			<Plus class="w-4 h-4" />
			New Respite
		</button>
	</div>

	<!-- Respite Grid -->
	{#if sortedRespites.length === 0}
		<div class="text-center py-16 px-4">
			<Coffee class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
				No respites yet
			</h2>
			<p class="text-slate-500 dark:text-slate-400 mb-6">
				Create your first respite to track hero downtime
			</p>
			<button class="btn btn-primary" onclick={handleNewRespite}>
				<Plus class="w-4 h-4" />
				New Respite
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each sortedRespites as respite (respite.id)}
				<div
					class="respite-card p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
					data-testid="respite-card"
					role="button"
					tabindex="0"
					aria-label="{respite.name} - {respite.status}"
					onclick={() => handleRespiteClick(respite.id)}
					onkeydown={(e) => handleCardKeydown(e, respite.id)}
				>
					<!-- Status Badge and Delete -->
					<div class="flex items-center justify-between mb-3">
						<span
							class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(respite.status)}`}
							data-testid="status-badge"
						>
							{respite.status.charAt(0).toUpperCase() + respite.status.slice(1)}
						</span>
						<button
							class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
							onclick={(e) => handleDeleteClick(e, respite.id)}
							aria-label="Delete respite"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>

					<!-- Name -->
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2 truncate">
						{respite.name}
					</h3>

					<!-- Description -->
					{#if respite.description}
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
							{respite.description}
						</p>
					{/if}

					<!-- Stats -->
					<div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
						<span>{respite.heroes.length} {respite.heroes.length === 1 ? 'hero' : 'heroes'}</span>
						<span>{respite.activityIds.length} {respite.activityIds.length === 1 ? 'activity' : 'activities'}</span>
					</div>

					<!-- VP Status -->
					{#if respite.victoryPointsAvailable > 0}
						<div class="text-sm text-slate-600 dark:text-slate-400 mb-3">
							<span class="font-medium">{respite.victoryPointsConverted}/{respite.victoryPointsAvailable}</span> VP converted
						</div>
					{/if}

					<!-- Created Date -->
					<div class="text-xs text-slate-500 dark:text-slate-400">
						Created {formatDistanceToNow(new Date(respite.createdAt), { addSuffix: true })}
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
				Delete Respite?
			</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				This will permanently delete this respite session and all its data. This action cannot be undone.
			</p>
			<div class="flex justify-end gap-3">
				<button class="btn btn-secondary" onclick={handleCancelDelete}>Cancel</button>
				<button class="btn bg-red-600 hover:bg-red-700 text-white" onclick={handleConfirmDelete}>Delete</button>
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
