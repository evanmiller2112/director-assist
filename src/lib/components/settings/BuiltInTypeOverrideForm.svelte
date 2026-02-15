<script lang="ts">
	import type { EntityTypeDefinition, EntityTypeOverride, FieldDefinition } from '$lib/types';
	import { Eye, EyeOff, ChevronUp, ChevronDown, Plus, Trash2, RotateCcw } from 'lucide-svelte';
	import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';

	interface Props {
		entityType: EntityTypeDefinition;
		existingOverride?: EntityTypeOverride;
		onsubmit: (override: EntityTypeOverride) => void | Promise<void>;
		oncancel: () => void;
	}

	let { entityType, existingOverride, onsubmit, oncancel }: Props = $props();

	// Form state
	let hiddenFields = $state<string[]>(existingOverride?.hiddenFields ?? []);
	let fieldOrder = $state<string[]>(existingOverride?.fieldOrder ?? []);
	let additionalFields = $state<FieldDefinition[]>(existingOverride?.additionalFields ?? []);
	let hiddenFromSidebar = $state<boolean>(existingOverride?.hiddenFromSidebar ?? false);

	// UI state
	let isSaving = $state(false);
	let showConfirmReset = $state(false);
	let showConfirmCancel = $state(false);
	let showFieldEditor = $state(false);
	let editingFieldIndex = $state<number | null>(null);

	// Track if form has unsaved changes
	const hasChanges = $derived.by(() => {
		const hasHiddenChanges = JSON.stringify(hiddenFields) !== JSON.stringify(existingOverride?.hiddenFields ?? []);
		const hasOrderChanges = JSON.stringify(fieldOrder) !== JSON.stringify(existingOverride?.fieldOrder ?? []);
		const hasAdditionalChanges = JSON.stringify(additionalFields) !== JSON.stringify(existingOverride?.additionalFields ?? []);
		const hasSidebarChanges = hiddenFromSidebar !== (existingOverride?.hiddenFromSidebar ?? false);
		return hasHiddenChanges || hasOrderChanges || hasAdditionalChanges || hasSidebarChanges;
	});

	// Get all fields including additional fields
	const allFields = $derived.by(() => {
		return [...entityType.fieldDefinitions, ...additionalFields];
	});

	// Get visible fields (not hidden)
	const visibleFields = $derived.by(() => {
		return allFields.filter(f => !hiddenFields.includes(f.key));
	});

	// Get ordered fields for display
	const orderedFields = $derived.by(() => {
		if (fieldOrder.length === 0) {
			return [...visibleFields].sort((a, b) => a.order - b.order);
		}

		const orderMap = new Map(fieldOrder.map((key, index) => [key, index]));
		return [...visibleFields].sort((a, b) => {
			const orderA = orderMap.get(a.key) ?? 999;
			const orderB = orderMap.get(b.key) ?? 999;
			if (orderA !== orderB) return orderA - orderB;
			return a.order - b.order;
		});
	});

	// Check if order differs from default
	const hasCustomOrder = $derived.by(() => {
		if (fieldOrder.length === 0) return false;
		const defaultOrder = [...visibleFields].sort((a, b) => a.order - b.order).map(f => f.key);
		return JSON.stringify(fieldOrder) !== JSON.stringify(defaultOrder);
	});

	// Check if customizations exist
	const hasCustomizations = $derived.by(() => {
		return hiddenFields.length > 0 || additionalFields.length > 0 || hasCustomOrder || hiddenFromSidebar;
	});

	function toggleFieldVisibility(fieldKey: string) {
		if (hiddenFields.includes(fieldKey)) {
			hiddenFields = hiddenFields.filter(k => k !== fieldKey);
		} else {
			hiddenFields = [...hiddenFields, fieldKey];
			// Remove from field order if it's there
			if (fieldOrder.includes(fieldKey)) {
				fieldOrder = fieldOrder.filter(k => k !== fieldKey);
			}
		}
	}

	function moveFieldUp(index: number) {
		if (index === 0) return;

		const currentOrder = orderedFields.map(f => f.key);
		[currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
		fieldOrder = currentOrder;
	}

	function moveFieldDown(index: number) {
		if (index === orderedFields.length - 1) return;

		const currentOrder = orderedFields.map(f => f.key);
		[currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
		fieldOrder = currentOrder;
	}

	function resetFieldOrder() {
		fieldOrder = [];
	}

	function openFieldEditor(fieldIndex: number | null = null) {
		editingFieldIndex = fieldIndex;
		showFieldEditor = true;
	}

	function closeFieldEditor() {
		showFieldEditor = false;
		editingFieldIndex = null;
	}

	function saveField(fields: FieldDefinition[]) {
		additionalFields = fields;
		closeFieldEditor();
	}

	function deleteField(index: number) {
		const field = additionalFields[index];
		additionalFields = additionalFields.filter((_, i) => i !== index);
		// Remove from field order if present
		if (fieldOrder.includes(field.key)) {
			fieldOrder = fieldOrder.filter(k => k !== field.key);
		}
	}

	function resetToDefaults() {
		showConfirmReset = false;
		hiddenFields = [];
		fieldOrder = [];
		additionalFields = [];
		hiddenFromSidebar = false;
	}

	async function handleSubmit() {
		isSaving = true;
		try {
			const override: EntityTypeOverride = {
				type: entityType.type
			};

			// Only include changed properties
			if (hiddenFields.length > 0) {
				override.hiddenFields = hiddenFields;
			}
			if (fieldOrder.length > 0) {
				override.fieldOrder = fieldOrder;
			}
			if (additionalFields.length > 0) {
				override.additionalFields = additionalFields;
			}
			if (hiddenFromSidebar) {
				override.hiddenFromSidebar = hiddenFromSidebar;
			}

			await onsubmit(override);
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		if (hasChanges) {
			showConfirmCancel = true;
		} else {
			oncancel();
		}
	}

	function confirmCancel() {
		showConfirmCancel = false;
		oncancel();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="text-3xl">
			{#if entityType.icon === 'user'}
				👤
			{:else if entityType.icon === 'users'}
				👥
			{:else if entityType.icon === 'map-pin'}
				📍
			{:else if entityType.icon === 'flag'}
				🚩
			{:else if entityType.icon === 'package'}
				📦
			{:else if entityType.icon === 'swords'}
				⚔️
			{:else if entityType.icon === 'calendar'}
				📅
			{:else if entityType.icon === 'sun'}
				☀️
			{:else if entityType.icon === 'clock'}
				🕐
			{:else if entityType.icon === 'book'}
				📖
			{:else if entityType.icon === 'user-circle'}
				👤
			{:else if entityType.icon === 'book-open'}
				📖
			{:else}
				📋
			{/if}
		</div>
		<div>
			<h2 class="text-2xl font-bold text-slate-900 dark:text-white">
				Customize {entityType.label}
			</h2>
			<p class="text-sm text-slate-600 dark:text-slate-400">
				Configure which fields to show, their order, and add custom fields
			</p>
		</div>
	</div>

	<!-- Field Visibility Section -->
	<section class="space-y-3">
		<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Field Visibility</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			Control which fields appear in forms for this entity type
			{#if hiddenFields.length > 0}
				<span class="ml-2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
					{hiddenFields.length} field{hiddenFields.length === 1 ? '' : 's'} hidden
				</span>
			{/if}
		</p>

		<div class="space-y-2">
			{#each entityType.fieldDefinitions as field}
				<label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
					<input
						type="checkbox"
						checked={!hiddenFields.includes(field.key)}
						onchange={() => toggleFieldVisibility(field.key)}
						class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
					/>
					{#if hiddenFields.includes(field.key)}
						<EyeOff class="w-4 h-4 text-slate-400" />
					{:else}
						<Eye class="w-4 h-4 text-slate-600 dark:text-slate-400" />
					{/if}
					<div class="flex-1">
						<div class="font-medium text-slate-900 dark:text-white">
							{field.label}
							{#if field.required}
								<span class="text-xs text-red-500 ml-1">Required</span>
							{/if}
						</div>
						<div class="text-xs text-slate-500 dark:text-slate-400">
							{field.type}
						</div>
					</div>
				</label>
			{/each}
		</div>

		{#if entityType.fieldDefinitions.some(f => f.required && hiddenFields.includes(f.key))}
			<p class="text-sm text-amber-600 dark:text-amber-400 mt-2">
				⚠️ Warning: Hiding required fields may cause issues when creating entities
			</p>
		{/if}
	</section>

	<!-- Field Ordering Section -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Field Order</h3>
			{#if hasCustomOrder}
				<button
					type="button"
					class="btn btn-ghost text-sm"
					onclick={resetFieldOrder}
				>
					<RotateCcw class="w-4 h-4" />
					Reset to Default Order
				</button>
			{/if}
		</div>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			Reorder fields to control how they appear in forms
			{#if hasCustomOrder}
				<span class="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
					Custom order applied
				</span>
			{/if}
		</p>

		<div class="space-y-2">
			{#each orderedFields as field, index}
				<div class="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
					<div class="flex flex-col gap-0.5">
						<button
							type="button"
							class="btn btn-ghost p-1 disabled:opacity-30"
							onclick={() => moveFieldUp(index)}
							disabled={index === 0}
							aria-label="Move {field.label} up"
						>
							<ChevronUp class="w-4 h-4" />
						</button>
						<button
							type="button"
							class="btn btn-ghost p-1 disabled:opacity-30"
							onclick={() => moveFieldDown(index)}
							disabled={index === orderedFields.length - 1}
							aria-label="Move {field.label} down"
						>
							<ChevronDown class="w-4 h-4" />
						</button>
					</div>
					<div class="flex-1">
						<div class="font-medium text-slate-900 dark:text-white">{field.label}</div>
						<div class="text-xs text-slate-500 dark:text-slate-400">{field.type}</div>
					</div>
					<div class="text-sm text-slate-500 dark:text-slate-400">#{index + 1}</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Additional Fields Section -->
	<section class="space-y-3">
		<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Additional Fields</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			Add custom fields specific to your campaign
			{#if additionalFields.length > 0}
				<span class="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
					+{additionalFields.length} custom field{additionalFields.length === 1 ? '' : 's'}
				</span>
			{/if}
		</p>

		{#if additionalFields.length === 0}
			<div class="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
				<p class="text-slate-500 dark:text-slate-400 mb-3">No custom fields added yet</p>
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => openFieldEditor()}
				>
					<Plus class="w-4 h-4" />
					Add Custom Field
				</button>
			</div>
		{:else}
			<div class="space-y-2">
				{#each additionalFields as field, index}
					<div class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">{field.label}</div>
							<div class="text-xs text-slate-500 dark:text-slate-400">{field.type}</div>
						</div>
						<button
							type="button"
							class="btn btn-ghost p-2"
							onclick={() => openFieldEditor(index)}
							aria-label="Edit {field.label}"
						>
							Edit
						</button>
						<button
							type="button"
							class="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
							onclick={() => deleteField(index)}
							aria-label="Delete {field.label}"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				{/each}
			</div>
			<button
				type="button"
				class="btn btn-secondary w-full"
				onclick={() => openFieldEditor()}
			>
				<Plus class="w-4 h-4" />
				Add Another Field
			</button>
		{/if}
	</section>

	<!-- Sidebar Visibility Section -->
	<section class="space-y-3">
		<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Sidebar Visibility</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			Control whether this entity type appears in the sidebar navigation
		</p>

		<label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
			<input
				type="checkbox"
				bind:checked={hiddenFromSidebar}
				class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
			/>
			<div>
				<div class="font-medium text-slate-900 dark:text-white">
					Hide {entityType.labelPlural} from sidebar
				</div>
				<div class="text-xs text-slate-500 dark:text-slate-400">
					You can still access these entities through search and relationships
				</div>
			</div>
		</label>

		{#if hiddenFromSidebar}
			<p class="text-sm text-amber-600 dark:text-amber-400">
				⚠️ This entity type will not appear in the sidebar navigation
			</p>
		{/if}
	</section>

	<!-- Actions -->
	<div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
		<div>
			{#if hasCustomizations}
				<button
					type="button"
					class="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
					onclick={() => showConfirmReset = true}
				>
					<RotateCcw class="w-4 h-4" />
					Reset to Defaults
				</button>
			{/if}
		</div>
		<div class="flex gap-2">
			<button
				type="button"
				class="btn btn-secondary"
				onclick={handleCancel}
				disabled={isSaving}
			>
				Cancel
			</button>
			<button
				type="button"
				class="btn btn-primary"
				onclick={handleSubmit}
				disabled={!hasChanges || isSaving}
			>
				{#if isSaving}
					Saving...
				{:else}
					Save Changes
				{/if}
			</button>
		</div>
	</div>
</div>

<!-- Field Editor Modal -->
{#if showFieldEditor}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
				{editingFieldIndex !== null ? 'Edit Field' : 'Add Custom Field'}
			</h3>
			<FieldDefinitionEditor
				bind:fields={additionalFields}
				onchange={(fields) => saveField(fields)}
			/>
			<div class="flex justify-end gap-2 mt-4">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={closeFieldEditor}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Reset Confirmation Modal -->
{#if showConfirmReset}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
				Reset to Defaults?
			</h3>
			<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
				This will remove all customizations:
			</p>
			<ul class="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-1">
				{#if hiddenFields.length > 0}
					<li>• {hiddenFields.length} hidden field{hiddenFields.length === 1 ? '' : 's'}</li>
				{/if}
				{#if hasCustomOrder}
					<li>• Custom field order</li>
				{/if}
				{#if additionalFields.length > 0}
					<li>• {additionalFields.length} custom field{additionalFields.length === 1 ? '' : 's'}</li>
				{/if}
				{#if hiddenFromSidebar}
					<li>• Hidden from sidebar setting</li>
				{/if}
			</ul>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => showConfirmReset = false}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary bg-red-600 hover:bg-red-700"
					onclick={resetToDefaults}
				>
					Reset to Defaults
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Cancel Confirmation Modal -->
{#if showConfirmCancel}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
				Discard Changes?
			</h3>
			<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
				You have unsaved changes. Are you sure you want to discard them?
			</p>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => showConfirmCancel = false}
				>
					Keep Editing
				</button>
				<button
					type="button"
					class="btn btn-primary bg-red-600 hover:bg-red-700"
					onclick={confirmCancel}
				>
					Discard Changes
				</button>
			</div>
		</div>
	</div>
{/if}
