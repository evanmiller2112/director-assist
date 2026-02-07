<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { aiSettings, entitiesStore, notificationStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { generateEntity, hasGenerationApiKey } from '$lib/services';
	import { generateField, isGeneratableField } from '$lib/services/fieldGenerationService';
	import { generateSuggestionsForEntity } from '$lib/services/fieldSuggestionService';
	import { createEntity, type FieldValue, type FieldDefinition, type PendingRelationship, type FieldSuggestion } from '$lib/types';
	import { validateEntity, formatContextSummary } from '$lib/utils';
	import { getSystemAwareEntityType } from '$lib/utils/entityFormUtils';
	import { deserializePrefillParams } from '$lib/utils/entityPrefillUtils';
	import { nanoid } from 'nanoid';
	import PrefillBanner from '$lib/components/ui/PrefillBanner.svelte';
	import { ArrowLeft, Save, Sparkles, Loader2, ExternalLink, ImagePlus, X as XIcon, Upload, Search, ChevronDown, Eye, EyeOff, Plus, ChevronRight } from 'lucide-svelte';
	import FieldGenerateButton from '$lib/components/entity/FieldGenerateButton.svelte';
	import GenerateSuggestionsButton from '$lib/components/entity/GenerateSuggestionsButton.svelte';
	import FieldSuggestionBadge from '$lib/components/entity/FieldSuggestionBadge.svelte';
	import FieldSuggestionPopover from '$lib/components/entity/FieldSuggestionPopover.svelte';
	import LoadingButton from '$lib/components/ui/LoadingButton.svelte';
	import { MarkdownEditor } from '$lib/components/markdown';
	import { PendingRelationshipList, CreateRelateCommand, AddFieldInline } from '$lib/components/entity';
	import { FormActionBar } from '$lib/components/ui';
	import { buildPendingRelationshipsContext } from './pendingRelationshipsContext';

	const entityType = $derived($page.params.type ?? '');
	const typeDefinition = $derived(
		entityType
			? getSystemAwareEntityType(
					entityType,
					campaignStore.getCurrentSystemProfile(),
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
	let playerVisible = $state<boolean | undefined>(undefined);
	let fields = $state<Record<string, FieldValue>>({});
	let isSaving = $state(false);
	let isGenerating = $state(false);
	let errors = $state<Record<string, string>>({});
	let generatingFieldKey = $state<string | null>(null);
	let imageLoading = $state<Record<string, boolean>>({});
	let entityRefSearchQuery = $state<Record<string, string>>({});
	let entityRefDropdownOpen = $state<Record<string, boolean>>({});

	// Relationship state
	let pendingRelationships = $state<PendingRelationship[]>([]);
	let showRelateCommand = $state(false);
	let relationshipsExpanded = $state(false);

	// Suggestion state (Phase 5: Form Integration)
	let suggestions = $state<Map<string, FieldSuggestion>>(new Map());
	let activePopoverFieldKey = $state<string | null>(null);

	// Auto-linking for Issue #48
	const shouldAutoLink = $derived(
		campaignStore.enforceCampaignLinking &&
		entityType !== 'campaign'  // Don't link campaigns to themselves
	);

	const autoLinkCampaignId = $derived(() => {
		if (!shouldAutoLink) return null;
		// If single campaign, use it; otherwise use defaultCampaignId
		const campaigns = campaignStore.allCampaigns;
		if (campaigns.length === 1) return campaigns[0].id;
		return campaignStore.defaultCampaignId ?? null;
	});

	function getCampaignName(campaignId: string): string {
		const camp = campaignStore.allCampaigns.find(c => c.id === campaignId);
		return camp?.name ?? 'Unknown Campaign';
	}

	// Prefill state (from chat entity detection)
	const prefillParam = $derived($page.url.searchParams.get('prefill'));
	const prefillData = $derived(prefillParam ? deserializePrefillParams(prefillParam) : null);
	let prefillApplied = $state(false);
	let showPrefillBanner = $state(false);

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

	// Initialize default field values
	$effect(() => {
		if (typeDefinition) {
			const defaultFields: Record<string, FieldValue> = {};
			for (const field of typeDefinition.fieldDefinitions) {
				if (field.defaultValue !== undefined) {
					defaultFields[field.key] = field.defaultValue;
				}
			}
			fields = defaultFields;
		}
	});

	// Apply prefill data from chat entity detection
	$effect(() => {
		if (prefillData && !prefillApplied) {
			name = prefillData.name || '';
			description = prefillData.description || '';
			summary = prefillData.summary || '';
			tags = prefillData.tags?.join(', ') || '';
			if (prefillData.fields) {
				fields = { ...fields, ...prefillData.fields };
			}
			prefillApplied = true;
			showPrefillBanner = true;
		}
	});

	function dismissPrefillBanner() {
		showPrefillBanner = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!entityType) return;
		if (!validate()) return;

		isSaving = true;

		try {
			// Auto-link to campaign if enabled (Issue #48)
			let relationshipsToCreate = [...pendingRelationships];
			const targetCampaignId = autoLinkCampaignId();
			if (targetCampaignId) {
				// Check if a campaign link already exists
				const hasCampaignLink = relationshipsToCreate.some(
					r => r.relationship === 'belongs_to_campaign' ||
					(r.targetType === 'campaign' && r.targetId === targetCampaignId)
				);

				if (!hasCampaignLink) {
					const campaignLink: PendingRelationship = {
						tempId: nanoid(),
						targetId: targetCampaignId,
						targetType: 'campaign',
						relationship: 'belongs_to_campaign',
						bidirectional: false
					};
					relationshipsToCreate = [...relationshipsToCreate, campaignLink];
				}
			}

			const newEntity = createEntity(entityType, name.trim(), {
				description: description.trim(),
				summary: summary.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim(),
				playerVisible,
				fields: $state.snapshot(fields)
			});

			let created;
			if (relationshipsToCreate.length > 0) {
				// Use createWithRelationships when there are pending relationships
				created = await entitiesStore.createWithRelationships(newEntity, relationshipsToCreate);
			} else {
				// Use standard create when no relationships
				created = await entitiesStore.create(newEntity);
			}

			goto(`/entities/${entityType}/${created.id}`);
		} catch (error) {
			console.error('Failed to create entity:', error);
			notificationStore.error('Failed to create entity. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function updateField(key: string, value: FieldValue) {
		fields = { ...fields, [key]: value };
		clearError(key);
	}

	async function handleGenerate() {
		if (!typeDefinition || isGenerating) return;

		isGenerating = true;

		try {
			// Build relationship context from pending relationships (Issue #232)
			const relationshipContext = buildPendingRelationshipsContext(pendingRelationships);

			// Build context from current form values
			const context = {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				fields: $state.snapshot(fields),
				relationshipContext: relationshipContext || undefined
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

			const result = await generateEntity(typeDefinition, context, campaignContext);

			if (result.success && result.entity) {
				// Populate form with generated values
				name = result.entity.name;
				description = result.entity.description;
				summary = result.entity.summary;
				tags = result.entity.tags.join(', ');
				fields = { ...fields, ...result.entity.fields };

				notificationStore.success('Entity generated! Review and save when ready.');
			} else {
				notificationStore.error(result.error ?? 'Failed to generate entity');
			}
		} catch (error) {
			console.error('Failed to generate entity:', error);
			notificationStore.error('An unexpected error occurred');
		} finally {
			isGenerating = false;
		}
	}

	async function handleGenerateField(targetField: FieldDefinition) {
		if (!typeDefinition || generatingFieldKey || isGenerating) return;

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

			// Build relationship context from pending relationships (Issue #232)
			const relationshipContext = buildPendingRelationshipsContext(pendingRelationships);

			const result = await generateField({
				entityType,
				typeDefinition,
				targetField,
				currentValues,
				campaignContext,
				relationshipContext
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

	// Relationship functions
	function handleAddRelationship(relationship: PendingRelationship) {
		pendingRelationships = [...pendingRelationships, relationship];
	}

	function handleRemoveRelationship(tempId: string) {
		pendingRelationships = pendingRelationships.filter((r) => r.tempId !== tempId);
	}

	// Suggestion handlers (Phase 5: Form Integration)
	async function handleGenerateSuggestions() {
		if (!typeDefinition) return;

		// Generate a temporary ID for new entities
		const tempEntityId = nanoid();

		// Build current form data
		const currentData = {
			id: tempEntityId,
			type: entityType,
			name,
			description,
			summary,
			tags: tags.split(',').map(t => t.trim()).filter(Boolean),
			notes,
			fields: $state.snapshot(fields)
		};

		// Build campaign context
		const campaign = campaignStore.campaign;
		const campaignContext = campaign ? {
			name: campaign.name,
			setting: (campaign.fields?.setting as string) ?? '',
			system: (campaign.fields?.system as string) ?? ''
		} : undefined;

		// Build relationship context from pending relationships
		const relationshipContextStr = buildPendingRelationshipsContext(pendingRelationships);

		// Generate suggestions
		const result = await generateSuggestionsForEntity(
			typeDefinition,
			tempEntityId,
			currentData,
			{ campaignContext, relationshipContext: relationshipContextStr || undefined }
		);

		if (result.success && result.suggestions) {
			// Store suggestions in local state for display
			const newSuggestions = new Map(suggestions);
			for (const suggestion of result.suggestions) {
				newSuggestions.set(suggestion.fieldKey, suggestion);
			}
			suggestions = newSuggestions;
			notificationStore.success(`Generated ${result.suggestions.length} suggestion(s)`);
		} else {
			notificationStore.error(result.error || 'Failed to generate suggestions');
		}
	}

	function handleAcceptSuggestion(fieldKey: string, suggestedValue: string) {
		// Copy suggestion to field
		updateField(fieldKey, suggestedValue);

		// Update suggestion status
		const suggestion = suggestions.get(fieldKey);
		if (suggestion) {
			suggestions.set(fieldKey, { ...suggestion, status: 'accepted' });
		}

		// Close popover
		activePopoverFieldKey = null;

		notificationStore.success('Suggestion accepted');
	}

	function handleDismissSuggestion(fieldKey: string) {
		// Update suggestion status
		const suggestion = suggestions.get(fieldKey);
		if (suggestion) {
			suggestions.set(fieldKey, { ...suggestion, status: 'dismissed' });
		}

		// Close popover
		activePopoverFieldKey = null;
	}

	function handleTogglePopover(fieldKey: string) {
		if (activePopoverFieldKey === fieldKey) {
			activePopoverFieldKey = null;
		} else {
			activePopoverFieldKey = fieldKey;
		}
	}

	function hasPendingSuggestion(fieldKey: string): boolean {
		const suggestion = suggestions.get(fieldKey);
		return suggestion !== undefined && suggestion.status === 'pending';
	}
</script>

<svelte:head>
	<title>New {typeDefinition?.label ?? 'Entity'} - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Back link -->
	<a
		href="/entities/{entityType}"
		class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
	>
		<ArrowLeft class="w-4 h-4" />
		Back to {typeDefinition?.labelPlural ?? 'Entities'}
	</a>

	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
		New {typeDefinition?.label ?? 'Entity'}
	</h1>

	{#if showPrefillBanner && prefillData}
		<PrefillBanner
			sourceMessageId={prefillData.sourceMessageId}
			onDismiss={dismissPrefillBanner}
		/>
	{/if}

	{#if shouldAutoLink}
		{@const campaignId = autoLinkCampaignId()}
		{#if campaignId}
			<div class="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
				<p class="text-sm text-blue-700 dark:text-blue-300">
					This entity will be automatically linked to campaign:
					<strong>{getCampaignName(campaignId)}</strong>
				</p>
			</div>
		{/if}
	{/if}

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
			<label for="description" class="label">Description</label>
			<textarea
				id="description"
				class="input min-h-[100px]"
				bind:value={description}
				placeholder="Describe this {typeDefinition?.label?.toLowerCase() ?? 'entity'}..."
			></textarea>
		</div>

		<!-- Type-specific fields -->
		{#if typeDefinition}
			{#each typeDefinition.fieldDefinitions.filter((f) => f.section !== 'hidden') as field}
				<div class="relative">
					<div class="flex items-center justify-between mb-1">
						<div class="flex items-center gap-2">
							<label for={field.key} class="label mb-0">
								{field.label}
								{#if field.required}*{/if}
							</label>
							{#if aiSettings.isSuggestionsMode && hasPendingSuggestion(field.key)}
								<FieldSuggestionBadge
									fieldName={field.label}
									hasSuggestion={true}
									onClick={() => handleTogglePopover(field.key)}
								/>
							{/if}
						</div>
						{#if isGeneratableField(field) && canGenerate && !aiSettings.isSuggestionsMode}
							<FieldGenerateButton
								disabled={isGenerating || isSaving}
								loading={generatingFieldKey === field.key}
								onGenerate={() => handleGenerateField(field)}
								contextSummary={getContextSummaryForField(field.key)}
							/>
						{/if}
					</div>

					{#if activePopoverFieldKey === field.key}
						{@const suggestion = suggestions.get(field.key)}
						{#if suggestion}
							<FieldSuggestionPopover
								suggestion={{
									entityType: suggestion.entityType,
									fieldName: suggestion.fieldKey,
									suggestedContent: suggestion.suggestedValue,
									createdAt: suggestion.createdAt,
									dismissed: suggestion.status === 'dismissed'
								}}
								onAccept={(content) => handleAcceptSuggestion(field.key, content)}
								onDismiss={() => handleDismissSuggestion(field.key)}
								onClose={() => (activePopoverFieldKey = null)}
							/>
						{/if}
					{/if}

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

			<!-- Add Field Button -->
			<div class="pt-2">
				<AddFieldInline {entityType} />
			</div>

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
										disabled={isGenerating || isSaving}
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

		<!-- Player Visibility -->
		<div>
			<label for="player-visibility-checkbox" class="label">Player Visibility</label>
			<div class="flex items-start gap-3">
				<label for="player-visibility-checkbox" class="flex items-center gap-2 cursor-pointer">
					<input
						id="player-visibility-checkbox"
						type="checkbox"
						class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600"
						checked={playerVisible === false}
						onchange={(e) => {
							playerVisible = e.currentTarget.checked ? false : undefined;
						}}
					/>
					<EyeOff class="w-4 h-4 text-amber-500" />
					<span class="text-sm text-slate-700 dark:text-slate-300">
						Hide from players (DM only)
					</span>
				</label>
			</div>
			<p class="text-xs text-slate-500 mt-1">
				When checked, this entity will be marked as hidden from players. Useful for secret NPCs, plot twists, etc.
			</p>
		</div>

		<!-- Relationships -->
		<div class="border border-slate-200 dark:border-slate-700 rounded-lg">
			<button
				type="button"
				onclick={() => (relationshipsExpanded = !relationshipsExpanded)}
				class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
			>
				<div class="flex items-center gap-2">
					<h3 class="text-base font-medium text-slate-900 dark:text-white">Relationships</h3>
					{#if pendingRelationships.length > 0}
						<span
							class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
						>
							{pendingRelationships.length}
						</span>
					{/if}
				</div>
				<ChevronRight
					class="w-5 h-5 text-slate-400 transition-transform {relationshipsExpanded
						? 'rotate-90'
						: ''}"
				/>
			</button>

			{#if relationshipsExpanded}
				<div class="border-t border-slate-200 dark:border-slate-700 p-4">
					<p class="text-sm text-slate-600 dark:text-slate-400 mb-3">
						Add relationships that will be created when this entity is saved.
					</p>

					<button
						type="button"
						onclick={() => (showRelateCommand = true)}
						class="btn btn-secondary mb-4"
						disabled={isSaving}
					>
						<Plus class="w-4 h-4" />
						Add Relationship
					</button>

					<PendingRelationshipList
						relationships={pendingRelationships}
						onRemove={handleRemoveRelationship}
					/>
				</div>
			{/if}
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
		<FormActionBar>
			<LoadingButton
				type="submit"
				variant="primary"
				loading={isSaving}
				disabled={isGenerating}
				loadingText="Saving..."
			>
				{#snippet leftIcon()}
					<Save class="w-4 h-4" />
				{/snippet}
				Create
			</LoadingButton>
			{#if aiSettings.isSuggestionsMode && canGenerate}
				<GenerateSuggestionsButton
					entityType={entityType}
					currentData={{ name, description, summary, tags, notes, fields: $state.snapshot(fields) }}
					onSuggestionsGenerated={handleGenerateSuggestions}
					disabled={isSaving || isGenerating}
				/>
			{:else if canGenerate}
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleGenerate}
					disabled={isGenerating || isSaving}
					title="Generate entity content using AI"
				>
					{#if isGenerating}
						<Loader2 class="w-4 h-4 animate-spin" />
						Generating...
					{:else}
						<Sparkles class="w-4 h-4" />
						Generate
					{/if}
				</button>
			{/if}
			<a href="/entities/{entityType}" class="btn btn-secondary"> Cancel </a>
		</FormActionBar>
	</form>
</div>

<!-- Create Relationship Modal -->
{#if entityType}
	<CreateRelateCommand
		entityType={entityType}
		bind:open={showRelateCommand}
		onSubmit={handleAddRelationship}
	/>
{/if}
