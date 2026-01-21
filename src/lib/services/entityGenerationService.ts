import Anthropic from '@anthropic-ai/sdk';
import { getSelectedModel } from './modelService';
import { debugStore } from '$lib/stores/debug.svelte';
import type { EntityTypeDefinition, FieldDefinition, FieldValue } from '$lib/types';
import type { DebugEntry } from '$lib/types/debug';

export interface GenerationContext {
	name?: string;
	description?: string;
	tags?: string[];
	fields: Record<string, FieldValue>;
	/** Relationship context for this entity (Issue #59) */
	relationshipContext?: string;
}

export interface GeneratedEntity {
	name: string;
	description: string;
	summary: string;
	tags: string[];
	fields: Record<string, FieldValue>;
}

export interface GenerationResult {
	success: boolean;
	entity?: GeneratedEntity;
	error?: string;
}

/**
 * Build a prompt for generating entity content.
 */
function buildGenerationPrompt(
	typeDefinition: EntityTypeDefinition,
	context: GenerationContext,
	campaignContext?: { name: string; setting: string; system: string }
): string {
	const typeName = typeDefinition.label;
	const fieldsToGenerate = typeDefinition.fieldDefinitions.filter(
		(f) => f.section !== 'hidden' // Don't generate hidden/secret fields
	);

	// Build field schema description
	const fieldSchemas = fieldsToGenerate.map((f) => {
		let schema = `- ${f.key} (${f.label}): ${f.type}`;
		if (f.options && f.options.length > 0) {
			schema += ` - MUST be one of: ${f.options.join(', ')}`;
		}
		if (f.placeholder) {
			schema += ` - Example: ${f.placeholder}`;
		}
		return schema;
	}).join('\n');

	// Build context from pre-filled values
	let existingContext = '';
	if (context.name) {
		existingContext += `Name: ${context.name}\n`;
	}
	if (context.description) {
		existingContext += `Description: ${context.description}\n`;
	}
	if (context.tags && context.tags.length > 0) {
		existingContext += `Tags: ${context.tags.join(', ')}\n`;
	}
	for (const [key, value] of Object.entries(context.fields)) {
		if (value !== null && value !== undefined && value !== '') {
			const fieldDef = fieldsToGenerate.find((f) => f.key === key);
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
- Setting: ${campaignContext.setting || 'Fantasy'}
- System: ${campaignContext.system || 'System Agnostic'}
`;
	}

	// Build relationship context (Issue #59)
	let relationshipInfo = '';
	if (context.relationshipContext && context.relationshipContext.trim()) {
		relationshipInfo = `\nRelationships:\n${context.relationshipContext}\n`;
	}

	return `You are a TTRPG campaign assistant generating a ${typeName} for a tabletop roleplaying campaign.
${campaignInfo}
${existingContext ? `\nThe user has provided some initial context:\n${existingContext}` : '\nGenerate a complete, original entity from scratch.'}${relationshipInfo}

Generate a complete ${typeName} with creative, evocative content. Fill in ALL fields appropriately.

Field Schema (generate content for each):
${fieldSchemas}

IMPORTANT RULES:
1. For "select" fields, you MUST use EXACTLY one of the listed options
2. For "tags" fields, provide 2-4 relevant tags as a comma-separated list
3. For "richtext" or "textarea" fields, write 1-3 paragraphs of evocative content
4. For "text" fields, write concise, descriptive text (1-2 sentences max)
5. For "number" fields, provide appropriate numeric values
6. Make the content interesting, memorable, and game-ready
7. If context was provided, ensure generated content is consistent with it
8. Generate a name if not provided

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "name": "Generated name here",
  "description": "A compelling 1-2 paragraph description",
  "summary": "A brief 1-2 sentence summary for AI context injection",
  "tags": ["tag1", "tag2", "tag3"],
  "fields": {
    "fieldKey1": "value1",
    "fieldKey2": "value2"
  }
}

The "fields" object should contain all the field keys from the schema above with appropriate generated values.`;
}

/**
 * Parse and validate the AI response.
 */
function parseGenerationResponse(
	response: string,
	typeDefinition: EntityTypeDefinition
): GeneratedEntity | null {
	try {
		// Try to extract JSON from the response (handle markdown code blocks)
		let jsonStr = response.trim();
		if (jsonStr.startsWith('```')) {
			jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
		}

		const parsed = JSON.parse(jsonStr);

		// Validate required fields
		if (!parsed.name || typeof parsed.name !== 'string') {
			throw new Error('Missing or invalid name');
		}
		if (!parsed.description || typeof parsed.description !== 'string') {
			throw new Error('Missing or invalid description');
		}
		if (!parsed.summary || typeof parsed.summary !== 'string') {
			throw new Error('Missing or invalid summary');
		}

		// Ensure tags is an array
		const tags = Array.isArray(parsed.tags) ? parsed.tags : [];

		// Validate and clean fields
		const fields: Record<string, FieldValue> = {};
		const fieldDefs = typeDefinition.fieldDefinitions.filter((f) => f.section !== 'hidden');

		for (const fieldDef of fieldDefs) {
			const value = parsed.fields?.[fieldDef.key];
			if (value !== undefined && value !== null) {
				// Validate select fields
				if (fieldDef.type === 'select' && fieldDef.options) {
					if (fieldDef.options.includes(value)) {
						fields[fieldDef.key] = value;
					} else {
						// Use default or first option if invalid
						fields[fieldDef.key] = fieldDef.defaultValue ?? fieldDef.options[0];
					}
				}
				// Handle tags/multi-select as arrays
				else if (fieldDef.type === 'tags' || fieldDef.type === 'multi-select') {
					if (Array.isArray(value)) {
						fields[fieldDef.key] = value;
					} else if (typeof value === 'string') {
						fields[fieldDef.key] = value.split(',').map((s) => s.trim()).filter(Boolean);
					}
				}
				// Handle numbers
				else if (fieldDef.type === 'number') {
					const num = parseFloat(value);
					if (!isNaN(num)) {
						fields[fieldDef.key] = num;
					}
				}
				// Handle booleans
				else if (fieldDef.type === 'boolean') {
					fields[fieldDef.key] = Boolean(value);
				}
				// Everything else as string
				else {
					fields[fieldDef.key] = String(value);
				}
			}
		}

		return {
			name: parsed.name,
			description: parsed.description,
			summary: parsed.summary,
			tags: tags.map(String),
			fields
		};
	} catch (error) {
		console.error('Failed to parse generation response:', error);
		return null;
	}
}

