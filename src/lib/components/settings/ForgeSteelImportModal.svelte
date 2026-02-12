<script lang="ts">
	import { X, Upload, AlertTriangle, CheckCircle } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores/entities.svelte';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { validateForgeSteelImport, mapForgeSteelHeroToEntity } from '$lib/services/forgeSteelImportService';
	import type { ForgeSteelHero } from '$lib/types/forgeSteel';
	import type { ForgeSteelImportValidationResult } from '$lib/services/forgeSteelImportService';

	interface Props {
		open: boolean;
		onimport?: () => void;
		oncancel?: () => void;
	}

	let { open = $bindable(false), onimport, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let fileInput: HTMLInputElement | null = $state(null);
	let selectedFile: File | null = $state(null);
	let validationResult: ForgeSteelImportValidationResult | null = $state(null);
	let importData: ForgeSteelHero | null = $state(null);
	let isImporting = $state(false);

	// Helper functions to avoid type narrowing issues with $derived
	function getIsValid(result: ForgeSteelImportValidationResult | null): boolean {
		return result?.valid ?? false;
	}
	function getHasErrors(result: ForgeSteelImportValidationResult | null): boolean {
		return (result?.errors?.length ?? 0) > 0;
	}
	function getHasWarnings(result: ForgeSteelImportValidationResult | null): boolean {
		return (result?.warnings?.length ?? 0) > 0;
	}

	// Derived states
	const hasFile = $derived(!!selectedFile);
	const hasValidation = $derived(!!validationResult);
	const isValid = $derived(getIsValid(validationResult));
	const hasErrors = $derived(getHasErrors(validationResult));
	const hasWarnings = $derived(getHasWarnings(validationResult));
	const canImport = $derived(isValid && !isImporting);

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
		isImporting = false;
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
		if (!isImporting) {
			open = false;
			oncancel?.();
		}
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

				// Get existing character names for conflict detection
				const existingCharacterNames = entitiesStore.entities
					.filter((e) => e.type === 'character')
					.map((e) => e.name);

				// Validate
				validationResult = validateForgeSteelImport(data, existingCharacterNames);
			} catch (parseError) {
				validationResult = {
					valid: false,
					errors: ['Invalid JSON format: ' + (parseError as Error).message],
					warnings: []
				};
				importData = null;
			}
		} catch (readError) {
			validationResult = {
				valid: false,
				errors: ['Failed to read file: ' + (readError as Error).message],
				warnings: []
			};
			importData = null;
		}
	}

	async function handleImport() {
		if (!canImport || !importData) return;

		isImporting = true;

		try {
			// Map to NewEntity
			const newEntity = mapForgeSteelHeroToEntity(importData);

			// Create entity
			await entitiesStore.create(newEntity);

			// Success notification
			notificationStore.success(`Character "${newEntity.name}" imported successfully`);

			// Call onimport callback
			onimport?.();
		} catch (error) {
			console.error('Import failed:', error);
			notificationStore.error(
				'Failed to import character: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
		} finally {
			isImporting = false;
		}
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
						Import from Forge Steel
					</h2>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleCancel}
					aria-label="Close dialog"
					disabled={isImporting}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- File Picker -->
				<div>
					<label for="import-file" class="label">
						Select Forge Steel Character File
					</label>
					<input
						bind:this={fileInput}
						id="import-file"
						type="file"
						class="input"
						accept=".json,.ds-hero,application/json"
						onchange={handleFileChange}
						disabled={isImporting}
					/>
					{#if selectedFile}
						<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Selected: {selectedFile.name}
						</p>
					{/if}
					<p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
						Accepts .json or .ds-hero files exported from Forge Steel character builder
					</p>
				</div>

				<!-- Validation Messages -->
				{#if hasValidation}
					<div aria-live="polite" class="space-y-3">
						<!-- Errors -->
						{#if hasErrors}
							<div class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
								<p class="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
									Validation Errors
								</p>
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
								<p class="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
									Warnings
								</p>
								{#each validationResult!.warnings as warning}
									<p class="text-sm text-yellow-900 dark:text-yellow-200 flex items-start gap-2">
										<AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
										<span>{warning}</span>
									</p>
								{/each}
							</div>
						{/if}

						<!-- Preview (if valid) -->
						{#if isValid && importData}
							<div>
								<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
									<CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
									Ready to Import
								</h3>
								<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
									<div class="flex items-start justify-between gap-4">
										<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
											Name:
										</span>
										<span class="text-sm text-slate-900 dark:text-white text-right">
											{importData.name}
										</span>
									</div>
									{#if importData.ancestry || importData.class}
										<div class="flex items-start justify-between gap-4">
											<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
												Concept:
											</span>
											<span class="text-sm text-slate-900 dark:text-white text-right">
												{[importData.ancestry?.name, importData.class?.name]
													.filter((x) => x)
													.join(' ') || 'None'}
											</span>
										</div>
									{/if}
									{#if importData.state.notes}
										<div class="flex items-start justify-between gap-4">
											<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
												Background:
											</span>
											<span class="text-sm text-slate-900 dark:text-white text-right max-w-md">
												{importData.state.notes.length > 100
													? importData.state.notes.slice(0, 100) + '...'
													: importData.state.notes}
											</span>
										</div>
									{/if}
									<div class="flex items-start justify-between gap-4">
										<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
											Status:
										</span>
										<span class="text-sm text-slate-900 dark:text-white text-right">
											{importData.state.defeated ? 'Deceased' : 'Active'}
										</span>
									</div>
								</div>
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
					disabled={isImporting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleImport}
					disabled={!canImport}
				>
					{isImporting ? 'Importing...' : 'Import Character'}
				</button>
			</div>
		</div>
	</dialog>
{/if}
