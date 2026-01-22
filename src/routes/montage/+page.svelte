<script lang="ts">
	import { Theater, Plus, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { montageStore } from '$lib/stores';
	import { formatDistanceToNow } from 'date-fns';

	let confirmDeleteId = $state<string | null>(null);

	const montages = $derived(montageStore.montages);

	// Sort montages: active first, then by most recently updated
	const sortedMontages = $derived.by(() => {
		return [...montages].sort((a, b) => {
			// Active montages first
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
			case 'preparing':
				return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
			case 'completed':
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
			default:
				return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
		}
	}

	function handleNewMontage() {
		goto('/montage/new');
	}

	function handleMontageClick(montageId: string) {
		goto(`/montage/${montageId}`);
	}

	function handleCardKeydown(event: KeyboardEvent, montageId: string) {
		if (event.key === 'Enter') {
			goto(`/montage/${montageId}`);
		}
	}

	function handleDeleteClick(event: MouseEvent, montageId: string) {
		event.stopPropagation();
		confirmDeleteId = montageId;
	}

	async function handleConfirmDelete() {
		if (confirmDeleteId) {
			await montageStore.deleteMontage(confirmDeleteId);
			confirmDeleteId = null;
		}
	}

	function handleCancelDelete() {
		confirmDeleteId = null;
	}
</script>

<div class="montage-list-page p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<Theater class="w-8 h-8 text-slate-700 dark:text-slate-300" />
			<h1 class="text-3xl font-bold text-slate-900 dark:text-white">Montage Sessions</h1>
		</div>
		<button class="btn btn-primary" onclick={handleNewMontage}>
			<Plus class="w-4 h-4" />
			New Montage
		</button>
	</div>

	<!-- Montage Grid -->
	{#if sortedMontages.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16 px-4">
			<Theater class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
				No montage sessions yet
			</h2>
			<p class="text-slate-500 dark:text-slate-400 mb-6">
				Create your first montage session to track challenging tasks
			</p>
			<button class="btn btn-primary" onclick={handleNewMontage}>
				<Plus class="w-4 h-4" />
				New Montage
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each sortedMontages as montage (montage.id)}
				<div
					class="montage-card p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
					role="button"
					tabindex="0"
					aria-label={`${montage.name} - ${montage.status}`}
					onclick={() => handleMontageClick(montage.id)}
					onkeydown={(e) => handleCardKeydown(e, montage.id)}
				>
					<!-- Status Badge and Delete Button -->
					<div class="flex items-center justify-between mb-3">
						<span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(montage.status)}`}>
							{montage.status.charAt(0).toUpperCase() + montage.status.slice(1)}
						</span>
						<div class="flex items-center gap-2">
							{#if montage.status === 'active'}
								<span class="text-sm font-medium text-slate-600 dark:text-slate-400">
									Round {montage.currentRound}
								</span>
							{/if}
							<button
								class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
								onclick={(e) => handleDeleteClick(e, montage.id)}
								aria-label="Delete montage"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>
					</div>

					<!-- Montage Name -->
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2 truncate">
						{montage.name}
					</h3>

					<!-- Description (if exists) -->
					{#if montage.description}
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
							{montage.description}
						</p>
					{/if}

					<!-- Stats -->
					<div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
						<div>
							<span class="font-medium capitalize">{montage.difficulty}</span>
						</div>
						<div>
							<span class="font-medium">{montage.playerCount}</span> {montage.playerCount === 1
								? 'player'
								: 'players'}
						</div>
						{#if montage.challenges.length > 0}
							<div>
								<span class="font-medium">{montage.challenges.length}</span> challenges
							</div>
						{/if}
					</div>

					<!-- Progress (if active or completed) -->
					{#if montage.status === 'active' || montage.status === 'completed'}
						<div class="mb-3 space-y-1">
							<div class="flex justify-between text-xs text-green-700 dark:text-green-400">
								<span>Success</span>
								<span>{montage.successCount}/{montage.successLimit}</span>
							</div>
							<div class="flex justify-between text-xs text-red-700 dark:text-red-400">
								<span>Failure</span>
								<span>{montage.failureCount}/{montage.failureLimit}</span>
							</div>
						</div>
					{/if}

					<!-- Outcome (if completed) -->
					{#if montage.status === 'completed' && montage.outcome}
						<div class="text-sm font-medium mb-2">
							{#if montage.outcome === 'total_success'}
								<span class="text-green-600 dark:text-green-400">Total Success</span>
							{:else if montage.outcome === 'partial_success'}
								<span class="text-yellow-600 dark:text-yellow-400">Partial Success</span>
							{:else}
								<span class="text-red-600 dark:text-red-400">Total Failure</span>
							{/if}
							{#if montage.victoryPoints > 0}
								<span class="text-slate-600 dark:text-slate-400">
									- {montage.victoryPoints} VP
								</span>
							{/if}
						</div>
					{/if}

					<!-- Created Date -->
					<div class="text-xs text-slate-500 dark:text-slate-400">
						Created {formatDistanceToNow(new Date(montage.createdAt), { addSuffix: true })}
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
				Delete Montage?
			</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				This will permanently delete this montage session and all its data. This action cannot be
				undone.
			</p>
			<div class="flex justify-end gap-3">
				<button class="btn btn-secondary" onclick={handleCancelDelete}> Cancel </button>
				<button class="btn bg-red-600 hover:bg-red-700 text-white" onclick={handleConfirmDelete}>
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
