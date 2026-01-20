/**
 * Plot Thread Analyzer
 *
 * Identifies recurring narrative themes and story threads:
 * - Groups entities by shared tags/keywords/themes
 * - Uses AI to analyze groups of 3+ related entities for plot patterns
 * - Detects unresolved conflicts, mysteries, recurring motifs
 * - Suggests narrative connections that span multiple entities
 */

import { generate } from '$lib/ai/client';
import type { EntityId } from '$lib/types';
import type {
	AnalysisConfig,
	AnalysisResult,
	EntityAnalysisContext,
	SuggestionAnalyzer
} from './types';

/**
 * Extract keywords from text for theme grouping
 */
function extractKeywords(text: string): string[] {
	const normalized = text.toLowerCase();
	const words = normalized.match(/\b[a-z]{4,}\b/g) || [];

	// Filter out common words
	const stopWords = new Set([
		'this',
		'that',
		'with',
		'from',
		'have',
		'been',
		'were',
		'will',
		'their',
		'there',
		'what',
		'when',
		'where',
		'which',
		'while',
		'about',
		'after',
		'before',
		'between',
		'through'
	]);

	return words.filter((word) => !stopWords.has(word));
}

/**
 * Group entities by shared themes (tags or keywords)
 */
function groupEntitiesByTheme(context: EntityAnalysisContext): Map<string, EntityId[]> {
	const themeGroups = new Map<string, Set<EntityId>>();

	for (const entity of context.entities) {
		// Group by tags
		for (const tag of entity.tags || []) {
			const normalizedTag = tag.toLowerCase().trim();
			if (!themeGroups.has(normalizedTag)) {
				themeGroups.set(normalizedTag, new Set());
			}
			themeGroups.get(normalizedTag)!.add(entity.id);
		}

		// Group by keywords in description
		const keywords = extractKeywords(entity.description || '');
		for (const keyword of keywords) {
			if (!themeGroups.has(keyword)) {
				themeGroups.set(keyword, new Set());
			}
			themeGroups.get(keyword)!.add(entity.id);
		}
	}

	// Convert sets to arrays and filter for groups with 3+ entities
	const result = new Map<string, EntityId[]>();
	for (const [theme, entityIds] of themeGroups) {
		if (entityIds.size >= 3) {
			result.set(theme, Array.from(entityIds));
		}
	}

	return result;
}

/**
 * Calculate relevance score based on group characteristics
 */
function calculatePlotThreadScore(
	groupSize: number,
	connectionCount: number,
	context: EntityAnalysisContext,
	entityIds: EntityId[]
): number {
	let score = 40; // Base score

	// Larger groups suggest more significant plot threads
	if (groupSize >= 5) {
		score += 20;
	} else if (groupSize >= 3) {
		score += 10;
	}

	// Higher interconnectivity suggests stronger plot thread
	const avgConnectionsPerEntity = connectionCount / groupSize;
	if (avgConnectionsPerEntity >= 2) {
		score += 20;
	} else if (avgConnectionsPerEntity >= 1) {
		score += 10;
	}

	// Check if entities include important types
	const entities = entityIds.map((id) => context.entityMap.get(id)).filter(Boolean);
	const hasCharacter = entities.some((e) => e?.type === 'character');
	const hasFaction = entities.some((e) => e?.type === 'faction');

	if (hasCharacter) score += 10;
	if (hasFaction) score += 5;

	return Math.min(score, 100);
}

/**
 * Count relationships within a group of entities
 */
function countGroupConnections(entityIds: EntityId[], context: EntityAnalysisContext): number {
	const entitySet = new Set(entityIds);
	return context.relationshipMap.edges.filter(
		(edge) => entitySet.has(edge.source) && entitySet.has(edge.target)
	).length;
}

/**
 * Sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse AI response for plot thread information
 */
