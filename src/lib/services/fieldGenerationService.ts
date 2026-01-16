/**
 * Field Generation Service
 *
 * Generates content for individual entity fields using Claude AI.
 * Uses context from other filled fields to create consistent, relevant content.
 *
 * Key Features:
 * - Per-field AI generation with context awareness
 * - Privacy protection (excludes hidden fields from context)
 * - User-friendly error handling
 * - Supports text, textarea, and richtext field types
 *
 * @module fieldGenerationService
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSelectedModel } from './modelService';
import type { EntityType, EntityTypeDefinition, FieldDefinition, FieldValue, FieldType } from '$lib/types';

/**
 * Context information for field generation.
 * Contains all the data needed to generate contextually appropriate content.
 */
export interface FieldGenerationContext {
	/** The type of entity being created/edited */
	entityType: EntityType;
	/** The complete type definition including all field definitions */
	typeDefinition: EntityTypeDefinition;
	/** The specific field to generate content for */
	targetField: FieldDefinition;
	/** Current values from the form (used as context) */
	currentValues: {
		name?: string;
		description?: string;
		tags?: string[];
		notes?: string;
		fields: Record<string, FieldValue>;
	};
	/** Campaign information for additional context */
	campaignContext?: { name: string; setting: string; system: string };
}

/**
 * Result of a field generation request.
 */
export interface FieldGenerationResult {
	/** Whether the generation was successful */
	success: boolean;
	/** The generated value (only present if success is true) */
	value?: FieldValue;
	/** User-friendly error message (only present if success is false) */
	error?: string;
}

/**
 * Check if a field type can be generated using AI.
 *
 * Only text-based fields are generatable. Other field types like numbers,
 * booleans, selects, etc. are not suitable for AI text generation.
 *
 * @param fieldType - The type of field to check
 * @returns True if the field type supports AI generation
 *
 * @example
 * ```typescript
 * isGeneratableField('text')     // true
 * isGeneratableField('richtext') // true
 * isGeneratableField('number')   // false
 * isGeneratableField('boolean')  // false
 * ```
 */
export function isGeneratableField(fieldType: FieldType): boolean {
	return fieldType === 'text' || fieldType === 'textarea' || fieldType === 'richtext';
}

/**
 * Build a focused prompt for generating a single field.
 *
 * Constructs a prompt that includes:
 * - Campaign context (name, setting, system)
 * - Existing entity context (name, description, tags, other fields)
 * - Field-specific hints (placeholder, helpText)
 * - Generation rules (format, length, consistency)
 *
 * Important: Hidden fields (section: 'hidden') are excluded from context
 * to protect DM secrets and sensitive information.
 *
 * @param context - The field generation context
 * @returns A formatted prompt string for the AI
 * @private
 */
function buildFieldPrompt(context: FieldGenerationContext): string {
	const { entityType, typeDefinition, targetField, currentValues, campaignContext } = context;

	// Build context from existing values (EXCLUDING hidden fields)
	let existingContext = '';

	if (currentValues.name) {
		existingContext += `Name: ${currentValues.name}\n`;
	}

	if (currentValues.description) {
		existingContext += `Description: ${currentValues.description}\n`;
	}

	if (currentValues.tags && currentValues.tags.length > 0) {
		existingContext += `Tags: ${currentValues.tags.join(', ')}\n`;
	}

	// Add other filled fields (excluding hidden fields and the target field itself)
	for (const [key, value] of Object.entries(currentValues.fields)) {
		if (value !== null && value !== undefined && value !== '' && key !== targetField.key) {
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
	if (campaignContext) {
		campaignInfo = `\nCampaign Context:
- Campaign: ${campaignContext.name}
- Setting: ${campaignContext.setting}
- System: ${campaignContext.system}
`;
	}

	// Build field-specific hints
	let fieldHints = '';
	if (targetField.placeholder) {
		fieldHints += `\nExample/Hint: ${targetField.placeholder}`;
	}
	if (targetField.helpText) {
		fieldHints += `\nGuidance: ${targetField.helpText}`;
	}

	const entityLabel = typeDefinition.label;
	const fieldLabel = targetField.label;

	return `You are a TTRPG campaign assistant. Generate content for a single field of a ${entityLabel}.
${campaignInfo}
${existingContext ? `\nExisting Context:\n${existingContext}` : ''}
FIELD TO GENERATE: ${fieldLabel} (${targetField.key})
Field Type: ${targetField.type}${fieldHints}

IMPORTANT RULES:
1. Generate ONLY the content for this specific field
2. Keep the content consistent with any existing context provided
3. For "text" fields: Write concise, descriptive text (1-2 sentences max)
4. For "textarea" fields: Write 1-2 paragraphs of content
5. For "richtext" fields: Write 1-3 paragraphs of evocative content
6. Make the content interesting, memorable, and game-ready
7. Do NOT include field labels or explanations, just the raw content value

Respond with ONLY the field content (no JSON, no markdown formatting, no explanation). Just the plain text value for the field.`;
}

/**
 * Generate content for a specific field using AI based on context.
 *
 * This is the main entry point for field generation. It handles:
 * - API key validation
 * - Prompt construction
 * - API communication
 * - Error handling and user-friendly messages
 *
 * The function uses other filled fields as context to generate content
 * that is consistent and relevant to the entity being created/edited.
 *
 * @param context - The field generation context including target field and current values
 * @returns A promise resolving to the generation result (success with value or error)
 *
 * @example
 * ```typescript
 * const result = await generateField({
 *   entityType: 'npc',
 *   typeDefinition: npcTypeDefinition,
 *   targetField: personalityField,
 *   currentValues: {
 *     name: 'Grimwald',
 *     description: 'An elderly wizard',
 *     fields: { role: 'Quest Giver' }
 *   },
 *   campaignContext: {
 *     name: 'Rise of Dragons',
 *     setting: 'High Fantasy',
 *     system: 'Draw Steel'
 *   }
 * });
 *
 * if (result.success) {
 *   console.log(result.value); // Generated personality text
 * } else {
 *   console.error(result.error); // User-friendly error message
 * }
 * ```
 */
export async function generateField(context: FieldGenerationContext): Promise<FieldGenerationResult> {
	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildFieldPrompt(context);

	try {
		// Call Anthropic API
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model: getSelectedModel(),
			max_tokens: 1024,
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

		// Return the generated value
		const value = textContent.text.trim();

		if (!value) {
			return {
				success: false,
				error: 'AI returned empty content'
			};
		}

		return {
			success: true,
			value
		};
	} catch (error) {
		// Handle API errors gracefully
		// Check for error status codes (works with or without instanceof check)
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
			error: `Failed to generate field: ${message}`
		};
	}
}
