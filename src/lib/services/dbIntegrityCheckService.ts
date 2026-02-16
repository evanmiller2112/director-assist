/**
 * Database Integrity Check Service (Issue #511)
 *
 * Provides functions to check database integrity on app startup:
 * - Fresh database detection (skip checks on empty DB)
 * - Table existence validation
 * - Sample-based entity validation
 * - Active campaign validation
 * - Referential integrity checks (dangling link detection)
 */

import type { DMAssistantDB } from '$lib/db';
import type { IntegrityIssue, IntegrityCheckResult, EntityLink, BaseEntity } from '$lib/types';
import type { Table } from 'dexie';

export interface IntegrityCheckConfig {
	sampleSize?: number; // default: 5
	referentialSampleSize?: number; // default: 10
	entityValidator?: (entity: unknown) => boolean;
}

// Expected table names based on database schema version 11
const EXPECTED_TABLES = [
	'entities',
	'campaign',
	'conversations',
	'chatMessages',
	'suggestions',
	'appConfig',
	'relationshipSummaryCache',
	'combatSessions',
	'montageSessions',
	'negotiationSessions',
	'respiteSessions',
	'creatureTemplates',
	'fieldSuggestions'
];

/**
 * Check if database is fresh (empty, no need to run integrity checks)
 */
export async function isFreshDatabase(db: DMAssistantDB): Promise<boolean> {
	const entityCount = await db.entities.count();
	const messageCount = await db.chatMessages.count();

	return entityCount === 0 && messageCount === 0;
}

/**
 * Check that all expected tables exist in the database
 */
export async function checkTableExistence(db: DMAssistantDB): Promise<IntegrityIssue[]> {
	const issues: IntegrityIssue[] = [];
	const actualTables = db.tables.map((t: Table) => t.name);

	for (const expectedTable of EXPECTED_TABLES) {
		if (!actualTables.includes(expectedTable)) {
			issues.push({
				type: 'table_existence',
				severity: 'major',
				message: `Expected table "${expectedTable}" is missing from database`,
				details: { tableName: expectedTable }
			});
		}
	}

	return issues;
}

/**
 * Default entity validator - checks for required fields
 */
function defaultEntityValidator(entity: unknown): boolean {
	if (!entity || typeof entity !== 'object') {
		return false;
	}

	const e = entity as Record<string, unknown>;

	// Check required fields
	if (typeof e.id !== 'string' || !e.id) {
		return false;
	}

	if (typeof e.type !== 'string' || !e.type) {
		return false;
	}

	if (typeof e.name !== 'string' || !e.name) {
		return false;
	}

	if (!Array.isArray(e.links)) {
		return false;
	}

	return true;
}

/**
 * Validate a sample of entities for data integrity
 */
export async function checkSampleValidation(
	db: DMAssistantDB,
	sampleSize: number,
	entityValidator?: (entity: unknown) => boolean
): Promise<IntegrityIssue[]> {
	const issues: IntegrityIssue[] = [];
	const validator = entityValidator || defaultEntityValidator;

	// Get a sample of entities
	const sample = await db.entities.limit(sampleSize).toArray();

	if (sample.length === 0) {
		return issues;
	}

	const invalidEntities: { id: string; missingFields: string[] }[] = [];

	for (const entity of sample) {
		if (!validator(entity)) {
			// Check which specific fields are missing
			const missingFields: string[] = [];
			if (!entity.id || typeof entity.id !== 'string') missingFields.push('id');
			if (!entity.type || typeof entity.type !== 'string') missingFields.push('type');
			if (!entity.name || typeof entity.name !== 'string') missingFields.push('name');
			if (!Array.isArray(entity.links)) missingFields.push('links');

			invalidEntities.push({
				id: entity.id || 'unknown',
				missingFields
			});
		}
	}

	// Determine severity based on percentage of invalid entities
	// Use major severity if > 50% invalid AND we have a meaningful sample size (at least 2 invalid)
	const invalidPercentage = sample.length > 0 ? invalidEntities.length / sample.length : 0;
	const severity = invalidPercentage > 0.5 && invalidEntities.length >= 2 ? 'major' : 'minor';

	// Create one issue per invalid entity
	for (const invalidEntity of invalidEntities) {
		issues.push({
			type: 'sample_validation',
			severity,
			message: `Entity validation failed - missing or invalid fields: ${invalidEntity.missingFields.join(', ')}`,
			details: {
				entityId: invalidEntity.id,
				missingFields: invalidEntity.missingFields
			}
		});
	}

	return issues;
}

/**
 * Check active campaign configuration
 */
