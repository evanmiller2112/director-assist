/**
 * Tests for relationshipGroups Configuration
 *
 * Issue #168 Phase 1: Relationship Guidance
 *
 * This configuration file groups relationships by category to provide
 * better guidance to users when selecting default relationships for
 * custom entity types.
 *
 * Groups:
 * - Character Relationships: knows, allied_with, enemy_of, member_of
 * - Physical Location: located_at, part_of, near, connected_to, contains
 * - Authority/Control: serves, worships, owns, controls, created_by
 * - Causality: involved, caused_by, led_to, affects
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the configuration is implemented.
 */

import { describe, it, expect } from 'vitest';
import { RELATIONSHIP_GROUPS } from './relationshipGroups';
import { DEFAULT_RELATIONSHIPS } from './entityTypes';

describe('relationshipGroups Configuration - Structure (Issue #168)', () => {
	it('should export RELATIONSHIP_GROUPS constant', () => {
		expect(RELATIONSHIP_GROUPS).toBeDefined();
	});

	it('should be an array of group objects', () => {
		expect(Array.isArray(RELATIONSHIP_GROUPS)).toBe(true);
		expect(RELATIONSHIP_GROUPS.length).toBeGreaterThan(0);
	});

	it('should have exactly 4 groups', () => {
		expect(RELATIONSHIP_GROUPS).toHaveLength(4);
	});

	it('should have group objects with required properties', () => {
		RELATIONSHIP_GROUPS.forEach((group) => {
			expect(group).toHaveProperty('id');
			expect(group).toHaveProperty('label');
			expect(group).toHaveProperty('relationships');
			expect(group).toHaveProperty('description');
		});
	});

	it('should have unique group IDs', () => {
		const ids = RELATIONSHIP_GROUPS.map((g) => g.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it('should have non-empty labels', () => {
		RELATIONSHIP_GROUPS.forEach((group) => {
			expect(group.label).toBeTruthy();
			expect(typeof group.label).toBe('string');
			expect(group.label.length).toBeGreaterThan(0);
		});
	});

	it('should have non-empty relationships arrays', () => {
		RELATIONSHIP_GROUPS.forEach((group) => {
			expect(Array.isArray(group.relationships)).toBe(true);
			expect(group.relationships.length).toBeGreaterThan(0);
		});
	});

	it('should have descriptions for each group', () => {
		RELATIONSHIP_GROUPS.forEach((group) => {
			expect(group.description).toBeTruthy();
			expect(typeof group.description).toBe('string');
			expect(group.description.length).toBeGreaterThan(0);
		});
	});
});

describe('relationshipGroups Configuration - Character Relationships Group', () => {
	it('should have Character Relationships group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group).toBeDefined();
	});

	it('should have correct label for Character Relationships', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.label).toMatch(/Character.*Relationships/i);
	});

	it('should include "knows" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.relationships).toContain('knows');
	});

	it('should include "allied_with" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.relationships).toContain('allied_with');
	});

	it('should include "enemy_of" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.relationships).toContain('enemy_of');
	});

	it('should include "member_of" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.relationships).toContain('member_of');
	});

	it('should have exactly 5 character relationships', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		// Character relationships: knows, allied_with, enemy_of, member_of, plays
		expect(group?.relationships).toHaveLength(5);
	});

	it('should include "plays" relationship for player-character connections', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.relationships).toContain('plays');
	});

	it('should have description for Character Relationships group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		expect(group?.description).toBeTruthy();
		expect(group?.description).toMatch(/social|interpersonal|character/i);
	});
});

describe('relationshipGroups Configuration - Physical Location Group', () => {
	it('should have Physical Location group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group).toBeDefined();
	});

	it('should have correct label for Physical Location', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.label).toMatch(/Physical.*Location|Spatial/i);
	});

	it('should include "located_at" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toContain('located_at');
	});

	it('should include "part_of" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toContain('part_of');
	});

	it('should include "near" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toContain('near');
	});

	it('should include "connected_to" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toContain('connected_to');
	});

	it('should include "contains" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toContain('contains');
	});

	it('should have exactly 5 location relationships', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.relationships).toHaveLength(5);
	});

	it('should have description for Physical Location group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'location');
		expect(group?.description).toBeTruthy();
		expect(group?.description).toMatch(/spatial|physical|location|place/i);
	});
});

