<script lang="ts">
	import { X, Upload, AlertTriangle } from 'lucide-svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { validateImport } from '$lib/services/entityTypeExportService';
	import type { EntityTypeDefinition, ImportValidationResult } from '$lib/types';

	interface Props {
		open: boolean;
		onimport?: (entityType: EntityTypeDefinition) => void;
		oncancel?: () => void;
	}

	let { open = false, onimport, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let fileInput: HTMLInputElement | null = $state(null);
	let selectedFile: File | null = $state(null);
	let validationResult: ImportValidationResult | null = $state(null);
	let importData: any = $state(null);
	let newTypeKey = $state('');

	// Helper functions to avoid type narrowing issues with $derived
	function getIsValid(result: ImportValidationResult | null): boolean {
		return result?.valid ?? false;
	}
	function getHasErrors(result: ImportValidationResult | null): boolean {
		return (result?.errors?.length ?? 0) > 0;
	}
	function getHasWarnings(result: ImportValidationResult | null): boolean {
		return (result?.warnings?.length ?? 0) > 0;
	}
	function getHasConflict(result: ImportValidationResult | null): boolean {
		return result?.preview?.conflictsWithExisting ?? false;
	}

	// Derived states
	const hasFile = $derived(!!selectedFile);
	const hasValidation = $derived(!!validationResult);
	const isValid = $derived(getIsValid(validationResult));
	const hasErrors = $derived(getHasErrors(validationResult));
	const hasWarnings = $derived(getHasWarnings(validationResult));
	const hasConflict = $derived(getHasConflict(validationResult));
	const canImport = $derived(
		isValid && (!hasConflict || (hasConflict && newTypeKey.trim().length > 0))
	);

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
			// Reset state when closing
			resetState();
		}
	});

	function resetState() {
		selectedFile = null;
		validationResult = null;
		importData = null;
		newTypeKey = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		const rect = dialogElement?.getBoundingClientRect();
		if (
			rect &&
			(e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom)
		) {
			handleCancel();
		}
	}

	// Handle Escape key
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleCancel();
		}
	}

	function handleCancel() {
		oncancel?.();
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) {
			resetState();
			return;
		}

		selectedFile = file;

		try {
			// Read file
			const text = await file.text();

			// Parse JSON
			try {
				const data = JSON.parse(text);
				importData = data;

				// Validate
				const existingTypes = [
					...campaignStore.customEntityTypes.map((t) => t.type)
				];
				validationResult = validateImport(data, existingTypes);
			} catch (parseError) {
				validationResult = {
					valid: false,
					errors: ['Invalid JSON format: ' + (parseError as Error).message],
					warnings: [],
					preview: {
						name: '',
						type: 'entity-type',
						fieldCount: 0,
						conflictsWithExisting: false
					}
				};
				importData = null;
			}
		} catch (readError) {
			validationResult = {
				valid: false,
				errors: ['Failed to read file: ' + (readError as Error).message],
				warnings: [],
				preview: {
					name: '',
					type: 'entity-type',
					fieldCount: 0,
					conflictsWithExisting: false
				}
			};
			importData = null;
		}
	}

	function handleImport() {
		if (!canImport || !importData?.data) return;

		let entityType: EntityTypeDefinition = importData.data;

		// If there's a conflict and user provided new key, use it
		if (hasConflict && newTypeKey.trim()) {
			entityType = {
				...entityType,
				type: newTypeKey.trim()
			};
		}

		onimport?.(entityType);
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-2xl p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="import-modal-title"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.stopPropagation();
				}
			}}
			role="button"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
						<Upload class="w-5 h-5 text-green-600 dark:text-green-400" />
					</div>
					<h2 id="import-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Import Entity Type
					</h2>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleCancel}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- File Picker -->
				<div>
					<label for="import-file" class="label">
						Select File
					</label>
					<input
						bind:this={fileInput}
						id="import-file"
						type="file"
						class="input"
						accept=".json,application/json"
						onchange={handleFileChange}
					/>
					{#if selectedFile}
						<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Selected: {selectedFile.name}
						</p>
					{/if}
				</div>

				<!-- Validation Messages -->
				{#if hasValidation}
					<div aria-live="polite" class="space-y-3">
						<!-- Errors -->
						{#if hasErrors}
							<div class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
								{#each validationResult!.errors as error}
									<p class="text-sm text-red-900 dark:text-red-200 flex items-start gap-2">
										<AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
										<span>{error}</span>
									</p>
								{/each}
							</div>
						{/if}

						<!-- Warnings -->
						{#if hasWarnings}
							<div class="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-2">
								{#each validationResult!.warnings as warning}
									<p class="text-sm text-yellow-900 dark:text-yellow-200 flex items-start gap-2">
										<AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
										<span>{warning}</span>
									</p>
								{/each}
							</div>
						{/if}

						<!-- Preview (if valid) -->
						{#if isValid && validationResult?.preview}
							<div>
								<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">
									Preview
								</h3>
								<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
											Name:
										</span>
										<span class="text-sm text-slate-900 dark:text-white">
											{validationResult.preview!.name}
										</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
											Fields:
										</span>
										<span class="text-sm text-slate-900 dark:text-white">
											{validationResult.preview!.fieldCount}
										</span>
									</div>
								</div>

								<!-- Conflict Resolution -->
								{#if hasConflict}
									<div class="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
										<p class="text-sm text-yellow-900 dark:text-yellow-200 mb-3">
											An entity type with this type key already exists. Please provide a new unique key:
										</p>
										<label for="new-type-key" class="label">
											New Type Key
										</label>
										<input
											id="new-type-key"
											type="text"
											class="input"
											bind:value={newTypeKey}
											placeholder="e.g., imported_quest"
										/>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleImport}
					disabled={!canImport}
				>
					Import
				</button>
			</div>
		</div>
	</dialog>
{/if}
