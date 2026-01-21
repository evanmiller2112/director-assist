<script lang="ts">
	import { Save, ArrowLeft, Users, MapPin, Shield, Clock, FileText } from 'lucide-svelte';
	import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';
	import IconPicker from './IconPicker.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
	import DrawSteelTipsPanel from './DrawSteelTipsPanel.svelte';
	import { DEFAULT_RELATIONSHIPS } from '$lib/config/entityTypes';
	import { RELATIONSHIP_GROUPS } from '$lib/config/relationshipGroups';

	interface Props {
		initialValue?: EntityTypeDefinition;
		isEditing?: boolean;
		templateName?: string;
		onChangeTemplate?: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onsubmit: (entityType: EntityTypeDefinition) => void;
		oncancel: () => void;
	}

	let { initialValue, isEditing = false, templateName, onChangeTemplate, onDirtyChange, onsubmit, oncancel }: Props = $props();

	// Form state
	let typeKey = $state(initialValue?.type ?? '');
	let label = $state(initialValue?.label ?? '');
	let labelPlural = $state(initialValue?.labelPlural ?? '');
	let description = $state(initialValue?.description ?? '');
	let icon = $state(initialValue?.icon ?? 'user');
	let color = $state(initialValue?.color ?? 'character');
	let fieldDefinitions = $state<FieldDefinition[]>(initialValue?.fieldDefinitions ?? []);
	let selectedRelationships = $state<string[]>(initialValue?.defaultRelationships ?? []);

	let isSaving = $state(false);
	let errors = $state<Record<string, string>>({});
	let submitError = $state<string | null>(null);
	let tipsPanelDismissed = $state(false);
	let initialFormState = $state<string>('');
	let currentFormState = $derived(JSON.stringify({ label, labelPlural, description, typeKey, icon, color, fieldDefinitions, selectedRelationships }));

	// Known entity types (built-in) for duplicate checking
	const KNOWN_TYPES = ['character', 'npc', 'location', 'faction', 'item', 'encounter', 'session', 'deity', 'timeline_event', 'world_rule', 'player_profile'];

	// Track if user has manually edited the plural
	let userEditedPlural = $state(false);

	// Initialize form state snapshot on mount
	$effect(() => {
		if (!initialFormState) {
			initialFormState = JSON.stringify({ label, labelPlural, description, typeKey, icon, color, fieldDefinitions, selectedRelationships });
		}
	});

	// Track dirty state and notify parent
	$effect(() => {
		const isDirty = initialFormState !== currentFormState;
		if (onDirtyChange) {
			onDirtyChange(isDirty);
		}
	});

	// Auto-generate type key and plural from label
	function updateFromLabel(newLabel: string) {
		label = newLabel;
		// Only auto-generate type key if not editing AND no initial value (not from template)
		if (!isEditing && !initialValue) {
			typeKey = newLabel
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_|_$/g, '');
		}
		// Simple pluralization - just add "s" unless user manually edited or using template
		if (!userEditedPlural && !initialValue) {
			labelPlural = newLabel + 's';
		}
	}

	function validate(): boolean {
		errors = {};

		if (!label.trim()) {
			errors.label = 'Display name is required';
		}

		if (!typeKey.trim()) {
			errors.typeKey = 'Type key is required';
		} else if (!/^[a-z][a-z0-9_-]*$/.test(typeKey)) {
			if (/^[0-9]/.test(typeKey)) {
				errors.typeKey = 'Type key must start with a letter';
			} else {
				errors.typeKey = 'Type key must contain only lowercase letters, numbers, underscores, and hyphens';
			}
		} else if (!isEditing && KNOWN_TYPES.includes(typeKey)) {
			errors.typeKey = `Type key "${typeKey}" already exists`;
		}

		if (!labelPlural.trim()) {
			errors.labelPlural = 'Plural name is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;

		isSaving = true;
		submitError = null;
		try {
			const entityType: EntityTypeDefinition = {
				type: typeKey,
				label,
				labelPlural,
				description: description.trim() || undefined,
				icon,
				color,
				isBuiltIn: false,
				fieldDefinitions,
				defaultRelationships: selectedRelationships
			};
			await onsubmit(entityType);
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Failed to save entity type';
		} finally {
			isSaving = false;
		}
	}

	// Clear field error when user starts typing
	function clearFieldError(field: string) {
		const { [field]: _, ...rest } = errors;
		errors = rest;
	}

	function toggleRelationship(rel: string) {
		if (selectedRelationships.includes(rel)) {
			selectedRelationships = selectedRelationships.filter((r) => r !== rel);
		} else {
			selectedRelationships = [...selectedRelationships, rel];
		}
	}

	function getGroupIcon(groupId: string) {
		switch(groupId) {
			case 'character': return Users;
			case 'location': return MapPin;
			case 'authority': return Shield;
			case 'causality': return Clock;
			default: return Users;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-8">
	<!-- Tips Panel -->
	<DrawSteelTipsPanel dismissed={tipsPanelDismissed} onDismiss={() => (tipsPanelDismissed = true)} />

	<!-- Template Indicator Banner -->
	{#if templateName && !isEditing}
		<div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
			<div class="flex items-center gap-3">
				<div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
					<FileText class="w-5 h-5" />
				</div>
				<div>
					<p class="text-sm text-blue-900 dark:text-blue-100 inline-flex items-center gap-1">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 badge">
							Template: {templateName}
						</span>
					</p>
				</div>
			</div>
			{#if onChangeTemplate}
				<button
					type="button"
					class="text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
					onclick={onChangeTemplate}
					aria-label="Change template"
				>
					Change template
				</button>
			{/if}
		</div>
	{/if}

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
					oninput={(e) => {
						clearFieldError('label');
						updateFromLabel(e.currentTarget.value);
					}}
					placeholder="e.g., Quest, Vehicle, Spell"
				/>
				{#if errors.label}
					<div class="text-sm text-red-500 mt-1">{errors.label}</div>
				{/if}
			</div>

			<div>
				<label for="description" class="label" id="entity-description-label">Description (optional)</label>
				<textarea
					id="description"
					class="input min-h-[80px]"
					value={description}
					oninput={(e) => (description = e.currentTarget.value)}
					placeholder="Brief description of this entity type (optional)"
					aria-labelledby="entity-description-label"
				></textarea>
				<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
					Describe this entity type to help users understand its purpose
				</p>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="typeKey" class="label">Type Key</label>
					<input
						id="typeKey"
						type="text"
						class="input"
						value={typeKey}
						oninput={(e) => {
							clearFieldError('typeKey');
							typeKey = e.currentTarget.value;
						}}
						disabled={isEditing}
						placeholder="e.g., quest"
					/>
					{#if errors.typeKey}
						<div class="text-sm text-red-500 mt-1">{errors.typeKey}</div>
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
							clearFieldError('labelPlural');
							labelPlural = e.currentTarget.value;
							userEditedPlural = true;
						}}
						placeholder="e.g., Quests"
					/>
					{#if errors.labelPlural}
						<div class="text-sm text-red-500 mt-1">{errors.labelPlural}</div>
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
		<div class="space-y-6">
			{#each RELATIONSHIP_GROUPS as group}
				{@const Icon = getGroupIcon(group.id)}
				<div role="group" aria-label={group.label} class="space-y-3">
					<div class="flex items-center gap-2">
						<Icon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
						<h3 class="text-sm font-medium text-slate-900 dark:text-white">{group.label}</h3>
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400 opacity-80">
						{group.description}
					</p>
					<div class="flex flex-wrap gap-2">
						{#each group.relationships as rel}
							<label for="rel-{rel}" class="inline-flex items-center cursor-pointer">
								<input
									id="rel-{rel}"
									type="checkbox"
									checked={selectedRelationships.includes(rel)}
									onchange={() => toggleRelationship(rel)}
									class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
									aria-label={rel.replace(/_/g, ' ')}
								/>
								<span class="ml-2 text-sm text-slate-700 dark:text-slate-300">
									{rel.replace(/_/g, ' ')}
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Preview -->
	<section>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Preview</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
			This is how the entity type will appear in the sidebar navigation.
		</p>
		<div class="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
			<div class="flex items-center gap-3 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
				<div class="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400">
					<!-- Icon would render here -->
					<span class="text-sm">📝</span>
				</div>
				<div class="flex-1">
					<div class="text-sm font-medium text-slate-900 dark:text-white">
						{labelPlural || 'Entity Types'}
					</div>
					{#if description}
						<div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
							{description}
						</div>
					{/if}
				</div>
				<div class="text-xs text-slate-500 dark:text-slate-400">
					0
				</div>
			</div>
		</div>
	</section>

	<!-- Actions -->
	<div class="flex flex-col gap-2">
		{#if submitError}
			<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
				{submitError}
			</div>
		{/if}
		<div class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
			<button
				type="button"
				class="btn btn-secondary"
				onclick={oncancel}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						oncancel();
					}
				}}
				disabled={isSaving}
				aria-label="Cancel and return"
			>
				<ArrowLeft class="w-4 h-4" />
				Cancel
			</button>
			<button
				type="submit"
				class="btn btn-primary"
				disabled={isSaving}
				aria-label={isSaving ? 'Saving...' : isEditing ? 'Save changes to entity type' : 'Create entity type'}
			>
				<Save class="w-4 h-4" />
				{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Entity Type'}
			</button>
		</div>
	</div>
</form>
