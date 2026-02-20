<script lang="ts">
	import { MessageSquare, Plus, Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { negotiationStore } from '$lib/stores';
	import { formatDistanceToNow } from 'date-fns';

	let confirmDeleteId = $state<string | null>(null);

	const negotiations = $derived(negotiationStore.negotiations);

	// Sort negotiations: active first, then by most recently updated
	const sortedNegotiations = $derived.by(() => {
		return [...negotiations].sort((a, b) => {
			// Active negotiations first
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;

			// Then by updatedAt (most recent first)
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

	function handleNewNegotiation() {
		goto('/negotiation/new');
	}

	function handleNegotiationClick(negotiationId: string) {
		goto(`/negotiation/${negotiationId}`);
	}

	function handleCardKeydown(event: KeyboardEvent, negotiationId: string) {
		if (event.key === 'Enter') {
			goto(`/negotiation/${negotiationId}`);
		}
	}

	function handleDeleteClick(event: MouseEvent, negotiationId: string) {
		event.stopPropagation();
		confirmDeleteId = negotiationId;
	}

	async function handleConfirmDelete() {
		if (confirmDeleteId) {
			await negotiationStore.deleteNegotiation(confirmDeleteId);
			confirmDeleteId = null;
		}
	}

	function handleCancelDelete() {
		confirmDeleteId = null;
	}
</script>

<div class="negotiation-list-page p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<MessageSquare class="w-8 h-8 text-slate-700 dark:text-slate-300" />
			<h1 class="text-3xl font-bold text-slate-900 dark:text-white">Negotiations</h1>
		</div>
		<button class="btn btn-primary" onclick={handleNewNegotiation}>
			<Plus class="w-4 h-4" />
			New Negotiation
		</button>
	</div>

	<!-- Negotiation Grid -->
	{#if sortedNegotiations.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16 px-4">
			<MessageSquare class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
				No negotiations yet
			</h2>
			<p class="text-slate-500 dark:text-slate-400 mb-6">
				Create your first negotiation to get started
			</p>
			<button class="btn btn-primary" onclick={handleNewNegotiation}>
				<Plus class="w-4 h-4" />
				New Negotiation
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each sortedNegotiations as negotiation (negotiation.id)}
				<div
					class="negotiation-card p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
					data-testid="negotiation-card"
					role="button"
					tabindex="0"
					aria-label={`${negotiation.npcName} - ${negotiation.status}`}
					onclick={() => handleNegotiationClick(negotiation.id)}
					onkeydown={(e) => handleCardKeydown(e, negotiation.id)}
				>
					<!-- Status Badge and Delete Button -->
					<div class="flex items-center justify-between mb-3">
						<span
							class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(negotiation.status)}`}
							data-testid="status-badge"
						>
							{negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
						</span>
						<button
							class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
							onclick={(e) => handleDeleteClick(e, negotiation.id)}
							aria-label="Delete negotiation"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>

					<!-- NPC Name -->
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2 truncate">
						{negotiation.npcName}
					</h3>

					<!-- Negotiation Name (if different from NPC) -->
					{#if negotiation.name}
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
							{negotiation.name}
						</p>
					{/if}

					<!-- Interest and Patience -->
					<div class="flex items-center gap-4 text-sm mb-3">
						<div class="flex-1">
							<div class="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
								<span>Interest</span>
								<span>{negotiation.interest}/5</span>
							</div>
							<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
								<div
									class="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all"
									style={`width: ${(negotiation.interest / 5) * 100}%`}
								></div>
							</div>
						</div>
						<div class="flex-1">
							<div class="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
								<span>Patience</span>
								<span>{negotiation.patience}/5</span>
							</div>
							<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
								<div
									class="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all"
									style={`width: ${(negotiation.patience / 5) * 100}%`}
								></div>
							</div>
						</div>
					</div>

					<!-- Arguments Count -->
					{#if negotiation.arguments.length > 0}
						<div class="text-sm text-slate-600 dark:text-slate-400 mb-3">
							<span class="font-medium">{negotiation.arguments.length}</span>
							{negotiation.arguments.length === 1 ? 'argument' : 'arguments'} made
						</div>
					{/if}

					<!-- Created Date -->
					<div class="text-xs text-slate-500 dark:text-slate-400">
						Created {formatDistanceToNow(new Date(negotiation.createdAt), { addSuffix: true })}
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
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			role="document"
			class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="delete-dialog-title" class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
				Delete Negotiation?
			</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				This will permanently delete this negotiation session and all its data. This action cannot
				be undone.
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
