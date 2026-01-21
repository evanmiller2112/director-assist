/**
 * Debug types for AI request/response inspection
 *
 * These types support the debug console feature (#118) which captures
 * detailed information about AI interactions for troubleshooting and analysis.
 */

/**
 * Context summary for a debug entry - captures what context was sent with a request
 */
export interface ContextSummary {
	entityCount: number;
	entities: Array<{
		id: string;
		type: string;
		name: string;
		summaryLength: number;
	}>;
	totalCharacters: number;
	truncated: boolean;
	generationType?: string;
	typeFieldValues?: Record<string, string>;
}

/**
 * A single debug entry capturing an AI interaction
 */
export interface DebugEntry {
	id: string;
	timestamp: Date;
	type: 'request' | 'response' | 'error';

	request?: {
		userMessage: string;
		systemPrompt: string;
		contextData: ContextSummary;
		model: string;
		maxTokens: number;
		conversationHistory: Array<{ role: string; content: string }>;
	};

	response?: {
		content: string;
		tokenUsage?: {
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
		};
		durationMs: number;
	};

	error?: {
		message: string;
		status?: number;
	};
}
