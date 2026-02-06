<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { BaseEntity } from '$lib/types';
	import type { SeatAssignment } from '$lib/types/campaign';

	interface Props {
		open: boolean;
		seatIndex: number;
		currentAssignment?: SeatAssignment;
		characters: BaseEntity[];
		onSave: (characterId?: string) => void;
		onClose: () => void;
	}

	let { open = false, seatIndex, currentAssignment, characters, onSave, onClose }: Props =
		$props();

	let selectedCharacterId = $state<string>('');

	// Initialize selection when modal opens or assignment changes
	$effect(() => {
		if (open) {
			selectedCharacterId = currentAssignment?.characterId || '';
		}
	});

	// Check if current selection constitutes an assignment
	const hasAssignment = $derived(Boolean(currentAssignment?.characterId));

	// Get preview of selected character info
	const selectedCharacter = $derived(
		selectedCharacterId ? characters.find((c) => c.id === selectedCharacterId) : undefined
	);
	const playerName = $derived(
		selectedCharacter?.fields?.playerName as string | undefined
	);

	// Handle save
	function handleSave() {
		const characterId = selectedCharacterId || undefined;
		onSave(characterId);
		onClose();
	}

	// Handle clear
	function handleClear() {
		onSave(undefined);
		onClose();
	}

	// Handle cancel
	function handleCancel() {
		onClose();
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">Assign Seat {seatIndex + 1}</h2>
				<button
					class="modal-close-btn"
					onclick={handleCancel}
					aria-label="Close"
					type="button"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				{#if characters.length === 0}
					<div class="empty-state">
						<p class="text-slate-600 dark:text-slate-400">No characters available.</p>
						<p class="text-sm text-slate-500 dark:text-slate-500">Create a Player Character first.</p>
					</div>
				{:else}
					<div class="form-group">
						<!-- Character dropdown -->
						<div class="input-group">
							<label for="character-select" class="label">Character</label>
							<select
								id="character-select"
								class="input"
								bind:value={selectedCharacterId}
								aria-label="Character"
							>
								<option value="">-- Select a character --</option>
								{#each characters as character}
									<option value={character.id}>{character.name}</option>
								{/each}
							</select>
						</div>

						<!-- Preview of selection -->
						{#if selectedCharacter}
							<div class="preview">
								<div class="preview-label">Preview:</div>
								<div class="preview-content">
									<div class="preview-character">{selectedCharacter.name}</div>
									{#if playerName}
										<div class="preview-player">Player: {playerName}</div>
									{:else}
										<div class="preview-player text-slate-400 italic">No player name set</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="btn btn-danger" onclick={handleClear} disabled={!hasAssignment} type="button">
					Clear
				</button>
				<button class="btn btn-secondary" onclick={handleCancel} type="button">Cancel</button>
				<button class="btn btn-primary" onclick={handleSave} type="button">Save</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 32rem;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.dark) .modal-content {
		background: rgb(30, 41, 59);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid rgb(226, 232, 240);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgb(51, 65, 85);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: rgb(15, 23, 42);
	}

	:global(.dark) .modal-title {
		color: rgb(248, 250, 252);
	}

	.modal-close-btn {
		padding: 0.5rem;
		border-radius: 0.375rem;
		color: rgb(100, 116, 139);
		transition: all 0.15s;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close-btn:hover {
		background: rgb(241, 245, 249);
		color: rgb(51, 65, 85);
	}

	:global(.dark) .modal-close-btn {
		color: rgb(148, 163, 184);
	}

	:global(.dark) .modal-close-btn:hover {
		background: rgb(51, 65, 85);
		color: rgb(203, 213, 225);
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(51, 65, 85);
	}

	:global(.dark) .label {
		color: rgb(203, 213, 225);
	}

	.input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid rgb(203, 213, 225);
		border-radius: 0.375rem;
		background: white;
		color: rgb(15, 23, 42);
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.input:focus {
		outline: none;
		border-color: rgb(59, 130, 246);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .input {
		background: rgb(51, 65, 85);
		border-color: rgb(71, 85, 105);
		color: rgb(248, 250, 252);
	}

	:global(.dark) .input:focus {
		border-color: rgb(96, 165, 250);
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
	}

	.preview {
		background: rgb(248, 250, 252);
		border: 1px solid rgb(226, 232, 240);
		border-radius: 0.375rem;
		padding: 1rem;
	}

	:global(.dark) .preview {
		background: rgb(51, 65, 85);
		border-color: rgb(71, 85, 105);
	}

	.preview-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: rgb(100, 116, 139);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .preview-label {
		color: rgb(148, 163, 184);
	}

	.preview-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.preview-character {
		font-weight: 600;
		color: rgb(15, 23, 42);
	}

	:global(.dark) .preview-character {
		color: rgb(248, 250, 252);
	}

	.preview-player {
		font-size: 0.875rem;
		color: rgb(71, 85, 105);
	}

	:global(.dark) .preview-player {
		color: rgb(203, 213, 225);
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid rgb(226, 232, 240);
	}

	:global(.dark) .modal-footer {
		border-top-color: rgb(51, 65, 85);
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: rgb(59, 130, 246);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgb(37, 99, 235);
	}

	:global(.dark) .btn-primary {
		background: rgb(96, 165, 250);
		color: rgb(15, 23, 42);
	}

	:global(.dark) .btn-primary:hover:not(:disabled) {
		background: rgb(59, 130, 246);
	}

	.btn-secondary {
		background: rgb(226, 232, 240);
		color: rgb(51, 65, 85);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgb(203, 213, 225);
	}

	:global(.dark) .btn-secondary {
		background: rgb(71, 85, 105);
		color: rgb(203, 213, 225);
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background: rgb(100, 116, 139);
	}

	.btn-danger {
		background: rgb(239, 68, 68);
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: rgb(220, 38, 38);
	}

	:global(.dark) .btn-danger {
		background: rgb(248, 113, 113);
		color: rgb(15, 23, 42);
	}

	:global(.dark) .btn-danger:hover:not(:disabled) {
		background: rgb(239, 68, 68);
	}
</style>
