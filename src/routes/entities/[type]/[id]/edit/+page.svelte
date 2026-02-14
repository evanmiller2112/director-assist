<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { aiSettings, entitiesStore, notificationStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { hasGenerationApiKey, generateEntity, buildFieldRelationshipContext, buildPlayerCharacterContext } from '$lib/services';
	import { generateField, generateSummaryContent, generateDescriptionContent, isGeneratableField } from '$lib/services/fieldGenerationService';
	import { generateSuggestionsForEntity, generateSuggestionForField } from '$lib/services/fieldSuggestionService';
	import { buildRelationshipContext, formatRelationshipContextForPrompt, getRelationshipContextStats } from '$lib/services/relationshipContextBuilder';
	import { getRelationshipContextSettings } from '$lib/services/relationshipContextSettingsService';
	import { relationshipSummaryCacheService } from '$lib/services';
	import type { FieldValue, FieldDefinition, BaseEntity, FieldSuggestion } from '$lib/types';
	import { validateEntity, formatContextSummary } from '$lib/utils';
	import { getSystemAwareEntityType } from '$lib/utils/entityFormUtils';
	import { ArrowLeft, Save, Sparkles, Loader2, ExternalLink, ImagePlus, X as XIcon, Upload, Search, ChevronDown, Eye, EyeOff } from 'lucide-svelte';
	import FieldGenerateButton from '$lib/components/entity/FieldGenerateButton.svelte';
	import FieldSuggestionButton from '$lib/components/entity/FieldSuggestionButton.svelte';
	import GenerateSuggestionsButton from '$lib/components/entity/GenerateSuggestionsButton.svelte';
	import FieldSuggestionBadge from '$lib/components/entity/FieldSuggestionBadge.svelte';
	import FieldSuggestionPopover from '$lib/components/entity/FieldSuggestionPopover.svelte';
	import LoadingButton from '$lib/components/ui/LoadingButton.svelte';
	import { MarkdownEditor } from '$lib/components/markdown';
	import { ConfirmDialog, FormActionBar } from '$lib/components/ui';
	import RelationshipContextSelector, { type RelationshipContextData } from '$lib/components/entity/RelationshipContextSelector.svelte';
	import { AddFieldInline, FieldReorderInline } from '$lib/components/entity';
	import { ArrowUpDown } from 'lucide-svelte';
	import FieldVisibilityToggle from '$lib/components/entity/FieldVisibilityToggle.svelte';
	import { getFieldVisibilitySetting, getHardcodedDefault } from '$lib/services/playerExportFieldConfigService';
	import { setFieldOverride } from '$lib/services/entityFieldVisibilityService';
	import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';

	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
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
	let metadata = $state<Record<string, unknown>>({});
	let isSaving = $state(false);
	let isGenerating = $state(false);
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

	// Field reorder mode
	let reorderMode = $state(false);

	// Relationship context state (Issues #62 & #134)
	let relationshipContextData = $state<RelationshipContextData[]>([]);
	let relationshipCount = $derived(entity?.links?.length ?? 0);
	let loadingRelationshipContext = $state(false);

	// Suggestion state (Phase 5: Form Integration)
	let suggestions = $state<Map<string, FieldSuggestion>>(new Map());
	let activePopoverFieldKey = $state<string | null>(null);

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
			playerVisible = entity.playerVisible;
			fields = { ...entity.fields };
			metadata = { ...(entity.metadata ?? {}) };

			isInitialized = true;
		}
	});

	// Load relationship context data when entity loads (Issues #62 & #134)
	$effect(() => {
		if (entity && relationshipCount > 0 && isInitialized) {
			loadRelationshipContextData();
		}
	});

	async function loadRelationshipContextData() {
		if (!entity) return;

		loadingRelationshipContext = true;

		try {
			const settings = getRelationshipContextSettings();
			const contextDataPromises = entity.links.map(async (link) => {
				const targetEntity = entitiesStore.getById(link.targetId);

				if (!targetEntity) {
					return null;
				}

				// Get cache status
				const cacheStatus = await relationshipSummaryCacheService.getCacheStatus(
					entity.id,
					targetEntity.id,
					link.relationship,
					entity.updatedAt,
					targetEntity.updatedAt
				);

				// Try to get cached summary if available
				let summary: string | undefined;
				let generatedAt: Date | undefined;
				let tokenCount: number | undefined;

				try {
					const cachedResult = await relationshipSummaryCacheService.getOrGenerate(
						entity,
						targetEntity,
						link,
						undefined, // no campaign context for now
						false // don't force regenerate
					);

					if (cachedResult.success) {
						summary = cachedResult.summary;
						generatedAt = cachedResult.generatedAt;
						// Rough token estimate: ~4 chars per token
						tokenCount = summary ? Math.ceil(summary.length / 4) : undefined;
					}
				} catch (error) {
					console.warn('Failed to get cached summary:', error);
				}

				return {
					relationship: link,
					targetEntity,
					cacheStatus,
					summary,
					generatedAt,
					tokenCount,
					included: settings.enabled, // Default to enabled based on settings
					regenerating: false
				} as RelationshipContextData;
			});

			const contextData = (await Promise.all(contextDataPromises)).filter(
				(data): data is RelationshipContextData => data !== null
			);

			relationshipContextData = contextData;
		} catch (error) {
			console.error('Failed to load relationship context data:', error);
			notificationStore.error('Failed to load relationship context');
		} finally {
			loadingRelationshipContext = false;
		}
	}

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
				playerVisible,
				fields: $state.snapshot(fields),
				metadata: $state.snapshot(metadata),
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

	async function handleGenerate() {
		if (!typeDefinition || isGenerating) return;

		isGenerating = true;

		try {
			const context = {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				fields: $state.snapshot(fields)
			};

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

// Build relationship context for this field (Issues #59/#60/#62/#134)
			// Uses selected relationships from RelationshipContextSelector
			let relationshipContextStr: string | undefined = undefined;
			const selectedRelationships = relationshipContextData.filter((ctx) => ctx.included);
			if (selectedRelationships.length > 0 && entityId) {
				const relationshipContextResult = await buildFieldRelationshipContext({
					entityId: entityId,
					entityType: entityType,
					targetField: targetField.key
				});
				if (relationshipContextResult.included) {
					relationshipContextStr = relationshipContextResult.formattedContext;
				}
			}

			// Build player character context (Issue #319)
			let playerCharacterContextStr: string | undefined = undefined;
			if (entityId) {
				const pcContextResult = await buildPlayerCharacterContext(entityId);
				if (pcContextResult.hasContext) {
					playerCharacterContextStr = pcContextResult.formattedContext;
				}
			}

			const result = await generateField({
				entityType,
				typeDefinition,
				targetField,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr,
				playerCharacterContext: playerCharacterContextStr
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

	function handleRelationshipContextChange(updatedContext: RelationshipContextData[]) {
		relationshipContextData = updatedContext;
	}

	async function handleRegenerateRelationship(index: number) {
		if (!entity) return;

		const contextItem = relationshipContextData[index];
		if (!contextItem) return;

		// Mark as regenerating
		relationshipContextData = relationshipContextData.map((item, i) =>
			i === index ? { ...item, regenerating: true } : item
		);

		try {
			const result = await relationshipSummaryCacheService.getOrGenerate(
				entity,
				contextItem.targetEntity,
				contextItem.relationship,
				undefined,
				true // force regenerate
			);

			if (result.success) {
				// Update the context item with new summary
				const tokenCount = result.summary ? Math.ceil(result.summary.length / 4) : undefined;

				relationshipContextData = relationshipContextData.map((item, i) =>
					i === index
						? {
								...item,
								summary: result.summary,
								generatedAt: result.generatedAt,
								tokenCount,
								cacheStatus: 'valid' as const,
								regenerating: false
							}
						: item
				);

				notificationStore.success('Relationship summary regenerated!');
			} else {
				notificationStore.error('Failed to regenerate summary');
				// Reset regenerating state
				relationshipContextData = relationshipContextData.map((item, i) =>
					i === index ? { ...item, regenerating: false } : item
				);
			}
		} catch (error) {
			console.error('Failed to regenerate relationship summary:', error);
			notificationStore.error('Failed to regenerate summary');
			// Reset regenerating state
			relationshipContextData = relationshipContextData.map((item, i) =>
				i === index ? { ...item, regenerating: false } : item
			);
		}
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

			// Build relationship context from selected relationships (Issues #59/#62/#134)
			let relationshipContextStr: string | undefined = undefined;
			const selectedRelationships = relationshipContextData.filter((ctx) => ctx.included);
			if (selectedRelationships.length > 0 && entityId) {
				try {
					// Build context using only selected relationships' summaries
					const contextParts = selectedRelationships
						.filter((ctx) => ctx.summary)
						.map((ctx) => {
							const relationshipLabel = ctx.relationship.relationship.replace(/_/g, ' ');
							return `- ${ctx.targetEntity.name} (${relationshipLabel}): ${ctx.summary}`;
						});

					if (contextParts.length > 0) {
						relationshipContextStr = `Related entities:\n${contextParts.join('\n')}`;
					}
				} catch (error) {
					console.error('Failed to build relationship context:', error);
					// Continue without relationship context if it fails
				}
			}

			// Build player character context (Issue #319)
			let playerCharacterContextStr: string | undefined = undefined;
			if (entityId) {
				try {
					const pcContextResult = await buildPlayerCharacterContext(entityId);
					if (pcContextResult.hasContext) {
						playerCharacterContextStr = pcContextResult.formattedContext;
					}
				} catch (error) {
					console.error('Failed to build player character context:', error);
					// Continue without player character context if it fails
				}
			}

			const result = await generateSummaryContent({
				entityType,
				typeDefinition,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr,
				playerCharacterContext: playerCharacterContextStr
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

			// Build relationship context from selected relationships (Issues #59/#62/#134)
			let relationshipContextStr: string | undefined = undefined;
			const selectedRelationships = relationshipContextData.filter((ctx) => ctx.included);
			if (selectedRelationships.length > 0 && entityId) {
				try {
					// Build context using only selected relationships' summaries
					const contextParts = selectedRelationships
						.filter((ctx) => ctx.summary)
						.map((ctx) => {
							const relationshipLabel = ctx.relationship.relationship.replace(/_/g, ' ');
							return `- ${ctx.targetEntity.name} (${relationshipLabel}): ${ctx.summary}`;
						});

					if (contextParts.length > 0) {
						relationshipContextStr = `Related entities:\n${contextParts.join('\n')}`;
					}
				} catch (error) {
					console.error('Failed to build relationship context:', error);
					// Continue without relationship context if it fails
				}
			}

			// Build player character context (Issue #319)
			let playerCharacterContextStr: string | undefined = undefined;
			if (entityId) {
				try {
					const pcContextResult = await buildPlayerCharacterContext(entityId);
					if (pcContextResult.hasContext) {
						playerCharacterContextStr = pcContextResult.formattedContext;
					}
				} catch (error) {
					console.error('Failed to build player character context:', error);
					// Continue without player character context if it fails
				}
			}

			const result = await generateDescriptionContent({
				entityType,
				typeDefinition,
				currentValues,
				campaignContext,
				relationshipContext: relationshipContextStr,
				playerCharacterContext: playerCharacterContextStr
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

	// Suggestion handlers (Phase 5: Form Integration)
	async function handleGenerateSuggestions() {
		if (!typeDefinition || !entityId) return;

		// Build current form data
		const currentData = {
			id: entityId,
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

		// Build relationship context from selected relationships
		let relationshipContextStr: string | undefined = undefined;
		const selectedRelationships = relationshipContextData.filter((ctx) => ctx.included);
		if (selectedRelationships.length > 0) {
			const contextParts = selectedRelationships.map((ctx) => {
				const relType = ctx.relationship.relationship;
				const targetName = ctx.targetEntity.name;
				const summary = ctx.summary || `${relType} of ${targetName}`;
				return `- ${targetName} (${relType}): ${summary}`;
			});
			if (contextParts.length > 0) {
				relationshipContextStr = `Related entities:\n${contextParts.join('\n')}`;
			}
		}

		// Generate suggestions
		const result = await generateSuggestionsForEntity(
			typeDefinition,
			entityId,
			currentData,
			{ campaignContext, relationshipContext: relationshipContextStr }
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

	// Player export field visibility config
	const playerExportFieldConfig = $derived.by(() => {
		return campaignStore.playerExportFieldConfig ?? { fieldVisibility: {} } as PlayerExportFieldConfig;
	});

	function getCategoryDefault(fieldKey: string, fieldDef: FieldDefinition | undefined): boolean {
		const entityTypeStr = entityType;
		const setting = getFieldVisibilitySetting(playerExportFieldConfig, entityTypeStr, fieldKey);
		if (setting !== undefined) return setting;
		return getHardcodedDefault(fieldKey, fieldDef, entityTypeStr);
	}

	function handleFieldVisibilityToggle(fieldKey: string, value: boolean | undefined) {
		metadata = setFieldOverride(metadata, fieldKey, value);
	}

	async function handleGenerateSingleFieldSuggestion(params: {
		fieldKey: string;
		fieldDefinition: FieldDefinition;
	}) {
		if (!typeDefinition || !entityId) return;

		const { fieldKey, fieldDefinition } = params;

		// Build current entity data
		const currentData = {
			id: entityId,
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

		// Build relationship context from selected relationships
		let relationshipContextStr: string | undefined = undefined;
		const selectedRelationships = relationshipContextData.filter((ctx) => ctx.included);
		if (selectedRelationships.length > 0) {
			const contextParts = selectedRelationships.map((ctx) => {
				const relType = ctx.relationship.relationship;
				const targetName = ctx.targetEntity.name;
				const summary = ctx.summary || `${relType} of ${targetName}`;
				return `- ${targetName} (${relType}): ${summary}`;
			});
			if (contextParts.length > 0) {
				relationshipContextStr = `Related entities:\n${contextParts.join('\n')}`;
			}
		}

		// Generate suggestion for this specific field
		const result = await generateSuggestionForField(
			typeDefinition,
			entityId,
			fieldKey,
			currentData,
			{ campaignContext, relationshipContext: relationshipContextStr }
		);

		if (result.success && result.suggestions && result.suggestions.length > 0) {
			// Store suggestion in local state for display
			const newSuggestions = new Map(suggestions);
			for (const suggestion of result.suggestions) {
				newSuggestions.set(suggestion.fieldKey, suggestion);
			}
			suggestions = newSuggestions;
			notificationStore.success(`Generated suggestion for ${fieldDefinition.label}`);
		} else {
			notificationStore.error(result.error || 'Failed to generate suggestion');
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

		{#if playerVisible === false}
			<div class="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
				<div class="flex items-start gap-3">
					<EyeOff class="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
							This entity is hidden from players
						</h3>
						<p class="text-sm text-amber-700 dark:text-amber-300">
							Field visibility settings have no effect while the entity is hidden. To make individual fields visible to players, first uncheck "Hide from players" below.
						</p>
					</div>
				</div>
			</div>
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
				<div class="flex items-center justify-between mb-1">
					<div class="flex items-center gap-2">
						<label for="description" class="label mb-0">Description</label>
						<FieldVisibilityToggle
							fieldKey="__core_description"
							entityMetadata={metadata}
							categoryDefault={getCategoryDefault('__core_description', undefined)}
							onToggle={handleFieldVisibilityToggle}
							disabled={playerVisible === false}
						/>
					</div>
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
					<div class="flex items-center gap-2">
						<label for="summary" class="label mb-0">Summary</label>
						<FieldVisibilityToggle
							fieldKey="__core_summary"
							entityMetadata={metadata}
							categoryDefault={getCategoryDefault('__core_summary', undefined)}
							onToggle={handleFieldVisibilityToggle}
							disabled={playerVisible === false}
						/>
					</div>
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

			<!-- Relationship Context Selector (Issues #62 & #134) -->
			{#if canGenerate && relationshipCount > 0 && !loadingRelationshipContext}
				<div class="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
					<RelationshipContextSelector
						sourceEntity={entity}
						relationshipContext={relationshipContextData}
						onContextChange={handleRelationshipContextChange}
						onRegenerate={handleRegenerateRelationship}
					/>
				</div>
			{/if}

			<!-- Type-specific fields -->
			{#if typeDefinition}
				{@const visibleFields = typeDefinition.fieldDefinitions.filter((f) => f.section !== 'hidden')}
				{#each visibleFields as field, fieldIndex}
					<div class="flex items-start">
						{#if reorderMode}
							<FieldReorderInline
								{entityType}
								fieldDefinitions={visibleFields}
								{fieldIndex}
								totalFields={visibleFields.length}
							/>
						{/if}
					<div class="flex-1 relative">
						<div class="flex items-center justify-between mb-1">
							<div class="flex items-center gap-2">
								<label for={field.key} class="label mb-0">
									{field.label}
									{#if field.required}*{/if}
								</label>
								<FieldVisibilityToggle
									fieldKey={field.key}
									entityMetadata={metadata}
									categoryDefault={getCategoryDefault(field.key, field)}
									onToggle={handleFieldVisibilityToggle}
									disabled={playerVisible === false}
								/>
								{#if canGenerate && hasPendingSuggestion(field.key)}
									<FieldSuggestionBadge
										fieldName={field.label}
										hasSuggestion={true}
										onClick={() => handleTogglePopover(field.key)}
									/>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								{#if isGeneratableField(field) && canGenerate}
									<FieldSuggestionButton
										fieldKey={field.key}
										fieldDefinition={field}
										entityType={entityType}
										entityData={{
											id: entityId,
											type: entityType,
											name,
											description,
											summary,
											tags: tags.split(',').map(t => t.trim()).filter(Boolean),
											notes,
											fields: $state.snapshot(fields)
										}}
										onSuggestionGenerated={handleGenerateSingleFieldSuggestion}
										disabled={isSaving}
									/>
								{/if}
								{#if isGeneratableField(field) && canGenerate}
									<FieldGenerateButton
										disabled={isSaving}
										loading={generatingFieldKey === field.key}
										onGenerate={() => handleGenerateField(field)}
										contextSummary={getContextSummaryForField(field.key)}
									/>
								{/if}
							</div>
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
									class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 dark:text-slate-100"
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
											class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 dark:text-slate-100"
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
					</div>
				{/each}

				<!-- Add Field / Reorder Buttons -->
				<div class="pt-2 flex gap-2">
					<AddFieldInline {entityType} />
					{#if visibleFields.length > 1}
						<button
							type="button"
							class="btn {reorderMode ? 'btn-primary' : 'btn-secondary'}"
							onclick={() => reorderMode = !reorderMode}
						>
							<ArrowUpDown class="w-4 h-4" />
							{reorderMode ? 'Done Reordering' : 'Reorder Fields'}
						</button>
					{/if}
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
									<div class="flex items-center gap-2">
										<label for={field.key} class="label mb-0">{field.label}</label>
										<FieldVisibilityToggle
											fieldKey={field.key}
											entityMetadata={metadata}
											categoryDefault={getCategoryDefault(field.key, field)}
											onToggle={handleFieldVisibilityToggle}
											disabled={playerVisible === false}
										/>
									</div>
									<div class="flex items-center gap-2">
										{#if isGeneratableField(field) && canGenerate}
											<FieldSuggestionButton
												fieldKey={field.key}
												fieldDefinition={field}
												entityType={entityType}
												entityData={{
													id: entityId,
													type: entityType,
													name,
													description,
													summary,
													tags: tags.split(',').map(t => t.trim()).filter(Boolean),
													notes,
													fields: $state.snapshot(fields)
												}}
												onSuggestionGenerated={handleGenerateSingleFieldSuggestion}
												disabled={isSaving}
											/>
										{/if}
										{#if isGeneratableField(field) && canGenerate}
											<FieldGenerateButton
												disabled={isSaving}
												loading={generatingFieldKey === field.key}
												onGenerate={() => handleGenerateField(field)}
												contextSummary={getContextSummaryForField(field.key)}
											/>
										{/if}
									</div>
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
				<div class="flex items-center gap-2 mb-1">
					<label for="tags" class="label mb-0">Tags</label>
					<FieldVisibilityToggle
						fieldKey="__core_tags"
						entityMetadata={metadata}
						categoryDefault={getCategoryDefault('__core_tags', undefined)}
						onToggle={handleFieldVisibilityToggle}
						disabled={playerVisible === false}
					/>
				</div>
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
				<label class="label">Player Visibility</label>
				<div class="flex items-start gap-3">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 dark:text-slate-100"
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
					loadingText="Saving..."
				>
					{#snippet leftIcon()}
						<Save class="w-4 h-4" />
					{/snippet}
					Save Changes
				</LoadingButton>
				{#if canGenerate && entity}
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
					<GenerateSuggestionsButton
						entityType={entityType}
						currentData={{ name, description, summary, tags, notes, fields: $state.snapshot(fields) }}
						entityId={parseInt(entityId)}
						onSuggestionsGenerated={handleGenerateSuggestions}
						disabled={isSaving || isGenerating}
					/>
				{/if}
				<a href="/entities/{entityType}/{entityId}" class="btn btn-secondary"> Cancel </a>
			</FormActionBar>
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