function parsePlotThreadResponse(response: string): { title: string; description: string } {
	// Try to extract title and description
	const lines = response.split('\n').filter((line) => line.trim());

	// Look for "Plot Thread:" prefix
	const titleLine = lines.find((line) => line.toLowerCase().includes('plot thread:'));
	let title = 'Plot Thread Detected';
	let description = response;

	if (titleLine) {
		title = titleLine.replace(/plot thread:/i, '').trim();
		// Rest is description
		const titleIndex = lines.indexOf(titleLine);
		description = lines.slice(titleIndex + 1).join(' ').trim();
	} else if (lines.length > 0) {
		// Use first line as title, rest as description
		title = lines[0].trim();
		description = lines.slice(1).join(' ').trim() || lines[0];
	}

	// Clean up title
	if (title.length > 80) {
		title = title.substring(0, 77) + '...';
	}

	return { title, description };
}

/**
 * Plot Thread Analyzer implementation
 */
export const plotThreadAnalyzer: SuggestionAnalyzer = {
	type: 'plot_thread',

	async analyze(
		context: EntityAnalysisContext,
		config: AnalysisConfig
	): Promise<AnalysisResult> {
		const startTime = Date.now();
		const suggestions: AnalysisResult['suggestions'] = [];
		let apiCallsMade = 0;

		// Skip if AI analysis is disabled
		if (!config.enableAIAnalysis) {
			return {
				type: 'plot_thread',
				suggestions: [],
				analysisTimeMs: Date.now() - startTime,
				apiCallsMade: 0
			};
		}

		// Group entities by themes
		const themeGroups = groupEntitiesByTheme(context);

		// Limit number of groups to analyze (avoid too many API calls)
		const maxGroups = Math.min(themeGroups.size, 10);
		const groupsToAnalyze = Array.from(themeGroups.entries())
			.sort((a, b) => b[1].length - a[1].length) // Prioritize larger groups
			.slice(0, maxGroups);

		for (const [theme, entityIds] of groupsToAnalyze) {
			// Only analyze groups with 3+ entities
			if (entityIds.length < 3) continue;

			// Limit group size for AI analysis (too many entities = too much context)
			const analyzedEntityIds = entityIds.slice(0, 8);
			const entities = analyzedEntityIds
				.map((id) => context.entityMap.get(id))
				.filter((e): e is NonNullable<typeof e> => e !== undefined);

			if (entities.length < 3) continue;

			try {
				// Build context for AI
				const entityDescriptions = entities
					.map((e) => {
						const summary = e.summary || e.description || 'No description';
						return `- ${e.name} (${e.type}): ${summary.substring(0, 200)}`;
					})
					.join('\n');

				const prompt = `Analyze these entities that share the theme "${theme}" and identify if they form a plot thread or narrative pattern:

${entityDescriptions}

If these entities form a coherent plot thread, recurring theme, or narrative arc, respond with:
"Plot Thread: [Title]

[1-2 sentence description of the plot thread, conflict, or pattern]"

If they don't form a meaningful plot thread, respond with "NO".`;

				const result = await generate(prompt, { temperature: 0.4 });
				apiCallsMade++;

				if (result.success && result.content && !result.content.toLowerCase().startsWith('no')) {
					const { title, description } = parsePlotThreadResponse(result.content);

					const connectionCount = countGroupConnections(analyzedEntityIds, context);
					const score = calculatePlotThreadScore(
						analyzedEntityIds.length,
						connectionCount,
						context,
						analyzedEntityIds
					);

					suggestions.push({
						type: 'plot_thread',
						title,
						description,
						relevanceScore: score,
						affectedEntityIds: analyzedEntityIds,
						suggestedAction: {
							actionType: 'flag-for-review',
							actionData: {
								theme,
								entityCount: analyzedEntityIds.length
							}
						}
					});
				}

				// Rate limiting
				if (apiCallsMade < groupsToAnalyze.length) {
					await sleep(config.rateLimitMs);
				}
			} catch (error) {
				// Silently continue on AI errors
				console.error('Plot thread analysis error:', error);
			}

			// Stop if we've reached the suggestion limit
			if (suggestions.length >= config.maxSuggestionsPerType) {
				break;
			}
		}

		// Filter by minimum relevance score and limit suggestions
		const filteredSuggestions = suggestions
			.filter((s) => s.relevanceScore >= config.minRelevanceScore)
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, config.maxSuggestionsPerType);

		return {
			type: 'plot_thread',
			suggestions: filteredSuggestions,
			analysisTimeMs: Date.now() - startTime,
			apiCallsMade
		};
	}
};
