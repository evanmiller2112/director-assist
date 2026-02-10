/**
 * Entity Regeneration Service
 * GitHub Issue #308: Character Regeneration with Full Context Integration
 *
 * Provides functionality to regenerate entity content while preserving entity identity.
 * Integrates relationship context to generate content aware of entity connections.
 */

import type { BaseEntity, EntityId, FieldValue } from '$lib/types';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '$lib/db';
import { getSelectedModel } from './modelService';
import {
	buildRelationshipContext,
	formatRelationshipContextForPrompt
} from './relationshipContextBuilder';

/**
 * Options for entity regeneration
 */
export interface RegenerationOptions {
	/** Field keys to keep as-is (e.g., ['occupation', 'level']) */
	preserveFields?: string[];
	/** Preserve entity name (default: true) */
	preserveName?: boolean;
	/** Preserve entity tags (default: true) */
	preserveTags?: boolean;
	/** Preserve DM notes (default: true) */
	preserveNotes?: boolean;
	/** Include relationship context in regeneration prompt (default: true) */
	includeRelationshipContext?: boolean;
	/** Maximum number of related entities to include in context (default: 20) */
	maxRelatedEntities?: number;
}

/**
 * Result of entity regeneration operation
 */
export interface RegenerationResult {
	/** Whether regeneration succeeded */
	success: boolean;
	/** Original entity before regeneration */
	original: BaseEntity;
	/** Regenerated fields (partial entity with only changed fields) */
	regenerated?: Partial<BaseEntity>;
	/** Error message if regeneration failed */
	error?: string;
}

/**
 * Represents a diff between original and regenerated field values
 */
export interface RegenerationDiff {
	/** Field identifier (e.g., 'description', 'fields.occupation') */
	field: string;
	/** Human-readable label for the field */
	label: string;
	/** Original field value (formatted as string) */
	original: string;
	/** Regenerated field value (formatted as string) */
	regenerated: string;
	/** Whether the field actually changed */
	changed: boolean;
}

/**
 * Regenerate an entity's content while preserving its identity.
 *
 * This function uses AI to regenerate entity fields while maintaining entity identity,
 * relationships, and optionally preserving specific fields. It includes relationship
 * context to generate content aware of the entity's connections.
 *
 * @param entityId - ID of the entity to regenerate
 * @param options - Regeneration options controlling what to preserve
 * @returns Promise resolving to regeneration result with original and regenerated data
 *
 * @example
 * ```typescript
 * // Regenerate while preserving name, tags, and occupation
 * const result = await regenerateEntity('entity-123', {
 *   preserveName: true,
 *   preserveTags: true,
 *   preserveFields: ['occupation'],
 *   includeRelationshipContext: true
 * });
 *
 * if (result.success) {
 *   console.log('Original:', result.original);
 *   console.log('Regenerated:', result.regenerated);
 * }
 * ```
 */
