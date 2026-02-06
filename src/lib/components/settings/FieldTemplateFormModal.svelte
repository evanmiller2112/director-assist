<script lang="ts">
	import { X } from 'lucide-svelte';
	import { nanoid } from 'nanoid';
	import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
	import type { FieldTemplate, FieldDefinition } from '$lib/types';

	interface Props {
		open: boolean;
		template?: FieldTemplate;
		onsubmit?: (template: FieldTemplate) => void;
		oncancel?: () => void;
	}

	let { open = false, template, onsubmit, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let name = $state('');
	let description = $state('');
	let category: 'user' | 'draw-steel' = $state('user');
	let fieldDefinitions = $state<FieldDefinition[]>([]);
	let nameTouched = $state(false);

	// Validation
	const isValid = $derived(name.trim().length > 0);
	const showNameError = $derived(nameTouched && !isValid);

	// Mode derived from template prop
	const isEditMode = $derived(!!template);
	const modalTitle = $derived(isEditMode ? 'Edit Field Template' : 'Create Field Template');
	const submitButtonText = $derived(isEditMode ? 'Save' : 'Create');

	// Initialize form when template changes
	$effect(() => {
		if (template) {
			name = template.name;
			description = template.description || '';
			category = template.category;
			fieldDefinitions = structuredClone(template.fieldDefinitions);
		}
	});

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
			// Focus name input after opening
			setTimeout(() => {
				const input = dialogElement?.querySelector('input[type="text"]') as HTMLInputElement;
				input?.focus();
			}, 0);
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
			// Reset state when closing
			if (!template) {
				resetForm();
			}
		}
	});

	function resetForm() {
		name = '';
		description = '';
		category = 'user';
		fieldDefinitions = [];
		nameTouched = false;
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

	function handleSubmit() {
		if (!isValid) return;

		const now = new Date();
		const templateData: FieldTemplate = {
			id: template?.id || nanoid(),
			name: name.trim(),
			description: description.trim(),
			category,
			fieldDefinitions: structuredClone(fieldDefinitions),
			createdAt: template?.createdAt || now,
			updatedAt: now
		};

		onsubmit?.(templateData);
	}

	function handleNameBlur() {
		nameTouched = true;
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-4xl p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="template-form-title"
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
				<h2 id="template-form-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					{modalTitle}
				</h2>
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
				<!-- Basic Info -->
				<div class="space-y-4">
					<!-- Name -->
					<div>
						<label for="template-name" class="label">
							Name <span class="text-red-500">*</span>
						</label>
						<input
							id="template-name"
							type="text"
							class="input"
							bind:value={name}
							onblur={handleNameBlur}
							placeholder="e.g., Combat Stats"
							required
						/>
						{#if showNameError}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">
								Name is required
							</p>
						{/if}
					</div>

					<!-- Description -->
					<div>
						<label for="template-description" class="label">
							Description
						</label>
						<textarea
							id="template-description"
							class="input"
							bind:value={description}
							placeholder="Brief description of what this template is for"
							rows="2"
						/>
					</div>

					<!-- Category -->
					<div>
						<label for="template-category" class="label">
							Category
						</label>
						<select
							id="template-category"
							class="input"
							bind:value={category}
						>
							<option value="user">User</option>
							<option value="draw-steel">Draw Steel</option>
						</select>
					</div>
				</div>

				<!-- Field Definitions -->
				<div>
					<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">
						Fields
					</h3>
					<FieldDefinitionEditor bind:fields={fieldDefinitions} />
				</div>
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
					onclick={handleSubmit}
					disabled={!isValid}
				>
					{submitButtonText}
				</button>
			</div>
		</div>
	</dialog>
{/if}
