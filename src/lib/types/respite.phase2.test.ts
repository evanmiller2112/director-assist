import { describe, it, expect } from 'vitest';
import type {
	RespiteSession,
	RespiteActivity,
	RecordActivityInput,
	RespiteActivityType,
	RespiteActivityStatus,
	CreateRespiteActivityInput
} from './respite';

/**
 * Tests for Respite Types Refactoring
 *
 * Issue #493 Phase 2: Refactor Respite Types
 *
 * These tests validate that the respite types have been correctly refactored
 * to work with the entity system:
 * - RespiteSession.activities replaced with activityIds
 * - RespiteActivity interface removed (now an entity)
 * - RecordActivityInput removed
 * - Type aliases preserved
 * - New CreateRespiteActivityInput helper type added
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the types are refactored.
 */

describe('RespiteSession Type Refactoring', () => {
	it('should have activityIds property as string array', () => {
		const session: RespiteSession = {
			id: 'test-session',
			name: 'Test Respite',
			status: 'preparing',
			heroes: [],
			victoryPointsAvailable: 0,
			victoryPointsConverted: 0,
			activityIds: ['activity-1', 'activity-2'], // NEW: array of IDs
			kitSwaps: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		expect(session.activityIds).toEqual(['activity-1', 'activity-2']);
		expect(Array.isArray(session.activityIds)).toBe(true);
		expect(session.activityIds.every((id) => typeof id === 'string')).toBe(true);
	});

	it('should not have activities property with inline objects', () => {
		const session: RespiteSession = {
			id: 'test-session',
			name: 'Test Respite',
			status: 'active',
			heroes: [],
			victoryPointsAvailable: 0,
			victoryPointsConverted: 0,
			activityIds: [],
			kitSwaps: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// TypeScript should error if we try to access 'activities'
		// @ts-expect-error - activities property should not exist
		expect(session.activities).toBeUndefined();
	});

	it('should allow empty activityIds array', () => {
		const session: RespiteSession = {
			id: 'test-session',
			name: 'Test Respite',
			status: 'preparing',
			heroes: [],
			victoryPointsAvailable: 0,
			victoryPointsConverted: 0,
			activityIds: [],
			kitSwaps: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		expect(session.activityIds).toEqual([]);
	});
});

describe('RespiteActivity Type Deprecation', () => {
	it('should still export RespiteActivity interface as deprecated', () => {
		// RespiteActivity is now deprecated but still exported for backward compatibility
		// It should work but is marked @deprecated in the type definition
		const activity: RespiteActivity = {
			id: 'test',
			name: 'Test Activity',
			type: 'project',
			status: 'pending',
			createdAt: new Date()
		};

		expect(activity).toBeDefined();
		expect(activity.id).toBe('test');
	});
});

describe('RecordActivityInput Type Deprecation', () => {
	it('should still export RecordActivityInput interface as deprecated', () => {
		// RecordActivityInput is now deprecated but still exported for backward compatibility
		const input: RecordActivityInput = {
			name: 'Test Activity',
			type: 'crafting'
		};

		expect(input).toBeDefined();
		expect(input.name).toBe('Test Activity');
	});
});

describe('Type Alias Preservation', () => {
	it('should still export RespiteActivityType', () => {
		const type: RespiteActivityType = 'project';
		expect(type).toBe('project');

		const types: RespiteActivityType[] = [
			'project',
			'crafting',
			'socializing',
			'training',
			'investigation',
			'other'
		];

		types.forEach((t) => {
			const typed: RespiteActivityType = t;
			expect(typed).toBe(t);
		});
	});

	it('should still export RespiteActivityStatus', () => {
		const status: RespiteActivityStatus = 'pending';
		expect(status).toBe('pending');

		const statuses: RespiteActivityStatus[] = ['pending', 'in_progress', 'completed'];

		statuses.forEach((s) => {
			const typed: RespiteActivityStatus = s;
			expect(typed).toBe(s);
		});
	});
});

describe('CreateRespiteActivityInput Type', () => {
	it('should export CreateRespiteActivityInput helper type', () => {
		const input: CreateRespiteActivityInput = {
			name: 'Craft Magic Weapon',
			activityType: 'crafting'
		};

		expect(input.name).toBe('Craft Magic Weapon');
		expect(input.activityType).toBe('crafting');
	});

	it('should allow all expected properties', () => {
		const input: CreateRespiteActivityInput = {
			name: 'Research Ancient Texts',
			description: 'Study old manuscripts in the library',
			activityType: 'investigation',
			heroId: 'hero-123',
			notes: 'Focusing on pre-war history'
		};

		expect(input.name).toBe('Research Ancient Texts');
		expect(input.description).toBe('Study old manuscripts in the library');
		expect(input.activityType).toBe('investigation');
		expect(input.heroId).toBe('hero-123');
		expect(input.notes).toBe('Focusing on pre-war history');
	});

	it('should require name and activityType only', () => {
		const minimal: CreateRespiteActivityInput = {
			name: 'Training Session',
			activityType: 'training'
		};

		expect(minimal.name).toBe('Training Session');
		expect(minimal.activityType).toBe('training');
		expect(minimal.description).toBeUndefined();
		expect(minimal.heroId).toBeUndefined();
		expect(minimal.notes).toBeUndefined();
	});

	it('should accept all valid activity types', () => {
		const activityTypes: RespiteActivityType[] = [
			'project',
			'crafting',
			'socializing',
			'training',
			'investigation',
			'other'
		];

		activityTypes.forEach((type) => {
			const input: CreateRespiteActivityInput = {
				name: `Test ${type}`,
				activityType: type
			};
			expect(input.activityType).toBe(type);
		});
	});
});
