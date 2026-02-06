<script lang="ts">
	/**
	 * FieldInput Component - Phase 4: Entity Form Field Rendering (Issue #25)
	 *
	 * Unified input component that renders the appropriate control for any field type.
	 * Handles validation, state management, and AI generation integration.
	 *
	 * Supports all 14 field types:
	 * - text, short-text → text input
	 * - textarea, long-text → textarea
	 * - richtext → markdown editor
	 * - number → number input
	 * - boolean → checkbox
	 * - date → date picker
	 * - select → dropdown
	 * - multi-select, tags → multi-select component
	 * - entity-ref → entity picker (single)
	 * - entity-refs → entity picker (multiple)
	 * - url → URL input with validation
	 * - image → image upload/display
	 * - computed → read-only display with auto-calculation
	 */

	import type { FieldDefinition, FieldValue } from '$lib/types';
	import { normalizeFieldType, evaluateComputedField } from '$lib/utils/fieldTypes';
	import MarkdownEditor from '$lib/components/markdown/MarkdownEditor.svelte';
	import { Check, X, ExternalLink, Upload, Trash2 } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';

	// Props
	interface Props {
		field: FieldDefinition;
		value: FieldValue;
		onchange: (value: FieldValue) => void;
		disabled?: boolean;
		error?: string;
		allFields?: Record<string, any>; // For computed field evaluation
	}

	let {
		field,
		value = $bindable(),
		onchange,
		disabled = false,
		error = '',
		allFields = {}
	}: Props = $props();

	// Normalize field type (handles aliases like short-text → text)
	const normalizedType = $derived(normalizeFieldType(field.type));

	// Generate unique ID for input
	const inputId = $derived(`field-${field.key}-${Math.random().toString(36).substring(2, 9)}`);
	const errorId = $derived(`error-${inputId}`);

	// Format option labels (replace underscores with spaces)
	function formatOptionLabel(option: string): string {
		return option.replace(/_/g, ' ');
	}

	// Handle text/textarea input
	function handleTextInput(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		onchange(target.value || '');
	}

	// Handle number input
	function handleNumberInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const val = target.value;
		onchange(val === '' ? null : Number(val));
	}

	// Handle boolean input
	function handleBooleanInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onchange(target.checked);
	}

	// Handle date input
	function handleDateInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onchange(target.value || '');
	}

	// Handle select input
	function handleSelectInput(event: Event) {
		const target = event.target as HTMLSelectElement;
		onchange(target.value || '');
	}

	// Handle multi-select checkbox
	function handleMultiSelectChange(option: string, checked: boolean) {
		const currentValues = Array.isArray(value) ? value : [];
		if (checked) {
			onchange([...currentValues, option]);
		} else {
			onchange(currentValues.filter((v) => v !== option));
		}
	}

	// Handle tags input (comma-separated)
	function handleTagsBlur(event: Event) {
		const target = event.target as HTMLInputElement;
		const text = target.value;
		if (text) {
			const tags = text.split(',').map((t) => t.trim()).filter((t) => t);
			onchange(tags);
		}
	}

	// Handle entity-ref select
	function handleEntityRefChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onchange(target.value || null);
	}

	// Handle entity-refs multi-select
	function handleEntityRefsChange(entityId: string, checked: boolean) {
		const currentValues = Array.isArray(value) ? value : [];
		if (checked) {
			onchange([...currentValues, entityId]);
		} else {
			onchange(currentValues.filter((v) => v !== entityId));
		}
	}

	// Handle URL input with validation
	function handleUrlInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onchange(target.value || '');
	}

	// Validate URL
	function isValidUrl(url: string): boolean {
		if (!url) return true;
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Check file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Check file size (warn if > 1MB)
		if (file.size > 1024 * 1024) {
			if (!confirm('This image is larger than 1MB. Continue?')) {
				target.value = '';
				return;
			}
		}

		// Convert to base64
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			onchange(result);
		};
		reader.onerror = () => {
			alert('Error reading file');
		};
		reader.readAsDataURL(file);
	}

	// Clear image
	function clearImage() {
		onchange(null);
	}

	// Open URL in new tab
	function openUrl(url: string) {
		// Prevent javascript: URLs for security
		if (url.toLowerCase().startsWith('javascript:')) {
			alert('Invalid URL');
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	// Get entities filtered by allowed types
	const availableEntities = $derived.by(() => {
		const allEntities = entitiesStore.entities;
		if (!field.entityTypes || field.entityTypes.length === 0) {
			return allEntities;
		}
		return allEntities.filter((e) => field.entityTypes?.includes(e.type));
	});

	// Get entity name by ID
	function getEntityName(entityId: string): string {
		const entity = entitiesStore.entities.find((e) => e.id === entityId);
		return entity ? entity.name : entityId;
	}

	// Computed field value
	const computedValue = $derived.by(() => {
		if (normalizedType === 'computed' && field.computedConfig) {
			try {
				return evaluateComputedField(field.computedConfig, allFields);
			} catch (error) {
				return `Error: ${error}`;
			}
		}
		return null;
	});

	// Format value for display (tags as comma-separated)
	const displayValue = $derived.by(() => {
		if (normalizedType === 'tags' && Array.isArray(value)) {
			return value.join(', ');
		}
		return value || '';
	});

	// Check if URL is valid for display
	const urlIsValid = $derived.by(() => {
		if (normalizedType === 'url' && typeof value === 'string') {
			return isValidUrl(value);
		}
		return false;
	});

	// Check if multi-select option is selected
	function isOptionSelected(option: string): boolean {
		return Array.isArray(value) && value.includes(option);
	}

	// Check if entity is selected
	function isEntitySelected(entityId: string): boolean {
		if (normalizedType === 'entity-ref') {
			return value === entityId;
		}
		if (normalizedType === 'entity-refs') {
			return Array.isArray(value) && value.includes(entityId);
		}
		return false;
	}

	// Common input classes
	const inputClasses = $derived(
		`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
			error
				? 'border-red-500 focus:ring-red-500'
				: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
		}`
	);
</script>

<div class="field-input">
	<!-- Label -->
	<label for={inputId} class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
		{field.label}
		{#if field.required}
			<span class="text-red-500">*</span>
		{/if}
	</label>

	<!-- Help text -->
	{#if field.helpText}
		<p class="text-sm text-slate-500 dark:text-slate-400 mb-2">{field.helpText}</p>
	{/if}

	<!-- Input control based on field type -->
	{#if normalizedType === 'text'}
		<input
			type="text"
			id={inputId}
			value={value || ''}
			placeholder={field.placeholder || ''}
			{disabled}
			oninput={handleTextInput}
			class={inputClasses}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
		/>
	{:else if normalizedType === 'textarea'}
		<textarea
			id={inputId}
			value={typeof value === 'string' ? value : ''}
			placeholder={field.placeholder || ''}
			{disabled}
			oninput={handleTextInput}
			class={`${inputClasses} min-h-[100px] resize-vertical`}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
		></textarea>
	{:else if normalizedType === 'richtext'}
		<MarkdownEditor
			value={typeof value === 'string' ? value : ''}
			placeholder={field.placeholder || ''}
			{disabled}
			{error}
			onchange={(v: string) => onchange(v)}
		/>
	{:else if normalizedType === 'number'}
		<input
			type="number"
			id={inputId}
			value={value ?? ''}
			placeholder={field.placeholder || ''}
			{disabled}
			oninput={handleNumberInput}
			class={inputClasses}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
		/>
	{:else if normalizedType === 'boolean'}
		<div class="flex items-center">
			<input
				type="checkbox"
				id={inputId}
				checked={value === true}
				{disabled}
				onchange={handleBooleanInput}
				class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
				aria-invalid={error ? 'true' : 'false'}
				aria-describedby={error ? errorId : undefined}
			/>
			<label for={inputId} class="ml-2 text-sm text-slate-700 dark:text-slate-300">
				{field.label}
			</label>
		</div>
	{:else if normalizedType === 'date'}
		<input
			type="date"
			id={inputId}
			value={value || ''}
			{disabled}
			onchange={handleDateInput}
			class={inputClasses}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
		/>
	{:else if normalizedType === 'select'}
		<select
			id={inputId}
			value={value || ''}
			{disabled}
			onchange={handleSelectInput}
			class={inputClasses}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
		>
			<option value="">Select an option...</option>
			{#each field.options || [] as option}
				<option value={option}>{formatOptionLabel(option)}</option>
			{/each}
		</select>
	{:else if normalizedType === 'multi-select'}
		<div class="space-y-2">
			{#each field.options || [] as option}
				<label class="flex items-center">
					<input
						type="checkbox"
						checked={isOptionSelected(option)}
						{disabled}
						onchange={(e) => handleMultiSelectChange(option, e.currentTarget.checked)}
						class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
					/>
					<span class="ml-2 text-sm text-slate-700 dark:text-slate-300">
						{formatOptionLabel(option)}
					</span>
				</label>
			{/each}
		</div>
	{:else if normalizedType === 'tags'}
		{#if field.options && field.options.length > 0}
			<!-- Tags with predefined options: render as multi-select -->
			<div class="space-y-2">
				{#each field.options as option}
					<label class="flex items-center">
						<input
							type="checkbox"
							checked={isOptionSelected(option)}
							{disabled}
							onchange={(e) => handleMultiSelectChange(option, e.currentTarget.checked)}
							class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
						/>
						<span class="ml-2 text-sm text-slate-700 dark:text-slate-300">
							{formatOptionLabel(option)}
						</span>
					</label>
				{/each}
			</div>
		{:else}
			<!-- Tags without options: comma-separated text input -->
			<input
				type="text"
				id={inputId}
				value={displayValue}
				placeholder={field.placeholder || 'Enter tags (comma-separated)'}
				{disabled}
				onblur={handleTagsBlur}
				class={inputClasses}
				aria-invalid={error ? 'true' : 'false'}
				aria-describedby={error ? errorId : undefined}
			/>
		{/if}
	{:else if normalizedType === 'entity-ref'}
		<div class="space-y-2">
			<select
				id={inputId}
				value={value || ''}
				{disabled}
				onchange={handleEntityRefChange}
				class={inputClasses}
				aria-invalid={error ? 'true' : 'false'}
				aria-describedby={error ? errorId : undefined}
			>
				<option value="">Select an entity...</option>
				{#each availableEntities as entity}
					<option value={entity.id}>
						{entity.name} ({entity.type})
					</option>
				{/each}
			</select>
			{#if value}
				<button
					type="button"
					onclick={() => onchange(null)}
					{disabled}
					class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
				>
					Clear selection
				</button>
			{/if}
		</div>
	{:else if normalizedType === 'entity-refs'}
		<div class="space-y-2 max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-2">
			{#each availableEntities as entity}
				<label class="flex items-center">
					<input
						type="checkbox"
						checked={isEntitySelected(entity.id)}
						{disabled}
						onchange={(e) => handleEntityRefsChange(entity.id, e.currentTarget.checked)}
						class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
					/>
					<span class="ml-2 text-sm text-slate-700 dark:text-slate-300">
						{entity.name} <span class="text-slate-500">({entity.type})</span>
					</span>
				</label>
			{/each}
		</div>
	{:else if normalizedType === 'url'}
		<div class="space-y-2">
			<div class="flex gap-2">
				<input
					type="url"
					id={inputId}
					value={value || ''}
					placeholder={field.placeholder || 'https://example.com'}
					{disabled}
					oninput={handleUrlInput}
					class={inputClasses}
					aria-invalid={error || (value && !urlIsValid) ? 'true' : 'false'}
					aria-describedby={error ? errorId : undefined}
				/>
				{#if value && urlIsValid}
					<button
						type="button"
						onclick={() => openUrl(value as string)}
						{disabled}
						class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
						title="Open link"
					>
						<ExternalLink size={16} />
					</button>
				{/if}
			</div>
			{#if value && !urlIsValid}
				<p class="text-sm text-red-600 dark:text-red-400">Invalid URL</p>
			{/if}
		</div>
	{:else if normalizedType === 'image'}
		<div class="space-y-2">
			{#if value}
				<div class="relative inline-block">
					<img
						src={typeof value === 'string' ? value : ''}
						alt={field.label}
						class="max-w-xs max-h-64 rounded-md border border-slate-300 dark:border-slate-600"
					/>
					<button
						type="button"
						onclick={clearImage}
						{disabled}
						class="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
						title="Remove image"
					>
						<Trash2 size={16} />
					</button>
				</div>
			{:else}
				<label
					for={inputId}
					class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
				>
					<Upload size={32} class="text-slate-400" />
					<span class="mt-2 text-sm text-slate-500 dark:text-slate-400">
						Click to upload image
					</span>
				</label>
				<input
					type="file"
					id={inputId}
					accept=".jpg,.jpeg,.png,.gif,.webp"
					{disabled}
					onchange={handleImageUpload}
					class="hidden"
				/>
			{/if}
		</div>
	{:else if normalizedType === 'computed'}
		<div class="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300">
			{#if computedValue !== null && computedValue !== undefined}
				{computedValue}
			{:else}
				<span class="text-slate-400 dark:text-slate-500">—</span>
			{/if}
		</div>
		{#if field.computedConfig}
			<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
				Formula: {field.computedConfig.formula}
			</p>
		{/if}
	{:else}
		<!-- Unknown field type fallback -->
		<div class="text-sm text-slate-500 dark:text-slate-400">
			Unsupported field type: {field.type}
		</div>
	{/if}

	<!-- AI Generation Button: Not included in FieldInput component.
	     Use FieldGenerateButton separately in the parent component if needed. -->

	<!-- Error message -->
	{#if error}
		<p id={errorId} class="text-sm text-red-600 dark:text-red-400 mt-1">
			{error}
		</p>
	{/if}
</div>