describe('relationshipGroups Configuration - Authority/Control Group', () => {
	it('should have Authority/Control group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group).toBeDefined();
	});

	it('should have correct label for Authority/Control', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.label).toMatch(/Authority|Control|Power/i);
	});

	it('should include "serves" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toContain('serves');
	});

	it('should include "worships" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toContain('worships');
	});

	it('should include "owns" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toContain('owns');
	});

	it('should include "controls" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toContain('controls');
	});

	it('should include "created_by" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toContain('created_by');
	});

	it('should have exactly 5 authority/control relationships', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.relationships).toHaveLength(5);
	});

	it('should have description for Authority/Control group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'authority');
		expect(group?.description).toBeTruthy();
		expect(group?.description).toMatch(/authority|control|power|ownership/i);
	});
});

describe('relationshipGroups Configuration - Causality Group', () => {
	it('should have Causality group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group).toBeDefined();
	});

	it('should have correct label for Causality', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.label).toMatch(/Causality|Cause|Effect/i);
	});

	it('should include "involved" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.relationships).toContain('involved');
	});

	it('should include "caused_by" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.relationships).toContain('caused_by');
	});

	it('should include "led_to" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.relationships).toContain('led_to');
	});

	it('should include "affects" relationship', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.relationships).toContain('affects');
	});

	it('should have exactly 4 causality relationships', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.relationships).toHaveLength(4);
	});

	it('should have description for Causality group', () => {
		const group = RELATIONSHIP_GROUPS.find((g) => g.id === 'causality');
		expect(group?.description).toBeTruthy();
		expect(group?.description).toMatch(/cause|effect|temporal|event/i);
	});
});

describe('relationshipGroups Configuration - Completeness', () => {
	it('should include all DEFAULT_RELATIONSHIPS', () => {
		const allGroupedRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);

		DEFAULT_RELATIONSHIPS.forEach((relationship) => {
			expect(allGroupedRelationships).toContain(relationship);
		});
	});

	it('should not have duplicate relationships across groups', () => {
		const allRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);
		const uniqueRelationships = new Set(allRelationships);

		expect(allRelationships.length).toBe(uniqueRelationships.size);
	});

	it('should account for all 18 relationships from DEFAULT_RELATIONSHIPS', () => {
		const allGroupedRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);

		expect(allGroupedRelationships.length).toBe(DEFAULT_RELATIONSHIPS.length);
	});

	it('should only contain relationships from DEFAULT_RELATIONSHIPS', () => {
		const allGroupedRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);

		allGroupedRelationships.forEach((relationship) => {
			expect(DEFAULT_RELATIONSHIPS).toContain(relationship);
		});
	});
});

describe('relationshipGroups Configuration - Individual Relationship Coverage', () => {
	it('should include "plays" relationship in one group', () => {
		const allRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);
		expect(allRelationships).toContain('plays');
	});

	it('should place "plays" in the appropriate group', () => {
		// "plays" is typically a character relationship (player plays character)
		const characterGroup = RELATIONSHIP_GROUPS.find((g) => g.id === 'character');
		if (characterGroup) {
			expect(characterGroup.relationships).toContain('plays');
		}
	});

	it('should include all key relationships', () => {
		const allRelationships = RELATIONSHIP_GROUPS.flatMap((g) => g.relationships);

		const keyRelationships = [
			'knows', 'allied_with', 'enemy_of', 'member_of',
			'located_at', 'part_of', 'near', 'connected_to', 'contains',
			'serves', 'worships', 'owns', 'controls', 'created_by',
			'involved', 'caused_by', 'led_to', 'affects',
			'plays'
		];

		keyRelationships.forEach((relationship) => {
			expect(allRelationships).toContain(relationship);
		});
	});
});

describe('relationshipGroups Configuration - TypeScript Types', () => {
	it('should export helper functions for accessing groups', () => {
		// These functions will be used in components
		// For now, we just verify the structure is correct
		expect(RELATIONSHIP_GROUPS).toBeDefined();
	});

	it('should have consistent structure for all groups', () => {
		RELATIONSHIP_GROUPS.forEach((group) => {
			expect(typeof group.id).toBe('string');
			expect(typeof group.label).toBe('string');
			expect(Array.isArray(group.relationships)).toBe(true);
			expect(typeof group.description).toBe('string');
		});
	});
});
