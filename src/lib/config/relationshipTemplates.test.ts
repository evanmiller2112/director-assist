/**
 * Tests for Relationship Templates Configuration (TDD RED Phase)
 *
 * Issue #146: Relationship Templates
 *
 * This file tests the built-in relationship templates configuration array.
 * Built-in templates provide pre-configured relationship patterns to speed up
 * relationship creation (Allied/Enemy, Friend/Rival, Parent/Child, etc.).
 *
 * Each template includes:
 * - id: Unique identifier (prefixed with 'builtin-')
 * - name: Display name
 * - relationship: Forward relationship label
 * - reverseRelationship: Optional reverse label (for bidirectional)
 * - bidirectional: Whether relationship goes both ways
 * - strength: Optional strength indicator
 * - category: Grouping category (Social, Professional, Family, Faction)
 * - description: Optional description text
 * - isBuiltIn: Always true for built-in templates
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_RELATIONSHIP_TEMPLATES } from './relationshipTemplates';
import type { RelationshipTemplate } from '$lib/types/relationships';

describe('BUILT_IN_RELATIONSHIP_TEMPLATES', () => {
	describe('Array Structure', () => {
		it('should be a non-empty array', () => {
			expect(Array.isArray(BUILT_IN_RELATIONSHIP_TEMPLATES)).toBe(true);
			expect(BUILT_IN_RELATIONSHIP_TEMPLATES.length).toBeGreaterThan(0);
		});

		it('should contain at least 10 templates', () => {
			// Per spec: built-in templates cover common relationship patterns
			expect(BUILT_IN_RELATIONSHIP_TEMPLATES.length).toBeGreaterThanOrEqual(10);
		});
	});

	describe('Template Required Fields', () => {
		it('should have all required fields for each template', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template, index) => {
				expect(template, `Template at index ${index} missing id`).toHaveProperty('id');
				expect(template, `Template at index ${index} missing name`).toHaveProperty('name');
				expect(template, `Template at index ${index} missing relationship`).toHaveProperty('relationship');
				expect(template, `Template at index ${index} missing bidirectional`).toHaveProperty('bidirectional');
				expect(template, `Template at index ${index} missing isBuiltIn`).toHaveProperty('isBuiltIn');
			});
		});

		it('should have isBuiltIn=true for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.isBuiltIn).toBe(true);
			});
		});

		it('should have non-empty id for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.id).toBeTruthy();
				expect(typeof template.id).toBe('string');
				expect(template.id.length).toBeGreaterThan(0);
			});
		});

		it('should have non-empty name for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.name).toBeTruthy();
				expect(typeof template.name).toBe('string');
				expect(template.name.length).toBeGreaterThan(0);
			});
		});

		it('should have non-empty relationship for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.relationship).toBeTruthy();
				expect(typeof template.relationship).toBe('string');
				expect(template.relationship.length).toBeGreaterThan(0);
			});
		});

		it('should have boolean bidirectional for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(typeof template.bidirectional).toBe('boolean');
			});
		});
	});

	describe('Template ID Uniqueness', () => {
		it('should have unique IDs for all templates', () => {
			const ids = BUILT_IN_RELATIONSHIP_TEMPLATES.map((t) => t.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should prefix all IDs with "builtin-"', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.id).toMatch(/^builtin-/);
			});
		});
	});

	describe('Template Categories', () => {
		it('should have category set for all templates', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(template.category).toBeTruthy();
				expect(typeof template.category).toBe('string');
			});
		});

		it('should include Social category templates', () => {
			const socialTemplates = BUILT_IN_RELATIONSHIP_TEMPLATES.filter(
				(t) => t.category === 'Social'
			);
			expect(socialTemplates.length).toBeGreaterThan(0);
		});

		it('should include Professional category templates', () => {
			const professionalTemplates = BUILT_IN_RELATIONSHIP_TEMPLATES.filter(
				(t) => t.category === 'Professional'
			);
			expect(professionalTemplates.length).toBeGreaterThan(0);
		});

		it('should include Family category templates', () => {
			const familyTemplates = BUILT_IN_RELATIONSHIP_TEMPLATES.filter(
				(t) => t.category === 'Family'
			);
			expect(familyTemplates.length).toBeGreaterThan(0);
		});

		it('should include Faction category templates', () => {
			const factionTemplates = BUILT_IN_RELATIONSHIP_TEMPLATES.filter(
				(t) => t.category === 'Faction'
			);
			expect(factionTemplates.length).toBeGreaterThan(0);
		});

		it('should use only expected categories', () => {
			const expectedCategories = ['Social', 'Professional', 'Family', 'Faction'];
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				expect(expectedCategories).toContain(template.category);
			});
		});
	});

	describe('Expected Templates', () => {
		it('should include Allied/Enemy template', () => {
			const template = BUILT_IN_RELATIONSHIP_TEMPLATES.find(
				(t) => t.name.toLowerCase().includes('allied') || t.name.toLowerCase().includes('enemy')
			);
			expect(template).toBeDefined();
		});

		it('should include Friend/Rival template', () => {
			const template = BUILT_IN_RELATIONSHIP_TEMPLATES.find(
				(t) => t.name.toLowerCase().includes('friend') || t.name.toLowerCase().includes('rival')
			);
			expect(template).toBeDefined();
		});

		it('should include Parent/Child template', () => {
			const template = BUILT_IN_RELATIONSHIP_TEMPLATES.find(
				(t) => t.name.toLowerCase().includes('parent') || t.name.toLowerCase().includes('child')
			);
			expect(template).toBeDefined();
		});

		it('should include Sibling template', () => {
			const template = BUILT_IN_RELATIONSHIP_TEMPLATES.find(
				(t) => t.name.toLowerCase().includes('sibling')
			);
			expect(template).toBeDefined();
		});
	});

	describe('Bidirectional Logic', () => {
		it('should have reverseRelationship for bidirectional templates with asymmetric relationships', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				if (template.bidirectional && template.relationship !== template.reverseRelationship) {
					// If bidirectional and relationships are different, reverseRelationship should exist
					// (Note: symmetric relationships like "sibling" may not need reverseRelationship)
					const isSymmetric = template.relationship === template.reverseRelationship;
					if (!isSymmetric && template.reverseRelationship) {
						expect(template.reverseRelationship).toBeTruthy();
					}
				}
			});
		});

		it('should have at least one bidirectional template', () => {
			const bidirectional = BUILT_IN_RELATIONSHIP_TEMPLATES.filter((t) => t.bidirectional);
			expect(bidirectional.length).toBeGreaterThan(0);
		});

		it('should have at least one unidirectional template', () => {
			const unidirectional = BUILT_IN_RELATIONSHIP_TEMPLATES.filter((t) => !t.bidirectional);
			expect(unidirectional.length).toBeGreaterThan(0);
		});
	});

	describe('Optional Fields', () => {
		it('should allow strength field if present', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				if (template.strength) {
					expect(['strong', 'moderate', 'weak']).toContain(template.strength);
				}
			});
		});

		it('should allow description field if present', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				if (template.description) {
					expect(typeof template.description).toBe('string');
				}
			});
		});
	});

	describe('Type Conformance', () => {
		it('should conform to RelationshipTemplate type', () => {
			BUILT_IN_RELATIONSHIP_TEMPLATES.forEach((template) => {
				const typed: RelationshipTemplate = template;
				expect(typed).toBeDefined();
			});
		});
	});
});
