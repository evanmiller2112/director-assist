<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { aiSettings, entitiesStore, notificationStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { hasGenerationApiKey, buildFieldRelationshipContext } from '$lib/services';
	import { generateField, generateSummaryContent, generateDescriptionContent, isGeneratableField } from '$lib/services/fieldGenerationService';
	import { buildRelationshipContext, formatRelationshipContextForPrompt, getRelationshipContextStats } from '$lib/services/relationshipContextBuilder';
	import { getRelationshipContextSettings } from '$lib/services/relationshipContextSettingsService';
	import type { FieldValue, FieldDefinition } from '$lib/types';
	import { validateEntity, formatContextSummary } from '$lib/utils';
	import { ArrowLeft, Save, ExternalLink, ImagePlus, X as XIcon, Upload, Search, ChevronDown } from 'lucide-svelte';
	import FieldGenerateButton from '$lib/components/entity/FieldGenerateButton.svelte';
	import LoadingButton from '$lib/components/ui/LoadingButton.svelte';
	import { MarkdownEditor } from '$lib/components/markdown';
	import { ConfirmDialog } from '$lib/components/ui';

	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
	const typeDefinition = $derived(
		entityType
			? getEntityTypeDefinition(
					entityType,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);
	const canGenerate = $derived(aiSettings.isEnabled && hasGenerationApiKey());

	// Form state
	let name = $state('');
	let description = $state('');
	let summary = $state('');
	let tags = $state('');
	let notes = $state('');
	let fields = $state<Record<string, FieldValue>>({});
	let isSaving = $state(false);
	let isInitialized = $state(false);
	let errors = $state<Record<string, string>>({});
	let generatingFieldKey = $state<string | null>(null);
	let imageLoading = $state<Record<string, boolean>>({});
	let entityRefSearchQuery = $state<Record<string, string>>({});
	let entityRefDropdownOpen = $state<Record<string, boolean>>({});

	// Summary and Description generation state
	let generatingSummary = $state(false);
	let generatingDescription = $state(false);
	let showSummaryConfirm = $state(false);
	let showDescriptionConfirm = $state(false);

	// Relationship context state (Issue #59)
	let includeRelationshipContext = $state(false);
	let relationshipCount = $derived(entity?.links?.length ?? 0);

	// Validation
	function validate(): boolean {
		const result = validateEntity(
			name,
			$state.snapshot(fields),
			typeDefinition?.fieldDefinitions ?? []
		);
		errors = result.errors;
		return result.valid;
	}

	function clearError(key: string) {
		if (errors[key]) {
			const newErrors = { ...errors };
			delete newErrors[key];
			errors = newErrors;
		}
	}

	// Initialize form with entity data
	$effect(() => {
		if (entity && !isInitialized) {
			name = entity.name;
			description = entity.description;
			summary = entity.summary ?? '';
			tags = entity.tags.join(', ');
			notes = entity.notes;
			fields = { ...entity.fields };

			// Initialize relationship context checkbox from settings (Issue #59)
			const settings = getRelationshipContextSettings();
			includeRelationshipContext = settings.enabled && relationshipCount > 0;

			isInitialized = true;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!entityId) return;
		if (!validate()) return;

		isSaving = true;

		try {
			await entitiesStore.update(entityId, {
				name: name.trim(),
				description: description.trim(),
				summary: summary.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim(),
				fields: $state.snapshot(fields),
				updatedAt: new Date()
			});

			goto(`/entities/${entityType}/${entityId}`);
		} catch (error) {
			console.error('Failed to update entity:', error);
			notificationStore.error('Failed to update entity. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function updateField(key: string, value: FieldValue) {
		fields = { ...fields, [key]: value };
		clearError(key);
	}

	async function handleGenerateField(targetField: FieldDefinition) {
		if (!typeDefinition || generatingFieldKey) return;

		generatingFieldKey = targetField.key;

		try {
			// Build context from current form values
			const currentValues = {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim() || undefined,
				fields: $state.snapshot(fields)
			};

			// Get campaign context if available
			const campaign = campaignStore.campaign;
			const campaignContext = campaign
				? {
						name: campaign.name,
						setting: (campaign.fields?.setting as string) ?? '',
						system: (campaign.fields?.system as string) ?? ''
					}
				: undefined;

// Build relationship context for this field (Issues #59/#60)
			// Uses smart per-field context detection from #60, respecting the manual checkbox from #59
			let relationshipContextStr: string | undefined = undefined;
			if (includeRelationshipContext && entityId && relationshipCount > 0) {
				const relationshipContextResult = await buildFieldRelationshipContext({
					entityId: entityId,
					entityType: entityType,
					targetField: targetField.key
				});
				if (relationshipContextResult.included) {
					relationshipContextStr = relationshipContextResult.formattedContext;
				}
			}

			const result = await generateField({
				entityType,
				typeDefinition,
				targetField,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr
			});

			if (result.success && result.value !== undefined) {
				// Update the field with the generated value
				updateField(targetField.key, result.value);
				notificationStore.success(`Generated ${targetField.label}!`);
			} else {
				notificationStore.error(result.error ?? 'Failed to generate field');
			}
		} catch (error) {
			console.error('Failed to generate field:', error);
			notificationStore.error('An unexpected error occurred');
		} finally {
			generatingFieldKey = null;
		}
	}

	async function handleImageUpload(key: string, file: File | null) {
		if (!file) return;

		// Check file size (warn if > 1MB, but allow)
		if (file.size > 1024 * 1024) {
			notificationStore.info('Image is larger than 1MB. This may impact performance.');
		}

		imageLoading = { ...imageLoading, [key]: true };

		try {
			const base64 = await fileToBase64(file);
			updateField(key, base64);
		} catch (error) {
			console.error('Failed to convert image:', error);
			notificationStore.error('Failed to upload image');
		} finally {
			const newLoading = { ...imageLoading };
			delete newLoading[key];
			imageLoading = newLoading;
		}
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	}

	function clearImage(key: string) {
		updateField(key, '');
	}

	// Entity reference helper functions
	function getEntityName(entityId: string): string {
		const entity = entitiesStore.getById(entityId);
		return entity?.name || '(Deleted)';
	}

	function getFilteredEntitiesForField(field: FieldDefinition): typeof entitiesStore.entities {
		const allowedTypes = field.entityTypes || [];
		const currentSelection = field.type === 'entity-refs'
			? (Array.isArray(fields[field.key]) ? (fields[field.key] as string[]) : [])
			: [];
		const query = (entityRefSearchQuery[field.key] || '').toLowerCase();

		return entitiesStore.entities.filter((e) => {
			// Filter by entity type
			if (allowedTypes.length > 0 && !allowedTypes.includes(e.type)) {
				return false;
			}

			// For entity-refs, exclude already selected entities
			if (field.type === 'entity-refs' && currentSelection.includes(e.id)) {
				return false;
			}

			// Apply search filter
			if (query) {
				return (
					e.name.toLowerCase().includes(query) ||
					e.description.toLowerCase().includes(query)
				);
			}

			return true;
		});
	}

	function selectEntityRef(fieldKey: string, entityId: string) {
		updateField(fieldKey, entityId);
		entityRefDropdownOpen = { ...entityRefDropdownOpen, [fieldKey]: false };
		entityRefSearchQuery = { ...entityRefSearchQuery, [fieldKey]: '' };
	}

	function clearEntityRef(fieldKey: string) {
		updateField(fieldKey, '');
	}

	function addEntityRef(fieldKey: string, entityId: string) {
		const currentValue = Array.isArray(fields[fieldKey]) ? (fields[fieldKey] as string[]) : [];
		updateField(fieldKey, [...currentValue, entityId]);
		entityRefSearchQuery = { ...entityRefSearchQuery, [fieldKey]: '' };
	}

	function removeEntityRef(fieldKey: string, entityId: string) {
		const currentValue = Array.isArray(fields[fieldKey]) ? (fields[fieldKey] as string[]) : [];
		updateField(fieldKey, currentValue.filter((id) => id !== entityId));
	}

	function toggleEntityRefDropdown(fieldKey: string) {
		entityRefDropdownOpen = {
			...entityRefDropdownOpen,
			[fieldKey]: !entityRefDropdownOpen[fieldKey]
		};
	}

	function getContextSummaryForField(targetFieldKey: string): string {
		if (!typeDefinition) return '';

		const campaign = campaignStore.campaign;
		const campaignContext = campaign
			? {
					name: campaign.name,
					setting: (campaign.fields?.setting as string) ?? '',
					system: (campaign.fields?.system as string) ?? ''
				}
			: undefined;

		return formatContextSummary({
			entityType,
			typeDefinition,
			currentValues: {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim() || undefined,
				fields: $state.snapshot(fields)
			},
			campaignContext,
			targetFieldKey
		});
	}

	// Summary generation
	function handleGenerateSummaryClick() {
		// If summary already has content, show confirmation dialog
		if (summary.trim()) {
			showSummaryConfirm = true;
		} else {
			// If empty, generate directly
			performSummaryGeneration();
		}
	}

	async function performSummaryGeneration() {
		if (!typeDefinition || generatingSummary) return;

		generatingSummary = true;
		showSummaryConfirm = false;

		try {
			// Build context from current form values
			const currentValues = {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim() || undefined,
				fields: $state.snapshot(fields)
			};

			// Get campaign context if available
			const campaign = campaignStore.campaign;
			const campaignContext = campaign
				? {
						name: campaign.name,
						setting: (campaign.fields?.setting as string) ?? '',
						system: (campaign.fields?.system as string) ?? ''
					}
				: undefined;

			// Build relationship context if enabled (Issue #59)
			let relationshipContextStr: string | undefined = undefined;
			if (includeRelationshipContext && entityId && relationshipCount > 0) {
				try {
					const settings = getRelationshipContextSettings();
					const relContext = await buildRelationshipContext(entityId, {
						maxRelatedEntities: settings.maxRelatedEntities,
						maxCharacters: settings.maxCharacters
					});
					relationshipContextStr = formatRelationshipContextForPrompt(relContext);
				} catch (error) {
					console.error('Failed to build relationship context:', error);
					// Continue without relationship context if it fails
				}
			}

			const result = await generateSummaryContent({
				entityType,
				typeDefinition,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr
			});

			if (result.success && result.value !== undefined) {
				summary = result.value as string;
				notificationStore.success('Generated summary!');
			} else {
				notificationStore.error(result.error ?? 'Failed to generate summary');
			}
		} catch (error) {
			console.error('Failed to generate summary:', error);
			notificationStore.error('An unexpected error occurred');
		} finally {
			generatingSummary = false;
		}
	}

	// Description generation
	function handleGenerateDescriptionClick() {
		// If description already has content, show confirmation dialog
		if (description.trim()) {
			showDescriptionConfirm = true;
		} else {
			// If empty, generate directly
			performDescriptionGeneration();
		}
	}

	async function performDescriptionGeneration() {
		if (!typeDefinition || generatingDescription) return;

		generatingDescription = true;
		showDescriptionConfirm = false;

		try {
			// Build context from current form values
			const currentValues = {
				name: name.trim() || undefined,
				summary: summary.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim() || undefined,
				fields: $state.snapshot(fields)
			};

			// Get campaign context if available
			const campaign = campaignStore.campaign;
			const campaignContext = campaign
				? {
						name: campaign.name,
						setting: (campaign.fields?.setting as string) ?? '',
						system: (campaign.fields?.system as string) ?? ''
					}
				: undefined;

			// Build relationship context if enabled (Issue #59)
			let relationshipContextStr: string | undefined = undefined;
			if (includeRelationshipContext && entityId && relationshipCount > 0) {
				try {
					const settings = getRelationshipContextSettings();
					const relContext = await buildRelationshipContext(entityId, {
						maxRelatedEntities: settings.maxRelatedEntities,
						maxCharacters: settings.maxCharacters
					});
					relationshipContextStr = formatRelationshipContextForPrompt(relContext);
				} catch (error) {
					console.error('Failed to build relationship context:', error);
					// Continue without relationship context if it fails
				}
			}

			const result = await generateDescriptionContent({
				entityType,
				typeDefinition,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr
			});

			if (result.success && result.value !== undefined) {
				description = result.value as string;
				notificationStore.success('Generated description!');
			} else {
				notificationStore.error(result.error ?? 'Failed to generate description');
			}
		} catch (error) {
			console.error('Failed to generate description:', error);
			notificationStore.error('An unexpected error occurred');
		} finally {
			generatingDescription = false;
		}
	}
</script>

<svelte:head>
	<title>Edit {entity?.name ?? 'Entity'} - Director Assist</title>
</svelte:head>

{#if entity && isInitialized}
	<div class="max-w-2xl mx-auto">
		<!-- Back link -->
		<a
			href="/entities/{entityType}/{entityId}"
			class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to {entity.name}
		</a>

		<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
			Edit {typeDefinition?.label ?? 'Entity'}
		</h1>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Name -->
			<div>
				<label for="name" class="label">Name *</label>
				<input
					id="name"
					type="text"
					class="input {errors.name ? 'input-error' : ''}"
					bind:value={name}
					oninput={() => clearError('name')}
					placeholder="Enter a name..."
				/>
				{#if errors.name}
					<p class="error-message">{errors.name}</p>
				{/if}
			</div>

			<!-- Description -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="description" class="label mb-0">Description</label>
					{#if canGenerate}
						<FieldGenerateButton
							disabled={isSaving}
							loading={generatingDescription}
							onGenerate={handleGenerateDescriptionClick}
						/>
					{/if}
				</div>
				<textarea
					id="description"
					class="input min-h-[100px]"
					bind:value={description}
					placeholder="Describe this {typeDefinition?.label?.toLowerCase() ?? 'entity'}..."
				></textarea>
			</div>

			<!-- Summary -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="summary" class="label mb-0">Summary</label>
					{#if canGenerate}
						<FieldGenerateButton
							disabled={isSaving}
							loading={generatingSummary}
							onGenerate={handleGenerateSummaryClick}
						/>
					{/if}
				</div>
				<p class="text-sm text-slate-500 mb-1">
					This summary will be submitted as context when calling an AI agent. Can be auto-generated on the view page.
				</p>
				<textarea
					id="summary"
					class="input min-h-[60px]"
					bind:value={summary}
					placeholder="A brief summary of this entity for AI context..."
				></textarea>
			</div>

			<!-- Relationship Context Checkbox (Issue #59) -->
			{#if canGenerate && relationshipCount > 0}
				{@const stats = includeRelationshipContext ? (async () => {
					try {
						const settings = getRelationshipContextSettings();
						const relContext = await buildRelationshipContext(entityId, {
							maxRelatedEntities: settings.maxRelatedEntities,
							maxCharacters: settings.maxCharacters
						});
						return getRelationshipContextStats(relContext);
					} catch {
						return null;
					}
				})() : null}
				<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeRelationshipContext}
							class="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600"
						/>
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">
								Include relationship context
							</div>
							<p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
								Include information about related entities ({relationshipCount} relationship{relationshipCount === 1 ? '' : 's'}) when generating content with AI.
								{#if includeRelationshipContext}
									{#await stats then statsData}
										{#if statsData}
											<span class="text-slate-500 dark:text-slate-500">
												~ {statsData.estimatedTokens} tokens
											</span>
										{/if}
									{/await}
								{/if}
							</p>
						</div>
					</label>
				</div>
			{/if}

			<!-- Type-specific fields -->
			{#if typeDefinition}
				{#each typeDefinition.fieldDefinitions.filter((f) => f.section !== 'hidden') as field}
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for={field.key} class="label mb-0">
								{field.label}
								{#if field.required}*{/if}
							</label>
							{#if isGeneratableField(field) && canGenerate}
								<FieldGenerateButton
									disabled={isSaving}
									loading={generatingFieldKey === field.key}
									onGenerate={() => handleGenerateField(field)}
									contextSummary={getContextSummaryForField(field.key)}
								/>
							{/if}
						</div>

						{#if field.helpText}
							<p class="text-sm text-slate-500 mb-1">{field.helpText}</p>
						{/if}

						{#if field.type === 'text'}
							<input
								id={field.key}
								type="text"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							/>
						{:else if field.type === 'richtext'}
							<MarkdownEditor
								value={(fields[field.key] as string) ?? ''}
								placeholder={field.placeholder}
								error={errors[field.key]}
								onchange={(value) => updateField(field.key, value)}
								mode="split"
								minHeight="200px"
								maxHeight="600px"
							/>
						{:else if field.type === 'textarea'}
							<textarea
								id={field.key}
								class="input min-h-[80px] {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							></textarea>
						{:else if field.type === 'number'}
							<input
								id={field.key}
								type="number"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as number) ?? ''}
								oninput={(e) =>
									updateField(field.key, parseFloat(e.currentTarget.value) || 0)}
							/>
						{:else if field.type === 'select'}
							<select
								id={field.key}
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								onchange={(e) => updateField(field.key, e.currentTarget.value)}
							>
								<option value="">Select...</option>
								{#each field.options ?? [] as option}
									<option value={option}>{option.replace(/_/g, ' ')}</option>
								{/each}
							</select>
						{:else if field.type === 'tags'}
							<input
								id={field.key}
								type="text"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={Array.isArray(fields[field.key])
									? (fields[field.key] as string[]).join(', ')
									: ''}
								oninput={(e) =>
									updateField(
										field.key,
										e.currentTarget.value
											.split(',')
											.map((t) => t.trim())
											.filter(Boolean)
									)}
								placeholder={field.placeholder ?? 'Comma-separated values'}
							/>
						{:else if field.type === 'date'}
							<input
								id={field.key}
								type="text"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder ?? 'e.g., Year 1042, Third Age'}
							/>
						{:else if field.type === 'boolean'}
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									id={field.key}
									type="checkbox"
									class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600"
									checked={(fields[field.key] as boolean) ?? false}
									onchange={(e) => updateField(field.key, e.currentTarget.checked)}
								/>
								<span class="text-sm text-slate-700 dark:text-slate-300">
									{field.placeholder ?? 'Enable'}
								</span>
							</label>
						{:else if field.type === 'multi-select'}
							<div class="space-y-2">
								{#each field.options ?? [] as option}
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600"
											checked={Array.isArray(fields[field.key]) &&
												(fields[field.key] as string[]).includes(option)}
											onchange={(e) => {
												const currentValue = Array.isArray(fields[field.key])
													? (fields[field.key] as string[])
													: [];
												const newValue = e.currentTarget.checked
													? [...currentValue, option]
													: currentValue.filter((v) => v !== option);
												updateField(field.key, newValue);
											}}
										/>
										<span class="text-sm text-slate-700 dark:text-slate-300">
											{option.replace(/_/g, ' ')}
										</span>
									</label>
								{/each}
							</div>
						{:else if field.type === 'url'}
							<div class="space-y-2">
								<input
									id={field.key}
									type="url"
									class="input {errors[field.key] ? 'input-error' : ''}"
									value={(fields[field.key] as string) ?? ''}
									oninput={(e) => updateField(field.key, e.currentTarget.value)}
									placeholder={field.placeholder ?? 'https://example.com'}
								/>
								{#if fields[field.key] && typeof fields[field.key] === 'string' && fields[field.key] !== '' && !errors[field.key]}
									<a
										href={fields[field.key] as string}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
									>
										<ExternalLink class="w-3 h-3" />
										Open Link
									</a>
								{/if}
							</div>
						{:else if field.type === 'image'}
							<div class="space-y-2">
								{#if fields[field.key] && typeof fields[field.key] === 'string' && fields[field.key] !== ''}
									<div class="relative inline-block">
										<img
											src={fields[field.key] as string}
											alt={field.label}
											class="max-w-full h-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700"
										/>
										<button
											type="button"
											onclick={() => clearImage(field.key)}
											class="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
											aria-label="Remove image"
										>
											<XIcon class="w-4 h-4" />
										</button>
									</div>
								{:else}
									<div class="flex items-center gap-2">
										<label
											for={field.key}
											class="btn btn-secondary cursor-pointer"
										>
											{#if imageLoading[field.key]}
												<Upload class="w-4 h-4 animate-pulse" />
												Uploading...
											{:else}
												<ImagePlus class="w-4 h-4" />
												Upload Image
											{/if}
										</label>
										<input
											id={field.key}
											type="file"
											accept="image/*"
											class="hidden"
											onchange={(e) => handleImageUpload(field.key, e.currentTarget.files?.[0] ?? null)}
											disabled={imageLoading[field.key]}
										/>
										<span class="text-sm text-slate-500">
											{field.placeholder ?? 'Select an image file'}
										</span>
									</div>
								{/if}
							</div>
						{:else if field.type === 'entity-ref'}
							{@const filteredEntities = getFilteredEntitiesForField(field)}
							<div class="relative">
								{#if fields[field.key] && typeof fields[field.key] === 'string'}
									<!-- Show selected entity -->
									<div class="flex items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
										<span class="flex-1 text-slate-900 dark:text-white">
											{getEntityName(fields[field.key] as string)}
										</span>
										<button
											type="button"
											onclick={() => clearEntityRef(field.key)}
											class="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
											aria-label="Clear selection"
										>
											<XIcon class="w-4 h-4" />
										</button>
									</div>
								{:else}
									<!-- Dropdown selector -->
									<div>
										<button
											type="button"
											onclick={() => toggleEntityRefDropdown(field.key)}
											class="w-full flex items-center justify-between gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-left text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
										>
											<span>{field.placeholder ?? 'Select...'}</span>
											<ChevronDown class="w-4 h-4" />
										</button>

										{#if entityRefDropdownOpen[field.key]}
											<div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
												<!-- Search input -->
												<div class="p-2 border-b border-slate-200 dark:border-slate-700">
													<div class="relative">
														<Search class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
														<input
															type="text"
															bind:value={entityRefSearchQuery[field.key]}
															placeholder="Search entities..."
															class="w-full pl-8 pr-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
														/>
													</div>
												</div>

												<!-- Entity list -->
												<div class="overflow-y-auto max-h-48">
													{#if filteredEntities.length === 0}
														<div class="p-3 text-sm text-center text-slate-500 dark:text-slate-400">
															{entityRefSearchQuery[field.key] ? 'No entities found' : 'No available entities'}
														</div>
													{:else}
														{#each filteredEntities as entity}
															{@const entityTypeDef = getEntityTypeDefinition(
																entity.type,
																campaignStore.customEntityTypes,
																campaignStore.entityTypeOverrides
															)}
															<button
																type="button"
																onclick={() => selectEntityRef(field.key, entity.id)}
																class="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
															>
																<div class="font-medium text-slate-900 dark:text-white text-sm">
																	{entity.name}
																</div>
																<div class="text-xs text-slate-500 dark:text-slate-400">
																	{entityTypeDef?.label ?? entity.type}
																</div>
															</button>
														{/each}
													{/if}
												</div>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{:else if field.type === 'entity-refs'}
							{@const filteredEntities = getFilteredEntitiesForField(field)}
							{@const selectedIds = Array.isArray(fields[field.key]) ? (fields[field.key] as string[]) : []}
							<div class="space-y-2">
								<!-- Selected entities as chips -->
								{#if selectedIds.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each selectedIds as entityId}
											<div class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm">
												<span class="text-slate-900 dark:text-white">
													{getEntityName(entityId)}
												</span>
												<button
													type="button"
													onclick={() => removeEntityRef(field.key, entityId)}
													class="hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-0.5"
													aria-label="Remove"
												>
													<XIcon class="w-3 h-3" />
												</button>
											</div>
										{/each}
									</div>
								{/if}

								<!-- Search and add -->
								<div>
									<div class="relative">
										<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
										<input
											type="text"
											bind:value={entityRefSearchQuery[field.key]}
											placeholder={field.placeholder ?? 'Search to add entities...'}
											class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
											onfocus={() => (entityRefDropdownOpen[field.key] = true)}
										/>
									</div>

									{#if entityRefDropdownOpen[field.key] && entityRefSearchQuery[field.key]}
										<div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
											{#if filteredEntities.length === 0}
												<div class="p-3 text-sm text-center text-slate-500 dark:text-slate-400">
													{selectedIds.length === filteredEntities.length ? 'All entities selected' : 'No entities found'}
												</div>
											{:else}
												{#each filteredEntities as entity}
													{@const entityTypeDef = getEntityTypeDefinition(
														entity.type,
														campaignStore.customEntityTypes,
														campaignStore.entityTypeOverrides
													)}
													<button
														type="button"
														onclick={() => addEntityRef(field.key, entity.id)}
														class="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
													>
														<div class="font-medium text-slate-900 dark:text-white text-sm">
															{entity.name}
														</div>
														<div class="text-xs text-slate-500 dark:text-slate-400">
															{entityTypeDef?.label ?? entity.type}
														</div>
													</button>
												{/each}
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<input
								id={field.key}
								type="text"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							/>
						{/if}

						{#if errors[field.key]}
							<p class="error-message">{errors[field.key]}</p>
						{/if}
					</div>
				{/each}

				<!-- Hidden/Secret fields -->
				{@const secretFields = typeDefinition.fieldDefinitions.filter(
					(f) => f.section === 'hidden'
				)}
				{#if secretFields.length > 0}
					<div class="border-t border-slate-200 dark:border-slate-700 pt-6">
						<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
							Secrets (DM Only)
						</h2>
						{#each secretFields as field}
							<div class="mb-4">
								<div class="flex items-center justify-between mb-1">
									<label for={field.key} class="label mb-0">{field.label}</label>
									{#if isGeneratableField(field) && canGenerate}
										<FieldGenerateButton
											disabled={isSaving}
											loading={generatingFieldKey === field.key}
											onGenerate={() => handleGenerateField(field)}
											contextSummary={getContextSummaryForField(field.key)}
										/>
									{/if}
								</div>
								<textarea
									id={field.key}
									class="input min-h-[80px]"
									value={(fields[field.key] as string) ?? ''}
									oninput={(e) => updateField(field.key, e.currentTarget.value)}
									placeholder={field.placeholder}
								></textarea>
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- Tags -->
			<div>
				<label for="tags" class="label">Tags</label>
				<input
					id="tags"
					type="text"
					class="input"
					bind:value={tags}
					placeholder="Comma-separated tags..."
				/>
			</div>

			<!-- DM Notes -->
			<div>
				<label for="notes" class="label">DM Notes</label>
				<textarea
					id="notes"
					class="input min-h-[80px]"
					bind:value={notes}
					placeholder="Private notes only you can see..."
				></textarea>
			</div>

			<!-- Submit -->
			<div class="flex gap-3 pt-4">
				<LoadingButton
					type="submit"
					variant="primary"
					loading={isSaving}
					loadingText="Saving..."
				>
					{#snippet leftIcon()}
						<Save class="w-4 h-4" />
					{/snippet}
					Save Changes
				</LoadingButton>
				<a href="/entities/{entityType}/{entityId}" class="btn btn-secondary"> Cancel </a>
			</div>
		</form>

		<!-- Confirmation Dialogs -->
		<ConfirmDialog
			open={showSummaryConfirm}
			title="Replace Existing Summary?"
			message="This will replace your current summary with AI-generated content. This action cannot be undone."
			variant="warning"
			confirmText="Generate"
			cancelText="Cancel"
			loading={generatingSummary}
			onConfirm={performSummaryGeneration}
			onCancel={() => showSummaryConfirm = false}
		/>

		<ConfirmDialog
			open={showDescriptionConfirm}
			title="Replace Existing Description?"
			message="This will replace your current description with AI-generated content. This action cannot be undone."
			variant="warning"
			confirmText="Generate"
			cancelText="Cancel"
			loading={generatingDescription}
			onConfirm={performDescriptionGeneration}
			onCancel={() => showDescriptionConfirm = false}
		/>
	</div>
{:else if !entity}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Entity not found</p>
		<a href="/entities/{entityType}" class="btn btn-secondary mt-4">
			<ArrowLeft class="w-4 h-4" />
			Back to list
		</a>
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Loading...</p>
	</div>
{/if}
