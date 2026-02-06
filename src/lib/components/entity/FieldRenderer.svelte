<script lang="ts">
	/**
	 * FieldRenderer Component - Phase 4: Entity Form Field Rendering (Issue #25)
	 *
	 * Read-only display component that formats and displays field values in a user-friendly way.
	 * Used for viewing entity details (non-editable).
	 *
	 * Supports all 14 field types:
	 * - text, short-text → plain text display
	 * - textarea, long-text → formatted text with line breaks
	 * - richtext → rendered markdown
	 * - number → formatted number
	 * - boolean → Yes/No with icon
	 * - date → formatted date
	 * - select → option label
	 * - multi-select, tags → chips/badges
	 * - entity-ref → linked entity name
	 * - entity-refs → multiple linked entity names
	 * - url → clickable external link
	 * - image → image display
	 * - computed → calculated value display
	 */

	import type { FieldDefinition, FieldValue } from '$lib/types';
	import { normalizeFieldType, evaluateComputedField } from '$lib/utils/fieldTypes';
	import MarkdownViewer from '$lib/components/markdown/MarkdownViewer.svelte';
	import { Check, X, ExternalLink } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';

	// Props
	interface Props {
		field: FieldDefinition;
		value: FieldValue;
		allFields?: Record<string, any>; // For computed field evaluation
		compact?: boolean; // Compact display mode for lists/cards
	}

	let { field, value, allFields = {}, compact = false }: Props = $props();

	// Normalize field type (handles aliases like short-text → text)
	const normalizedType = $derived(normalizeFieldType(field.type));

	// Format option labels (replace underscores with spaces)
	function formatOptionLabel(option: string): string {
		return option.replace(/_/g, ' ');
	}

	// Format date for display
	function formatDate(dateString: string): string {
		if (!dateString) return '—';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return dateString;
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return dateString;
		}
	}

	// Format number with commas
	function formatNumber(num: number): string {
		return num.toLocaleString('en-US');
	}

	// Get entity name by ID
	function getEntityName(entityId: string): string {
		const entity = entitiesStore.entities.find((e) => e.id === entityId);
		return entity ? entity.name : 'Unknown Entity';
	}

	// Get entity type by ID
	function getEntityType(entityId: string): string {
		const entity = entitiesStore.entities.find((e) => e.id === entityId);
		return entity ? entity.type : '';
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

	// Check if value is empty
	const isEmpty = $derived.by(() => {
		if (value === null || value === undefined || value === '') return true;
		if (Array.isArray(value) && value.length === 0) return true;
		return false;
	});

	// Format boolean display
	const booleanDisplay = $derived.by(() => {
		const boolValue = value === true || value === 'true';
		return {
			text: boolValue ? 'Yes' : 'No',
			icon: boolValue
		};
	});

	// Check if URL is safe (not javascript:)
	function isSafeUrl(url: string): boolean {
		if (!url) return false;
		return !url.toLowerCase().startsWith('javascript:');
	}

	// Truncate long URLs
	function truncateUrl(url: string, maxLength: number = 50): string {
		if (url.length <= maxLength) return url;
		return url.substring(0, maxLength - 3) + '...';
	}

	// Empty state text
	const emptyStateText = '—';
</script>

<div class="field-renderer" class:compact>
	<!-- Label -->
	<div class="field-label text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
		{field.label}
	</div>

	<!-- Value display based on field type -->
	<div class="field-value text-slate-900 dark:text-slate-100">
		{#if isEmpty && normalizedType !== 'computed'}
			<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
		{:else if normalizedType === 'text'}
			<div class="whitespace-pre-wrap">{value}</div>
		{:else if normalizedType === 'textarea'}
			<div class="whitespace-pre-wrap">{value}</div>
		{:else if normalizedType === 'richtext'}
			<MarkdownViewer content={typeof value === 'string' ? value : ''} />
		{:else if normalizedType === 'number'}
			<div>{formatNumber(value as number)}</div>
		{:else if normalizedType === 'boolean'}
			<div class="flex items-center gap-2">
				{#if booleanDisplay.icon}
					<Check size={16} class="text-green-600 dark:text-green-400" />
				{:else}
					<X size={16} class="text-red-600 dark:text-red-400" />
				{/if}
				<span>{booleanDisplay.text}</span>
			</div>
		{:else if normalizedType === 'date'}
			<div>{formatDate(value as string)}</div>
		{:else if normalizedType === 'select'}
			<div>{formatOptionLabel(value as string)}</div>
		{:else if normalizedType === 'multi-select' || normalizedType === 'tags'}
			<div class="flex flex-wrap gap-2">
				{#each (value as string[]) || [] as option}
					<span
						class="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
					>
						{formatOptionLabel(option)}
					</span>
				{/each}
			</div>
		{:else if normalizedType === 'entity-ref'}
			{#if value}
				<a
					href="/entities/{getEntityType(value as string)}/{value}"
					class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
				>
					{getEntityName(value as string)}
					<span class="text-xs text-slate-500 dark:text-slate-400">
						({getEntityType(value as string)})
					</span>
				</a>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		{:else if normalizedType === 'entity-refs'}
			{#if Array.isArray(value) && value.length > 0}
				<div class="space-y-1">
					{#each value as entityId}
						<div>
							<a
								href="/entities/{getEntityType(entityId)}/{entityId}"
								class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
							>
								{getEntityName(entityId)}
								<span class="text-xs text-slate-500 dark:text-slate-400">
									({getEntityType(entityId)})
								</span>
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		{:else if normalizedType === 'url'}
			{#if value && typeof value === 'string' && isSafeUrl(value)}
				<a
					href={value}
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
				>
					{truncateUrl(value)}
					<ExternalLink size={14} />
				</a>
			{:else if value}
				<span class="text-slate-400 dark:text-slate-500">Invalid URL</span>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		{:else if normalizedType === 'image'}
			{#if value && typeof value === 'string' && isSafeUrl(value)}
				<div class="image-container">
					<img
						src={value}
						alt={field.label}
						class="max-w-md max-h-96 rounded-md border border-slate-300 dark:border-slate-600 cursor-pointer hover:opacity-90 transition-opacity"
						onclick={() => window.open(value, '_blank', 'noopener,noreferrer')}
						onerror={(e) => {
							const target = e.currentTarget as HTMLImageElement;
							target.style.display = 'none';
							target.insertAdjacentHTML(
								'afterend',
								'<span class="text-slate-400">Image not available</span>'
							);
						}}
					/>
				</div>
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		{:else if normalizedType === 'computed'}
			{#if computedValue !== null && computedValue !== undefined}
				<div class="computed-value">
					{#if field.computedConfig?.outputType === 'number'}
						{formatNumber(computedValue)}
					{:else if field.computedConfig?.outputType === 'boolean'}
						<div class="flex items-center gap-2">
							{#if computedValue}
								<Check size={16} class="text-green-600 dark:text-green-400" />
								<span>Yes</span>
							{:else}
								<X size={16} class="text-red-600 dark:text-red-400" />
								<span>No</span>
							{/if}
						</div>
					{:else}
						{computedValue}
					{/if}
				</div>
				{#if field.computedConfig?.formula}
					<div class="text-xs text-slate-500 dark:text-slate-400 mt-1" title={field.computedConfig.formula}>
						Computed
					</div>
				{/if}
			{:else}
				<span class="text-slate-400 dark:text-slate-500">{emptyStateText}</span>
			{/if}
		{:else}
			<!-- Unknown field type fallback -->
			<div class="text-sm text-slate-500 dark:text-slate-400">
				Unsupported field type: {field.type}
			</div>
		{/if}
	</div>
</div>

<style>
	.field-renderer {
		@apply mb-4;
	}

	.field-renderer.compact {
		@apply mb-2;
	}

	.field-renderer.compact .field-label {
		@apply text-xs;
	}

	.field-renderer.compact .field-value {
		@apply text-sm;
	}
</style>
