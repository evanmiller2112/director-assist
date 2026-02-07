/**
 * Field Suggestion Generation Service (Issue #365 - Phase 3)
 *
 * This service generates AI suggestions for empty fields in entities using the
 * existing prompt building infrastructure from fieldGenerationService.
 *
 * Key Features:
 * - Generates suggestions for multiple empty fields in one API call
 * - Stores suggestions in fieldSuggestionRepository for later acceptance/dismissal
 * - Reuses prompt building logic from fieldGenerationService
 * - Returns array of created FieldSuggestion objects
 *
 * @module fieldSuggestionService
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSelectedModel } from './modelService';
import { isGeneratableField } from './fieldGenerationService';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';
import { fieldSuggestionRepository } from '$lib/db/repositories/fieldSuggestionRepository';
import type { EntityType, EntityTypeDefinition, FieldDefinition, FieldValue } from '$lib/types';
import type { FieldSuggestion } from '$lib/types/ai';

/**
 * Options for generating suggestions.
 */
export interface FieldSuggestionOptions {
	/** Campaign information for additional context */
	campaignContext?: { name: string; setting: string; system: string };
	/** Formatted relationship context to include in prompt */
	relationshipContext?: string;
}

/**
 * Result of a field suggestion generation request.
 */
export interface FieldSuggestionResult {
	/** Whether the generation was successful */
	success: boolean;
	/** Array of created FieldSuggestion objects (only present if success is true) */
	suggestions?: FieldSuggestion[];
	/** User-friendly error message (only present if success is false) */
	error?: string;
}

/**
 * Structure of a single field suggestion from the AI response.
 */
interface AISuggestion {
	fieldKey: string;
	value: string;
	confidence?: number;
}

/**
 * Structure of the AI response for batch field suggestions.
 */
interface AISuggestionResponse {
	suggestions: AISuggestion[];
}

/**
 * Entity data with all the fields needed for context building.
 */
