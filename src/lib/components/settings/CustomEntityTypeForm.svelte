<script lang="ts">
	import { Save, ArrowLeft } from 'lucide-svelte';
	import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';
	import IconPicker from './IconPicker.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
	import { DEFAULT_RELATIONSHIPS } from '$lib/config/entityTypes';

	interface Props {
		initialValue?: EntityTypeDefinition;
		isEditing?: boolean;
		onsubmit: (entityType: EntityTypeDefinition) => void;
		oncancel: () => void;
	}

	let { initialValue, isEditing = false, onsubmit, oncancel }: Props = $props();

	// Form state
	let typeKey = $state(initialValue?.type ?? '');
	let label = $state(initialValue?.label ?? '');
	let labelPlural = $state(initialValue?.labelPlural ?? '');
	let icon = $state(initialValue?.icon ?? 'user');
	let color = $state(initialValue?.color ?? 'character');
	let fieldDefinitions = $state<FieldDefinition[]>(initialValue?.fieldDefinitions ?? []);
	let selectedRelationships = $state<string[]>(initialValue?.defaultRelationships ?? []);

	let isSaving = $state(false);
	let errors = $state<Record<string, string>>({});

	// Track if user has manually edited the plural
	let userEditedPlural = $state(false);

	// Auto-generate type key and plural from label
	function updateFromLabel(newLabel: string) {
		label = newLabel;
		if (!isEditing) {
			typeKey = newLabel
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_|_$/g, '');
		}
		// Simple pluralization - just add "s" unless user manually edited
		if (!userEditedPlural) {
			labelPlural = newLabel + 's';
		}
	}

	function validate(): boolean {
		errors = {};

		if (!label.trim()) {
			errors.label = 'Label is required';
		}

		if (!typeKey.trim()) {
			errors.typeKey = 'Type key is required';
		} else if (!/^[a-z][a-z0-9_]*$/.test(typeKey)) {
			errors.typeKey = 'Type key must start with a letter and contain only lowercase letters, numbers, and underscores';
		}

		if (!labelPlural.trim()) {
			errors.labelPlural = 'Plural label is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;

		isSaving = true;
		try {
			const entityType: EntityTypeDefinition = {
				type: typeKey,
				label,
				labelPlural,
				icon,
				color,
				isBuiltIn: false,
				fieldDefinitions,
				defaultRelationships: selectedRelationships
			};
			await onsubmit(entityType);
		} finally {
			isSaving = false;
		}
	}

	function toggleRelationship(rel: string) {
		if (selectedRelationships.includes(rel)) {
			selectedRelationships = selectedRelationships.filter((r) => r !== rel);
		} else {
			selectedRelationships = [...selectedRelationships, rel];
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-8">
	<!-- Basic Info -->
	<section>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h2>
		<div class="space-y-4">
			<div>
				<label for="label" class="label">Display Name</label>
				<input
					id="label"
					type="text"
					class="input"
					value={label}
					oninput={(e) => updateFromLabel(e.currentTarget.value)}
					placeholder="e.g., Quest, Vehicle, Spell"
				/>
				{#if errors.label}
					<p class="text-sm text-red-500 mt-1">{errors.label}</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="typeKey" class="label">Type Key</label>
					<input
						id="typeKey"
						type="text"
						class="input"
						value={typeKey}
						oninput={(e) => (typeKey = e.currentTarget.value)}
						disabled={isEditing}
						placeholder="e.g., quest"
					/>
					{#if errors.typeKey}
						<p class="text-sm text-red-500 mt-1">{errors.typeKey}</p>
					{/if}
					{#if isEditing}
						<p class="text-xs text-slate-500 mt-1">Type key cannot be changed after creation</p>
					{/if}
				</div>
				<div>
					<label for="labelPlural" class="label">Plural Name</label>
					<input
						id="labelPlural"
						type="text"
						class="input"
						value={labelPlural}
						oninput={(e) => {
							labelPlural = e.currentTarget.value;
							userEditedPlural = true;
						}}
						placeholder="e.g., Quests"
					/>
					{#if errors.labelPlural}
						<p class="text-sm text-red-500 mt-1">{errors.labelPlural}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">Icon</label>
					<IconPicker bind:value={icon} />
				</div>
				<div>
					<label class="label">Color</label>
					<ColorPicker bind:value={color} />
				</div>
			</div>
		</div>
	</section>

	<!-- Field Definitions -->
	<section>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Fields</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
			Define the fields that entities of this type will have. All entities automatically have Name, Description, Tags, and Notes.
		</p>
		<FieldDefinitionEditor bind:fields={fieldDefinitions} />
	</section>

	<!-- Default Relationships -->
	<section>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Default Relationships</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
			Select the relationship types that will be suggested when linking entities of this type.
		</p>
		<div class="flex flex-wrap gap-2">
			{#each DEFAULT_RELATIONSHIPS as rel}
				<button
					type="button"
					class="px-3 py-1.5 text-sm rounded-full border transition-colors
						{selectedRelationships.includes(rel)
						? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
						: 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}"
					onclick={() => toggleRelationship(rel)}
				>
					{rel.replace(/_/g, ' ')}
				</button>
			{/each}
		</div>
	</section>

	<!-- Actions -->
	<div class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
		<button type="button" class="btn btn-secondary" onclick={oncancel}>
			<ArrowLeft class="w-4 h-4" />
			Cancel
		</button>
		<button type="submit" class="btn btn-primary" disabled={isSaving}>
			<Save class="w-4 h-4" />
			{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Entity Type'}
		</button>
	</div>
</form>
