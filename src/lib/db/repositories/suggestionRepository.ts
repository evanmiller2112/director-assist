import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { AISuggestion, AISuggestionType, AISuggestionStatus, SuggestionQueryFilters, SuggestionStats } from '$lib/types';

export const suggestionRepository = {
	// ============================================================================
	// CRUD Operations
	// ============================================================================

	/**
	 * Add a new suggestion to the database
	 */
	async add(suggestion: AISuggestion): Promise<void> {
		await ensureDbReady();
		await db.suggestions.add(suggestion);
	},

	/**
	 * Get a suggestion by ID
	 */
	async getById(id: string): Promise<AISuggestion | undefined> {
		await ensureDbReady();
		return await db.suggestions.get(id);
	},

	/**
	 * Get all suggestions as a live query
	 */
	getAll(): Observable<AISuggestion[]> {
		return liveQuery(() => db.suggestions.toArray());
	},

	/**
	 * Update a suggestion with partial changes
	 */
	async update(id: string, changes: Partial<AISuggestion>): Promise<void> {
		await ensureDbReady();

		// Check if suggestion exists
		const existing = await db.suggestions.get(id);
		if (!existing) {
			throw new Error(`Suggestion with id ${id} not found`);
		}

		await db.suggestions.update(id, changes);
	},

	/**
	 * Delete a suggestion by ID
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.suggestions.delete(id);
	},

	/**
	 * Clear all suggestions from the database
	 */
	async clearAll(): Promise<void> {
		await ensureDbReady();
		await db.suggestions.clear();
	},

	// ============================================================================
	// Status Management
	// ============================================================================

	/**
	 * Dismiss a suggestion (set status to 'dismissed')
	 */
	async dismiss(id: string): Promise<void> {
		await this.update(id, { status: 'dismissed' });
	},

	/**
	 * Accept a suggestion (set status to 'accepted')
	 */
	async accept(id: string): Promise<void> {
		await this.update(id, { status: 'accepted' });
	},

	/**
	 * Get suggestions by status
	 */
	async getByStatus(status: AISuggestionStatus): Promise<AISuggestion[]> {
		await ensureDbReady();
		return await db.suggestions.where('status').equals(status).toArray();
	},

	/**
	 * Get count of pending suggestions
	 */
	async getPendingCount(): Promise<number> {
		await ensureDbReady();
		return await db.suggestions.where('status').equals('pending').count();
	},

	// ============================================================================
	// Query Operations
	// ============================================================================

	/**
	 * Get suggestions by type
	 */
	async getByType(type: AISuggestionType): Promise<AISuggestion[]> {
		await ensureDbReady();
		return await db.suggestions.where('type').equals(type).toArray();
	},

	/**
	 * Get suggestions that affect a specific entity
	 */
	async getByAffectedEntity(entityId: string): Promise<AISuggestion[]> {
		await ensureDbReady();
		return await db.suggestions
			.where('affectedEntityIds')
			.equals(entityId)
			.toArray();
	},

	/**
	 * Get suggestions that affect any of the specified entities
	 */
	async getByAffectedEntities(entityIds: string[]): Promise<AISuggestion[]> {
		await ensureDbReady();

		// Return empty array for empty input
		if (entityIds.length === 0) {
			return [];
		}

		// Use the multi-entry index to find suggestions
		const suggestions = await db.suggestions
			.where('affectedEntityIds')
			.anyOf(entityIds)
			.toArray();

		// Deduplicate suggestions (a suggestion might match multiple entity IDs)
		const uniqueSuggestions = Array.from(
			new Map(suggestions.map(s => [s.id, s])).values()
		);

		return uniqueSuggestions;
	},

	/**
	 * Query suggestions with multiple filters
	 */
	async query(filters: SuggestionQueryFilters): Promise<AISuggestion[]> {
		await ensureDbReady();

		// Start with all suggestions
		let results = await db.suggestions.toArray();

		// Filter by types
		if (filters.types && filters.types.length > 0) {
			const typeSet = new Set(filters.types);
			results = results.filter(s => typeSet.has(s.type));
		}

		// Filter by statuses
		if (filters.statuses && filters.statuses.length > 0) {
			const statusSet = new Set(filters.statuses);
			results = results.filter(s => statusSet.has(s.status));
		}

		// Filter by affected entity IDs
		if (filters.affectedEntityIds && filters.affectedEntityIds.length > 0) {
			const entityIdSet = new Set(filters.affectedEntityIds);
			results = results.filter(s =>
				s.affectedEntityIds.some(id => entityIdSet.has(id))
			);
		}

		// Filter by minimum relevance score
		if (filters.minRelevanceScore !== undefined) {
			results = results.filter(s => s.relevanceScore >= filters.minRelevanceScore!);
		}

		// Filter out expired suggestions by default
		if (!filters.includeExpired) {
			const now = new Date();
			results = results.filter(s => {
				// Keep suggestions without expiresAt
				if (!s.expiresAt) return true;
				// Keep suggestions that haven't expired yet
				return s.expiresAt.getTime() > now.getTime();
			});
		}

		return results;
	},

	// ============================================================================
	// Expiration Handling
	// ============================================================================

	/**
	 * Get all expired suggestions
	 */
	async getExpired(): Promise<AISuggestion[]> {
		await ensureDbReady();
		const now = new Date();

		return await db.suggestions
			.where('expiresAt')
			.below(now)
			.toArray();
	},

	/**
	 * Delete all expired suggestions
	 */
	async deleteExpired(): Promise<void> {
		await ensureDbReady();
		const now = new Date();

		await db.suggestions
			.where('expiresAt')
			.below(now)
			.delete();
	},

	/**
	 * Check if a suggestion is expired
	 */
	isExpired(suggestion: AISuggestion): boolean {
		if (!suggestion.expiresAt) {
			return false;
		}
		return suggestion.expiresAt.getTime() < new Date().getTime();
	},

	/**
	 * Get active suggestions (pending and not expired)
	 */
	async getActive(): Promise<AISuggestion[]> {
		await ensureDbReady();
		const now = new Date();

		// Get all pending suggestions
		const pending = await db.suggestions
			.where('status')
			.equals('pending')
			.toArray();

		// Filter out expired ones
		return pending.filter(s => {
			// Keep suggestions without expiresAt
			if (!s.expiresAt) return true;
			// Keep suggestions that haven't expired yet
			return s.expiresAt.getTime() > now.getTime();
		});
	},

	// ============================================================================
	// Utility Operations
	// ============================================================================

	/**
	 * Bulk add multiple suggestions
	 */
	async bulkAdd(suggestions: AISuggestion[]): Promise<void> {
		await ensureDbReady();
		await db.suggestions.bulkAdd(suggestions);
	},

	/**
	 * Get statistics about suggestions
	 */
	async getStats(): Promise<SuggestionStats> {
		await ensureDbReady();

		const allSuggestions = await db.suggestions.toArray();
		const now = new Date();

		// Count by status
		const byStatus: Record<AISuggestionStatus, number> = {
			pending: 0,
			accepted: 0,
			dismissed: 0
		};

		// Count by type
		const byType: Record<AISuggestionType, number> = {
			relationship: 0,
			plot_thread: 0,
			inconsistency: 0,
			enhancement: 0,
			recommendation: 0
		};

		let expiredCount = 0;

		// Process all suggestions
		for (const suggestion of allSuggestions) {
			// Count by status
			byStatus[suggestion.status]++;

			// Count by type
			byType[suggestion.type]++;

			// Count expired
			if (suggestion.expiresAt && suggestion.expiresAt.getTime() < now.getTime()) {
				expiredCount++;
			}
		}

		return {
			total: allSuggestions.length,
			byStatus,
			byType,
			expiredCount
		};
	}
};
