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
import { debugStore } from '$lib/stores/debug.svelte';
import type { EntityType, EntityTypeDefinition, FieldDefinition, FieldValue, FieldType } from '$lib/types';
import type { DebugEntry } from '$lib/types/debug';

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
	/** Formatted relationship context to include in prompt (optional, Issues #59/#60) */
	relationshipContext?: string;
	/** Formatted player character context to include in prompt (optional, Issue #319) */
	playerCharacterContext?: string;
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
 * When a FieldDefinition is provided, also checks the aiGenerate property.
 * If aiGenerate is explicitly set to false, returns false even for text-based fields.
 *
 * @param fieldTypeOrDefinition - The type of field or the full field definition to check
 * @returns True if the field type supports AI generation and aiGenerate is not false
 *
 * @example
 * ```typescript
 * isGeneratableField('text')     // true
 * isGeneratableField('richtext') // true
 * isGeneratableField('number')   // false
 * isGeneratableField('boolean')  // false
 * isGeneratableField({ type: 'text', aiGenerate: false, ... }) // false
 * isGeneratableField({ type: 'text', aiGenerate: true, ... })  // true
 * isGeneratableField({ type: 'text', ... })                    // true (default)
 * ```
 */
export function isGeneratableField(fieldTypeOrDefinition: FieldType | FieldDefinition): boolean {
	// If a FieldDefinition object is passed
	if (typeof fieldTypeOrDefinition === 'object' && 'type' in fieldTypeOrDefinition) {
		const field = fieldTypeOrDefinition as FieldDefinition;
		// If aiGenerate is explicitly false, return false
		if (field.aiGenerate === false) {
			return false;
		}
		// Otherwise check the field type
		return field.type === 'text' || field.type === 'textarea' || field.type === 'richtext';
	}

	// Backward compatibility: if just a FieldType string is passed
	const fieldType = fieldTypeOrDefinition as FieldType;
	return fieldType === 'text' || fieldType === 'textarea' || fieldType === 'richtext';
}

/**
 * Build a focused prompt for generating a single field.
 *
 * Constructs a prompt that includes:
 * - Campaign context (name, setting, system)
 * - Existing entity context (name, description, tags, other fields)
 * - Relationship context (if provided)
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
	const { entityType, typeDefinition, targetField, currentValues, campaignContext, relationshipContext, playerCharacterContext } = context;

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

	// Build relationship context section (Issues #59/#60)
	let relationshipInfo = '';
	if (relationshipContext && relationshipContext.trim()) {
		relationshipInfo = `\n${relationshipContext}\n`;
	}

	// Build player character context section (Issue #319)
	let pcInfo = '';
	if (playerCharacterContext && playerCharacterContext.trim()) {
		pcInfo = `\n${playerCharacterContext}\n`;
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
${existingContext ? `\nExisting Context:\n${existingContext}` : ''}${relationshipInfo}${pcInfo}
FIELD TO GENERATE: ${fieldLabel} (${targetField.key})
Field Type: ${targetField.type}${fieldHints}

IMPORTANT RULES:
1. Generate ONLY the content for this specific field
2. Keep the content consistent with any existing context provided
3. For "text" fields: Write concise, descriptive text (~50-100 characters, 1-2 sentences maximum)
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
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `field-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Field Generation] ${context.targetField.label} for ${context.typeDefinition.label}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [{
						id: 'field-generation',
						type: context.entityType,
						name: context.currentValues.name || 'New Entity',
						summaryLength: prompt.length
					}],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'field'
				},
				model,
				maxTokens: 1024,
				conversationHistory: []
			}
		};
		debugStore.addEntry(requestEntry);
	}

	try {
		// Call Anthropic API
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
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

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `field-gen-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: value,
					tokenUsage: response.usage ? {
						promptTokens: response.usage.input_tokens,
						completionTokens: response.usage.output_tokens,
						totalTokens: response.usage.input_tokens + response.usage.output_tokens
					} : undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

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
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `field-gen-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status: error && typeof error === 'object' && 'status' in error
						? (error as { status: number }).status
						: undefined
				}
			};
			debugStore.addEntry(errorEntry);
		}

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

/**
 * Core field generation context (subset of FieldGenerationContext).
 * Used for summary and description generation where we don't need a target field.
 */
