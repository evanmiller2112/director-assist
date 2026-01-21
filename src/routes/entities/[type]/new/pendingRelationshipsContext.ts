/**
 * Utility for building relationship context from pending relationships
 * Issue #232: Strengthen relationship inclusion during AI calls
 *
 * This module provides functionality to build privacy-safe relationship context
 * from pending relationships that haven't been saved yet. Used in the new entity form.
 */

import type { PendingRelationship } from '$lib/types';
import { entitiesStore } from '$lib/stores';
import { buildPrivacySafeSummary } from '$lib/services/relationshipContextBuilder';

/**
 * Build relationship context string from pending relationships.
 *
 * This function:
 * - Takes an array of pending relationships
 * - Fetches target entities via entitiesStore.getById()
 * - Builds privacy-safe summaries using buildPrivacySafeSummary()
 * - Returns a formatted string with relationship information
 *
 * Format:
 * ```
 * Related entities:
 * - EntityName (relationship label): privacy-safe summary
 * - AnotherEntity (different relationship): another summary
 * ```
 *
 * @param relationships - Array of pending relationships
 * @returns Formatted relationship context string, or empty string if no valid relationships
 */
export function buildPendingRelationshipsContext(relationships: PendingRelationship[]): string {
	// Return empty string for empty array
	if (relationships.length === 0) {
		return '';
	}

	// Collect valid relationship entries
	const entries: string[] = [];

	for (const rel of relationships) {
		// Fetch target entity
		const targetEntity = entitiesStore.getById(rel.targetId);

		// Skip if entity doesn't exist (deleted or invalid)
		if (!targetEntity) {
			continue;
		}

		// Build privacy-safe summary
		const summary = buildPrivacySafeSummary(targetEntity);

		// Format relationship label (convert underscores to spaces)
		const formattedLabel = rel.relationship.replace(/_/g, ' ');

		// Build entry: - EntityName (relationship): summary
		const entry = `- ${targetEntity.name} (${formattedLabel}): ${summary}`;
		entries.push(entry);
	}

	// If no valid entries, return empty string
	if (entries.length === 0) {
		return '';
	}

	// Build final string with header
	return 'Related entities:\n' + entries.join('\n');
}
