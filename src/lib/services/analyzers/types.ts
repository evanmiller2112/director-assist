/**
 * Shared types for suggestion analyzers
 */

import type { BaseEntity, EntityId } from '$lib/types';
import type { AISuggestion, AISuggestionType } from '$lib/types/ai';

/**
 * Configuration for analysis runs
 */
export interface AnalysisConfig {
	maxSuggestionsPerType: number;
	minRelevanceScore: number;
	enableAIAnalysis: boolean;
	rateLimitMs: number;
	expirationDays: number;
}

/**
 * Result from an analyzer run
 */
export interface AnalysisResult {
	type: AISuggestionType;
	suggestions: Omit<AISuggestion, 'id' | 'status' | 'createdAt' | 'expiresAt'>[];
	analysisTimeMs: number;
	apiCallsMade: number;
}

/**
 * Result from running all analyzers
 */
export interface FullAnalysisResult {
	results: AnalysisResult[];
	totalSuggestions: number;
	totalApiCalls: number;
	totalTimeMs: number;
	errors: string[];
}

/**
 * Relationship graph representation
 */
export interface RelationshipMap {
	nodes: EntityId[];
	edges: Array<{
		source: EntityId;
		target: EntityId;
		relationship: string;
	}>;
}

/**
 * Pre-built context for entity analysis
 * This is built once and passed to all analyzers to avoid redundant computation
 */
export interface EntityAnalysisContext {
	entities: BaseEntity[];
	entityMap: Map<EntityId, BaseEntity>;
	relationshipMap: RelationshipMap;
	locationsByEntity: Map<EntityId, EntityId[]>;
	mentionedNames: Map<string, EntityId[]>; // normalized name -> entity IDs
}

/**
 * Interface that all analyzers must implement
 */
export interface SuggestionAnalyzer {
	type: AISuggestionType;
	analyze(
		context: EntityAnalysisContext,
		config: AnalysisConfig
	): Promise<AnalysisResult>;
}
