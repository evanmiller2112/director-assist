import Anthropic from '@anthropic-ai/sdk';
import type { BaseEntity } from '$lib/types';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';
import { getSelectedModel } from './modelService';
import { debugStore } from '$lib/stores/debug.svelte';
import type { DebugEntry } from '$lib/types/debug';

export interface SummaryGenerationResult {
	success: boolean;
	summary?: string;
	error?: string;
}

/**
 * Build a context string from entity data for the summary prompt.
 * Excludes hidden/secret fields to prevent leaking DM-only info into summaries.
 */
function buildEntityContext(entity: BaseEntity): string {
	const typeDefinition = getEntityTypeDefinition(entity.type);
	const typeName = typeDefinition?.label ?? entity.type;

	let context = `${typeName}: ${entity.name}\n`;

	if (entity.description) {
		context += `Description: ${entity.description}\n`;
	}

	if (entity.tags.length > 0) {
		context += `Tags: ${entity.tags.join(', ')}\n`;
	}

	// Include relevant fields (skip hidden/secret fields)
	for (const [key, value] of Object.entries(entity.fields)) {
		if (value && value !== '') {
			const fieldDef = typeDefinition?.fieldDefinitions.find((f) => f.key === key);
			// Skip secret fields from summary context
			if (fieldDef?.section !== 'hidden') {
				const label = fieldDef?.label ?? key;
				const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
				context += `${label}: ${displayValue}\n`;
			}
		}
	}

	return context;
}

/**
 * Generate an AI summary for an entity.
 * Returns a brief 1-2 sentence summary suitable for context injection.
 */
export async function generateSummary(entity: BaseEntity): Promise<SummaryGenerationResult> {
	// Get API key from localStorage
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	const entityContext = buildEntityContext(entity);
	const typeDefinition = getEntityTypeDefinition(entity.type);
	const typeName = typeDefinition?.label ?? entity.type;
	const model = getSelectedModel();
	const startTime = Date.now();

	const prompt = `You are a TTRPG campaign assistant. Generate a brief 1-2 sentence summary of this ${typeName} that captures the key identifying information useful for providing context in future conversations.

The summary should be concise (50-150 words max) but include the most essential details that distinguish this entity. Focus on: who/what they are, their role or significance, and any key traits or attributes.

Do NOT include any secrets or hidden information - only publicly known facts about this entity.

${entityContext}

Write ONLY the summary, nothing else. No preamble, no explanation.`;

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Entity Summary] ${typeName}: ${entity.name}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [{
						id: entity.id,
						type: entity.type,
						name: entity.name,
						summaryLength: entity.description?.length || 0
					}],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'entity-summary'
				},
				model,
				maxTokens: 256,
				conversationHistory: []
			}
		};
		debugStore.addEntry(requestEntry);
	}

	try {
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		const response = await client.messages.create({
			model,
			max_tokens: 256,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		const textContent = response.content.find((c) => c.type === 'text');
		if (textContent && textContent.type === 'text') {
			const summary = textContent.text.trim();

			// Debug: capture response
			if (debugStore.enabled) {
				const responseEntry: DebugEntry = {
					id: `summary-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					timestamp: new Date(),
					type: 'response',
					response: {
						content: summary,
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

			return { success: true, summary };
		}

		return { success: false, error: 'Unexpected response format from AI' };
	} catch (error) {
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `summary-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, error: `Failed to generate summary: ${message}` };
	}
}

/**
 * Check if an API key is configured.
 */
export function hasApiKey(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('dm-assist-api-key');
}
