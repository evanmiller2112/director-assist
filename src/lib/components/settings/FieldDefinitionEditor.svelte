<script lang="ts">
	import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff, Library } from 'lucide-svelte';
	import type { FieldDefinition, FieldType, EntityType, FieldTemplate } from '$lib/types';
	import ComputedFieldEditor from './ComputedFieldEditor.svelte';
	import FieldTemplatePicker from './FieldTemplatePicker.svelte';

	interface Props {
		fields: FieldDefinition[];
		onchange?: (fields: FieldDefinition[]) => void;
	}

	let { fields = $bindable([]), onchange }: Props = $props();

	let expandedIndex = $state<number | null>(null);
	let previewIndex = $state<number | null>(null);
	let showTemplatePicker = $state(false);

	// Field type categories
	const FIELD_TYPE_CATEGORIES = {
		text: 'Text & Content',
		numeric: 'Numeric',
		selection: 'Selection',
		reference: 'Links & References',
		specialized: 'Specialized'
	};

	const FIELD_TYPES: {
		value: FieldType;
		label: string;
		category: string;
		description: string;
		drawSteelRecommended: boolean;
		exampleUse?: string;
	}[] = [
		{
			value: 'text',
			label: 'Short Text',
			category: 'text',
			description: 'Often used for names, titles, and brief descriptions',
			drawSteelRecommended: true
		},
		{
			value: 'textarea',
			label: 'Long Text',
			category: 'text',
			description: 'For longer descriptions and multi-line content',
			drawSteelRecommended: true
		},
		{
			value: 'richtext',
			label: 'Rich Text (Markdown)',
			category: 'text',
			description: 'Supports formatted text with markdown',
			drawSteelRecommended: true
		},
		{
			value: 'number',
			label: 'Number',
			category: 'numeric',
			description: 'For AC, HP, damage bonuses, and other numeric stats',
			drawSteelRecommended: true
		},
		{
			value: 'boolean',
			label: 'Checkbox',
			category: 'numeric',
			description: 'For yes/no or true/false values',
			drawSteelRecommended: false
		},
		{
			value: 'select',
			label: 'Dropdown',
			category: 'selection',
			description: 'Choose from predefined options like threat_level, role, or school of magic',
			drawSteelRecommended: true
		},
		{
			value: 'multi-select',
			label: 'Multi-Select',
			category: 'selection',
			description: 'Select multiple options from a list',
			drawSteelRecommended: false
		},
		{
			value: 'tags',
			label: 'Tags',
			category: 'selection',
			description: 'Free-form tags for categorization',
			drawSteelRecommended: false
		},
		{
			value: 'date',
			label: 'Date',
			category: 'specialized',
			description: 'For tracking dates and timelines',
			drawSteelRecommended: false
		},
		{
			value: 'url',
			label: 'URL',
			category: 'specialized',
			description: 'For external links and references',
			drawSteelRecommended: false
		},
		{
			value: 'image',
			label: 'Image',
			category: 'specialized',
			description: 'For image URLs',
			drawSteelRecommended: false
		},
		{
			value: 'entity-ref',
			label: 'Entity Reference',
			category: 'reference',
			description: 'Link to other entities in your campaign',
			drawSteelRecommended: true
		},
		{
			value: 'entity-refs',
			label: 'Multiple Entity References',
			category: 'reference',
			description: 'Link to multiple entities',
			drawSteelRecommended: false
		},
		{
			value: 'computed',
			label: 'Computed Field',
			category: 'specialized',
			description: 'For calculated values based on other fields',
			drawSteelRecommended: true,
			exampleUse: 'Example: total_hp = level * 3 + con'
		}
	];

	// Built-in entity types for reference fields
	const ENTITY_TYPES: { value: EntityType; label: string }[] = [
		{ value: 'character', label: 'Character' },
		{ value: 'npc', label: 'NPC' },
		{ value: 'location', label: 'Location' },
		{ value: 'faction', label: 'Faction' },
		{ value: 'item', label: 'Item' },
		{ value: 'encounter', label: 'Encounter' },
		{ value: 'session', label: 'Session' }
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

	function addFieldsFromTemplate(template: FieldTemplate) {
		const existingKeys = new Set(fields.map((f) => f.key));
		const startOrder = fields.length;

		// Add template fields, handling conflicts
		const newFields = template.fieldDefinitions.map((field, index) => {
			let key = field.key;
			let suffix = 1;

			// Handle key conflicts by appending _1, _2, etc.
			while (existingKeys.has(key)) {
				key = `${field.key}_${suffix}`;
				suffix++;
			}

			existingKeys.add(key);

			return {
				...structuredClone(field),
				key,
				order: startOrder + index + 1
			};
		});

		fields = [...fields, ...newFields];
		showTemplatePicker = false;
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

	function toggleEntityType(index: number, entityType: EntityType) {
		const field = fields[index];
		// If entityTypes is undefined, clicking a checkbox means we want to select specific types (not all)
		// So start with empty array
		const currentTypes = field.entityTypes ?? [];
		let newTypes: EntityType[];

		if (currentTypes.includes(entityType)) {
			newTypes = currentTypes.filter((t) => t !== entityType);
		} else {
			newTypes = [...currentTypes, entityType];
		}

		// Keep the array even if empty (empty array means no types selected)
		updateField(index, { entityTypes: newTypes });
	}

	function setAllEntityTypes(index: number) {
		const field = fields[index];
		// Toggle behavior:
		// If "All Types" is currently checked (entityTypes is undefined), unchecking it sets to empty array
		// If "All Types" is currently unchecked (entityTypes is defined), checking it sets to undefined
		if (field.entityTypes === undefined) {
			// Was "All Types", now want specific types - start with empty array
			updateField(index, { entityTypes: [] });
		} else {
			// Was specific types, now want "All Types"
			updateField(index, { entityTypes: undefined });
		}
	}

	function togglePreview(index: number) {
		previewIndex = previewIndex === index ? null : index;
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
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggleExpanded(index);
					}
				}}
				aria-expanded={expandedIndex === index}
				aria-label={`Toggle field editor for ${field.label}`}
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
							<label for="field-type-{index}" class="label">Field Type</label>
							<select
								id="field-type-{index}"
								class="input"
								value={field.type}
								onchange={(e) => updateField(index, { type: e.currentTarget.value as FieldType })}
							>
								{#each Object.entries(FIELD_TYPE_CATEGORIES) as [categoryId, categoryLabel]}
									<optgroup label={categoryLabel}>
										{#each FIELD_TYPES.filter(t => t.category === categoryId) as type}
											<option value={type.value}>
												{type.label}{type.drawSteelRecommended ? ' ⭐' : ''}
											</option>
										{/each}
									</optgroup>
								{/each}
							</select>
							{#if field.type}
								{@const typeInfo = FIELD_TYPES.find(t => t.value === field.type)}
								{#if typeInfo}
									<div class="mt-2 space-y-1">
										{#if typeInfo.drawSteelRecommended}
											<p class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
												<span class="inline-block w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">⭐</span>
												<span class="font-medium">Recommended for Draw Steel</span>
											</p>
										{/if}
										<p class="text-xs text-gray-600 dark:text-gray-400">
											{typeInfo.description}
										</p>
										{#if typeInfo.exampleUse}
											<p class="text-xs text-gray-500 dark:text-gray-500 italic">
												{typeInfo.exampleUse}
											</p>
										{/if}
									</div>
								{/if}
							{/if}
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
							{#if field.options && field.options.length > 0}
								<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
									{field.options.length} options
								</p>
							{/if}
						</div>
					{/if}

					<!-- Entity type selection for entity-ref and entity-refs -->
					{#if field.type === 'entity-ref' || field.type === 'entity-refs'}
						<div>
							<label class="label">Allowed Entity Types</label>
							<div class="space-y-2">
								<label for="entity-all-types-{index}" class="flex items-center gap-2 cursor-pointer">
									<input
										id="entity-all-types-{index}"
										type="checkbox"
										checked={!field.entityTypes}
										onchange={() => setAllEntityTypes(index)}
										class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
									/>
									<span class="text-sm text-slate-700 dark:text-slate-300">All Types</span>
								</label>
								<div class="grid grid-cols-2 gap-2 pl-6">
									{#each ENTITY_TYPES as entityType}
										<label for="entity-type-{index}-{entityType.value}" class="flex items-center gap-2 cursor-pointer">
											<input
												id="entity-type-{index}-{entityType.value}"
												type="checkbox"
												checked={field.entityTypes?.includes(entityType.value) ?? false}
												onchange={() => toggleEntityType(index, entityType.value)}
												class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
											/>
											<span class="text-sm text-slate-700 dark:text-slate-300 capitalize">
												{entityType.label}
											</span>
										</label>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					<!-- Computed field configuration -->
					{#if field.type === 'computed'}
						<div>
							<label class="label">Formula Configuration</label>
							<ComputedFieldEditor
								availableFields={fields.filter((f, i) => i !== index)}
								config={field.computedConfig ?? { formula: '', dependencies: [], outputType: 'text' }}
								onchange={(config) => updateField(index, { computedConfig: config })}
							/>
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
						<label for="field-required-{index}" class="flex items-center gap-2 cursor-pointer">
							<input
								id="field-required-{index}"
								type="checkbox"
								checked={field.required}
								onchange={(e) => updateField(index, { required: e.currentTarget.checked })}
								class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
							/>
							<span class="text-sm text-slate-700 dark:text-slate-300">Required</span>
						</label>
					</div>

					<!-- Field Preview -->
					<div class="pt-2 border-t border-slate-200 dark:border-slate-700">
						<button
							type="button"
							class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
							onclick={() => togglePreview(index)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									togglePreview(index);
								}
							}}
							aria-expanded={previewIndex === index}
							aria-label={previewIndex === index ? 'Hide field preview' : 'Show field preview'}
						>
							{#if previewIndex === index}
								<EyeOff class="w-4 h-4" />
								Hide Preview
							{:else}
								<Eye class="w-4 h-4" />
								Show Preview
							{/if}
						</button>

						{#if previewIndex === index}
							<div class="mt-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
								<div>
									<label for="preview-{index}" class="label">
										{field.label}
										{#if field.required}
											<span class="text-red-500">*</span>
										{/if}
									</label>

									{#if field.type === 'text'}
										<input
											id="preview-{index}"
											type="text"
											class="input"
											placeholder={field.placeholder || ''}
											disabled
										/>
									{:else if field.type === 'textarea'}
										<textarea
											id="preview-{index}"
											class="input min-h-[80px]"
											placeholder={field.placeholder || ''}
											disabled
										></textarea>
									{:else if field.type === 'number'}
										<input
											id="preview-{index}"
											type="number"
											class="input"
											placeholder={field.placeholder || ''}
											disabled
										/>
									{:else if field.type === 'boolean'}
										<div class="flex items-center gap-2">
											<input
												type="checkbox"
												disabled
												role="checkbox"
												class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
											/>
											<span class="text-sm text-slate-700 dark:text-slate-300">{field.label}</span>
										</div>
									{:else if field.type === 'select'}
										<select id="preview-{index}" class="input" disabled role="combobox">
											<option value="">Select an option...</option>
											{#if field.options}
												{#each field.options as option}
													<option value={option} role="option">{option}</option>
												{/each}
											{/if}
										</select>
									{:else if field.type === 'multi-select'}
										<div class="text-sm text-slate-500 dark:text-slate-400">
											Multi-select dropdown (would show: {field.options?.join(', ') || 'no options'})
										</div>
									{:else if field.type === 'date'}
										<input
											id="preview-{index}"
											type="date"
											class="input"
											disabled
										/>
									{:else if field.type === 'url'}
										<input
											id="preview-{index}"
											type="url"
											class="input"
											placeholder={field.placeholder || 'https://'}
											disabled
										/>
									{:else}
										<div class="text-sm text-slate-500 dark:text-slate-400">
											{FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
										</div>
									{/if}

									{#if field.helpText}
										<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
											{field.helpText}
										</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
						<div class="flex gap-1">
							<button
								type="button"
								class="btn btn-ghost p-2"
								onclick={() => moveField(index, 'up')}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										moveField(index, 'up');
									}
								}}
								disabled={index === 0}
								title="Move up"
								aria-label="Move field up"
							>
								<ChevronUp class="w-4 h-4" />
							</button>
							<button
								type="button"
								class="btn btn-ghost p-2"
								onclick={() => moveField(index, 'down')}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										moveField(index, 'down');
									}
								}}
								disabled={index === fields.length - 1}
								title="Move down"
								aria-label="Move field down"
							>
								<ChevronDown class="w-4 h-4" />
							</button>
						</div>
						<button
							type="button"
							class="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
							onclick={() => removeField(index)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									removeField(index);
								}
							}}
							title="Delete field"
							aria-label={`Delete field ${field.label}`}
						>
							<Trash2 class="w-4 h-4" />
							<span class="text-sm">Delete</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Add field buttons -->
	<div class="flex gap-2">
		<button
			type="button"
			class="btn btn-secondary flex-1"
			onclick={addField}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					addField();
				}
			}}
			aria-label="Add new field"
		>
			<Plus class="w-4 h-4" />
			Add Field
		</button>
		<button
			type="button"
			class="btn btn-secondary"
			onclick={() => (showTemplatePicker = true)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					showTemplatePicker = true;
				}
			}}
			aria-label="Add fields from template"
		>
			<Library class="w-4 h-4" />
			Add from Template
		</button>
	</div>
</div>

<!-- Template Picker Modal -->
<FieldTemplatePicker
	open={showTemplatePicker}
	onselect={addFieldsFromTemplate}
	oncancel={() => (showTemplatePicker = false)}
/>
