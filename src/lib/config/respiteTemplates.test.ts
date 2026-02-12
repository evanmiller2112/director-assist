/**
 * Tests for Respite Activity Templates
 */

import { describe, it, expect } from 'vitest';
import {
	activityTemplates,
	getTemplatesByType,
	getTemplateTypes
} from './respiteTemplates';

describe('Respite Activity Templates', () => {
	describe('activityTemplates', () => {
		it('should have templates for all activity types', () => {
			const types = new Set(activityTemplates.map((t) => t.type));
			expect(types.has('project')).toBe(true);
			expect(types.has('crafting')).toBe(true);
			expect(types.has('socializing')).toBe(true);
			expect(types.has('training')).toBe(true);
			expect(types.has('investigation')).toBe(true);
		});

		it('should have non-empty name and description for all templates', () => {
			for (const template of activityTemplates) {
				expect(template.name.length).toBeGreaterThan(0);
				expect(template.description.length).toBeGreaterThan(0);
			}
		});

		it('should have at least 3 templates per type', () => {
			const countByType: Record<string, number> = {};
			for (const t of activityTemplates) {
				countByType[t.type] = (countByType[t.type] || 0) + 1;
			}
			for (const count of Object.values(countByType)) {
				expect(count).toBeGreaterThanOrEqual(3);
			}
		});
	});

	describe('getTemplatesByType', () => {
		it('should return only templates matching the type', () => {
			const craftingTemplates = getTemplatesByType('crafting');
			expect(craftingTemplates.length).toBeGreaterThan(0);
			for (const t of craftingTemplates) {
				expect(t.type).toBe('crafting');
			}
		});

		it('should return empty array for type with no templates', () => {
			const otherTemplates = getTemplatesByType('other');
			expect(otherTemplates).toEqual([]);
		});
	});

	describe('getTemplateTypes', () => {
		it('should return unique types', () => {
			const types = getTemplateTypes();
			expect(new Set(types).size).toBe(types.length);
		});

		it('should include all types that have templates', () => {
			const types = getTemplateTypes();
			expect(types).toContain('project');
			expect(types).toContain('crafting');
			expect(types).toContain('socializing');
			expect(types).toContain('training');
			expect(types).toContain('investigation');
		});
	});
});
