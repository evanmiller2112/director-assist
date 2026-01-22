/**
 * Scene Generation Service
 *
 * Provides AI-powered generation for scene-specific content:
 * - Scene setting text (read-aloud descriptions)
 * - Pre-scene summaries (what's about to happen)
 * - Post-scene summaries (what happened)
 *
 * Uses context from location, NPCs, and other scene details to create
 * vivid, game-ready content for Game Masters.
 *
 * @module sceneGenerationService
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSelectedModel } from './modelService';
import { debugStore } from '$lib/stores/debug.svelte';
import type { BaseEntity } from '$lib/types';
import type { DebugEntry } from '$lib/types/debug';

/**
 * Result type for scene setting text generation
 */
export interface SceneSettingResult {
	/** Whether generation was successful */
	success: boolean;
	/** Generated scene setting text (only present if success is true) */
	content?: string;
	/** Error message (only present if success is false) */
	error?: string;
}

/**
 * Context for pre-scene summary generation
 */
export interface PreSceneSummaryContext {
	/** Name of the scene */
	sceneName?: string;
	/** Location where the scene takes place */
	location?: {
		id: string;
		name: string;
		type: 'location';
	};
	/** NPCs present in the scene */
	npcs?: Array<{
		id: string;
		name: string;
		type: 'npc';
	}>;
	/** Mood/atmosphere of the scene */
	mood?: string;
	/** Scene setting text if already generated */
	settingText?: string;
}

/**
 * Context for post-scene summary generation
 */
export interface PostSceneSummaryContext {
	/** Name of the scene */
	sceneName?: string;
	/** What actually happened during the scene */
	whatHappened?: string;
	/** Location where the scene took place */
	location?: {
		id: string;
		name: string;
		type: 'location';
	};
	/** NPCs that were present */
	npcs?: Array<{
		id: string;
		name: string;
		type: 'npc';
	}>;
	/** Mood/atmosphere of the scene */
	mood?: string;
}

/**
 * Result type for summary generation
 */
export interface SummaryResult {
	/** Whether generation was successful */
	success: boolean;
	/** Generated summary (only present if success is true) */
	summary?: string;
	/** Error message (only present if success is false) */
	error?: string;
}

/**
 * Build a prompt for generating scene setting text
 *
 * @param location - The location entity where the scene takes place
 * @param npcs - NPCs present in the scene
 * @param mood - Optional mood/atmosphere
 * @returns Formatted prompt for AI
 */
function buildSceneSettingPrompt(
	location: BaseEntity | null,
	npcs: BaseEntity[],
	mood?: string
): string {
	let context = '';

	// Add location context
	if (location) {
		context += `LOCATION: ${location.name}\n`;
		if (location.description) {
			context += `Description: ${location.description}\n`;
		}
		if (location.summary) {
			context += `Summary: ${location.summary}\n`;
		}
		// Add location-specific fields
		if (location.fields) {
			if (location.fields.atmosphere) {
				context += `Atmosphere: ${location.fields.atmosphere}\n`;
			}
			if (location.fields.features) {
				context += `Features: ${location.fields.features}\n`;
			}
		}
		context += '\n';
	}

	// Add NPCs context
	if (npcs && npcs.length > 0) {
		context += `NPCs PRESENT:\n`;
		npcs.forEach((npc) => {
			context += `- ${npc.name}`;
			if (npc.description) {
				context += `: ${npc.description}`;
			}
			context += '\n';
			if (npc.fields) {
				if (npc.fields.role) {
					context += `  Role: ${npc.fields.role}\n`;
				}
				if (npc.fields.personality) {
					context += `  Personality: ${npc.fields.personality}\n`;
				}
				if (npc.fields.appearance) {
					context += `  Appearance: ${npc.fields.appearance}\n`;
				}
			}
		});
		context += '\n';
	}

	// Add mood if provided
	if (mood) {
		context += `MOOD: ${mood}\n\n`;
	}

	return `You are a TTRPG Game Master assistant. Generate vivid scene setting text (read-aloud description) for a scene.

${context}
TASK: Create an evocative, atmospheric scene description that a GM can read aloud to players.

IMPORTANT RULES:
1. Write 2-3 paragraphs of vivid, sensory description
2. Include sights, sounds, smells, and atmosphere
3. Introduce the location and any NPCs present naturally
4. Set the mood and tone for the scene
5. Make it engaging and immersive for players
6. Use present tense and second person ("you see", "you hear")
7. Do NOT include dialogue or specific actions - just the setting
8. Keep it game-ready and easy to read aloud

Respond with ONLY the scene setting text (no JSON, no markdown, no explanation). Just the descriptive text.`;
}

/**
 * Build a prompt for generating pre-scene summary
 *
 * @param context - Context for the scene
 * @returns Formatted prompt for AI
 */
