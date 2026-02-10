import Anthropic from '@anthropic-ai/sdk';
import { buildContext, formatContextForPrompt } from './contextBuilder';
import { getSelectedModel } from './modelService';
import type { ChatMessage, GenerationType } from '$lib/types';
import type { SystemId } from '$lib/types/systems';
import type { DebugEntry, ContextSummary } from '$lib/types/debug';
import { chatRepository } from '$lib/db/repositories';
import { getGenerationTypeConfig } from '$lib/config/generationTypes';
import { getSystemGenerationOverride, mergeGenerationConfig } from '$lib/config/systemGenerationOverrides';
import { debugStore } from '$lib/stores/debug.svelte';

const SYSTEM_PROMPT = `You are a TTRPG campaign assistant for Director Assist, helping Directors (Game Masters) with campaign preparation, content generation, and world-building.

Your capabilities include:
- Generating NPCs with personalities, motivations, and backgrounds
- Creating locations with atmosphere, inhabitants, and points of interest
- Suggesting plot hooks, story threads, and adventure ideas
- Designing encounters with interesting challenges
- Creating items, artifacts, and treasures
- Building factions with goals, resources, and relationships
- Helping with session preparation and pacing

Guidelines:
- Be creative but stay consistent with the campaign context provided
- When generating content, format it clearly with headings and bullet points
- Ask clarifying questions if the request is ambiguous
- Suggest connections to existing campaign elements when relevant
- Keep responses concise but comprehensive`;

export interface ChatResponse {
	content: string;
	error?: string;
}

/**
 * Send a chat message and get an AI response.
 * Supports streaming via the onStream callback.
 */