interface EntityData {
	id: string;
	type: EntityType;
	name: string;
	description?: string;
	summary?: string;
	tags?: string[];
	notes?: string;
	fields: Record<string, FieldValue>;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Identify empty text-based fields that should have suggestions generated.
 *
 * Only includes fields that:
 * - Are text-based (text, textarea, richtext)
 * - Are empty (undefined, null, or empty string)
 * - Are not hidden (section !== 'hidden')
 * - Have aiGenerate !== false
 *
 * @param typeDefinition - The entity type definition
 * @param existingData - The current entity data
 * @returns Array of field definitions to generate suggestions for
 * @private
 */
function identifyEmptyFields(
	typeDefinition: EntityTypeDefinition,
	existingData: EntityData
): FieldDefinition[] {
	return typeDefinition.fieldDefinitions.filter((fieldDef) => {
		// Must be generatable (text-based and aiGenerate !== false)
		if (!isGeneratableField(fieldDef)) {
			return false;
		}

		// Must not be hidden
		if (fieldDef.section === 'hidden') {
			return false;
		}

		// Must be empty (undefined, null, or empty string)
		const value = existingData.fields[fieldDef.key];
		return value === undefined || value === null || value === '';
	});
}

/**
 * Build a prompt for generating suggestions for multiple fields at once.
 *
 * This prompt requests the AI to generate suggestions for all empty fields
 * in a single batch request, returning a structured JSON response.
 *
 * @param typeDefinition - The entity type definition
 * @param existingData - The current entity data
 * @param emptyFields - Array of fields to generate suggestions for
 * @param options - Additional context options
 * @returns A formatted prompt string for the AI
 * @private
 */
function buildBatchSuggestionPrompt(
	typeDefinition: EntityTypeDefinition,
	existingData: EntityData,
	emptyFields: FieldDefinition[],
	options?: FieldSuggestionOptions
): string {
	// Build context from existing values (EXCLUDING hidden fields)
	let existingContext = '';

	if (existingData.name) {
		existingContext += `Name: ${existingData.name}\n`;
	}

	if (existingData.description) {
		existingContext += `Description: ${existingData.description}\n`;
	}

	if (existingData.summary) {
		existingContext += `Summary: ${existingData.summary}\n`;
	}

	if (existingData.tags && existingData.tags.length > 0) {
		existingContext += `Tags: ${existingData.tags.join(', ')}\n`;
	}

	// Add other filled fields (excluding hidden fields)
	for (const [key, value] of Object.entries(existingData.fields)) {
		if (value !== null && value !== undefined && value !== '') {
			// Find the field definition to check if it's hidden
			const fieldDef = typeDefinition.fieldDefinitions.find((f) => f.key === key);

			// Skip hidden fields
			if (fieldDef?.section === 'hidden') {
				continue;
			}

			const label = fieldDef?.label ?? key;
			const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
			existingContext += `${label}: ${displayValue}\n`;
		}
	}

	// Build campaign context
	let campaignInfo = '';
	if (options?.campaignContext) {
		campaignInfo = `\nCampaign Context:
- Campaign: ${options.campaignContext.name}
- Setting: ${options.campaignContext.setting}
- System: ${options.campaignContext.system}
`;
	}

	// Build relationship context
	let relationshipInfo = '';
	if (options?.relationshipContext && options.relationshipContext.trim()) {
		relationshipInfo = `\n${options.relationshipContext}\n`;
	}

	// Build field descriptions for the empty fields
	const fieldDescriptions = emptyFields
		.map((field) => {
			let desc = `- ${field.key} (${field.label}): ${field.type}`;
			if (field.placeholder) {
				desc += ` - Example: ${field.placeholder}`;
			}
			if (field.helpText) {
				desc += ` - Guidance: ${field.helpText}`;
			}
			return desc;
		})
		.join('\n');

	const entityLabel = typeDefinition.label;

	return `You are a TTRPG campaign assistant. Generate content suggestions for multiple fields of a ${entityLabel}.
${campaignInfo}
${existingContext ? `\nExisting Context:\n${existingContext}` : ''}${relationshipInfo}

FIELDS TO GENERATE SUGGESTIONS FOR:
${fieldDescriptions}

IMPORTANT RULES:
1. Generate a suggestion for EACH field listed above
2. Keep suggestions consistent with any existing context provided
3. For "text" fields: Write concise, descriptive text (~50-100 characters, 1-2 sentences maximum)
4. For "textarea" fields: Write 1-2 paragraphs of content
5. For "richtext" fields: Write 1-3 paragraphs of evocative content
6. Make the content interesting, memorable, and game-ready
7. Provide a confidence score (0.0 to 1.0) for each suggestion

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "suggestions": [
    {
      "fieldKey": "fieldKeyHere",
      "value": "The suggested content for this field",
      "confidence": 0.85
    }
  ]
}`;
}

/**
 * Generate AI suggestions for empty fields in an entity.
 *
 * This is the main entry point for batch field suggestion generation. It:
 * - Identifies empty text-based fields that can be generated
 * - Builds a batch prompt requesting suggestions for all empty fields
 * - Makes a single API call to generate all suggestions
 * - Stores each suggestion in the fieldSuggestionRepository
 * - Returns the array of created FieldSuggestion objects
 *
 * If there are no empty fields to generate suggestions for, returns success
 * with an empty array.
 *
 * @param typeOrDefinition - The entity type string (e.g., 'npc') or EntityTypeDefinition
 * @param entityId - The ID of the entity
 * @param existingData - The current entity data
 * @param options - Optional campaign and relationship context
 * @returns A promise resolving to the generation result
 *
 * @example
 * ```typescript
 * // Using entity type string
 * const result = await generateSuggestionsForEntity(
 *   'npc',
 *   'npc-123',
 *   {
 *     id: 'npc-123',
 *     type: 'npc',
 *     name: 'Grimwald',
 *     description: 'An innkeeper',
 *     fields: { role: 'Innkeeper' }
 *   }
 * );
 *
 * // Using EntityTypeDefinition
 * const result2 = await generateSuggestionsForEntity(
 *   npcTypeDefinition,
 *   'npc-123',
 *   entityData,
 *   {
 *     campaignContext: {
 *       name: 'Dragon Campaign',
 *       setting: 'High Fantasy',
 *       system: 'Draw Steel'
 *     }
 *   }
 * );
 * ```
 */
export async function generateSuggestionsForEntity(
	typeOrDefinition: EntityType | EntityTypeDefinition,
	entityId: string,
	existingData: EntityData,
	options?: FieldSuggestionOptions
): Promise<FieldSuggestionResult> {
	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Resolve the type definition
	let typeDefinition: EntityTypeDefinition | undefined;

	// Check if it's an EntityTypeDefinition object (has fieldDefinitions property)
	// or an entity type string
	if (typeof typeOrDefinition === 'object' && 'fieldDefinitions' in typeOrDefinition) {
		// It's already an EntityTypeDefinition
		typeDefinition = typeOrDefinition;
	} else if (typeof typeOrDefinition === 'string') {
		// It's an entity type string, look it up
		typeDefinition = getEntityTypeDefinition(typeOrDefinition);

		if (!typeDefinition) {
			// Unknown type - return success with empty array
			// This can happen for custom types not yet registered
			return {
				success: true,
				suggestions: []
			};
		}
	} else {
		// Invalid input
		return {
			success: false,
			error: 'Invalid entity type or type definition'
		};
	}

	// Identify empty fields to generate suggestions for
	const emptyFields = identifyEmptyFields(typeDefinition, existingData);

	// If no empty fields, return success with empty array
	if (emptyFields.length === 0) {
		return {
			success: true,
			suggestions: []
		};
	}

	// Build the batch prompt
	const prompt = buildBatchSuggestionPrompt(typeDefinition, existingData, emptyFields, options);
	const model = getSelectedModel();

	try {
		// Call Anthropic API
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
			max_tokens: 2048, // Higher token limit for multiple fields
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		// Extract text content from response
		const textContent = response.content.find((c) => c.type === 'text');
		if (!textContent || textContent.type !== 'text') {
			return {
				success: false,
				error: 'Unexpected response format from AI'
			};
		}

		// Parse the JSON response - handle markdown code blocks
		let aiResponse: AISuggestionResponse;
		try {
			let jsonText = textContent.text.trim();

			// Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
			const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
			if (jsonMatch) {
				jsonText = jsonMatch[1].trim();
			}

			aiResponse = JSON.parse(jsonText);
		} catch (parseError) {
			console.error('[fieldSuggestionService] Failed to parse AI response:', textContent.text);
			return {
				success: false,
				error: 'Failed to parse AI response as JSON'
			};
		}

		// Validate response structure
		if (!aiResponse.suggestions || !Array.isArray(aiResponse.suggestions)) {
			return {
				success: false,
				error: 'AI response missing suggestions array'
			};
		}

		// Create FieldSuggestion objects and store them
		const createdSuggestions: FieldSuggestion[] = [];

		for (const suggestion of aiResponse.suggestions) {
			try {
				const created = await fieldSuggestionRepository.create({
					entityId,
					entityType: existingData.type,
					fieldKey: suggestion.fieldKey,
					suggestedValue: suggestion.value,
					...(suggestion.confidence !== undefined && { confidence: suggestion.confidence })
				});

				createdSuggestions.push(created);
			} catch (storageError) {
				// If any storage fails, return error
				return {
					success: false,
					error: storageError instanceof Error ? storageError.message : 'Failed to store suggestion'
				};
			}
		}

		return {
			success: true,
			suggestions: createdSuggestions
		};
	} catch (error) {
		// Handle API errors gracefully
		if (error && typeof error === 'object' && 'status' in error) {
			const status = (error as { status: number }).status;
			if (status === 401) {
				return {
					success: false,
					error: 'Invalid API key. Please check your API key in Settings.'
				};
			} else if (status === 429) {
				return {
					success: false,
					error: 'Rate limit exceeded. Please wait a moment and try again.'
				};
			}
		}

		const message = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			error: `Failed to generate suggestions: ${message}`
		};
	}
}