function buildPreSceneSummaryPrompt(context: PreSceneSummaryContext): string {
	let contextText = '';

	if (context.sceneName) {
		contextText += `SCENE: ${context.sceneName}\n`;
	}

	if (context.location) {
		contextText += `LOCATION: ${context.location.name}\n`;
	}

	if (context.npcs && context.npcs.length > 0) {
		contextText += `NPCs: ${context.npcs.map((n) => n.name).join(', ')}\n`;
	}

	if (context.mood) {
		contextText += `MOOD: ${context.mood}\n`;
	}

	if (context.settingText) {
		contextText += `\nSETTING:\n${context.settingText}\n`;
	}

	return `You are a TTRPG Game Master assistant. Generate a brief pre-scene summary.

${contextText}

TASK: Create a concise summary (1-2 sentences) of what's about to happen in this scene.

IMPORTANT RULES:
1. Keep it to 1-2 sentences maximum
2. Focus on setup and expectations
3. Set the stage for what's about to occur
4. Don't reveal outcomes - this is the "before" summary
5. Make it clear and informative for the GM

Respond with ONLY the summary text (no JSON, no markdown, no explanation). Just 1-2 sentences.`;
}

/**
 * Build a prompt for generating post-scene summary
 *
 * @param context - Context including what happened
 * @returns Formatted prompt for AI
 */
function buildPostSceneSummaryPrompt(context: PostSceneSummaryContext): string {
	let contextText = '';

	if (context.sceneName) {
		contextText += `SCENE: ${context.sceneName}\n`;
	}

	if (context.whatHappened) {
		contextText += `\nWHAT HAPPENED:\n${context.whatHappened}\n`;
	}

	if (context.location) {
		contextText += `\nLOCATION: ${context.location.name}\n`;
	}

	if (context.npcs && context.npcs.length > 0) {
		contextText += `NPCs INVOLVED: ${context.npcs.map((n) => n.name).join(', ')}\n`;
	}

	return `You are a TTRPG Game Master assistant. Generate a brief post-scene summary.

${contextText}

TASK: Create a concise summary (1-2 sentences) of what happened in this scene.

IMPORTANT RULES:
1. Keep it to 1-2 sentences maximum
2. Focus on key events and outcomes
3. Capture the most important things that occurred
4. Make it clear and useful for future reference
5. Condense the events into their essence

Respond with ONLY the summary text (no JSON, no markdown, no explanation). Just 1-2 sentences.`;
}

/**
 * Generate vivid scene setting text from location and NPC context
 *
 * Creates atmospheric, read-aloud description text that GMs can use
 * to set the scene for players. Incorporates location details, NPCs
 * present, and optional mood.
 *
 * @param location - The location entity (or null)
 * @param npcs - Array of NPC entities present in the scene
 * @param mood - Optional mood/atmosphere for the scene
 * @returns Promise resolving to generation result
 *
 * @example
 * ```typescript
 * const result = await generateSceneSettingText(tavernLocation, [barkeepNPC, bardNPC], 'tense');
 * if (result.success) {
 *   console.log(result.content); // "As you push open the heavy oak door..."
 * }
 * ```
 */
