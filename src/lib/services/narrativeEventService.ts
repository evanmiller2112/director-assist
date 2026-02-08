/**
 * Narrative Event Service (Issue #399)
 *
 * Creates narrative event entities from combat sessions, montage sessions,
 * and scenes, and manages timeline relationships between events.
 */

import { entityRepository } from '$lib/db/repositories/entityRepository';
import type { CombatSession } from '$lib/types/combat';
import type { MontageSession } from '$lib/types/montage';
import type { BaseEntity, NewEntity } from '$lib/types';

/**
 * Create a narrative event from a completed combat session.
 *
 * @param combat - The combat session to convert into a narrative event
 * @returns The created narrative event entity
 * @throws Error if combat is not completed or repository creation fails
 */
export async function createFromCombat(combat: CombatSession): Promise<BaseEntity> {
	// Validate combat status
	if (combat.status !== 'completed') {
		throw new Error('Cannot create narrative event from combat that is not completed');
	}

	// Build outcome summary
	const outcome = `Victory in ${combat.currentRound} rounds, earned ${combat.victoryPoints} VP`;

	// Create NewEntity for narrative event
	const newEntity: NewEntity = {
		type: 'narrative_event',
		name: combat.name,
		description: combat.description || '',
		tags: [],
		fields: {
			eventType: 'combat',
			sourceId: combat.id,
			outcome
		},
		links: [],
		notes: '',
		metadata: {}
	};

	// Persist and return
	return await entityRepository.create(newEntity);
}

/**
 * Create a narrative event from a completed montage session.
 *
 * @param montage - The montage session to convert into a narrative event
 * @returns The created narrative event entity
 * @throws Error if montage is not completed or repository creation fails
 */
export async function createFromMontage(montage: MontageSession): Promise<BaseEntity> {
	// Validate montage status
	if (montage.status !== 'completed') {
		throw new Error('Cannot create narrative event from montage that is not completed');
	}

	// Create NewEntity for narrative event
	const newEntity: NewEntity = {
		type: 'narrative_event',
		name: montage.name,
		description: montage.description || '',
		tags: [],
		fields: {
			eventType: 'montage',
			sourceId: montage.id,
			outcome: montage.outcome
		},
		links: [],
		notes: '',
		metadata: {}
	};

	// Persist and return
	return await entityRepository.create(newEntity);
}

/**
 * Create a narrative event from a scene entity.
 *
 * @param sceneId - The ID of the scene entity to convert
 * @returns The created narrative event entity
 * @throws Error if scene not found, not a scene type, or repository creation fails
 */
export async function createFromScene(sceneId: string): Promise<BaseEntity> {
	// Fetch scene entity
	const scene = await entityRepository.getById(sceneId);

	// Validate scene exists
	if (!scene) {
		throw new Error('Scene entity not found');
	}

	// Validate scene type
	if (scene.type !== 'scene') {
		throw new Error('Entity is not a scene type');
	}

	// Create NewEntity for narrative event
	const newEntity: NewEntity = {
		type: 'narrative_event',
		name: scene.name,
		description: scene.description,
		tags: [],
		fields: {
			eventType: 'scene',
			sourceId: sceneId
		},
		links: [],
		notes: '',
		metadata: {}
	};

	// Persist and return
	return await entityRepository.create(newEntity);
}

/**
 * Link two narrative events with a temporal relationship.
 * Creates a bidirectional "leads_to" / "follows" relationship.
 *
 * @param fromId - ID of the earlier narrative event
 * @param toId - ID of the later narrative event
 * @throws Error if entities not found, wrong type, or link creation fails
 */
export async function linkEvents(fromId: string, toId: string): Promise<void> {
	// Fetch both entities
	const fromEntity = await entityRepository.getById(fromId);
	const toEntity = await entityRepository.getById(toId);

	// Validate source entity exists
	if (!fromEntity) {
		throw new Error('Source entity not found');
	}

	// Validate target entity exists
	if (!toEntity) {
		throw new Error('Target entity not found');
	}

	// Validate source entity type
	if (fromEntity.type !== 'narrative_event') {
		throw new Error('Source entity is not a narrative_event type');
	}

	// Validate target entity type
	if (toEntity.type !== 'narrative_event') {
		throw new Error('Target entity is not a narrative_event type');
	}

	// Create bidirectional link with leads_to/follows relationship
	await entityRepository.addLink(
		fromId,
		toId,
		'leads_to',
		true, // bidirectional
		undefined, // notes
		undefined, // strength
		undefined, // metadata
		'follows', // reverseRelationship
		undefined // playerVisible
	);
}