export async function sendChatMessage(
	userMessage: string,
	contextEntityIds: string[],
	includeLinked: boolean = true,
	onStream?: (partial: string) => void,
	generationType: GenerationType = 'custom',
	typeFieldValues?: Record<string, string>,
	systemId?: SystemId | null
): Promise<string> {
	// Get API key from localStorage
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		throw new Error('API key not configured. Please add your Anthropic API key in Settings.');
	}

	// Build context from selected entities
	const context = await buildContext({
		entityIds: contextEntityIds,
		includeLinked,
		maxCharacters: 6000 // Leave room for conversation history
	});

	const contextPrompt = formatContextForPrompt(context);

	// Build conversation history from recent messages
	const recentMessages = await getRecentMessages(10);
	const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
		recentMessages.map((m) => ({
			role: m.role,
			content: m.content
		}));

	// Build system prompt with context
	let fullSystemPrompt = SYSTEM_PROMPT;
	if (contextPrompt) {
		fullSystemPrompt += '\n\n' + contextPrompt;
	}

	// Add generation type-specific prompt and structure
	if (generationType && generationType !== 'custom') {
		let typeConfig = getGenerationTypeConfig(generationType);

		// Merge with system-specific overrides if a system is specified
		if (typeConfig && systemId) {
			const systemOverride = getSystemGenerationOverride(systemId, generationType);
			typeConfig = mergeGenerationConfig(typeConfig, systemOverride);
		}

		if (typeConfig) {
			fullSystemPrompt += '\n\n' + typeConfig.promptTemplate;
			if (typeConfig.suggestedStructure) {
				fullSystemPrompt += '\n\n' + typeConfig.suggestedStructure;
			}

			// Add typeField-specific prompts if values are provided
			if (typeFieldValues && typeConfig.typeFields) {
				for (const field of typeConfig.typeFields) {
					const value = typeFieldValues[field.key];
					// Only include non-empty values
					if (value && value.trim() !== '') {
						// Replace {value} placeholder with actual value
						const fieldPrompt = field.promptTemplate.replace(/\{value\}/g, value);
						fullSystemPrompt += '\n\n' + fieldPrompt;
					}
				}
			}
		}
	}

	// Capture debug request data if debug is enabled
	const requestStartTime = Date.now();
	let requestEntryId: string | undefined;

	if (debugStore.enabled) {
		requestEntryId = `debug-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Build context summary for debug
		const contextSummary: ContextSummary = {
			entityCount: context.entities.length,
			entities: context.entities.map(e => ({
				id: e.id,
				type: e.type,
				name: e.name,
				summaryLength: (e.summary || '').length
			})),
			totalCharacters: context.totalCharacters,
			truncated: context.truncated || false,
			generationType,
			typeFieldValues
		};

		const requestEntry: DebugEntry = {
			id: requestEntryId,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage,
				systemPrompt: fullSystemPrompt,
				contextData: contextSummary,
				model: getSelectedModel(),
				maxTokens: 4096,
				conversationHistory
			}
		};

		debugStore.addEntry(requestEntry);
	}

	try {
		const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

		// Add the new user message to history
		const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
			...conversationHistory,
			{ role: 'user', content: userMessage }
		];

		if (onStream) {
			// Streaming response
			let fullContent = '';

			const stream = client.messages.stream({
				model: getSelectedModel(),
				max_tokens: 4096,
				system: fullSystemPrompt,
				messages
			});

			for await (const event of stream) {
				if (
					event.type === 'content_block_delta' &&
					event.delta.type === 'text_delta'
				) {
					fullContent += event.delta.text;
					onStream(fullContent);
				}
			}

			// Capture debug response data if debug is enabled
			if (debugStore.enabled) {
				const duration = Date.now() - requestStartTime;
				const responseEntryId = `debug-res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Get final message for token usage
				const finalMessage = await stream.finalMessage();

				const responseEntry: DebugEntry = {
					id: responseEntryId,
					timestamp: new Date(),
					type: 'response',
					response: {
						content: fullContent,
						tokenUsage: finalMessage.usage ? {
							promptTokens: finalMessage.usage.input_tokens,
							completionTokens: finalMessage.usage.output_tokens,
							totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens
						} : undefined,
						durationMs: duration
					}
				};

				debugStore.addEntry(responseEntry);
			}

			return fullContent;
		} else {
			// Non-streaming response
			const response = await client.messages.create({
				model: getSelectedModel(),
				max_tokens: 4096,
				system: fullSystemPrompt,
				messages
			});

			const textContent = response.content.find((c) => c.type === 'text');
			if (textContent && textContent.type === 'text') {
				// Capture debug response data if debug is enabled
				if (debugStore.enabled) {
					const duration = Date.now() - requestStartTime;
					const responseEntryId = `debug-res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

					const responseEntry: DebugEntry = {
						id: responseEntryId,
						timestamp: new Date(),
						type: 'response',
						response: {
							content: textContent.text,
							tokenUsage: response.usage ? {
								promptTokens: response.usage.input_tokens,
								completionTokens: response.usage.output_tokens,
								totalTokens: response.usage.input_tokens + response.usage.output_tokens
							} : undefined,
							durationMs: duration
						}
					};

					debugStore.addEntry(responseEntry);
				}

				return textContent.text;
			}

			throw new Error('Unexpected response format from AI');
		}
	} catch (error) {
		// Capture debug error data if debug is enabled
		if (debugStore.enabled) {
			const errorEntryId = `debug-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			let errorMessage = 'Unknown error';
			let statusCode: number | undefined;

			if (Anthropic?.APIError && error instanceof Anthropic.APIError) {
				errorMessage = error.message;
				statusCode = error.status;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			const errorEntry: DebugEntry = {
				id: errorEntryId,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: errorMessage,
					status: statusCode
				}
			};

			debugStore.addEntry(errorEntry);
		}

		if (Anthropic?.APIError && error instanceof Anthropic.APIError) {
			if (error.status === 401) {
				throw new Error('Invalid API key. Please check your API key in Settings.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			} else if (error.status === 500) {
				throw new Error('AI service temporarily unavailable. Please try again later.');
			}
		}
		throw error;
	}
}

/**
 * Get recent messages from the chat repository.
 */
async function getRecentMessages(limit: number = 10): Promise<ChatMessage[]> {
	return new Promise((resolve) => {
		const observable = chatRepository.getRecent(limit);
		const subscription = observable.subscribe({
			next: (messages) => {
				subscription.unsubscribe();
				// Reverse to get chronological order
				resolve(messages.reverse());
			},
			error: () => {
				resolve([]);
			}
		});
	});
}

/**
 * Check if an API key is configured.
 */
export function hasChatApiKey(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('dm-assist-api-key');
}
