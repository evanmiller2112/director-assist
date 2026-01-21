<script lang="ts">
	import { entityRepository } from '$lib/db/repositories';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		open: boolean;
		unlinkedEntities: BaseEntity[];
		campaigns: BaseEntity[];
		defaultCampaignId?: string;
		onConfirm: (linkedCount: number) => void;
		onSkip: () => void;
		onCancel: () => void;
	}

	let {
		open = false,
		unlinkedEntities,
		campaigns,
		defaultCampaignId,
		onConfirm,
		onSkip,
		onCancel
	}: Props = $props();

	// State
	let selectedCampaignId = $state('');
	let isLinking = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Derived values
	const hasSingleCampaign = $derived(campaigns.length === 1);
	const selectedCampaign = $derived(
		campaigns.find((c) => c.id === selectedCampaignId)
	);

	// Initialize selected campaign
	$effect(() => {
		if (open) {
			if (defaultCampaignId) {
				selectedCampaignId = defaultCampaignId;
			} else if (campaigns.length > 0) {
				selectedCampaignId = campaigns[0].id;
			}
			// Reset messages
			errorMessage = '';
			successMessage = '';
		}
	});

	function handleCampaignChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCampaignId = target.value;
	}

	async function handleLinkAll() {
		if (!selectedCampaignId || isLinking) return;

		isLinking = true;
		errorMessage = '';
		successMessage = '';

		try {
			const entityIds = unlinkedEntities.map((e) => e.id);
			const linkedCount = await entityRepository.bulkLinkToCampaign(
				entityIds,
				selectedCampaignId
			);

			successMessage = `Successfully linked ${linkedCount} entities`;

			// Wait a moment to show success message
			setTimeout(() => {
				onConfirm(linkedCount);
			}, 500);
		} catch (error) {
			console.error('Failed to link entities:', error);
			errorMessage = 'Failed to link entities. Please try again.';
			isLinking = false;
		}
	}

	function handleSkip() {
		if (isLinking) return;
		onSkip();
	}

	function handleCancel() {
		if (isLinking) return;
		onCancel();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isLinking) {
			handleCancel();
		}
	}

	// Focus management
	let linkAllButton = $state<HTMLButtonElement | null>(null);
	$effect(() => {
		if (open && linkAllButton) {
			linkAllButton.focus();
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div class="modal-header">
				<h2 id="modal-title" class="text-xl font-semibold">
					Link Existing Entities
				</h2>
			</div>

			<div class="modal-body">
				{#if unlinkedEntities.length === 0}
					<!-- Empty state: all entities are already linked (Issue #48) -->
					<div class="text-center py-8">
						<p class="text-lg font-medium text-green-600 dark:text-green-400 mb-2">
							All entities are already linked to campaigns!
						</p>
						<p class="text-sm text-slate-600 dark:text-slate-400">
							No action needed - you're all set.
						</p>
					</div>
				{:else}
					<p class="mb-4">
						Found {unlinkedEntities.length} {unlinkedEntities.length === 1 ? 'entity' : 'entities'} that are not linked to any campaign.
						Would you like to link them now?
					</p>

					{#if hasSingleCampaign}
						<p class="mb-4 text-sm">
							All entities will be linked to <strong>{campaigns[0].name}</strong>.
						</p>
					{:else}
						<div class="mb-4">
							<label for="campaign-select" class="label">Select Campaign</label>
							<select
								id="campaign-select"
								class="input w-full"
								value={selectedCampaignId}
								onchange={handleCampaignChange}
								disabled={isLinking}
								aria-label="Select Campaign"
							>
								{#each campaigns as campaign}
									<option value={campaign.id}>{campaign.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Entity List -->
					<div class="entity-list" data-testid="entity-list" role="list">
						{#each unlinkedEntities as entity}
							<div class="entity-item" role="listitem">
								<span class="entity-name">{entity.name}</span>
								<span class="entity-type">{entity.type}</span>
							</div>
						{/each}
					</div>
				{/if}

				{#if isLinking}
					<p class="text-sm text-blue-600 dark:text-blue-400 mt-4">
						Linking entities...
					</p>
				{/if}

				{#if successMessage}
					<p class="text-sm text-green-600 dark:text-green-400 mt-4">
						{successMessage}
					</p>
				{/if}

				{#if errorMessage}
					<p class="text-sm text-red-600 dark:text-red-400 mt-4">
						{errorMessage}
					</p>
				{/if}
			</div>

			<div class="modal-footer">
				{#if unlinkedEntities.length === 0}
					<!-- Only show close button for empty state -->
					<button
						class="btn btn-primary"
						onclick={handleCancel}
						aria-label="Close"
					>
						Close
					</button>
				{:else}
					<button
						bind:this={linkAllButton}
						class="btn btn-primary"
						onclick={handleLinkAll}
						disabled={isLinking}
						aria-label="Link All"
					>
						Link All
					</button>
					<button
						class="btn btn-secondary"
						onclick={handleSkip}
						disabled={isLinking}
						aria-label="Skip"
					>
						Skip
					</button>
					<button
						class="btn btn-ghost"
						onclick={handleCancel}
						disabled={isLinking}
						aria-label="Cancel"
					>
						Cancel
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: white;
		border-radius: 0.5rem;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .modal-content {
		background-color: #1e293b;
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	:global(.dark) .modal-header {
		border-bottom-color: #475569;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	:global(.dark) .modal-footer {
		border-top-color: #475569;
	}

	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.input {
		padding: 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background-color: white;
	}

	:global(.dark) .input {
		background-color: #1e293b;
		border-color: #475569;
		color: white;
	}

	.entity-list {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.5rem;
	}

	:global(.dark) .entity-list {
		border-color: #475569;
	}

	.entity-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #f1f5f9;
	}

	:global(.dark) .entity-item {
		border-bottom-color: #334155;
	}

	.entity-item:last-child {
		border-bottom: none;
	}

	.entity-name {
		font-weight: 500;
	}

	.entity-type {
		font-size: 0.875rem;
		color: #64748b;
		text-transform: capitalize;
	}

	:global(.dark) .entity-type {
		color: #94a3b8;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-secondary {
		background-color: #64748b;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #475569;
	}

	.btn-ghost {
		background-color: transparent;
		color: #64748b;
	}

	.btn-ghost:hover:not(:disabled) {
		background-color: #f1f5f9;
	}

	:global(.dark) .btn-ghost {
		color: #94a3b8;
	}

	:global(.dark) .btn-ghost:hover:not(:disabled) {
		background-color: #334155;
	}
</style>
