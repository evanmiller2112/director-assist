<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import { campaignStore, notificationStore } from '$lib/stores';
	import type { FieldDefinition, FieldType, EntityType } from '$lib/types';

	interface Props {
		entityType: string;
	}

	let { entityType }: Props = $props();

	let showModal = $state(false);
	let isSaving = $state(false);

	// Form state
	let fieldLabel = $state('');
	let fieldType = $state<FieldType>('text');
	let fieldOptions = $state('');
	let fieldSection = $state<'' | 'hidden' | 'prep'>('');
	let fieldRequired = $state(false);

	// Field type options (simplified from FieldDefinitionEditor)
	const FIELD_TYPES: { value: FieldType; label: string }[] = [
		{ value: 'text', label: 'Short Text' },
		{ value: 'textarea', label: 'Long Text' },
		{ value: 'richtext', label: 'Rich Text (Markdown)' },
		{ value: 'number', label: 'Number' },
		{ value: 'boolean', label: 'Checkbox' },
		{ value: 'select', label: 'Dropdown' },
		{ value: 'multi-select', label: 'Multi-Select' },
		{ value: 'tags', label: 'Tags' },
		{ value: 'date', label: 'Date' },
		{ value: 'url', label: 'URL' },
		{ value: 'image', label: 'Image' }
	];

	const SECTION_OPTIONS = [
		{ value: '', label: 'Default' },
		{ value: 'hidden', label: 'Hidden (DM Only)' },
		{ value: 'prep', label: 'Preparation' }
	];

	// Check if this is a built-in entity type
	const isBuiltInType = $derived(() => {
		const customTypes = campaignStore.customEntityTypes;
		return !customTypes.some((t) => t.type === entityType);
	});

	function generateKey(label: string): string {
		return label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '') || `field_${Date.now()}`;
	}

	function resetForm() {
		fieldLabel = '';
		fieldType = 'text';
		fieldOptions = '';
		fieldSection = '';
		fieldRequired = false;
	}

	function openModal() {
		resetForm();
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		resetForm();
	}

	async function handleSave() {
		if (!fieldLabel.trim()) {
			notificationStore.error('Field label is required');
			return;
		}

		isSaving = true;

		try {
			const fieldKey = generateKey(fieldLabel);
			const newField: FieldDefinition = {
				key: fieldKey,
				label: fieldLabel.trim(),
				type: fieldType,
				required: fieldRequired,
				order: 1000 // High order number so it appears at the end
			};

			// Add section if not default
			if (fieldSection) {
				newField.section = fieldSection;
			}

			// Add options for select/multi-select
			if ((fieldType === 'select' || fieldType === 'multi-select') && fieldOptions.trim()) {
				newField.options = fieldOptions
					.split('\n')
					.map((o) => o.trim())
					.filter((o) => o);
			}

			if (isBuiltInType()) {
				// For built-in types, use setEntityTypeOverride
				const existingOverride = campaignStore.getEntityTypeOverride(entityType);
				const existingFields = existingOverride?.additionalFields ?? [];

				// Check for duplicate key
				if (existingFields.some((f) => f.key === fieldKey)) {
					notificationStore.error(`A field with key "${fieldKey}" already exists`);
					isSaving = false;
					return;
				}

				await campaignStore.setEntityTypeOverride({
					type: entityType as EntityType,
					...existingOverride,
					additionalFields: [...existingFields, newField]
				});
			} else {
				// For custom types, use updateCustomEntityType
				const customType = campaignStore.getCustomEntityType(entityType);
				if (!customType) {
					throw new Error(`Custom entity type "${entityType}" not found`);
				}

				const existingFields = customType.fieldDefinitions ?? [];

				// Check for duplicate key
				if (existingFields.some((f) => f.key === fieldKey)) {
					notificationStore.error(`A field with key "${fieldKey}" already exists`);
					isSaving = false;
					return;
				}

				await campaignStore.updateCustomEntityType(entityType, {
					fieldDefinitions: [...existingFields, newField]
				});
			}

			notificationStore.success(`Field "${fieldLabel}" added successfully`);
			closeModal();
		} catch (error) {
			console.error('Failed to add field:', error);
			notificationStore.error('Failed to add field. Please try again.');
		} finally {
			isSaving = false;
		}
	}
</script>

<!-- Add Field Button -->
<button
	type="button"
	class="btn btn-secondary"
	onclick={openModal}
	aria-label="Add custom field to this entity type"
>
	<Plus class="w-4 h-4" />
	Add Field
</button>

<!-- Modal -->
{#if showModal}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 z-40"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
	></div>

	<!-- Modal content -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-labelledby="add-field-modal-title"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 id="add-field-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Add Custom Field
				</h2>
				<button
					type="button"
					onclick={closeModal}
					class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
					aria-label="Close modal"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body -->
			<div class="p-4 space-y-4">
				<p class="text-sm text-slate-600 dark:text-slate-400">
					This field will be added to all {isBuiltInType() ? 'entities of this type' : 'entities of this custom type'}.
				</p>

				<!-- Field Label -->
				<div>
					<label for="field-label" class="label">Field Label *</label>
					<input
						id="field-label"
						type="text"
						class="input"
						bind:value={fieldLabel}
						placeholder="e.g., Motivation"
					/>
					{#if fieldLabel}
						<p class="text-xs text-slate-500 mt-1">
							Key: <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">{generateKey(fieldLabel)}</code>
						</p>
					{/if}
				</div>

				<!-- Field Type -->
				<div>
					<label for="field-type" class="label">Field Type</label>
					<select
						id="field-type"
						class="input"
						bind:value={fieldType}
					>
						{#each FIELD_TYPES as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<!-- Options (for select/multi-select) -->
				{#if fieldType === 'select' || fieldType === 'multi-select'}
					<div>
						<label for="field-options" class="label">Options (one per line)</label>
						<textarea
							id="field-options"
							class="input min-h-[80px]"
							bind:value={fieldOptions}
							placeholder="Option 1&#10;Option 2&#10;Option 3"
							aria-label="Options (one per line)"
						></textarea>
					</div>
				{/if}

				<!-- Section -->
				<div>
					<label for="field-section" class="label">Section</label>
					<select id="field-section" class="input" bind:value={fieldSection}>
						{#each SECTION_OPTIONS as section}
							<option value={section.value}>{section.label}</option>
						{/each}
					</select>
				</div>

				<!-- Required -->
				<div>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
							bind:checked={fieldRequired}
						/>
						<span class="text-sm text-slate-700 dark:text-slate-300">Required field</span>
					</label>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
				<button type="button" class="btn btn-secondary" onclick={closeModal} disabled={isSaving}>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleSave}
					disabled={isSaving || !fieldLabel.trim()}
				>
					{#if isSaving}
						Adding...
					{:else}
						Add Field
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