/**
 * Generate a complete entity using AI.
 */
export async function generateEntity(
	typeDefinition: EntityTypeDefinition,
	context: GenerationContext,
	campaignContext?: { name: string; setting: string; system: string }
): Promise<GenerationResult> {
	// Get API key from localStorage
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	const prompt = buildGenerationPrompt(typeDefinition, context, campaignContext);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `entity-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Entity Generation] ${typeDefinition.label}: ${context.name || 'New Entity'}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [{
						id: 'entity-generation',
						type: typeDefinition.type,
						name: context.name || 'New Entity',
						summaryLength: prompt.length
					}],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'entity'
				},
				model,
				maxTokens: 2048,
				conversationHistory: []
			}
		};
		debugStore.addEntry(requestEntry);
	}

	try {
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
			max_tokens: 2048,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		const textContent = response.content.find((c) => c.type === 'text');
		if (!textContent || textContent.type !== 'text') {
			return { success: false, error: 'Unexpected response format from AI' };
		}

		const entity = parseGenerationResponse(textContent.text, typeDefinition);

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `entity-gen-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: textContent.text,
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

		if (!entity) {
			return { success: false, error: 'Failed to parse AI response. Please try again.' };
		}

		return { success: true, entity };
	} catch (error) {
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `entity-gen-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status: error instanceof Anthropic.APIError ? error.status : undefined
				}
			};
			debugStore.addEntry(errorEntry);
		}

		if (error instanceof Anthropic.APIError) {
			if (error.status === 401) {
				return { success: false, error: 'Invalid API key. Please check your API key in Settings.' };
			} else if (error.status === 429) {
				return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
			}
		}
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, error: `Failed to generate entity: ${message}` };
	}
}

/**
 * Check if an API key is configured.
 */
export function hasGenerationApiKey(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('dm-assist-api-key');
}