export interface CoreFieldGenerationContext {
	/** The type of entity being created/edited */
	entityType: EntityType;
	/** The complete type definition including all field definitions */
	typeDefinition: EntityTypeDefinition;
	/** Current values from the form (used as context) */
	currentValues: {
		name?: string;
		description?: string;
		summary?: string;
		tags?: string[];
		notes?: string;
		fields: Record<string, FieldValue>;
	};
	/** Campaign information for additional context */
	campaignContext?: { name: string; setting: string; system: string };
	/** Relationship context for this entity (Issue #59) */
	relationshipContext?: string;
	/** Player character context for this entity (Issue #319) */
	playerCharacterContext?: string;
}

/**
 * Build a prompt for generating summary content.
 *
 * The summary is meant to be brief (1-2 sentences) and provide a quick
 * overview of the entity. It excludes hidden fields from context.
 *
 * @param context - The core field generation context
 * @returns A formatted prompt string for the AI
 * @private
 */
function buildSummaryPrompt(context: CoreFieldGenerationContext): string {
	const { entityType, typeDefinition, currentValues, campaignContext, relationshipContext, playerCharacterContext } = context;

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

	// Add other filled fields (excluding hidden fields)
	for (const [key, value] of Object.entries(currentValues.fields)) {
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
	if (campaignContext) {
		campaignInfo = `\nCampaign Context:
- Campaign: ${campaignContext.name}
- Setting: ${campaignContext.setting}
- System: ${campaignContext.system}
`;
	}

	// Build relationship context (Issue #59)
	let relationshipInfo = '';
	if (relationshipContext && relationshipContext.trim()) {
		relationshipInfo = `\nRelationships:\n${relationshipContext}\n`;
	}

	// Build player character context (Issue #319)
	let pcInfo = '';
	if (playerCharacterContext && playerCharacterContext.trim()) {
		pcInfo = `\n${playerCharacterContext}\n`;
	}

	const entityLabel = typeDefinition.label;

	return `You are a TTRPG campaign assistant. Generate a brief summary for a ${entityLabel}.
${campaignInfo}
${existingContext ? `\nExisting Context:\n${existingContext}` : ''}${relationshipInfo}${pcInfo}
TASK: Generate a concise summary (1-2 sentences) that captures the essence of this ${entityLabel}.

IMPORTANT RULES:
1. Keep it BRIEF - maximum 1-2 sentences
2. Focus on the most distinctive or important aspects
3. Make it memorable and game-ready
4. Use the existing context to inform the summary
5. Do NOT include labels or explanations, just the raw summary text

Respond with ONLY the summary text (no JSON, no markdown formatting, no explanation). Just the plain text summary.`;
}

/**
 * Build a prompt for generating description content.
 *
 * The description is meant to be detailed (multiple paragraphs) and provide
 * rich, evocative content. It excludes hidden fields from context.
 *
 * @param context - The core field generation context
 * @returns A formatted prompt string for the AI
 * @private
 */
function buildDescriptionPrompt(context: CoreFieldGenerationContext): string {
	const { entityType, typeDefinition, currentValues, campaignContext, relationshipContext, playerCharacterContext } = context;

	// Build context from existing values (EXCLUDING hidden fields)
	let existingContext = '';

	if (currentValues.name) {
		existingContext += `Name: ${currentValues.name}\n`;
	}

	if (currentValues.summary) {
		existingContext += `Summary: ${currentValues.summary}\n`;
	}

	if (currentValues.tags && currentValues.tags.length > 0) {
		existingContext += `Tags: ${currentValues.tags.join(', ')}\n`;
	}

	// Add other filled fields (excluding hidden fields)
	for (const [key, value] of Object.entries(currentValues.fields)) {
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
	if (campaignContext) {
		campaignInfo = `\nCampaign Context:
- Campaign: ${campaignContext.name}
- Setting: ${campaignContext.setting}
- System: ${campaignContext.system}
`;
	}

	// Build relationship context (Issue #59)
	let relationshipInfo = '';
	if (relationshipContext && relationshipContext.trim()) {
		relationshipInfo = `\nRelationships:\n${relationshipContext}\n`;
	}

	// Build player character context (Issue #319)
	let pcInfo = '';
	if (playerCharacterContext && playerCharacterContext.trim()) {
		pcInfo = `\n${playerCharacterContext}\n`;
	}

	const entityLabel = typeDefinition.label;

	return `You are a TTRPG campaign assistant. Generate a detailed description for a ${entityLabel}.
${campaignInfo}
${existingContext ? `\nExisting Context:\n${existingContext}` : ''}${relationshipInfo}${pcInfo}
TASK: Generate a rich, evocative description (1-3 paragraphs) for this ${entityLabel}.

IMPORTANT RULES:
1. Write 1-3 paragraphs of atmospheric, game-ready content
2. Make it vivid and engaging for a Game Master to use at the table
3. Expand on the existing context (especially the summary if provided)
4. Include sensory details and distinctive characteristics
5. Make it memorable and interesting for players
6. Do NOT include labels or explanations, just the raw description text

Respond with ONLY the description text (no JSON, no markdown formatting, no explanation). Just the plain text description.`;
}

/**
 * Generate summary content for an entity using AI.
 *
 * Creates a brief (1-2 sentence) summary that captures the essence of the entity.
 * This is a convenience function specifically for the summary field.
 *
 * @param context - The core field generation context (without target field)
 * @returns A promise resolving to the generation result (success with value or error)
 *
 * @example
 * ```typescript
 * const result = await generateSummaryContent({
 *   entityType: 'npc',
 *   typeDefinition: npcTypeDefinition,
 *   currentValues: {
 *     name: 'Grimwald the Wise',
 *     description: 'An elderly wizard',
 *     fields: { role: 'Sage and Advisor' }
 *   },
 *   campaignContext: {
 *     name: 'Rise of Dragons',
 *     setting: 'High Fantasy',
 *     system: 'Draw Steel'
 *   }
 * });
 *
 * if (result.success) {
 *   console.log(result.value); // Brief summary text
 * }
 * ```
 */
export async function generateSummaryContent(
	context: CoreFieldGenerationContext
): Promise<FieldGenerationResult> {
	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildSummaryPrompt(context);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `summary-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Summary Generation] ${context.typeDefinition.label}: ${context.currentValues.name || 'New Entity'}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [{
						id: 'summary-generation',
						type: context.entityType,
						name: context.currentValues.name || 'New Entity',
						summaryLength: prompt.length
					}],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'summary'
				},
				model,
				maxTokens: 512,
				conversationHistory: []
			}
		};
		debugStore.addEntry(requestEntry);
	}

	try {
		// Call Anthropic API
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
			max_tokens: 512,
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

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `summary-gen-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: value,
					tokenUsage: response.usage ? {
						promptTokens: response.usage.input_tokens,
						completionTokens: response.usage.output_tokens,
						totalTokens: response.usage.input_tokens + response.usage.output_tokens
					} : undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

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
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `summary-gen-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status: error && typeof error === 'object' && 'status' in error
						? (error as { status: number }).status
						: undefined
				}
			};
			debugStore.addEntry(errorEntry);
		}

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
			error: `Failed to generate summary: ${message}`
		};
	}
}

/**
 * Generate description content for an entity using AI.
 *
 * Creates a detailed (multiple paragraph) description with evocative,
 * game-ready content. This is a convenience function specifically for
 * the description field.
 *
 * @param context - The core field generation context (without target field)
 * @returns A promise resolving to the generation result (success with value or error)
 *
 * @example
 * ```typescript
 * const result = await generateDescriptionContent({
 *   entityType: 'location',
 *   typeDefinition: locationTypeDefinition,
 *   currentValues: {
 *     name: 'Dragon\'s Peak',
 *     summary: 'A towering mountain where dragons nest',
 *     fields: {}
 *   }
 * });
 *
 * if (result.success) {
 *   console.log(result.value); // Detailed description text
 * }
 * ```
 */
export async function generateDescriptionContent(
	context: CoreFieldGenerationContext
): Promise<FieldGenerationResult> {
	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildDescriptionPrompt(context);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `desc-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Description Generation] ${context.typeDefinition.label}: ${context.currentValues.name || 'New Entity'}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [{
						id: 'description-generation',
						type: context.entityType,
						name: context.currentValues.name || 'New Entity',
						summaryLength: prompt.length
					}],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'description'
				},
				model,
				maxTokens: 1024,
				conversationHistory: []
			}
		};
		debugStore.addEntry(requestEntry);
	}

	try {
		// Call Anthropic API
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
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

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `desc-gen-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: value,
					tokenUsage: response.usage ? {
						promptTokens: response.usage.input_tokens,
						completionTokens: response.usage.output_tokens,
						totalTokens: response.usage.input_tokens + response.usage.output_tokens
					} : undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

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
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `desc-gen-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status: error && typeof error === 'object' && 'status' in error
						? (error as { status: number }).status
						: undefined
				}
			};
			debugStore.addEntry(errorEntry);
		}

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
			error: `Failed to generate description: ${message}`
		};
	}
}
