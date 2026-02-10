/**
 * Scene Status Service
 *
 * Manages scene status transitions and lifecycle for Issue #292: Scene Runner Mode
 * - Starting a scene (planned → in_progress)
 * - Completing a scene (in_progress → completed)
 * - Querying scenes by status
 */

import { entityRepository } from '$lib/db/entityRepository';
import { db } from '$lib/db';
import { campaignStore } from '$lib/stores';
import type { BaseEntity } from '$lib/types';
import { createFromScene } from '$lib/services/narrativeEventService';

/**
 * Start a scene - sets sceneStatus to 'in_progress' and updates startedAt timestamp
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
			sceneStatus: 'in_progress',
			startedAt: new Date().toISOString()
		}
	});
}

/**
 * Complete a scene - sets sceneStatus to 'completed' and updates completedAt timestamp
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
			sceneStatus: 'completed',
			completedAt: new Date().toISOString(),
			whatHappened
		}
	});

	// Create narrative event from completed scene
	// Use try/catch so narrative event creation failure doesn't block scene completion
	try {
		await createFromScene(sceneId);
	} catch (error) {
		console.error('Failed to create narrative event for scene:', error);
	}
}

/**
 * Get all in-progress scenes for the current campaign
 *
 * @returns Array of scene entities with sceneStatus 'in_progress'
 */
export async function getActiveScenes(): Promise<BaseEntity[]> {
	const allEntities = await db.entities.toArray();
	const currentCampaignId = campaignStore.campaign?.id;

	return allEntities.filter(entity =>
		entity.type === 'scene' &&
		(entity.fields.sceneStatus as string) === 'in_progress' &&
		(entity.metadata as { campaignId?: string })?.campaignId === currentCampaignId
	);
}

/**
 * Get scenes filtered by status for the current campaign
 *
 * @param status - The status to filter by ('planned', 'in_progress', 'completed')
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

		// Treat missing sceneStatus field as 'planned'
		const entityStatus = (entity.fields.sceneStatus as string | undefined) ?? 'planned';
		return entityStatus === status;
	});
}
