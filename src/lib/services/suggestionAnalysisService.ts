/**
 * Suggestion Analysis Service
 *
 * Main orchestration service that:
 * - Coordinates all analyzers (inconsistency, enhancement, relationship, plot thread)
 * - Builds EntityAnalysisContext from campaign data
 * - Deduplicates suggestions
 * - Manages configuration and scheduling
 * - Stores results in suggestionRepository
 */

import { get } from 'svelte/store';
import { entityRepository, suggestionRepository } from '$lib/db/repositories';
import type { BaseEntity, EntityId } from '$lib/types';
import type { AISuggestion } from '$lib/types/ai';
import {
	inconsistencyAnalyzer,
	enhancementAnalyzer,
	relationshipAnalyzer,
	plotThreadAnalyzer,
	type AnalysisConfig,
	type FullAnalysisResult,
	type EntityAnalysisContext,
	type RelationshipMap
} from './analyzers';

/**
 * Default analysis configuration
 */
const DEFAULT_CONFIG: AnalysisConfig = {
	maxSuggestionsPerType: 10,
	minRelevanceScore: 30,
	enableAIAnalysis: true,
	rateLimitMs: 1000,
	expirationDays: 7
};

/**
 * Build EntityAnalysisContext from campaign entities
 */
function buildContext(entities: BaseEntity[]): EntityAnalysisContext {
	const entityMap = new Map<EntityId, BaseEntity>();
	const locationsByEntity = new Map<EntityId, EntityId[]>();
	const mentionedNames = new Map<string, EntityId[]>();
	const relationshipMap: RelationshipMap = {
		nodes: [],
		edges: []
	};

	// Build entity map and extract data
	for (const entity of entities) {
		entityMap.set(entity.id, entity);
		relationshipMap.nodes.push(entity.id);

		// Extract location references
		const locations: EntityId[] = [];
		for (const link of entity.links || []) {
			if (link.targetType === 'location') {
				locations.push(link.targetId);
			}

			// Add to relationship map
			if (link.sourceId && link.targetId) {
				const relationship: string = link.relationship || 'related_to';
				relationshipMap.edges.push({
					source: link.sourceId,
					target: link.targetId,
					relationship
				});
			}
		}
		if (locations.length > 0) {
			locationsByEntity.set(entity.id, locations);
		}

		// Build name mention index
		const normalizeName = (name: string) => name.toLowerCase().trim();
		const fullName = normalizeName(entity.name);

		if (!mentionedNames.has(fullName)) {
			mentionedNames.set(fullName, []);
		}
		mentionedNames.get(fullName)!.push(entity.id);

		// Also index partial names (first name, last name)
		const nameParts = entity.name.split(' ').filter((part) => part.length > 2);
		for (const part of nameParts) {
			const normalizedPart = normalizeName(part);
			if (!mentionedNames.has(normalizedPart)) {
				mentionedNames.set(normalizedPart, []);
			}
			if (!mentionedNames.get(normalizedPart)!.includes(entity.id)) {
				mentionedNames.get(normalizedPart)!.push(entity.id);
			}
		}
	}

	return {
		entities,
		entityMap,
		relationshipMap,
		locationsByEntity,
		mentionedNames
	};
}

/**
 * Create a unique key for a suggestion (for deduplication)
 */
function getSuggestionKey(suggestion: Partial<AISuggestion>): string {
	const ids = [...suggestion.affectedEntityIds!].sort().join(',');
	const titleNorm = suggestion.title!.toLowerCase().replace(/[^a-z0-9]/g, '');
	return `${ids}:${titleNorm}`;
}

// Type alias for a single suggestion item
type SuggestionItem = FullAnalysisResult['results'][0]['suggestions'][0];

/**
 * Deduplicate suggestions, keeping highest relevance score
 */
function deduplicateSuggestions(
	suggestions: SuggestionItem[]
): SuggestionItem[] {
	const seen = new Map<string, SuggestionItem>();

	for (const suggestion of suggestions) {
		const key = getSuggestionKey(suggestion);
		const existing = seen.get(key);

		if (!existing || suggestion.relevanceScore > existing.relevanceScore) {
			seen.set(key, suggestion);
		}
	}

	return Array.from(seen.values());
}

/**
 * Convert analyzer suggestions to full AISuggestion objects with IDs and timestamps
 */
function toFullSuggestions(
	suggestions: Omit<AISuggestion, 'id' | 'status' | 'createdAt' | 'expiresAt'>[],
	expirationDays: number
): AISuggestion[] {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

	return suggestions.map((s) => ({
		...s,
		id: crypto.randomUUID(),
		status: 'pending' as const,
		createdAt: now,
		expiresAt
	}));
}

/**
 * Suggestion Analysis Service
 */
