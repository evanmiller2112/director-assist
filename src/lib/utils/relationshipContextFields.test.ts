/**
 * Tests for Smart Field Detection Utility
 *
 * Determines which fields should include relationship context in per-field AI generation.
 * Tests field priority detection, entity type relevance, and budget allocation.
 *
 * These are FAILING tests written following TDD principles.
 * They define the expected behavior before implementation.
 */
import { describe, it, expect } from 'vitest';
import {
	shouldIncludeRelationshipContext,
	getRelationshipContextPriority,
	getFieldRelationshipContextBudget,
	type ContextPriority
} from './relationshipContextFields';
import type { EntityType } from '$lib/types';

describe('relationshipContextFields', () => {
	describe('shouldIncludeRelationshipContext', () => {
		describe('Priority Fields (High/Medium Priority)', () => {
			it('should return true for personality field on NPC', () => {
				expect(shouldIncludeRelationshipContext('personality', 'npc')).toBe(true);
			});

			it('should return true for motivation field on Character', () => {
				expect(shouldIncludeRelationshipContext('motivation', 'character')).toBe(true);
			});

			it('should return true for goals field on Faction', () => {
				expect(shouldIncludeRelationshipContext('goals', 'faction')).toBe(true);
			});

			it('should return true for background field on NPC', () => {
				expect(shouldIncludeRelationshipContext('background', 'npc')).toBe(true);
			});

			it('should return true for description field on Location', () => {
				expect(shouldIncludeRelationshipContext('description', 'location')).toBe(true);
			});

			it('should return true for relationships field on any entity', () => {
				expect(shouldIncludeRelationshipContext('relationships', 'npc')).toBe(true);
				expect(shouldIncludeRelationshipContext('relationships', 'faction')).toBe(true);
			});

			it('should return true for alliances field on Faction', () => {
				expect(shouldIncludeRelationshipContext('alliances', 'faction')).toBe(true);
			});

			it('should return true for enemies field on any entity', () => {
				expect(shouldIncludeRelationshipContext('enemies', 'npc')).toBe(true);
				expect(shouldIncludeRelationshipContext('enemies', 'character')).toBe(true);
			});

			it('should return true for history field on Location', () => {
				expect(shouldIncludeRelationshipContext('history', 'location')).toBe(true);
			});

			it('should return true for role field on NPC', () => {
				expect(shouldIncludeRelationshipContext('role', 'npc')).toBe(true);
			});
		});

		describe('Non-Priority Fields (Low/None Priority)', () => {
			it('should return false for appearance field', () => {
				expect(shouldIncludeRelationshipContext('appearance', 'npc')).toBe(false);
			});

			it('should return false for physical_description field', () => {
				expect(shouldIncludeRelationshipContext('physical_description', 'npc')).toBe(false);
			});

			it('should return false for equipment field', () => {
				expect(shouldIncludeRelationshipContext('equipment', 'character')).toBe(false);
			});

			it('should return false for abilities field', () => {
				expect(shouldIncludeRelationshipContext('abilities', 'character')).toBe(false);
			});

			it('should return false for stats field', () => {
				expect(shouldIncludeRelationshipContext('stats', 'npc')).toBe(false);
			});

			it('should return false for treasure field', () => {
				expect(shouldIncludeRelationshipContext('treasure', 'encounter')).toBe(false);
			});

			it('should return false for map field', () => {
				expect(shouldIncludeRelationshipContext('map', 'location')).toBe(false);
			});

			it('should return false for name field', () => {
				expect(shouldIncludeRelationshipContext('name', 'npc')).toBe(false);
			});

			it('should return false for notes field', () => {
				expect(shouldIncludeRelationshipContext('notes', 'location')).toBe(false);
			});
		});

		describe('Entity Type Relevance', () => {
			it('should prioritize social entity types (NPC, Character, Faction)', () => {
				// Personality is highly relevant for NPCs and Characters
				expect(shouldIncludeRelationshipContext('personality', 'npc')).toBe(true);
				expect(shouldIncludeRelationshipContext('personality', 'character')).toBe(true);

				// But less relevant for items or encounters
				expect(shouldIncludeRelationshipContext('personality', 'item')).toBe(false);
				expect(shouldIncludeRelationshipContext('personality', 'encounter')).toBe(false);
			});

			it('should include context for Location description fields', () => {
				expect(shouldIncludeRelationshipContext('description', 'location')).toBe(true);
				expect(shouldIncludeRelationshipContext('atmosphere', 'location')).toBe(true);
			});

			it('should handle custom entity types conservatively', () => {
				// Custom entity types should default to conservative behavior
				expect(shouldIncludeRelationshipContext('personality', 'custom_monster')).toBe(false);

				// But description fields should still include context
				expect(shouldIncludeRelationshipContext('description', 'custom_monster')).toBe(true);
			});
		});

		describe('Edge Cases', () => {
			it('should handle field names with underscores', () => {
				expect(shouldIncludeRelationshipContext('social_background', 'npc')).toBe(true);
				expect(shouldIncludeRelationshipContext('physical_stats', 'character')).toBe(false);
			});

			it('should handle field names with hyphens', () => {
				expect(shouldIncludeRelationshipContext('background-story', 'npc')).toBe(true);
			});

			it('should be case-insensitive for field names', () => {
				expect(shouldIncludeRelationshipContext('Personality', 'npc')).toBe(true);
				expect(shouldIncludeRelationshipContext('MOTIVATION', 'character')).toBe(true);
			});

			it('should handle empty or invalid field keys', () => {
				expect(shouldIncludeRelationshipContext('', 'npc')).toBe(false);
				expect(shouldIncludeRelationshipContext(' ', 'npc')).toBe(false);
			});

			it('should handle special characters in field keys', () => {
				expect(shouldIncludeRelationshipContext('field!@#$%', 'npc')).toBe(false);
			});
		});
	});

	describe('getRelationshipContextPriority', () => {
		describe('High Priority Fields', () => {
			it('should return "high" for personality field', () => {
				expect(getRelationshipContextPriority('personality')).toBe('high');
			});

			it('should return "high" for motivation field', () => {
				expect(getRelationshipContextPriority('motivation')).toBe('high');
			});

			it('should return "high" for goals field', () => {
				expect(getRelationshipContextPriority('goals')).toBe('high');
			});

			it('should return "high" for relationships field', () => {
				expect(getRelationshipContextPriority('relationships')).toBe('high');
			});

			it('should return "high" for alliances field', () => {
				expect(getRelationshipContextPriority('alliances')).toBe('high');
			});

			it('should return "high" for enemies field', () => {
				expect(getRelationshipContextPriority('enemies')).toBe('high');
			});
		});

		describe('Medium Priority Fields', () => {
			it('should return "medium" for background field', () => {
				expect(getRelationshipContextPriority('background')).toBe('medium');
			});

			it('should return "medium" for description field', () => {
				expect(getRelationshipContextPriority('description')).toBe('medium');
			});

			it('should return "medium" for history field', () => {
				expect(getRelationshipContextPriority('history')).toBe('medium');
			});

			it('should return "medium" for role field', () => {
				expect(getRelationshipContextPriority('role')).toBe('medium');
			});

			it('should return "medium" for occupation field', () => {
				expect(getRelationshipContextPriority('occupation')).toBe('medium');
			});

			it('should return "medium" for atmosphere field', () => {
				expect(getRelationshipContextPriority('atmosphere')).toBe('medium');
			});
		});

		describe('Low Priority Fields', () => {
			it('should return "low" for appearance field', () => {
				expect(getRelationshipContextPriority('appearance')).toBe('low');
			});

			it('should return "low" for physical_description field', () => {
				expect(getRelationshipContextPriority('physical_description')).toBe('low');
			});

			it('should return "low" for tactics field', () => {
				expect(getRelationshipContextPriority('tactics')).toBe('low');
			});

			it('should return "low" for combat_behavior field', () => {
				expect(getRelationshipContextPriority('combat_behavior')).toBe('low');
			});
		});

		describe('None Priority Fields', () => {
			it('should return "none" for equipment field', () => {
				expect(getRelationshipContextPriority('equipment')).toBe('none');
			});

			it('should return "none" for abilities field', () => {
				expect(getRelationshipContextPriority('abilities')).toBe('none');
			});

			it('should return "none" for stats field', () => {
				expect(getRelationshipContextPriority('stats')).toBe('none');
			});

			it('should return "none" for treasure field', () => {
				expect(getRelationshipContextPriority('treasure')).toBe('none');
			});

			it('should return "none" for map field', () => {
				expect(getRelationshipContextPriority('map')).toBe('none');
			});

			it('should return "none" for unknown fields', () => {
				expect(getRelationshipContextPriority('unknown_field_xyz')).toBe('none');
			});

			it('should return "none" for secrets field', () => {
				expect(getRelationshipContextPriority('secrets')).toBe('none');
			});
		});

		describe('Case Insensitivity', () => {
			it('should be case-insensitive', () => {
				expect(getRelationshipContextPriority('Personality')).toBe('high');
				expect(getRelationshipContextPriority('BACKGROUND')).toBe('medium');
				expect(getRelationshipContextPriority('Appearance')).toBe('low');
			});
		});

		describe('Field Name Variations', () => {
			it('should handle underscores and hyphens', () => {
				expect(getRelationshipContextPriority('social_background')).toBe('medium');
				expect(getRelationshipContextPriority('background-story')).toBe('medium');
			});

			it('should detect partial matches for compound fields', () => {
				expect(getRelationshipContextPriority('character_motivation')).toBe('high');
				expect(getRelationshipContextPriority('npc_personality')).toBe('high');
			});
		});
	});

	describe('getFieldRelationshipContextBudget', () => {
		const BASE_BUDGET = 4000;

		describe('High Priority Field Budgets', () => {
			it('should allocate 75% of base budget for high priority fields', () => {
				expect(getFieldRelationshipContextBudget('personality', BASE_BUDGET)).toBe(3000);
			});

			it('should allocate 75% for motivation field', () => {
				expect(getFieldRelationshipContextBudget('motivation', BASE_BUDGET)).toBe(3000);
			});

			it('should allocate 75% for relationships field', () => {
				expect(getFieldRelationshipContextBudget('relationships', BASE_BUDGET)).toBe(3000);
			});
		});

		describe('Medium Priority Field Budgets', () => {
			it('should allocate 50% of base budget for medium priority fields', () => {
				expect(getFieldRelationshipContextBudget('background', BASE_BUDGET)).toBe(2000);
			});

			it('should allocate 50% for description field', () => {
				expect(getFieldRelationshipContextBudget('description', BASE_BUDGET)).toBe(2000);
			});

			it('should allocate 50% for role field', () => {
				expect(getFieldRelationshipContextBudget('role', BASE_BUDGET)).toBe(2000);
			});
		});

		describe('Low Priority Field Budgets', () => {
			it('should allocate 25% of base budget for low priority fields', () => {
				expect(getFieldRelationshipContextBudget('appearance', BASE_BUDGET)).toBe(1000);
			});

			it('should allocate 25% for tactics field', () => {
				expect(getFieldRelationshipContextBudget('tactics', BASE_BUDGET)).toBe(1000);
			});
		});

		describe('None Priority Field Budgets', () => {
			it('should allocate 0 for none priority fields', () => {
				expect(getFieldRelationshipContextBudget('equipment', BASE_BUDGET)).toBe(0);
			});

			it('should allocate 0 for stats field', () => {
				expect(getFieldRelationshipContextBudget('stats', BASE_BUDGET)).toBe(0);
			});

			it('should allocate 0 for unknown fields', () => {
				expect(getFieldRelationshipContextBudget('unknown_field', BASE_BUDGET)).toBe(0);
			});
		});

		describe('Budget Calculations', () => {
			it('should calculate correctly for different base budgets', () => {
				// High priority: 75%
				expect(getFieldRelationshipContextBudget('personality', 2000)).toBe(1500);
				expect(getFieldRelationshipContextBudget('personality', 8000)).toBe(6000);

				// Medium priority: 50%
				expect(getFieldRelationshipContextBudget('background', 2000)).toBe(1000);
				expect(getFieldRelationshipContextBudget('background', 8000)).toBe(4000);

				// Low priority: 25%
				expect(getFieldRelationshipContextBudget('appearance', 2000)).toBe(500);
				expect(getFieldRelationshipContextBudget('appearance', 8000)).toBe(2000);
			});

			it('should handle zero base budget', () => {
				expect(getFieldRelationshipContextBudget('personality', 0)).toBe(0);
				expect(getFieldRelationshipContextBudget('background', 0)).toBe(0);
			});

			it('should handle very small budgets', () => {
				expect(getFieldRelationshipContextBudget('personality', 100)).toBe(75);
				expect(getFieldRelationshipContextBudget('background', 100)).toBe(50);
				expect(getFieldRelationshipContextBudget('appearance', 100)).toBe(25);
			});

			it('should handle very large budgets', () => {
				expect(getFieldRelationshipContextBudget('personality', 10000)).toBe(7500);
				expect(getFieldRelationshipContextBudget('background', 10000)).toBe(5000);
				expect(getFieldRelationshipContextBudget('appearance', 10000)).toBe(2500);
			});

			it('should return integer values', () => {
				const budget = getFieldRelationshipContextBudget('personality', 3333);
				expect(Number.isInteger(budget)).toBe(true);
			});
		});

		describe('Edge Cases', () => {
			it('should handle negative base budget gracefully', () => {
				// Should either return 0 or throw - implementation decision
				const result = getFieldRelationshipContextBudget('personality', -1000);
				expect(result).toBeGreaterThanOrEqual(0);
			});

			it('should handle non-integer base budget', () => {
				expect(getFieldRelationshipContextBudget('personality', 4000.5)).toBeCloseTo(3000, 0);
			});
		});
	});

	describe('Integration: Priority and Budget Consistency', () => {
		it('should have consistent priority and budget relationships', () => {
			const baseBudget = 4000;

			// High priority fields should get more budget than medium
			const highBudget = getFieldRelationshipContextBudget('personality', baseBudget);
			const mediumBudget = getFieldRelationshipContextBudget('background', baseBudget);
			expect(highBudget).toBeGreaterThan(mediumBudget);

			// Medium priority fields should get more budget than low
			const lowBudget = getFieldRelationshipContextBudget('appearance', baseBudget);
			expect(mediumBudget).toBeGreaterThan(lowBudget);

			// Low priority fields should get more budget than none
			const noneBudget = getFieldRelationshipContextBudget('equipment', baseBudget);
			expect(lowBudget).toBeGreaterThan(noneBudget);
		});

		it('should not include context for fields with zero budget', () => {
			const fieldsWithZeroBudget = ['equipment', 'stats', 'treasure', 'abilities'];

			for (const fieldKey of fieldsWithZeroBudget) {
				const budget = getFieldRelationshipContextBudget(fieldKey, 4000);
				const shouldInclude = shouldIncludeRelationshipContext(fieldKey, 'npc');

				expect(budget).toBe(0);
				expect(shouldInclude).toBe(false);
			}
		});

		it('should include context for fields with non-zero budget', () => {
			const fieldsWithBudget = [
				{ field: 'personality', entityType: 'npc' as EntityType },
				{ field: 'background', entityType: 'character' as EntityType },
				{ field: 'description', entityType: 'location' as EntityType }
			];

			for (const { field, entityType } of fieldsWithBudget) {
				const budget = getFieldRelationshipContextBudget(field, 4000);
				const shouldInclude = shouldIncludeRelationshipContext(field, entityType);

				expect(budget).toBeGreaterThan(0);
				expect(shouldInclude).toBe(true);
			}
		});
	});
});
