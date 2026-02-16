/**
 * Tests for Combat Schemas (Issue #504)
 *
 * Tests Valibot schemas for CombatSession and Combatant validation.
 * These schemas provide runtime validation at the IndexedDB boundary.
 *
 * Testing Strategy:
 * - Valid combat sessions with all required fields pass validation
 * - Invalid status values fail validation
 * - Combatants array is properly validated
 * - Hero and Creature combatants are validated with type-specific fields
 * - Initiative rolls are validated as [number, number] tuples
 * - Date fields accept both Date objects and ISO 8601 strings
 *
 * Coverage:
 * - CombatSessionSchema: id, name, status, combatants, rounds, points, logs, dates
 * - HeroCombatant validation with optional heroicResource
 * - CreatureCombatant validation with threat level
 * - Status enum validation ('preparing' | 'active' | 'paused' | 'completed')
 * - Type coercion for JSON deserialization (ISO strings → Dates)
 * - Draw Steel specifics: 2d10 initiative, threat levels, hero points
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect } from 'vitest';
import { safeParse } from 'valibot';
import { CombatSessionSchema } from '$lib/db/schemas/combatSchemas';
import type { CombatSession, HeroCombatant, CreatureCombatant } from '$lib/types/combat';

describe('CombatSessionSchema', () => {
	describe('Valid CombatSession', () => {
		it('should pass validation with all required fields and empty combatants', () => {
			const validSession: CombatSession = {
				id: 'combat-123',
				name: 'Battle at Helm\'s Deep',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date('2024-01-15T10:00:00Z'),
				updatedAt: new Date('2024-01-15T10:00:00Z')
			};

			const result = safeParse(CombatSessionSchema, validSession);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toEqual(validSession);
			}
		});

		it('should pass validation with optional description field', () => {
			const validSession: CombatSession = {
				id: 'combat-456',
				name: 'Skirmish in Moria',
				description: 'Fighting orcs in the dark',
				status: 'paused',
				currentRound: 3,
				currentTurn: 2,
				combatants: [],
				groups: [],
				victoryPoints: 2,
				heroPoints: 3,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, validSession);
			expect(result.success).toBe(true);
		});

		it('should pass validation with valid hero combatant', () => {
			const heroCombatant: HeroCombatant = {
				id: 'combatant-1',
				type: 'hero',
				name: 'Aragorn',
				entityId: 'entity-aragorn',
				initiative: 18,
				initiativeRoll: [9, 9],
				turnOrder: 1,
				hp: 50,
				maxHp: 50,
				tempHp: 0,
				ac: 18,
				conditions: [],
				heroicResource: {
					current: 3,
					max: 5,
					name: 'Heroism'
				}
			};

			const validSession: CombatSession = {
				id: 'combat-789',
				name: 'Test Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [heroCombatant],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, validSession);
			expect(result.success).toBe(true);
		});

		it('should pass validation with valid creature combatant', () => {
			const creatureCombatant: CreatureCombatant = {
				id: 'combatant-2',
				type: 'creature',
				name: 'Orc Warrior',
				entityId: 'entity-orc',
				initiative: 12,
				initiativeRoll: [6, 6],
				turnOrder: 2,
				hp: 30,
				maxHp: 30,
				tempHp: 0,
				ac: 14,
				conditions: [],
				threat: 1
			};

			const validSession: CombatSession = {
				id: 'combat-101',
				name: 'Test Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [creatureCombatant],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, validSession);
			expect(result.success).toBe(true);
		});

		it('should pass validation with multiple combatants (heroes and creatures)', () => {
			const hero: HeroCombatant = {
				id: 'combatant-hero',
				type: 'hero',
				name: 'Legolas',
				initiative: 20,
				initiativeRoll: [10, 10],
				turnOrder: 1,
				hp: 45,
				tempHp: 0,
				conditions: []
			};

			const creature: CreatureCombatant = {
				id: 'combatant-creature',
				type: 'creature',
				name: 'Goblin',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 2,
				hp: 15,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const validSession: CombatSession = {
				id: 'combat-202',
				name: 'Mixed Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [hero, creature],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, validSession);
			expect(result.success).toBe(true);
		});

		it('should accept createdAt as Date object', () => {
			const session = {
				id: 'combat-303',
				name: 'Test Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date('2024-01-15T10:00:00Z'),
				updatedAt: new Date('2024-01-15T10:00:00Z')
			};

			const result = safeParse(CombatSessionSchema, session);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.createdAt).toBeInstanceOf(Date);
			}
		});

		it('should accept and coerce createdAt as ISO 8601 string (JSON deserialization)', () => {
			const session = {
				id: 'combat-404',
				name: 'Test Combat',
				status: 'completed',
				currentRound: 5,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 3,
				heroPoints: 2,
				log: [],
				createdAt: '2024-01-15T10:00:00.000Z',
				updatedAt: '2024-01-15T12:00:00.000Z'
			};

			const result = safeParse(CombatSessionSchema, session);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.createdAt).toBeInstanceOf(Date);
				expect(result.output.updatedAt).toBeInstanceOf(Date);
			}
		});
	});

	describe('Invalid Status Values', () => {
		it('should fail validation when status is not a valid CombatStatus', () => {
			const invalidSession = {
				id: 'combat-505',
				name: 'Invalid Combat',
				status: 'running', // invalid, should be 'preparing', 'active', 'paused', or 'completed'
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when status is empty string', () => {
			const invalidSession = {
				id: 'combat-606',
				name: 'Invalid Combat',
				status: '',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});
	});

	describe('Missing Required Fields', () => {
		it('should fail validation when combatants array is missing', () => {
			const invalidSession = {
				id: 'combat-707',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				// combatants missing
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when name is missing', () => {
			const invalidSession = {
				id: 'combat-808',
				// name missing
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when id is missing', () => {
			const invalidSession = {
				// id missing
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Combatant Data', () => {
		it('should fail validation when combatant is missing required fields', () => {
			const invalidCombatant = {
				id: 'combatant-bad',
				type: 'hero',
				// name missing
				initiative: 15,
				initiativeRoll: [7, 8],
				turnOrder: 1,
				hp: 40,
				tempHp: 0,
				conditions: []
			};

			const invalidSession = {
				id: 'combat-909',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [invalidCombatant],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when creature combatant is missing threat level', () => {
			const invalidCreature = {
				id: 'combatant-creature-bad',
				type: 'creature',
				name: 'Troll',
				initiative: 8,
				initiativeRoll: [4, 4],
				turnOrder: 1,
				hp: 60,
				tempHp: 0,
				conditions: []
				// threat missing
			};

			const invalidSession = {
				id: 'combat-1010',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [invalidCreature],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when initiativeRoll is not a 2-element array', () => {
			const invalidCombatant = {
				id: 'combatant-bad-roll',
				type: 'hero',
				name: 'Test Hero',
				initiative: 15,
				initiativeRoll: [7, 8, 1], // should be exactly 2 elements
				turnOrder: 1,
				hp: 40,
				tempHp: 0,
				conditions: []
			};

			const invalidSession = {
				id: 'combat-1111',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [invalidCombatant],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when combatant type is invalid', () => {
			const invalidCombatant = {
				id: 'combatant-bad-type',
				type: 'villain', // invalid, should be 'hero' or 'creature'
				name: 'Test Villain',
				initiative: 15,
				initiativeRoll: [7, 8],
				turnOrder: 1,
				hp: 40,
				tempHp: 0,
				conditions: []
			};

			const invalidSession = {
				id: 'combat-1212',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [invalidCombatant],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Field Types', () => {
		it('should fail validation when combatants is not an array', () => {
			const invalidSession = {
				id: 'combat-1313',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: 'not-an-array', // should be array
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when currentRound is not a number', () => {
			const invalidSession = {
				id: 'combat-1414',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: '1', // should be number
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 5,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});

		it('should fail validation when heroPoints is not a number', () => {
			const invalidSession = {
				id: 'combat-1515',
				name: 'Invalid Combat',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: '5', // should be number
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const result = safeParse(CombatSessionSchema, invalidSession);
			expect(result.success).toBe(false);
		});
	});
});
