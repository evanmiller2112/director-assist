/**
 * Database Recovery Service (Issue #511)
 *
 * Provides recovery actions for database integrity issues:
 * - repairDatabase: Automatically fix minor issues
 * - resetDatabase: Nuclear option - clear all data
 */

import type { DMAssistantDB } from '$lib/db';
import type { IntegrityIssue, EntityLink, BaseEntity } from '$lib/types';

/**
 * Repair database by fixing issues automatically
 *
 * Handles:
 * - Referential integrity: Remove dangling links
 * - Active campaign: Reset to first valid campaign
 *
 * @param db - Database instance
 * @param issues - List of integrity issues to repair
 * @returns Number of repairs made
 */
export async function repairDatabase(
	db: DMAssistantDB,
	issues: IntegrityIssue[]
): Promise<number> {
	let repairCount = 0;

	// Group issues by type for efficient processing
	const referentialIssues = issues.filter((i) => i.type === 'referential_integrity');
	const activeCampaignIssues = issues.filter((i) => i.type === 'active_campaign');

	// Repair referential integrity issues (remove dangling links)
	if (referentialIssues.length > 0) {
		// Group by source entity
		const issuesBySource = new Map<string, string[]>();

		for (const issue of referentialIssues) {
			if (!issue.details?.sourceId || !issue.details?.targetId) {
				continue;
			}

			const sourceId = issue.details.sourceId as string;
			const targetId = issue.details.targetId as string;

			if (!issuesBySource.has(sourceId)) {
				issuesBySource.set(sourceId, []);
			}
			issuesBySource.get(sourceId)!.push(targetId);
		}

		// Process each entity with dangling links
		for (const [sourceId, danglingTargetIds] of Array.from(issuesBySource.entries())) {
			const entity = await db.entities.get(sourceId);

			if (!entity || !entity.links) {
				continue;
			}

			// Remove dangling links
			const originalLinkCount = entity.links.length;
			const validLinks = entity.links.filter((link: EntityLink) => !danglingTargetIds.includes(link.targetId));

			if (validLinks.length < originalLinkCount) {
				await db.entities.update(sourceId, { links: validLinks });
				repairCount += originalLinkCount - validLinks.length;
			}
		}
	}

	// Repair active campaign issues
	if (activeCampaignIssues.length > 0) {
		// Get first available campaign
		const campaigns = await db.entities.where('type').equals('campaign').toArray();

		if (campaigns.length > 0) {
			// Sort by createdAt to get the first/oldest campaign
			campaigns.sort((a: BaseEntity, b: BaseEntity) => {
				const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
				const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
				return aTime - bTime;
			});

			const firstCampaign = campaigns[0];

			// Update or set active campaign
			await db.appConfig.put({
				key: 'activeCampaignId',
				value: firstCampaign.id
			});

			repairCount++;
		}
		// If no campaigns exist, we can't repair (major issue - needs manual intervention)
	}

	return repairCount;
}

/**
 * Reset database by clearing all tables
 *
 * WARNING: This is destructive and will delete ALL data
 *
 * @param db - Database instance
 */
export async function resetDatabase(db: DMAssistantDB): Promise<void> {
	// Clear all tables
	await Promise.all([
		db.entities.clear(),
		db.campaign.clear(),
		db.conversations.clear(),
		db.chatMessages.clear(),
		db.suggestions.clear(),
		db.appConfig.clear(),
		db.relationshipSummaryCache.clear(),
		db.combatSessions.clear(),
		db.montageSessions.clear(),
		db.negotiationSessions.clear(),
		db.respiteSessions.clear(),
		db.creatureTemplates.clear(),
		db.fieldSuggestions.clear()
	]);
}
