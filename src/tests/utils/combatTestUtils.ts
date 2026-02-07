/**
 * Combat Testing Utilities
 *
 * Helper functions for creating mock combat data for testing A2 Combat Round Tracker components.
 * These utilities follow TDD RED phase - components will fail until implemented.
 *
 * Updated for Issue #263: Group support for combat tracker
 */

import type {
	CombatSession,
	Combatant,
	HeroCombatant,
	CreatureCombatant,
	CombatCondition,
	CombatLogEntry,
	HeroicResource,
	CombatantGroup
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
		tokenIndicator: undefined,
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
		tokenIndicator: undefined,
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
		groups: [],
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

	const session = createActiveCombatSession();
	session.combatants = [hero, creature];
	return session;
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

// ============================================================================
// Group Support Utilities (Issue #263)
// ============================================================================

/**
 * Creates a mock combatant group for testing.
 */
export function createMockCombatantGroup(
	overrides: Partial<CombatantGroup> = {}
): CombatantGroup {
	return {
		id: `group-${Math.random().toString(36).substring(7)}`,
		name: 'Test Group',
		memberIds: [],
		initiative: 12,
		initiativeRoll: [6, 6],
		turnOrder: 1,
		...overrides
	};
}

/**
 * Creates a mock creature combatant with group membership.
 */
export function createMockGroupedCreatureCombatant(
	groupId: string,
	overrides: Partial<CreatureCombatant> = {}
): CreatureCombatant {
	return {
		id: `creature-${Math.random().toString(36).substring(7)}`,
		type: 'creature',
		name: 'Grouped Creature',
		groupId,
		entityId: `entity-${Math.random().toString(36).substring(7)}`,
		initiative: 12,
		initiativeRoll: [6, 6],
		turnOrder: 1.1, // Fractional for group members
		hp: 20,
		maxHp: 20,
		tempHp: 0,
		ac: 13,
		conditions: [],
		threat: 1,
		tokenIndicator: undefined,
		...overrides
	};
}

/**
 * Creates multiple grouped creature combatants for testing.
 */
export function createMockGroupedCreatures(
	count: number,
	groupId: string,
	overrides: Partial<CreatureCombatant>[] = []
): CreatureCombatant[] {
	return Array.from({ length: count }, (_, i) =>
		createMockGroupedCreatureCombatant(groupId, {
			id: `creature-${i}`,
			name: `Grouped Creature ${i + 1}`,
			turnOrder: 1 + (i + 1) * 0.1, // 1.1, 1.2, 1.3, etc.
			...overrides[i]
		})
	);
}

/**
 * Creates a combat session with grouped combatants for testing.
 */
export function createCombatWithGroups(): CombatSession {
	const groupId = 'group-1';
	const group: CombatantGroup = createMockCombatantGroup({
		id: groupId,
		name: 'Goblin Squad',
		memberIds: ['creature-0', 'creature-1', 'creature-2'],
		initiative: 12,
		turnOrder: 2
	});

	const groupedCreatures = createMockGroupedCreatures(3, groupId, [
		{ id: 'creature-0', name: 'Goblin 1', turnOrder: 2.1 },
		{ id: 'creature-1', name: 'Goblin 2', turnOrder: 2.2 },
		{ id: 'creature-2', name: 'Goblin 3', turnOrder: 2.3 }
	]);

	const hero = createMockHeroCombatant({
		id: 'hero-1',
		name: 'Solo Hero',
		initiative: 18,
		turnOrder: 1
	});

	const combat = createMockCombatSession({
		status: 'active',
		currentRound: 1,
		currentTurn: 0,
		combatants: [hero, ...groupedCreatures],
		groups: [group],
		log: [
			createMockLogEntry({
				message: 'Combat started',
				type: 'system',
				round: 1,
				turn: 0
			})
		]
	});

	return combat;
}

/**
 * Creates a combat session with multiple groups for testing.
 */
export function createCombatWithMultipleGroups(): CombatSession {
	const group1Id = 'group-1';
	const group2Id = 'group-2';

	const group1: CombatantGroup = createMockCombatantGroup({
		id: group1Id,
		name: 'Goblin Squad',
		memberIds: ['goblin-0', 'goblin-1'],
		initiative: 10,
		turnOrder: 3
	});

	const group2: CombatantGroup = createMockCombatantGroup({
		id: group2Id,
		name: 'Orc Warriors',
		memberIds: ['orc-0', 'orc-1', 'orc-2'],
		initiative: 14,
		turnOrder: 2
	});

	const goblins = createMockGroupedCreatures(2, group1Id, [
		{ id: 'goblin-0', name: 'Goblin 1', hp: 8, maxHp: 8, turnOrder: 3.1 },
		{ id: 'goblin-1', name: 'Goblin 2', hp: 8, maxHp: 8, turnOrder: 3.2 }
	]);

	const orcs = createMockGroupedCreatures(3, group2Id, [
		{ id: 'orc-0', name: 'Orc 1', hp: 15, maxHp: 15, turnOrder: 2.1, threat: 1 },
		{ id: 'orc-1', name: 'Orc 2', hp: 15, maxHp: 15, turnOrder: 2.2, threat: 1 },
		{ id: 'orc-2', name: 'Orc 3', hp: 15, maxHp: 15, turnOrder: 2.3, threat: 1 }
	]);

	const hero = createMockHeroCombatant({
		id: 'hero-1',
		name: 'Solo Hero',
		initiative: 18,
		turnOrder: 1
	});

	return createMockCombatSession({
		status: 'active',
		currentRound: 1,
		currentTurn: 0,
		combatants: [hero, ...orcs, ...goblins],
		groups: [group1, group2],
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
 * Helper to get all members of a group from a combat session.
 */
export function getGroupMembers(combat: CombatSession, groupId: string): Combatant[] {
	return combat.combatants.filter(c => c.groupId === groupId);
}

/**
 * Helper to find a group by ID in a combat session.
 */
export function findGroup(combat: CombatSession, groupId: string): CombatantGroup | undefined {
	return combat.groups?.find(g => g.id === groupId);
}