export async function generateSceneSettingText(
	location: BaseEntity | null,
	npcs: BaseEntity[],
	mood?: string
): Promise<SceneSettingResult> {
	// Validate inputs
	if (location === null || location === undefined) {
		return {
			success: false,
			error: 'Location is required for scene setting generation'
		};
	}

	if (!npcs) {
		npcs = [];
	}

	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildSceneSettingPrompt(location, npcs, mood);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `scene-setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Scene Setting] ${location.name}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1 + npcs.length,
					entities: [
						{
							id: location.id,
							type: 'location',
							name: location.name,
							summaryLength: prompt.length
						}
					],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'scene-setting'
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

		// Return the generated content
		const content = textContent.text.trim();

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `scene-setting-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: content,
					tokenUsage: response.usage
						? {
								promptTokens: response.usage.input_tokens,
								completionTokens: response.usage.output_tokens,
								totalTokens: response.usage.input_tokens + response.usage.output_tokens
							}
						: undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

		if (!content) {
			return {
				success: false,
				error: 'AI returned empty content'
			};
		}

		return {
			success: true,
			content
		};
	} catch (error) {
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `scene-setting-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status:
						error && typeof error === 'object' && 'status' in error
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
			error: `Failed to generate scene setting: ${message}`
		};
	}
}

/**
 * Generate a pre-scene summary from context
 *
 * Creates a brief (1-2 sentence) summary of what's about to happen
 * in the scene. This is used to set expectations before the scene begins.
 *
 * @param context - Scene context including name, location, NPCs, mood, etc.
 * @returns Promise resolving to summary result
 *
 * @example
 * ```typescript
 * const result = await generatePreSceneSummary({
 *   sceneName: 'Meeting at the Tavern',
 *   location: { id: '1', name: 'The Rusty Sword', type: 'location' },
 *   npcs: [{ id: '2', name: 'Grimwald', type: 'npc' }],
 *   mood: 'relaxed'
 * });
 * if (result.success) {
 *   console.log(result.summary); // "The party arrives at The Rusty Sword..."
 * }
 * ```
 */
export async function generatePreSceneSummary(
	context: PreSceneSummaryContext
): Promise<SummaryResult> {
	// Validate input
	if (!context || context === null) {
		return {
			success: false,
			error: 'Scene context is required'
		};
	}

	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildPreSceneSummaryPrompt(context);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `pre-summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Pre-Scene Summary] ${context.sceneName || 'Untitled Scene'}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [
						{
							id: 'scene-summary',
							type: 'scene',
							name: context.sceneName || 'Untitled Scene',
							summaryLength: prompt.length
						}
					],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'pre-summary'
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

		// Return the generated summary
		const summary = textContent.text.trim();

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `pre-summary-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: summary,
					tokenUsage: response.usage
						? {
								promptTokens: response.usage.input_tokens,
								completionTokens: response.usage.output_tokens,
								totalTokens: response.usage.input_tokens + response.usage.output_tokens
							}
						: undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

		if (!summary) {
			return {
				success: false,
				error: 'AI returned empty summary'
			};
		}

		return {
			success: true,
			summary
		};
	} catch (error) {
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `pre-summary-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status:
						error && typeof error === 'object' && 'status' in error
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
			error: `Failed to generate pre-scene summary: ${message}`
		};
	}
}

/**
 * Generate a post-scene summary from what happened
 *
 * Creates a brief (1-2 sentence) summary of what actually happened
 * during the scene. This condenses the events into their essence for
 * easy reference.
 *
 * @param context - Scene data including what happened, location, NPCs, etc.
 * @returns Promise resolving to summary result
 *
 * @example
 * ```typescript
 * const result = await generatePostSceneSummary({
 *   sceneName: 'Tavern Brawl',
 *   whatHappened: 'The party got into a fight with some thugs...',
 *   location: { id: '1', name: 'The Rusty Sword', type: 'location' },
 *   npcs: [{ id: '2', name: 'Grimwald', type: 'npc' }]
 * });
 * if (result.success) {
 *   console.log(result.summary); // "A brawl broke out in the tavern..."
 * }
 * ```
 */
export async function generatePostSceneSummary(
	context: PostSceneSummaryContext
): Promise<SummaryResult> {
	// Validate input
	if (!context || context === null) {
		return {
			success: false,
			error: 'Scene context is required'
		};
	}

	// Check for API key
	const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dm-assist-api-key') : null;

	if (!apiKey) {
		return {
			success: false,
			error: 'API key not configured. Please add your Anthropic API key in Settings.'
		};
	}

	// Build the prompt
	const prompt = buildPostSceneSummaryPrompt(context);
	const model = getSelectedModel();
	const startTime = Date.now();

	// Debug: capture request
	if (debugStore.enabled) {
		const requestEntry: DebugEntry = {
			id: `post-summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'request',
			request: {
				userMessage: `[Post-Scene Summary] ${context.sceneName || 'Untitled Scene'}`,
				systemPrompt: prompt,
				contextData: {
					entityCount: 1,
					entities: [
						{
							id: 'scene-summary',
							type: 'scene',
							name: context.sceneName || 'Untitled Scene',
							summaryLength: prompt.length
						}
					],
					totalCharacters: prompt.length,
					truncated: false,
					generationType: 'post-summary'
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

		// Return the generated summary
		const summary = textContent.text.trim();

		// Debug: capture response
		if (debugStore.enabled) {
			const responseEntry: DebugEntry = {
				id: `post-summary-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'response',
				response: {
					content: summary,
					tokenUsage: response.usage
						? {
								promptTokens: response.usage.input_tokens,
								completionTokens: response.usage.output_tokens,
								totalTokens: response.usage.input_tokens + response.usage.output_tokens
							}
						: undefined,
					durationMs: Date.now() - startTime
				}
			};
			debugStore.addEntry(responseEntry);
		}

		if (!summary) {
			return {
				success: false,
				error: 'AI returned empty summary'
			};
		}

		return {
			success: true,
			summary
		};
	} catch (error) {
		// Debug: capture error
		if (debugStore.enabled) {
			const errorEntry: DebugEntry = {
				id: `post-summary-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				type: 'error',
				error: {
					message: error instanceof Error ? error.message : 'Unknown error',
					status:
						error && typeof error === 'object' && 'status' in error
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
			error: `Failed to generate post-scene summary: ${message}`
		};
	}
}