export async function regenerateEntity(
	entityId: EntityId,
	options: RegenerationOptions = {}
): Promise<RegenerationResult> {
	// Apply defaults
	const {
		preserveFields = [],
		preserveName = true,
		preserveTags = true,
		preserveNotes = true,
		includeRelationshipContext = true,
		maxRelatedEntities = 20
	} = options;

	// Get entity from database
	const entity = await db.entities.get(entityId);
	if (!entity) {
		return {
			success: false,
			error: 'Entity not found',
			original: {} as BaseEntity
		};
	}

	// Check for API key
	const apiKey = localStorage.getItem('dm-assist-api-key');
	if (!apiKey) {
		return {
			success: false,
			error: 'API key not found. Please configure your Anthropic API key in settings.',
			original: entity
		};
	}

	try {
		// Build relationship context if requested
		let relationshipContextText = '';
		if (includeRelationshipContext) {
			// Fetch related entities directly from database
			const relatedEntities: Array<{ name: string; type: string; summary: string; relationship: string }> = [];

			// Process outgoing relationships (links from this entity)
			const linksToProcess = entity.links.slice(0, maxRelatedEntities);
			for (const link of linksToProcess) {
				const relatedEntity = await db.entities.get(link.targetId);
				if (relatedEntity) {
					relatedEntities.push({
						name: relatedEntity.name,
						type: relatedEntity.type,
						summary: relatedEntity.summary || relatedEntity.description || '',
						relationship: link.relationship
					});
				}
			}

			// Process incoming relationships (entities that link to this entity)
			if (relatedEntities.length < maxRelatedEntities) {
				const allEntities = await db.entities.toArray();
				for (const otherEntity of allEntities) {
					if (otherEntity.id === entityId) continue; // Skip self

					// Check if this entity has a link pointing to our target entity
					for (const link of otherEntity.links) {
						if (link.targetId === entityId) {
							relatedEntities.push({
								name: otherEntity.name,
								type: otherEntity.type,
								summary: otherEntity.summary || otherEntity.description || '',
								relationship: link.relationship
							});

							// Stop if we've reached the limit
							if (relatedEntities.length >= maxRelatedEntities) {
								break;
							}
						}
					}

					if (relatedEntities.length >= maxRelatedEntities) {
						break;
					}
				}
			}

			// Format relationship context
			if (relatedEntities.length > 0) {
				relationshipContextText = `\n=== Related Entities ===\n`;
				for (const rel of relatedEntities) {
					relationshipContextText += `[${rel.relationship}] ${rel.name} (${rel.type}): ${rel.summary}\n`;
				}
			}
		}

		// Get campaign context if entity is linked to a campaign
		let campaignContext = '';
		let isDrawSteel = false;
		const campaignLink = entity.links.find((link) => link.targetType === 'campaign');
		if (campaignLink) {
			const campaign = await db.entities.get(campaignLink.targetId);
			if (campaign) {
				campaignContext = `\nCampaign: ${campaign.name}`;
				if (campaign.fields.setting) {
					campaignContext += `\nSetting: ${campaign.fields.setting}`;
				}
				if (campaign.fields.system === 'Draw Steel') {
					isDrawSteel = true;
				}
			}
		}

		// Build preservation instructions
		let preservationInstructions = '';
		if (preserveFields.length > 0) {
			preservationInstructions = '\n\nThe following fields must be preserved (keep their current values):';
			for (const fieldKey of preserveFields) {
				const currentValue = entity.fields[fieldKey];
				if (currentValue !== undefined) {
					preservationInstructions += `\n- ${fieldKey}: ${currentValue}`;
				}
			}
		}

		// Build regeneration prompt
		const prompt = `You are regenerating content for an existing ${entity.type} entity while preserving its core identity.

Entity Name: ${entity.name}
Entity Type: ${entity.type}
Current Description: ${entity.description || '(empty)'}
Current Summary: ${entity.summary || '(empty)'}
${entity.tags && entity.tags.length > 0 ? `Current Tags: ${entity.tags.join(', ')}` : ''}

Current Fields:
${Object.entries(entity.fields)
	.map(([key, value]) => `- ${key}: ${value}`)
	.join('\n')}
${campaignContext}
${relationshipContextText ? `\n${relationshipContextText}` : ''}
${preservationInstructions}

Please regenerate the entity's description, summary, and fields with fresh, engaging content that:
1. Maintains the entity's core identity and name
2. Is consistent with any relationships shown above
3. Respects the campaign setting and context
4. ${preserveFields.length > 0 ? 'Preserves the fields listed above' : 'Enhances and expands on existing fields'}

Return ONLY a JSON object with the following structure (no markdown, no explanation):
{
  "name": "entity name",
  "description": "detailed description",
  "summary": "brief summary",
  "tags": ["tag1", "tag2"],
  "fields": {
    "field_name": "field_value"
  }
}`;

		// Build system prompt
		let systemPrompt =
			'You are an expert at creating rich, detailed content for tabletop RPG entities.';
		if (isDrawSteel) {
			systemPrompt +=
				' You are familiar with the Draw Steel RPG system and create content consistent with its mechanics and lore.';
		}
		systemPrompt +=
			' Always return valid JSON only, without any markdown formatting or explanatory text.';

		// Call Anthropic API
		const client = new Anthropic({ apiKey });
		const modelId = getSelectedModel();

		const response = await client.messages.create({
			model: modelId,
			max_tokens: 4096,
			system: systemPrompt,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		// Parse response
		const firstBlock = response.content[0];
		if (firstBlock.type !== 'text') {
			throw new Error('Expected text response from AI');
		}
		const responseText = firstBlock.text;
		const regeneratedData = JSON.parse(responseText);

		// Apply preservation options
		const regenerated: Partial<BaseEntity> = {};

		// Preserve name by default
		if (!preserveName && regeneratedData.name) {
			regenerated.name = regeneratedData.name;
		}

		// Always include description and summary if regenerated
		if (regeneratedData.description !== undefined) {
			regenerated.description = regeneratedData.description;
		}
		if (regeneratedData.summary !== undefined) {
			regenerated.summary = regeneratedData.summary;
		}

		// Preserve tags by default
		if (!preserveTags && regeneratedData.tags) {
			regenerated.tags = regeneratedData.tags;
		}

		// Preserve notes by default (notes aren't regenerated by AI, but we ensure they're not in result)
		// Notes are never regenerated, so we don't need to handle them here

		// Handle fields with preservation
		if (regeneratedData.fields) {
			regenerated.fields = {};
			for (const [key, value] of Object.entries(regeneratedData.fields)) {
				// Skip preserved fields
				if (!preserveFields.includes(key)) {
					regenerated.fields[key] = value as FieldValue;
				}
			}
		}

		return {
			success: true,
			original: entity,
			regenerated
		};
	} catch (error: any) {
		return {
			success: false,
			error: error.message || 'Failed to regenerate entity',
			original: entity
		};
	}
}

/**
 * Compute diff between original and regenerated entity fields.
 *
 * Compares original entity with regenerated fields and returns an array of
 * diffs showing what changed. Useful for displaying a preview before applying changes.
 *
 * @param original - Original entity
 * @param regenerated - Regenerated entity fields (partial)
 * @returns Array of field diffs with change detection
 *
 * @example
 * ```typescript
 * const diffs = computeRegenerationDiff(originalEntity, regeneratedFields);
 * diffs.forEach(diff => {
 *   if (diff.changed) {
 *     console.log(`${diff.label}: ${diff.original} -> ${diff.regenerated}`);
 *   }
 * });
 * ```
 */
export function computeRegenerationDiff(
	original: BaseEntity,
	regenerated: Partial<BaseEntity>
): RegenerationDiff[] {
	const diffs: RegenerationDiff[] = [];

	// Helper to format values
	const formatValue = (value: any): string => {
		if (value === undefined || value === null || value === '') {
			return '(empty)';
		}
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		return String(value);
	};

	// Check description
	if (regenerated.description !== undefined) {
		const originalValue = formatValue(original.description);
		const regeneratedValue = formatValue(regenerated.description);
		diffs.push({
			field: 'description',
			label: 'Description',
			original: originalValue,
			regenerated: regeneratedValue,
			changed: originalValue !== regeneratedValue
		});
	}

	// Check summary
	if (regenerated.summary !== undefined) {
		const originalValue = formatValue(original.summary);
		const regeneratedValue = formatValue(regenerated.summary);
		diffs.push({
			field: 'summary',
			label: 'Summary',
			original: originalValue,
			regenerated: regeneratedValue,
			changed: originalValue !== regeneratedValue
		});
	}

	// Check tags
	if (regenerated.tags !== undefined) {
		const originalValue = formatValue(original.tags);
		const regeneratedValue = formatValue(regenerated.tags);
		diffs.push({
			field: 'tags',
			label: 'Tags',
			original: originalValue,
			regenerated: regeneratedValue,
			changed: originalValue !== regeneratedValue
		});
	}

	// Check fields
	if (regenerated.fields) {
		for (const [key, regeneratedValue] of Object.entries(regenerated.fields)) {
			const originalValue = formatValue(original.fields[key]);
			const newValue = formatValue(regeneratedValue);
			diffs.push({
				field: `fields.${key}`,
				label: key.charAt(0).toUpperCase() + key.slice(1),
				original: originalValue,
				regenerated: newValue,
				changed: originalValue !== newValue
			});
		}
	}

	return diffs;
}

/**
 * Apply regenerated fields to an entity in the database.
 *
 * Updates only the selected fields from the regenerated content while preserving
 * all other entity properties including ID, type, createdAt, links, etc.
 *
 * @param entityId - ID of the entity to update
 * @param regenerated - Regenerated entity fields (partial)
 * @param selectedFields - Array of field identifiers to apply (e.g., ['description', 'fields.occupation'])
 * @returns Promise that resolves when update is complete
 *
 * @example
 * ```typescript
 * // Apply only description and summary changes
 * await applyRegeneration('entity-123', regeneratedFields, [
 *   'description',
 *   'summary'
 * ]);
 * ```
 */
export async function applyRegeneration(
	entityId: EntityId,
	regenerated: Partial<BaseEntity>,
	selectedFields: string[]
): Promise<void> {
	// Get current entity
	const entity = await db.entities.get(entityId);
	if (!entity) {
		throw new Error(`Entity not found: ${entityId}`);
	}

	// Build update object with only selected fields
	const updates: Partial<BaseEntity> = {};

	for (const fieldId of selectedFields) {
		if (fieldId === 'description' && regenerated.description !== undefined) {
			updates.description = regenerated.description;
		} else if (fieldId === 'summary' && regenerated.summary !== undefined) {
			updates.summary = regenerated.summary;
		} else if (fieldId === 'tags' && regenerated.tags !== undefined) {
			updates.tags = regenerated.tags;
		} else if (fieldId.startsWith('fields.') && regenerated.fields) {
			// Handle nested field updates
			const fieldKey = fieldId.substring('fields.'.length);
			if (regenerated.fields[fieldKey] !== undefined) {
				if (!updates.fields) {
					// Deep clone current fields to avoid modifying the original
					updates.fields = JSON.parse(JSON.stringify(entity.fields)) as Record<string, FieldValue>;
				}
				updates.fields![fieldKey] = regenerated.fields[fieldKey];
			}
		}
	}

	// Always update the updatedAt timestamp
	updates.updatedAt = new Date();

	// Apply updates to database
	await db.entities.update(entityId, updates);
}
