import Anthropic from '@anthropic-ai/sdk';
import type { BaseEntity, EntityId, EntityLink } from '$lib/types';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';
import { getSelectedModel } from './modelService';
import { buildPrivacySafeSummary } from './relationshipContextBuilder';

/**
 * Result from generating a single relationship summary.
 */
export interface RelationshipSummaryResult {
	success: boolean;
	summary?: string;
	error?: string;
}

/**
 * Result from batch relationship summary generation.
 */
export interface RelationshipSummaryBatchResult {
	success: boolean;
	summaries?: Array<{
		relationshipId: EntityId;
		targetEntityId: EntityId;
		success: boolean;
		summary?: string;
		error?: string;
	}>;
	totalCount: number;
	successCount: number;
	failureCount: number;
	error?: string;
}

/**
 * Optional campaign context for relationship summaries.
 */
export interface RelationshipSummaryContext {
	campaignName?: string;
	campaignSetting?: string;
	campaignSystem?: string;
}

/**
 * Build a privacy-safe context string from an entity.
 * Excludes hidden fields, notes, and secrets.
 */
function buildEntityContextForRelationship(entity: BaseEntity): string {
	const typeDefinition = getEntityTypeDefinition(entity.type);
	const typeName = typeDefinition?.label ?? entity.type;

	let context = `${typeName}: ${entity.name}\n`;

	// Include summary if available
	if (entity.summary) {
		context += `Summary: ${entity.summary}\n`;
	}

	// Include description if available
	if (entity.description) {
		context += `Description: ${entity.description}\n`;
	}

	// Include tags
	if (entity.tags.length > 0) {
		context += `Tags: ${entity.tags.join(', ')}\n`;
	}

	// Include non-hidden fields (excluding notes and secrets)
	for (const [key, value] of Object.entries(entity.fields)) {
		if (value && value !== '') {
			const fieldDef = typeDefinition?.fieldDefinitions.find((f) => f.key === key);
			// Skip hidden section fields and notes
			// Also skip fields with "hidden" or "secret" in the key name (privacy protection)
			const isHiddenBySection = fieldDef?.section === 'hidden';
			const isHiddenByName = key.toLowerCase().includes('hidden') || key.toLowerCase().includes('secret');

			if (!isHiddenBySection && !isHiddenByName) {
				const label = fieldDef?.label ?? key;
				const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
				context += `${label}: ${displayValue}\n`;
			}
		}
	}

	return context;
}

/**
 * Build the AI prompt for generating a relationship summary.
 */
function buildRelationshipSummaryPrompt(
	sourceEntity: BaseEntity,
	targetEntity: BaseEntity,
	relationship: EntityLink,
	context?: RelationshipSummaryContext
): string {
	const sourceContext = buildEntityContextForRelationship(sourceEntity);
	const targetContext = buildEntityContextForRelationship(targetEntity);

	// Build campaign context
	let campaignInfo = '';
	if (context) {
		const setting = context.campaignSetting || 'Fantasy';
		const system = context.campaignSystem || 'System Agnostic';
		campaignInfo = `\nCampaign Context:`;
		if (context.campaignName) {
			campaignInfo += `\n- Campaign: ${context.campaignName}`;
		}
		campaignInfo += `\n- Setting: ${setting}`;
		campaignInfo += `\n- System: ${system}`;
		campaignInfo += '\n';
	}

	// Build relationship details
	let relationshipDetails = `\nRelationship Type: ${relationship.relationship}`;
	if (relationship.bidirectional) {
		relationshipDetails += ' (bidirectional)';
		if (relationship.reverseRelationship) {
			relationshipDetails += `\nReverse Relationship: ${relationship.reverseRelationship}`;
		}
	}
	if (relationship.strength) {
		relationshipDetails += `\nRelationship Strength: ${relationship.strength}`;
	}
	if (relationship.notes) {
		relationshipDetails += `\nRelationship Notes: ${relationship.notes}`;
	}

	return `You are a TTRPG campaign assistant. Generate a brief, concise summary that describes the relationship between two entities in a tabletop roleplaying game campaign.
${campaignInfo}
Source Entity:
${sourceContext}

Target Entity:
${targetContext}
${relationshipDetails}

Generate a concise 1-2 sentence summary that describes this relationship from the perspective of the source entity (${sourceEntity.name}) toward the target entity (${targetEntity.name}).

IMPORTANT RULES:
1. Focus on the relationship itself - how these entities are connected
2. Keep it brief and focused (1-2 sentences maximum)
3. Use only the information provided - do not speculate or add details
4. Consider the relationship type and strength in your description
5. Make it useful for game context - suitable for reading to players or using in AI prompts
6. Write from a neutral, third-person perspective

Write ONLY the relationship summary, nothing else. No preamble, no explanation.`;
}