export const suggestionAnalysisService = {
	/**
	 * Get configuration with optional overrides
	 */
	getConfig(overrides?: Partial<AnalysisConfig>): AnalysisConfig {
		return {
			...DEFAULT_CONFIG,
			...overrides
		};
	},

	/**
	 * Run full analysis across all entities and all analyzers
	 */
	async runFullAnalysis(
		configOverrides?: Partial<AnalysisConfig>
	): Promise<FullAnalysisResult> {
		const config = this.getConfig(configOverrides);
		const startTime = Date.now();

		// Load all entities
		const entities = await new Promise<BaseEntity[]>((resolve) => {
			const unsubscribe = entityRepository.getAll().subscribe((data) => {
				resolve(data);
				unsubscribe.unsubscribe();
			});
		});

		// Build analysis context
		const context = buildContext(entities);

		// Run all analyzers
		const results: FullAnalysisResult['results'] = [];
		const errors: string[] = [];
		let totalApiCalls = 0;
		let totalAnalyzerTime = 0;

		// Run each analyzer with error handling
		const analyzers = [
			inconsistencyAnalyzer,
			enhancementAnalyzer,
			relationshipAnalyzer,
			plotThreadAnalyzer
		];

		for (const analyzer of analyzers) {
			try {
				const result = await analyzer.analyze(context, config);
				results.push(result);
				totalApiCalls += result.apiCallsMade;
			totalAnalyzerTime += result.analysisTimeMs;
			} catch (error: any) {
				errors.push(
					`${analyzer.type} analyzer failed: ${error?.message || String(error)}`
				);
				// Add empty result for failed analyzer
				results.push({
					type: analyzer.type,
					suggestions: [],
					analysisTimeMs: 0,
					apiCallsMade: 0
				});
			}
		}

		// Deduplicate suggestions across all analyzers
		const allSuggestions = results.flatMap((r) => r.suggestions);
		const uniqueSuggestions = deduplicateSuggestions(allSuggestions);

		// Convert to full suggestions with IDs and store
		const fullSuggestions = toFullSuggestions(uniqueSuggestions, config.expirationDays);
		if (fullSuggestions.length > 0) {
			await suggestionRepository.bulkAdd(fullSuggestions);
		}

		return {
			results,
			totalSuggestions: fullSuggestions.length,
			totalApiCalls,
			totalTimeMs: totalAnalyzerTime,
			errors
		};
	},

	/**
	 * Analyze a single entity and return relevant suggestions
	 */
	async analyzeEntity(
		entityId: EntityId,
		configOverrides?: Partial<AnalysisConfig>
	): Promise<FullAnalysisResult> {
		const config = this.getConfig(configOverrides);
		const startTime = Date.now();

		// Get the target entity
		const targetEntity = await entityRepository.getById(entityId);
		if (!targetEntity) {
			throw new Error(`Entity with id ${entityId} not found`);
		}

		// Load all entities (needed for context)
		const entities = await new Promise<BaseEntity[]>((resolve) => {
			const unsubscribe = entityRepository.getAll().subscribe((data) => {
				resolve(data);
				unsubscribe.unsubscribe();
			});
		});

		// Build analysis context
		const context = buildContext(entities);

		// Run all analyzers
		let totalAnalyzerTime = 0;
		const results: FullAnalysisResult['results'] = [];
		const errors: string[] = [];
		let totalApiCalls = 0;

		const analyzers = [
			inconsistencyAnalyzer,
			enhancementAnalyzer,
			relationshipAnalyzer,
			plotThreadAnalyzer
		];

		for (const analyzer of analyzers) {
			try {
				const result = await analyzer.analyze(context, config);

				// Filter suggestions to only include those affecting the target entity
				totalAnalyzerTime += result.analysisTimeMs;
				const filteredSuggestions = result.suggestions.filter((s) =>
					s.affectedEntityIds.includes(entityId)
				);

				results.push({
					...result,
					suggestions: filteredSuggestions
				});
				totalApiCalls += result.apiCallsMade;
			} catch (error: any) {
				errors.push(
					`${analyzer.type} analyzer failed: ${error?.message || String(error)}`
				);
				results.push({
					type: analyzer.type,
					suggestions: [],
					analysisTimeMs: 0,
					apiCallsMade: 0
				});
			}
		}

		// Collect all suggestions
		const allSuggestions = results.flatMap((r) => r.suggestions);

		// Sort results to put non-empty ones first (for easier access in tests/UI)
		const sortedResults = [...results].sort((a, b) => b.suggestions.length - a.suggestions.length);

		return {
			results: sortedResults,
			totalSuggestions: allSuggestions.length,
			totalApiCalls,
			totalTimeMs: totalAnalyzerTime,
			errors
		};
	},

	/**
	 * Determine if analysis should run based on current state
	 */
	async shouldRunAnalysis(): Promise<boolean> {
		// Get current suggestion stats
		const stats = await suggestionRepository.getStats();

		// Run if no suggestions exist
		if (stats.total === 0) {
			return true;
		}

		// Run if all suggestions are expired
		if (stats.expiredCount === stats.total) {
			return true;
		}

		// Run if no pending suggestions remain
		if (stats.byStatus.pending === 0) {
			return true;
		}

		// Otherwise, don't run (user has active suggestions to review)
		return false;
	}
};
