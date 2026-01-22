/**
 * Combat Testing Utilities
 *
 * Helper functions for creating mock combat data for testing A2 Combat Round Tracker components.
 * These utilities follow TDD RED phase - components will fail until implemented.
 */

import type {
	CombatSession,
	Combatant,
	HeroCombatant,
	CreatureCombatant,
	CombatCondition,
	CombatLogEntry,
	HeroicResource
} from '$lib/types/combat';

/**
 * Creates a mock hero combatant for testing
 */
export function createMockHeroCombatant(
	overrides: Partial<HeroCombatant> = {}
): HeroCombatant {
	return {
		id: `hero-${Math.random().toString(36).substring(7)}`,
		type: 'hero',
		name: 'Test Hero',
		entityId: `entity-${Math.random().toString(36).substring(7)}`,
		initiative: 15,
		initiativeRoll: [7, 8],
		turnOrder: 1,
		hp: 30,
		maxHp: 40,
		tempHp: 0,
		ac: 16,
		conditions: [],
		heroicResource: {
			name: 'Victories',
			current: 0,
			max: 3
		},
		...overrides
	};
}

/**
 * Creates a mock creature combatant for testing
 */
export function createMockCreatureCombatant(
	overrides: Partial<CreatureCombatant> = {}
): CreatureCombatant {
	return {
		id: `creature-${Math.random().toString(36).substring(7)}`,
		type: 'creature',
		name: 'Test Creature',
		entityId: `entity-${Math.random().toString(36).substring(7)}`,
		initiative: 12,
		initiativeRoll: [6, 6],
		turnOrder: 1,
		hp: 25,
		maxHp: 25,
		tempHp: 0,
		ac: 14,
		conditions: [],
		threat: 1,
		...overrides
	};
}

/**
 * Creates multiple mock hero combatants for testing
 */
export function createMockHeroes(count: number, overrides: Partial<HeroCombatant>[] = []): HeroCombatant[] {
	return Array.from({ length: count }, (_, i) =>
		createMockHeroCombatant({
			id: `hero-${i}`,
			name: `Hero ${i + 1}`,
			initiative: 15 - i,
			turnOrder: i + 1,
			...overrides[i]
		})
	);
}

/**
 * Creates multiple mock creature combatants for testing
 */
export function createMockCreatures(count: number, overrides: Partial<CreatureCombatant>[] = []): CreatureCombatant[] {
	return Array.from({ length: count }, (_, i) =>
		createMockCreatureCombatant({
			id: `creature-${i}`,
			name: `Creature ${i + 1}`,
			initiative: 10 - i,
			turnOrder: i + 1,
			...overrides[i]
		})
	);
}

/**
 * Creates a mock combat condition for testing
 */
export function createMockCondition(
	overrides: Partial<CombatCondition> = {}
): CombatCondition {
	return {
		name: 'Test Condition',
		description: 'A test condition',
		source: 'Test Source',
		duration: 3,
		...overrides
	};
}

/**
 * Creates a mock combat log entry for testing
 */
export function createMockLogEntry(
	overrides: Partial<CombatLogEntry> = {}
): CombatLogEntry {
	return {
		id: `log-${Math.random().toString(36).substring(7)}`,
		round: 1,
		turn: 1,
		timestamp: new Date(),
		message: 'Test log message',
		type: 'system',
		...overrides
	};
}

/**
 * Creates a mock combat session for testing
 */
export function createMockCombatSession(
	overrides: Partial<CombatSession> = {}
): CombatSession {
	const now = new Date();
	return {
		id: `combat-${Math.random().toString(36).substring(7)}`,
		name: 'Test Combat',
		description: 'A test combat encounter',
		status: 'preparing',
		currentRound: 0,
		currentTurn: 0,
		combatants: [],
		victoryPoints: 0,
		heroPoints: 3,
		log: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

/**
 * Creates a fully-populated active combat session for testing
 */
export function createActiveCombatSession(
	heroCount: number = 2,
	creatureCount: number = 3
): CombatSession {
	const heroes = createMockHeroes(heroCount);
	const creatures = createMockCreatures(creatureCount);
	const sortedCombatants = [...heroes, ...creatures].sort((a, b) => b.initiative - a.initiative);
	// Assign proper turnOrder based on sorted position
	const combatants = sortedCombatants.map((c, i) => ({ ...c, turnOrder: i + 1 }));

	return createMockCombatSession({
		status: 'active',
		currentRound: 1,
		currentTurn: 0,
		combatants,
		log: [
			createMockLogEntry({
				message: 'Combat started',
				type: 'system',
				round: 1,
				turn: 0
			})
		]
	});
}

/**
 * Creates a combat session with various conditions applied to combatants
 */
export function createCombatWithConditions(): CombatSession {
	const hero = createMockHeroCombatant({
		id: 'hero-1',
		name: 'Afflicted Hero',
		conditions: [
			createMockCondition({ name: 'Bleeding', duration: 2 }),
			createMockCondition({ name: 'Slowed', duration: 1 })
		]
	});

	const creature = createMockCreatureCombatant({
		id: 'creature-1',
		name: 'Stunned Creature',
		conditions: [
			createMockCondition({ name: 'Stunned', duration: 0 })
		]
	});

	return createActiveCombatSession().combatants = [hero, creature];
}

/**
 * Creates a combat session with damaged combatants
 */
export function createCombatWithDamage(): CombatSession {
	const hero = createMockHeroCombatant({
		id: 'hero-1',
		name: 'Wounded Hero',
		hp: 15,
		maxHp: 40,
		tempHp: 5
	});

	const creature = createMockCreatureCombatant({
		id: 'creature-1',
		name: 'Bloodied Creature',
		hp: 10,
		maxHp: 25
	});

	const combat = createActiveCombatSession();
	combat.combatants = [hero, creature];
	return combat;
}

/**
 * Helper to get the current combatant from a combat session
 */
export function getCurrentCombatant(combat: CombatSession): Combatant | undefined {
	return combat.combatants[combat.currentTurn];
}

/**
 * Helper to check if a combatant is bloodied (HP <= 50% of max)
 */
export function isBloodied(combatant: Combatant): boolean {
	return combatant.maxHp ? combatant.hp <= combatant.maxHp / 2 : false;
}

/**
 * Helper to check if a combatant is at 0 HP
 */
export function isDefeated(combatant: Combatant): boolean {
	return combatant.hp <= 0;
}

/**
 * Creates a combat session in completed state
 */
export function createCompletedCombatSession(): CombatSession {
	const combat = createActiveCombatSession();
	combat.status = 'completed';
	combat.currentRound = 5;
	combat.log.push(
		createMockLogEntry({
			message: 'Combat ended',
			type: 'system',
			round: 5,
			turn: 0
		})
	);
	return combat;
}