/**
 * Check if an API key is configured for relationship summary generation.
 */
export function hasRelationshipSummaryApiKey(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('dm-assist-api-key');
}

/**
 * Generate an AI-powered summary describing the relationship between two entities.
 */
export async function generateRelationshipSummary(
	sourceEntity: BaseEntity,
	targetEntity: BaseEntity,
	relationship: EntityLink,
	context?: RelationshipSummaryContext
): Promise<RelationshipSummaryResult> {
	// Validate inputs
	if (!sourceEntity || !targetEntity || !relationship) {
		return {
			success: false,
			error: 'Invalid input: source entity, target entity, and relationship are required'
		};
	}

	// Get API key from localStorage
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	const prompt = buildRelationshipSummaryPrompt(sourceEntity, targetEntity, relationship, context);

	try {
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model: getSelectedModel(),
			max_tokens: 300, // Relationship summaries should be concise (between 256-512 as per tests)
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

		const summary = textContent.text.trim();

		// Validate that we got a non-empty summary
		if (!summary || summary.length === 0) {
			return { success: false, error: 'AI returned an empty summary' };
		}

		return { success: true, summary };
	} catch (error) {
		if (error instanceof Anthropic.APIError) {
			if (error.status === 401) {
				return { success: false, error: 'Invalid API key. Please check your API key in Settings.' };
			} else if (error.status === 429) {
				return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
			}
		}
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, error: `Failed to generate relationship summary: ${message}` };
	}
}

/**
 * Generate relationship summaries for multiple relationships in batch.
 * Processes sequentially to avoid rate limits and handles partial failures.
 */
export async function generateRelationshipSummariesBatch(
	sourceEntity: BaseEntity,
	relationships: Array<{ targetEntity: BaseEntity; relationship: EntityLink }>,
	context?: RelationshipSummaryContext
): Promise<RelationshipSummaryBatchResult> {
	// Validate source entity
	if (!sourceEntity) {
		return {
			success: false,
			error: 'Invalid input: source entity is required',
			totalCount: 0,
			successCount: 0,
			failureCount: 0
		};
	}

	// Check API key
	if (!hasRelationshipSummaryApiKey()) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.',
			totalCount: 0,
			successCount: 0,
			failureCount: 0
		};
	}

	// Handle empty relationships array
	if (relationships.length === 0) {
		return {
			success: true,
			summaries: [],
			totalCount: 0,
			successCount: 0,
			failureCount: 0
		};
	}

	const summaries: Array<{
		relationshipId: EntityId;
		targetEntityId: EntityId;
		success: boolean;
		summary?: string;
		error?: string;
	}> = [];

	let successCount = 0;
	let failureCount = 0;

	// Process each relationship sequentially
	for (const { targetEntity, relationship } of relationships) {
		// Validate that relationship is not null/undefined
		if (!relationship || !targetEntity) {
			const summaryEntry = {
				relationshipId: relationship?.id ?? 'unknown',
				targetEntityId: targetEntity?.id ?? 'unknown',
				success: false,
				error: 'Invalid relationship or target entity'
			};
			summaries.push(summaryEntry);
			failureCount++;
			continue;
		}

		const result = await generateRelationshipSummary(
			sourceEntity,
			targetEntity,
			relationship,
			context
		);

		const summaryEntry = {
			relationshipId: relationship.id,
			targetEntityId: targetEntity.id,
			success: result.success,
			summary: result.summary,
			error: result.error
		};

		summaries.push(summaryEntry);

		if (result.success) {
			successCount++;
		} else {
			failureCount++;
		}

		// Add a small delay between requests to avoid rate limiting
		// Only add delay if there are more relationships to process
		if (relationships.indexOf({ targetEntity, relationship }) < relationships.length - 1) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return {
		success: true,
		summaries,
		totalCount: relationships.length,
		successCount,
		failureCount
	};
}
