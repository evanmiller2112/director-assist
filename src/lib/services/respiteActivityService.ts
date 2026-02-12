/**
 * Respite Activity Service
 *
 * Orchestrates respite activity entity CRUD and respite linking.
 * This service bridges the entity system with the respite system,
 * managing activities as independent entities while maintaining
 * associations with respite sessions.
 */

import { entityRepository } from '$lib/db/repositories';
import { respiteRepository } from '$lib/db/repositories/respiteRepository';
import type { BaseEntity, NewEntity } from '$lib/types';
import type {
	CreateRespiteActivityInput,
	RespiteActivityStatus
} from '$lib/types/respite';

/**
 * Create a respite activity entity and link it to a respite session.
 *
 * @param respiteId - ID of the respite session this activity belongs to
 * @param input - Activity creation data
 * @param campaignId - Campaign ID for the entity
 * @returns The created activity entity
 * @throws Error if respite not found or entity creation fails
 */
export async function createRespiteActivity(
	respiteId: string,
	input: CreateRespiteActivityInput,
	campaignId: string
): Promise<BaseEntity> {
	// Validate respite exists
	const respite = await respiteRepository.getById(respiteId);
	if (!respite) {
		throw new Error(`Respite session ${respiteId} not found`);
	}

	// Create entity via entityRepository
	const newEntity: NewEntity = {
		type: 'respite_activity',
		name: input.name,
		description: input.description || '',
		tags: [],
		fields: {
			activityType: input.activityType,
			heroId: input.heroId || null,
			activityStatus: 'pending' as RespiteActivityStatus,
			progress: null,
			outcome: null
		},
		links: [],
		notes: input.notes || '',
		metadata: {
			campaignId,
			respiteId
		}
	};

	const entity = await entityRepository.create(newEntity);

	// Add entity ID to respite
	await respiteRepository.addActivityId(respiteId, entity.id);

	return entity;
}

/**
 * Delete a respite activity entity and unlink it from the respite session.
 *
 * @param respiteId - ID of the respite session
 * @param activityEntityId - ID of the activity entity to delete
 * @throws Error if respite not found or deletion fails
 */
export async function deleteRespiteActivity(
	respiteId: string,
	activityEntityId: string
): Promise<void> {
	// Remove ID from respite first
	await respiteRepository.removeActivityId(respiteId, activityEntityId);

	// Delete entity
	await entityRepository.delete(activityEntityId);
}

/**
 * Get all activity entities for a respite session by loading their IDs.
 *
 * @param activityIds - Array of activity entity IDs
 * @returns Array of activity entities (excluding any that no longer exist)
 */
export async function getActivitiesForRespite(activityIds: string[]): Promise<BaseEntity[]> {
	if (activityIds.length === 0) {
		return [];
	}

	// Fetch all activity entities by IDs
	const entities = await Promise.all(
		activityIds.map((id) => entityRepository.getById(id))
	);

	// Filter out any undefined results (deleted entities)
	return entities.filter((e): e is BaseEntity => e !== undefined);
}

/**
 * Update the status of a respite activity entity.
 *
 * @param activityEntityId - ID of the activity entity
 * @param status - New status value
 * @param outcome - Optional outcome text (for completed status)
 * @throws Error if entity not found or update fails
 */
export async function updateActivityStatus(
	activityEntityId: string,
	status: RespiteActivityStatus,
	outcome?: string
): Promise<void> {
	const entity = await entityRepository.getById(activityEntityId);
	if (!entity) {
		throw new Error(`Activity entity ${activityEntityId} not found`);
	}

	const updates: Record<string, any> = {
		activityStatus: status
	};

	if (outcome !== undefined) {
		updates.outcome = outcome;
	}

	await entityRepository.update(activityEntityId, {
		fields: {
			...entity.fields,
			...updates
		}
	});
}

/**
 * Update the progress notes of a respite activity entity.
 *
 * @param activityEntityId - ID of the activity entity
 * @param progress - Progress notes text
 * @throws Error if entity not found or update fails
 */
export async function updateActivityProgress(
	activityEntityId: string,
	progress: string
): Promise<void> {
	const entity = await entityRepository.getById(activityEntityId);
	if (!entity) {
		throw new Error(`Activity entity ${activityEntityId} not found`);
	}

	await entityRepository.update(activityEntityId, {
		fields: {
			...entity.fields,
			progress
		}
	});
}

/**
 * Complete a respite session and create a narrative event.
 * This orchestrates loading activity entities and passing them to the narrative service.
 *
 * @param respiteId - ID of the respite session to complete
 * @returns The completed respite session
 * @throws Error if respite not found or completion fails
 */
export async function completeRespiteWithNarrative(respiteId: string): Promise<void> {
	// Complete the respite
	const respite = await respiteRepository.completeRespite(respiteId);

	// Load activity entities
	const activities = await getActivitiesForRespite(respite.activityIds);

	// Count completed activities
	const completedCount = activities.filter(
		(a) => a.fields.activityStatus === 'completed'
	).length;

	// Create narrative event manually (since respite no longer has activities array)
	try {
		const outcome = `${respite.heroes.length} heroes rested, ${completedCount} activities completed, ${respite.victoryPointsConverted} VP converted`;

		await entityRepository.create({
			type: 'narrative_event',
			name: respite.name,
			description: respite.description || '',
			tags: [],
			fields: {
				eventType: 'respite',
				sourceId: respite.id,
				outcome
			},
			links: [],
			notes: '',
			metadata: {}
		});
	} catch (error) {
		console.error('Failed to create narrative event for respite:', error);
	}
}