export async function checkActiveCampaign(db: DMAssistantDB): Promise<IntegrityIssue[]> {
	const issues: IntegrityIssue[] = [];

	// Get active campaign ID from config
	const activeCampaignConfig = await db.appConfig.get('activeCampaignId');
	const activeCampaignId = activeCampaignConfig?.value as string | undefined;

	// Check if database is fresh (but only if no active campaign is set)
	if (!activeCampaignId) {
		const fresh = await isFreshDatabase(db);
		if (fresh) {
			return issues; // No issues for fresh database with no active campaign
		}
	}

	// Get all campaigns
	const campaigns = await db.entities.where('type').equals('campaign').toArray();

	// Check if there are any entities at all
	const totalEntities = await db.entities.count();

	// Case 1: Active campaign is set - verify it exists and is valid (check this first!)
	if (activeCampaignId) {
		const activeEntity = await db.entities.get(activeCampaignId);

		if (!activeEntity) {
			issues.push({
				type: 'active_campaign',
				severity: 'minor',
				message: `Active campaign "${activeCampaignId}" does not exist`,
				details: { activeCampaignId }
			});
			return issues;
		} else if (activeEntity.type !== 'campaign') {
			issues.push({
				type: 'active_campaign',
				severity: 'minor',
				message: `Active campaign "${activeCampaignId}" is not a campaign entity (type: ${activeEntity.type})`,
				details: {
					activeCampaignId,
					actualType: activeEntity.type
				}
			});
			return issues;
		}

		// Active campaign is valid
		return issues;
	}

	// Case 2: Database has entities but no campaigns exist
	if (campaigns.length === 0 && totalEntities > 0) {
		issues.push({
			type: 'active_campaign',
			severity: 'major',
			message: 'No campaigns exist in database but other entities do',
			details: { totalEntities }
		});
		return issues;
	}

	// Case 3: Campaigns exist but no active campaign is set
	if (!activeCampaignId && campaigns.length > 0) {
		issues.push({
			type: 'active_campaign',
			severity: 'minor',
			message: 'No active campaign set but campaigns exist',
			details: { availableCampaigns: campaigns.length }
		});
		return issues;
	}

	return issues;
}

/**
 * Check referential integrity of entity links
 */
export async function checkReferentialIntegrity(
	db: DMAssistantDB,
	sampleSize: number
): Promise<IntegrityIssue[]> {
	const issues: IntegrityIssue[] = [];

	// Get a sample of entities
	const sample = await db.entities.limit(sampleSize).toArray();

	if (sample.length === 0) {
		return issues;
	}

	// Collect all dangling references first, then determine severity
	const danglingRefs: {
		sourceId: string;
		sourceName: string;
		targetId: string;
		relationship: string;
	}[] = [];
	let totalLinks = 0;

	for (const entity of sample) {
		if (!entity.links || entity.links.length === 0) {
			continue;
		}

		// Collect all target IDs from this entity's links
		const targetIds = entity.links.map((link: EntityLink) => link.targetId);
		totalLinks += targetIds.length;

		// Batch check if all targets exist
		const existingTargets = await db.entities.where('id').anyOf(targetIds).toArray();
		const existingTargetIds = new Set(existingTargets.map((t: BaseEntity) => t.id));

		// Check each link
		for (const link of entity.links) {
			if (!existingTargetIds.has(link.targetId)) {
				danglingRefs.push({
					sourceId: entity.id,
					sourceName: entity.name,
					targetId: link.targetId,
					relationship: link.relationship
				});
			}
		}
	}

	// Determine severity based on percentage of dangling links
	// Use major severity if >= 30% of links are dangling AND we have a meaningful sample size
	const danglingPercentage = totalLinks > 0 ? danglingRefs.length / totalLinks : 0;
	const severity = danglingPercentage >= 0.3 && danglingRefs.length >= 3 ? 'major' : 'minor';

	// Create issues for all dangling references
	for (const ref of danglingRefs) {
		issues.push({
			type: 'referential_integrity',
			severity,
			message: `Entity "${ref.sourceName}" has dangling reference to non-existent entity "${ref.targetId}"`,
			details: {
				sourceId: ref.sourceId,
				sourceName: ref.sourceName,
				targetId: ref.targetId,
				relationship: ref.relationship
			}
		});
	}

	return issues;
}

/**
 * Run all integrity checks and return combined result
 */
export async function runIntegrityCheck(
	db: DMAssistantDB,
	config?: IntegrityCheckConfig
): Promise<IntegrityCheckResult> {
	const startTime = performance.now();
	const checkedAt = new Date();

	// Default config values
	const sampleSize = config?.sampleSize ?? 5;
	const referentialSampleSize = config?.referentialSampleSize ?? 10;

	// Check if database is fresh - skip checks if so
	const fresh = await isFreshDatabase(db);

	if (fresh) {
		const durationMs = Math.round(performance.now() - startTime);
		return {
			completed: true,
			checkedAt,
			durationMs,
			issues: [],
			skipped: true,
			hasMinorIssues: false,
			hasMajorIssues: false
		};
	}

	// Run all checks
	const allIssues: IntegrityIssue[] = [];

	const tableIssues = await checkTableExistence(db);
	allIssues.push(...tableIssues);

	const sampleIssues = await checkSampleValidation(db, sampleSize, config?.entityValidator);
	allIssues.push(...sampleIssues);

	const campaignIssues = await checkActiveCampaign(db);
	allIssues.push(...campaignIssues);

	const referentialIssues = await checkReferentialIntegrity(db, referentialSampleSize);
	allIssues.push(...referentialIssues);

	const durationMs = Math.round(performance.now() - startTime);

	// Determine if there are minor or major issues
	const hasMinorIssues = allIssues.some((issue) => issue.severity === 'minor');
	const hasMajorIssues = allIssues.some((issue) => issue.severity === 'major');

	return {
		completed: true,
		checkedAt,
		durationMs,
		issues: allIssues,
		skipped: false,
		hasMinorIssues,
		hasMajorIssues
	};
}
