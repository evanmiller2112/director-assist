/**
 * Scene Status Service
 *
 * Manages scene status transitions and lifecycle for Issue #292: Scene Runner Mode
 * - Starting a scene (planned → active)
 * - Completing a scene (active → completed)
 * - Querying scenes by status
 */

import { entityRepository } from '$lib/db/entityRepository';
import { db } from '$lib/db';
import { campaignStore } from '$lib/stores';
import type { BaseEntity } from '$lib/types';

/**
 * Start a scene - sets status to 'active' and updates startedAt timestamp
 *
 * @param sceneId - The ID of the scene to start
 * @throws Error if scene not found or entity is not a scene
 */
export async function startScene(sceneId: string): Promise<void> {
	const entity = await entityRepository.getById(sceneId);

	if (!entity) {
		throw new Error('Scene not found');
	}

	if (entity.type !== 'scene') {
		throw new Error('Entity is not a scene');
	}

	await entityRepository.update(sceneId, {
		fields: {
			...entity.fields,
			status: 'active',
			startedAt: new Date().toISOString()
		}
	});
}

/**
 * Complete a scene - sets status to 'completed' and updates completedAt timestamp
 *
 * @param sceneId - The ID of the scene to complete
 * @param notes - Optional completion notes to save in whatHappened field
 * @throws Error if scene not found
 */
export async function completeScene(sceneId: string, notes?: string): Promise<void> {
	const entity = await entityRepository.getById(sceneId);

	if (!entity) {
		throw new Error('Scene not found');
	}

	const whatHappened = notes ?? (entity.fields.whatHappened as string | undefined);

	await entityRepository.update(sceneId, {
		fields: {
			...entity.fields,
			status: 'completed',
			completedAt: new Date().toISOString(),
			whatHappened
		}
	});
}

/**
 * Get all active scenes for the current campaign
 *
 * @returns Array of scene entities with status 'active'
 */
export async function getActiveScenes(): Promise<BaseEntity[]> {
	const allEntities = await db.entities.toArray();
	const currentCampaignId = campaignStore.campaign?.id;

	return allEntities.filter(entity =>
		entity.type === 'scene' &&
		(entity.fields.status as string) === 'active' &&
		(entity.metadata as { campaignId?: string })?.campaignId === currentCampaignId
	);
}

/**
 * Get scenes filtered by status for the current campaign
 *
 * @param status - The status to filter by ('planned', 'active', 'completed')
 * @returns Array of scene entities matching the status
 */
export async function getScenesByStatus(status: string): Promise<BaseEntity[]> {
	const allEntities = await db.entities.toArray();
	const currentCampaignId = campaignStore.campaign?.id;

	return allEntities.filter(entity => {
		if (entity.type !== 'scene') return false;

		// Filter by campaign
		if ((entity.metadata as { campaignId?: string })?.campaignId !== currentCampaignId) {
			return false;
		}

		// Treat missing status field as 'planned'
		const entityStatus = (entity.fields.status as string | undefined) ?? 'planned';
		return entityStatus === status;
	});
}
