<script lang="ts">
	import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { FieldDefinition, FieldType } from '$lib/types';

	interface Props {
		fields: FieldDefinition[];
		onchange?: (fields: FieldDefinition[]) => void;
	}

	let { fields = $bindable([]), onchange }: Props = $props();

	let expandedIndex = $state<number | null>(null);

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
		{ value: 'entity-ref', label: 'Entity Reference' },
		{ value: 'entity-refs', label: 'Multiple Entity References' }
	];

	const SECTION_OPTIONS = [
		{ value: '', label: 'Default' },
		{ value: 'hidden', label: 'Hidden (DM Only)' },
		{ value: 'prep', label: 'Preparation' }
	];

	function addField() {
		const newField: FieldDefinition = {
			key: `field_${Date.now()}`,
			label: 'New Field',
			type: 'text',
			required: false,
			order: fields.length + 1
		};
		fields = [...fields, newField];
		expandedIndex = fields.length - 1;
		onchange?.(fields);
	}

	function removeField(index: number) {
		fields = fields.filter((_, i) => i !== index);
		// Reorder remaining fields
		fields = fields.map((f, i) => ({ ...f, order: i + 1 }));
		if (expandedIndex === index) {
			expandedIndex = null;
		} else if (expandedIndex !== null && expandedIndex > index) {
			expandedIndex--;
		}
		onchange?.(fields);
	}

	function moveField(index: number, direction: 'up' | 'down') {
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= fields.length) return;

		const newFields = [...fields];
		[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
		// Update order
		newFields.forEach((f, i) => (f.order = i + 1));
		fields = newFields;

		// Update expanded index
		if (expandedIndex === index) {
			expandedIndex = newIndex;
		} else if (expandedIndex === newIndex) {
			expandedIndex = index;
		}
		onchange?.(fields);
	}

	function updateField(index: number, updates: Partial<FieldDefinition>) {
		fields = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
		onchange?.(fields);
	}

	function updateFieldKey(index: number, label: string) {
		// Generate key from label (lowercase, underscores)
		const key = label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');
		updateField(index, { label, key: key || `field_${index}` });
	}

	function toggleExpanded(index: number) {
		expandedIndex = expandedIndex === index ? null : index;
	}

	function updateOptions(index: number, optionsText: string) {
		const options = optionsText
			.split('\n')
			.map((o) => o.trim())
			.filter((o) => o);
		updateField(index, { options });
	}
</script>

<div class="space-y-2">
	{#each fields as field, index}
		<div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
			<!-- Header -->
			<button
				type="button"
				class="w-full flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
				onclick={() => toggleExpanded(index)}
			>
				<GripVertical class="w-4 h-4 text-slate-400 cursor-grab" />
				<span class="flex-1 text-left font-medium text-slate-900 dark:text-white">
					{field.label}
				</span>
				<span class="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
					{FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
				</span>
				{#if field.required}
					<span class="text-xs text-red-500">Required</span>
				{/if}
				{#if expandedIndex === index}
					<ChevronUp class="w-4 h-4 text-slate-400" />
				{:else}
					<ChevronDown class="w-4 h-4 text-slate-400" />
				{/if}
			</button>

			<!-- Expanded content -->
			{#if expandedIndex === index}
				<div class="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="field-label-{index}" class="label">Label</label>
							<input
								id="field-label-{index}"
								type="text"
								class="input"
								value={field.label}
								oninput={(e) => updateFieldKey(index, e.currentTarget.value)}
							/>
						</div>
						<div>
							<label for="field-type-{index}" class="label">Type</label>
							<select
								id="field-type-{index}"
								class="input"
								value={field.type}
								onchange={(e) => updateField(index, { type: e.currentTarget.value as FieldType })}
							>
								{#each FIELD_TYPES as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Options for select/multi-select -->
					{#if field.type === 'select' || field.type === 'multi-select'}
						<div>
							<label for="field-options-{index}" class="label">Options (one per line)</label>
							<textarea
								id="field-options-{index}"
								class="input min-h-[80px]"
								value={field.options?.join('\n') ?? ''}
								oninput={(e) => updateOptions(index, e.currentTarget.value)}
								placeholder="Option 1&#10;Option 2&#10;Option 3"
							></textarea>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="field-placeholder-{index}" class="label">Placeholder</label>
							<input
								id="field-placeholder-{index}"
								type="text"
								class="input"
								value={field.placeholder ?? ''}
								oninput={(e) => updateField(index, { placeholder: e.currentTarget.value || undefined })}
							/>
						</div>
						<div>
							<label for="field-section-{index}" class="label">Section</label>
							<select
								id="field-section-{index}"
								class="input"
								value={field.section ?? ''}
								onchange={(e) => updateField(index, { section: e.currentTarget.value || undefined })}
							>
								{#each SECTION_OPTIONS as section}
									<option value={section.value}>{section.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label for="field-help-{index}" class="label">Help Text</label>
						<input
							id="field-help-{index}"
							type="text"
							class="input"
							value={field.helpText ?? ''}
							oninput={(e) => updateField(index, { helpText: e.currentTarget.value || undefined })}
						/>
					</div>

					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={field.required}
								onchange={(e) => updateField(index, { required: e.currentTarget.checked })}
								class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
							/>
							<span class="text-sm text-slate-700 dark:text-slate-300">Required</span>
						</label>
					</div>

					<!-- Actions -->
					<div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
						<div class="flex gap-1">
							<button
								type="button"
								class="btn btn-ghost p-2"
								onclick={() => moveField(index, 'up')}
								disabled={index === 0}
								title="Move up"
							>
								<ChevronUp class="w-4 h-4" />
							</button>
							<button
								type="button"
								class="btn btn-ghost p-2"
								onclick={() => moveField(index, 'down')}
								disabled={index === fields.length - 1}
								title="Move down"
							>
								<ChevronDown class="w-4 h-4" />
							</button>
						</div>
						<button
							type="button"
							class="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
							onclick={() => removeField(index)}
							title="Delete field"
						>
							<Trash2 class="w-4 h-4" />
							<span class="text-sm">Delete</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Add field button -->
	<button
		type="button"
		class="btn btn-secondary w-full"
		onclick={addField}
	>
		<Plus class="w-4 h-4" />
		Add Field
	</button>
</div>
