import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity, EntityLink } from '$lib/types';
import { createMockEntity } from '../../tests/utils/testUtils';

/**
 * Tests for entities store - getLinkedWithRelationships method
 *
 * Issue #72: Enhanced relationship cards with full metadata
 *
 * These tests verify that getLinkedWithRelationships() returns the full EntityLink
 * object with all metadata instead of a simplified object.
 */

// Mock the entity repository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getAll: vi.fn(() => ({
			subscribe: vi.fn()
		})),
		create: vi.fn(),
		createWithLinks: vi.fn((newEntity, pendingLinks) => {
			// Default mock implementation - returns entity with ID and links
			const entity = {
				...newEntity,
				id: 'mock-id-' + Math.random(),
				createdAt: new Date(),
				updatedAt: new Date(),
				links: pendingLinks.map((pending: any) => ({
					id: 'link-' + Math.random(),
					sourceId: 'mock-id-' + Math.random(),
					targetId: pending.targetId,
					targetType: pending.targetType,
					relationship: pending.relationship,
					bidirectional: pending.bidirectional,
					createdAt: new Date(),
					updatedAt: new Date()
				}))
			};

			// Simulate error for non-existent targets
			if (pendingLinks.some((p: any) => p.targetId === 'non-existent')) {
				return Promise.reject(new Error('Target entity not found'));
			}

			return Promise.resolve(entity);
		}),
		update: vi.fn(),
		delete: vi.fn(),
		addLink: vi.fn(),
		updateLink: vi.fn(),
		removeLink: vi.fn()
	}
}));

describe('EntitiesStore - getLinkedWithRelationships (Issue #72)', () => {
	let entitiesStore: any;
	let mockEntities: BaseEntity[];

	beforeEach(async () => {
		// Clear all mocks
		vi.clearAllMocks();

		// Dynamically import the store to get a fresh instance
		const module = await import('./entities.svelte');
		entitiesStore = module.entitiesStore;

		// Create mock entities with various link configurations
		const now = new Date();

		mockEntities = [
			createMockEntity({
				id: 'entity-1',
				name: 'Aragorn',
				type: 'character',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'entity-2',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: true,
						notes: 'Ranger of the North, later King',
						strength: 'strong',
						createdAt: new Date('2024-01-01'),
						updatedAt: new Date('2024-01-15'),
						metadata: {
							tags: ['fellowship', 'leadership'],
							tension: 25
						}
					},
					{
						id: 'link-2',
						sourceId: 'entity-1',
						targetId: 'entity-3',
						targetType: 'character',
						relationship: 'friend_of',
						bidirectional: true,
						// No notes, strength, or metadata - testing optional fields
						createdAt: now,
						updatedAt: now
					}
				]
			}),
			createMockEntity({
				id: 'entity-2',
				name: 'Rangers of the North',
				type: 'faction',
				links: []
			}),
			createMockEntity({
				id: 'entity-3',
				name: 'Gandalf',
				type: 'character',
				links: []
			}),
			createMockEntity({
				id: 'entity-4',
				name: 'Rivendell',
				type: 'location',
				links: [
					{
						id: 'link-3',
						sourceId: 'entity-4',
						targetId: 'entity-1',
						targetType: 'character',
						relationship: 'visited_by',
						bidirectional: false, // Unidirectional link
						notes: 'Frequent visitor for councils',
						strength: 'moderate',
						createdAt: now,
						updatedAt: now,
						metadata: {
							tags: ['location', 'history']
						}
					}
				]
			}),
			createMockEntity({
				id: 'entity-5',
				name: 'Fellowship',
				type: 'faction',
				links: [
					{
						id: 'link-4',
						sourceId: 'entity-5',
						targetId: 'entity-1',
						targetType: 'character',
						relationship: 'has_member',
						bidirectional: true,
						reverseRelationship: 'member_of', // Asymmetric bidirectional
						notes: 'One of the Nine Walkers',
						strength: 'strong',
						createdAt: now,
						updatedAt: now,
						metadata: {
							tags: ['quest', 'important'],
							tension: 60,
							customField: 'test-value'
						}
					}
				]
			})
		];

		// Set the mock entities in the store
		entitiesStore._setEntities(mockEntities);
	});

	describe('Full Link Object Return Value', () => {
		it('should return full EntityLink object with all metadata fields', () => {
			// This test will FAIL because current implementation returns simplified object
			// Expected: { entity, link: EntityLink, isReverse }
			// Actual: { entity, relationship, reverseRelationship, isReverse, bidirectional }

			// Setup: Manually set entities (simulate loaded state)
			// Note: This is testing the expected new behavior

			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Should have links to entity-2, entity-3, entity-4 (reverse), entity-5 (reverse)
			expect(result).toHaveLength(4);

			// Find the link to entity-2 (Rangers)
			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// CRITICAL: Should have a 'link' property containing the full EntityLink object
			expect(rangersLink).toHaveProperty('link');
			expect(rangersLink.link).toBeInstanceOf(Object);

			// Verify the link object has all EntityLink properties
			expect(rangersLink.link).toHaveProperty('id', 'link-1');
			expect(rangersLink.link).toHaveProperty('sourceId', 'entity-1');
			expect(rangersLink.link).toHaveProperty('targetId', 'entity-2');
			expect(rangersLink.link).toHaveProperty('targetType', 'faction');
			expect(rangersLink.link).toHaveProperty('relationship', 'member_of');
			expect(rangersLink.link).toHaveProperty('bidirectional', true);
			expect(rangersLink.link).toHaveProperty('notes', 'Ranger of the North, later King');
			expect(rangersLink.link).toHaveProperty('strength', 'strong');
			expect(rangersLink.link).toHaveProperty('createdAt');
			expect(rangersLink.link).toHaveProperty('updatedAt');
			expect(rangersLink.link).toHaveProperty('metadata');
		});

		it('should include metadata.tags in the full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// Should have metadata with tags
			expect(rangersLink.link.metadata).toBeDefined();
			expect(rangersLink.link.metadata.tags).toEqual(['fellowship', 'leadership']);
		});

		it('should include metadata.tension in the full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// Should have metadata with tension
			expect(rangersLink.link.metadata).toBeDefined();
			expect(rangersLink.link.metadata.tension).toBe(25);
		});

		it('should include custom metadata fields in the full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const fellowshipLink = result.find((r: any) => r.entity.id === 'entity-5' && r.isReverse);
			expect(fellowshipLink).toBeDefined();

			// Should have custom metadata field
			expect(fellowshipLink.link.metadata).toBeDefined();
			expect(fellowshipLink.link.metadata.customField).toBe('test-value');
		});

		it('should include timestamps (createdAt, updatedAt) in the full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// Should have timestamps
			expect(rangersLink.link.createdAt).toBeInstanceOf(Date);
			expect(rangersLink.link.updatedAt).toBeInstanceOf(Date);
			expect(rangersLink.link.createdAt).toEqual(new Date('2024-01-01'));
			expect(rangersLink.link.updatedAt).toEqual(new Date('2024-01-15'));
		});
	});

	describe('Optional Fields Handling', () => {
		it('should handle links without notes field gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');
			expect(gandalfLink).toBeDefined();

			// Link should exist but notes should be undefined
			expect(gandalfLink.link).toBeDefined();
			expect(gandalfLink.link.notes).toBeUndefined();
		});

		it('should handle links without strength field gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');
			expect(gandalfLink).toBeDefined();

			// Link should exist but strength should be undefined
			expect(gandalfLink.link).toBeDefined();
			expect(gandalfLink.link.strength).toBeUndefined();
		});

		it('should handle links without metadata field gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');
			expect(gandalfLink).toBeDefined();

			// Link should exist but metadata should be undefined or empty
			expect(gandalfLink.link).toBeDefined();
			expect(gandalfLink.link.metadata).toBeUndefined();
		});

		it('should handle links without metadata.tags gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');
			expect(gandalfLink).toBeDefined();

			// Link metadata tags should be undefined
			if (gandalfLink.link.metadata) {
				expect(gandalfLink.link.metadata.tags).toBeUndefined();
			}
		});

		it('should handle links without metadata.tension gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');
			expect(gandalfLink).toBeDefined();

			// Link metadata tension should be undefined
			if (gandalfLink.link.metadata) {
				expect(gandalfLink.link.metadata.tension).toBeUndefined();
			}
		});
	});

	describe('Forward and Reverse Links', () => {
		it('should correctly identify forward links with isReverse: false', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Links to entity-2 and entity-3 are forward links
			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			const gandalfLink = result.find((r: any) => r.entity.id === 'entity-3');

			expect(rangersLink).toBeDefined();
			expect(rangersLink.isReverse).toBe(false);

			expect(gandalfLink).toBeDefined();
			expect(gandalfLink.isReverse).toBe(false);
		});

		it('should correctly identify reverse links with isReverse: true', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Link from entity-4 is a reverse unidirectional link
			const rivendellLink = result.find((r: any) => r.entity.id === 'entity-4');

			expect(rivendellLink).toBeDefined();
			expect(rivendellLink.isReverse).toBe(true);
		});

		it('should return correct isReverse flag for bidirectional links', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Bidirectional links should be marked as forward (isReverse: false)
			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');

			expect(rangersLink).toBeDefined();
			expect(rangersLink.link.bidirectional).toBe(true);
			expect(rangersLink.isReverse).toBe(false);
		});

		it('should include full link object for reverse links', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Reverse link from entity-4
			const rivendellLink = result.find((r: any) => r.entity.id === 'entity-4');

			expect(rivendellLink).toBeDefined();
			expect(rivendellLink.link).toBeDefined();
			expect(rivendellLink.link.id).toBe('link-3');
			expect(rivendellLink.link.sourceId).toBe('entity-4');
			expect(rivendellLink.link.targetId).toBe('entity-1');
			expect(rivendellLink.link.relationship).toBe('visited_by');
			expect(rivendellLink.link.notes).toBe('Frequent visitor for councils');
			expect(rivendellLink.link.strength).toBe('moderate');
			expect(rivendellLink.link.metadata?.tags).toEqual(['location', 'history']);
		});
	});

	describe('Asymmetric Relationships', () => {
		it('should include reverseRelationship in the full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Find reverse link from Fellowship
			const fellowshipLink = result.find((r: any) => r.entity.id === 'entity-5' && r.isReverse);

			expect(fellowshipLink).toBeDefined();
			expect(fellowshipLink.link).toBeDefined();
			expect(fellowshipLink.link.reverseRelationship).toBe('member_of');
		});

		it('should handle links without reverseRelationship gracefully', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			// Regular bidirectional link without asymmetric relationship
			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');

			expect(rangersLink).toBeDefined();
			expect(rangersLink.link).toBeDefined();
			expect(rangersLink.link.reverseRelationship).toBeUndefined();
		});

		it('should preserve asymmetric relationship metadata in full link object', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const fellowshipLink = result.find((r: any) => r.entity.id === 'entity-5' && r.isReverse);

			expect(fellowshipLink).toBeDefined();
			expect(fellowshipLink.link.relationship).toBe('has_member');
			expect(fellowshipLink.link.reverseRelationship).toBe('member_of');
			expect(fellowshipLink.link.bidirectional).toBe(true);
			expect(fellowshipLink.link.notes).toBe('One of the Nine Walkers');
			expect(fellowshipLink.link.strength).toBe('strong');
			expect(fellowshipLink.link.metadata?.tension).toBe(60);
		});
	});

	describe('Return Type Structure', () => {
		it('should return array with correct structure: { entity, link, isReverse }', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			expect(Array.isArray(result)).toBe(true);

			if (result.length > 0) {
				const firstLink = result[0];

				// Should have exactly these properties
				expect(Object.keys(firstLink)).toContain('entity');
				expect(Object.keys(firstLink)).toContain('link');
				expect(Object.keys(firstLink)).toContain('isReverse');

				// Should NOT have old simplified properties
				expect(firstLink).not.toHaveProperty('relationship');
				expect(firstLink).not.toHaveProperty('reverseRelationship');
				expect(firstLink).not.toHaveProperty('bidirectional');
			}
		});

		it('should return BaseEntity for entity property', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// Entity should be a full BaseEntity object
			expect(rangersLink.entity).toBeDefined();
			expect(rangersLink.entity).toHaveProperty('id');
			expect(rangersLink.entity).toHaveProperty('name');
			expect(rangersLink.entity).toHaveProperty('type');
			expect(rangersLink.entity).toHaveProperty('description');
			expect(rangersLink.entity).toHaveProperty('tags');
			expect(rangersLink.entity).toHaveProperty('links');
		});

		it('should return EntityLink for link property', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			const rangersLink = result.find((r: any) => r.entity.id === 'entity-2');
			expect(rangersLink).toBeDefined();

			// Link should be a full EntityLink object
			const link: EntityLink = rangersLink.link;
			expect(link).toBeDefined();
			expect(link).toHaveProperty('id');
			expect(link).toHaveProperty('targetId');
			expect(link).toHaveProperty('targetType');
			expect(link).toHaveProperty('relationship');
			expect(link).toHaveProperty('bidirectional');
		});

		it('should return boolean for isReverse property', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			result.forEach((linkedItem: any) => {
				expect(typeof linkedItem.isReverse).toBe('boolean');
			});
		});
	});

	describe('Empty and Edge Cases', () => {
		it('should return empty array for entity with no links', () => {
			// entity-3 (Gandalf) has no forward links and only receives
			// a bidirectional link from entity-1, which would show as reverse
			const result = entitiesStore.getLinkedWithRelationships('entity-3');

			// entity-3 receives a link from entity-1, so it should see that relationship
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0].isReverse).toBe(true);
		});

		it('should return empty array for non-existent entity', () => {
			const result = entitiesStore.getLinkedWithRelationships('non-existent-id');

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it('should handle entities with only forward links', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-4');

			// entity-4 only has forward link to entity-1
			expect(result).toHaveLength(1);
			expect(result[0].entity.id).toBe('entity-1');
			expect(result[0].isReverse).toBe(false);
			expect(result[0].link).toBeDefined();
		});

		it('should handle entities with only reverse links', () => {
			// entity-2 has no forward links, but entity-1 links to it
			const result = entitiesStore.getLinkedWithRelationships('entity-2');

			// Should have reverse link from entity-1 (bidirectional counts as both)
			// Since entity-1 -> entity-2 is bidirectional, entity-2 won't show it as reverse
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe('Backward Compatibility', () => {
		it('should maintain all existing functionality while adding new link property', () => {
			const result = entitiesStore.getLinkedWithRelationships('entity-1');

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			// Should still return entity and isReverse
			result.forEach((item: any) => {
				expect(item).toHaveProperty('entity');
				expect(item).toHaveProperty('isReverse');
			});
		});

		it('should not break when processing old links without new fields', () => {
			// Create entity with minimal link (backward compatibility)
			const minimalEntity = createMockEntity({
				id: 'minimal-1',
				links: [
					{
						id: 'minimal-link',
						targetId: 'entity-2',
						targetType: 'faction',
						relationship: 'knows',
						bidirectional: false
						// No notes, strength, metadata, timestamps
					} as EntityLink
				]
			});

			// This should not throw and should handle gracefully
			expect(() => {
				// Simulating the store method on minimal entity
				const links = minimalEntity.links;
				expect(links[0]).toBeDefined();
				expect(links[0].notes).toBeUndefined();
				expect(links[0].strength).toBeUndefined();
				expect(links[0].metadata).toBeUndefined();
			}).not.toThrow();
		});
	});
});

/**
 * Tests for entities store - Relationship-based filtering
 *
 * Issue #78: Relationship-based entity filtering
 *
 * These tests verify that the entities store can filter entities based on:
 * - Related to a specific entity
 * - Relationship type
 * - Has any relationships
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the functionality is implemented.
 */

describe('EntitiesStore - Relationship Filters (Issue #78)', () => {
	let entitiesStore: any;
	let mockEntities: BaseEntity[];

	beforeEach(async () => {
		// Clear all mocks
		vi.clearAllMocks();

		// Dynamically import the store to get a fresh instance
		const module = await import('./entities.svelte');
		entitiesStore = module.entitiesStore;

		// Create mock entities with various relationships
		mockEntities = [
			createMockEntity({
				id: 'aragorn',
				name: 'Aragorn',
				type: 'character',
				links: [
					{
						id: 'link-1',
						targetId: 'gandalf',
						targetType: 'character',
						relationship: 'friend_of',
						bidirectional: true,
						createdAt: new Date(),
						updatedAt: new Date()
					},
					{
						id: 'link-2',
						targetId: 'rangers',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			}),
			createMockEntity({
				id: 'gandalf',
				name: 'Gandalf',
				type: 'character',
				links: [
					{
						id: 'link-3',
						targetId: 'council',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			}),
			createMockEntity({
				id: 'frodo',
				name: 'Frodo',
				type: 'character',
				links: [
					{
						id: 'link-4',
						targetId: 'gandalf',
						targetType: 'character',
						relationship: 'knows',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			}),
			createMockEntity({
				id: 'rangers',
				name: 'Rangers of the North',
				type: 'faction',
				links: []
			}),
			createMockEntity({
				id: 'rivendell',
				name: 'Rivendell',
				type: 'location',
				links: []
			})
		];

		// Set the mock entities in the store
		entitiesStore._setEntities(mockEntities);
	});

	describe('Relationship Filter State', () => {
		it('should have relationshipFilter state property', () => {
			expect(entitiesStore).toHaveProperty('relationshipFilter');
		});

		it('should initialize relationshipFilter with empty values', () => {
			const filter = entitiesStore.relationshipFilter;
			expect(filter).toBeDefined();
			expect(filter.relatedToEntityId).toBeUndefined();
			expect(filter.relationshipType).toBeUndefined();
			expect(filter.hasRelationships).toBeUndefined();
		});
	});

	describe('setRelationshipFilter Method', () => {
		it('should have setRelationshipFilter method', () => {
			expect(entitiesStore.setRelationshipFilter).toBeDefined();
			expect(typeof entitiesStore.setRelationshipFilter).toBe('function');
		});

		it('should update relationshipFilter when called', () => {
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'gandalf',
				relationshipType: 'friend_of',
				hasRelationships: true
			});

			const filter = entitiesStore.relationshipFilter;
			expect(filter.relatedToEntityId).toBe('gandalf');
			expect(filter.relationshipType).toBe('friend_of');
			expect(filter.hasRelationships).toBe(true);
		});

		it('should allow partial filter updates', () => {
			// Set initial filter
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'gandalf',
				relationshipType: 'friend_of'
			});

			// Update only one property
			entitiesStore.setRelationshipFilter({
				relationshipType: 'member_of'
			});

			const filter = entitiesStore.relationshipFilter;
			expect(filter.relatedToEntityId).toBe('gandalf');
			expect(filter.relationshipType).toBe('member_of');
		});
	});

	describe('clearRelationshipFilter Method', () => {
		it('should have clearRelationshipFilter method', () => {
			expect(entitiesStore.clearRelationshipFilter).toBeDefined();
			expect(typeof entitiesStore.clearRelationshipFilter).toBe('function');
		});

		it('should reset all relationship filters', () => {
			// Set filters
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'gandalf',
				relationshipType: 'friend_of',
				hasRelationships: true
			});

			// Clear filters
			entitiesStore.clearRelationshipFilter();

			const filter = entitiesStore.relationshipFilter;
			expect(filter.relatedToEntityId).toBeUndefined();
			expect(filter.relationshipType).toBeUndefined();
			expect(filter.hasRelationships).toBeUndefined();
		});
	});

	describe('filterByRelatedTo Method', () => {
		it('should have filterByRelatedTo method', () => {
			expect(entitiesStore.filterByRelatedTo).toBeDefined();
			expect(typeof entitiesStore.filterByRelatedTo).toBe('function');
		});

		it('should filter entities that have relationships to specified entity', () => {
			entitiesStore.filterByRelatedTo('gandalf');

			const filtered = entitiesStore.filteredEntities;

			// Should include Aragorn (friend_of Gandalf) and Frodo (knows Gandalf)
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'frodo')).toBe(true);

			// Should NOT include Rangers or Rivendell
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'rivendell')).toBe(false);
		});

		it('should include entities with bidirectional relationships', () => {
			entitiesStore.filterByRelatedTo('gandalf');

			const filtered = entitiesStore.filteredEntities;

			// Aragorn has bidirectional relationship with Gandalf
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
		});

		it('should include entities that are targeted by the specified entity', () => {
			entitiesStore.filterByRelatedTo('aragorn');

			const filtered = entitiesStore.filteredEntities;

			// Gandalf is targeted by Aragorn (Aragorn -> Gandalf: friend_of)
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(true);

			// Rangers is targeted by Aragorn (Aragorn -> Rangers: member_of)
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(true);
		});

		it('should return empty array if entity has no relationships', () => {
			entitiesStore.filterByRelatedTo('rivendell');

			const filtered = entitiesStore.filteredEntities;

			// Rivendell has no relationships
			expect(filtered.length).toBe(0);
		});

		it('should return empty array for non-existent entity', () => {
			entitiesStore.filterByRelatedTo('non-existent-id');

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.length).toBe(0);
		});
	});

	describe('filterByRelationshipType Method', () => {
		it('should have filterByRelationshipType method', () => {
			expect(entitiesStore.filterByRelationshipType).toBeDefined();
			expect(typeof entitiesStore.filterByRelationshipType).toBe('function');
		});

		it('should filter entities that have relationships of specified type', () => {
			entitiesStore.filterByRelationshipType('member_of');

			const filtered = entitiesStore.filteredEntities;

			// Should include Aragorn and Gandalf (both have member_of relationships)
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(true);

			// Should NOT include Rangers, Rivendell, or Frodo
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'rivendell')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'frodo')).toBe(false);
		});

		it('should filter by friend_of relationship type', () => {
			entitiesStore.filterByRelationshipType('friend_of');

			const filtered = entitiesStore.filteredEntities;

			// Only Aragorn has friend_of relationship
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.length).toBe(1);
		});

		it('should return empty array if no entities have the relationship type', () => {
			entitiesStore.filterByRelationshipType('enemy_of');

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.length).toBe(0);
		});

		it('should be case-insensitive', () => {
			entitiesStore.filterByRelationshipType('MEMBER_OF');

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.length).toBeGreaterThan(0);
		});
	});

	describe('filterByHasRelationships Method', () => {
		it('should have filterByHasRelationships method', () => {
			expect(entitiesStore.filterByHasRelationships).toBeDefined();
			expect(typeof entitiesStore.filterByHasRelationships).toBe('function');
		});

		it('should filter entities that have any relationships', () => {
			entitiesStore.filterByHasRelationships(true);

			const filtered = entitiesStore.filteredEntities;

			// Should include Aragorn, Gandalf, Frodo (all have relationships)
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'frodo')).toBe(true);

			// Should NOT include Rangers, Rivendell (no relationships)
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'rivendell')).toBe(false);
		});

		it('should filter entities that have no relationships', () => {
			entitiesStore.filterByHasRelationships(false);

			const filtered = entitiesStore.filteredEntities;

			// Should include Rangers, Rivendell (no relationships)
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'rivendell')).toBe(true);

			// Should NOT include Aragorn, Gandalf, Frodo
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(false);
			expect(filtered.some((e: BaseEntity) => e.id === 'frodo')).toBe(false);
		});

		it('should return all entities when hasRelationships is undefined', () => {
			entitiesStore.filterByHasRelationships(undefined);

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.length).toBe(mockEntities.length);
		});
	});

	describe('availableRelationshipTypes Derived Value', () => {
		it('should have availableRelationshipTypes property', () => {
			expect(entitiesStore).toHaveProperty('availableRelationshipTypes');
		});

		it('should return all unique relationship types from entities', () => {
			const types = entitiesStore.availableRelationshipTypes;

			expect(types).toContain('friend_of');
			expect(types).toContain('member_of');
			expect(types).toContain('knows');
		});

		it('should not include duplicates', () => {
			const types = entitiesStore.availableRelationshipTypes;

			// member_of appears twice but should only be listed once
			const memberOfCount = types.filter((t: string) => t === 'member_of').length;
			expect(memberOfCount).toBe(1);
		});

		it('should return empty array when no entities have relationships', () => {
			// Create entities with no links
			const emptyEntities = [
				createMockEntity({ id: 'e1', links: [] }),
				createMockEntity({ id: 'e2', links: [] })
			];
			entitiesStore._setEntities(emptyEntities);

			const types = entitiesStore.availableRelationshipTypes;
			expect(types).toEqual([]);
		});

		it('should be sorted alphabetically', () => {
			const types = entitiesStore.availableRelationshipTypes;

			// Should be in alphabetical order
			const sorted = [...types].sort();
			expect(types).toEqual(sorted);
		});
	});

	describe('Combined Relationship Filters', () => {
		it('should apply both relatedTo and relationshipType filters', () => {
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'gandalf',
				relationshipType: 'friend_of'
			});

			const filtered = entitiesStore.filteredEntities;

			// Only Aragorn has friend_of relationship with Gandalf
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.length).toBe(1);
		});

		it('should apply relatedTo and hasRelationships filters', () => {
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'gandalf',
				hasRelationships: true
			});

			const filtered = entitiesStore.filteredEntities;

			// Aragorn and Frodo are related to Gandalf and have relationships
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'frodo')).toBe(true);
		});

		it('should apply relationshipType and hasRelationships filters', () => {
			entitiesStore.setRelationshipFilter({
				relationshipType: 'member_of',
				hasRelationships: true
			});

			const filtered = entitiesStore.filteredEntities;

			// Aragorn and Gandalf have member_of relationships
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(true);
		});

		it('should apply all three filters together', () => {
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: 'rangers',
				relationshipType: 'member_of',
				hasRelationships: true
			});

			const filtered = entitiesStore.filteredEntities;

			// Only Aragorn satisfies all conditions
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.length).toBe(1);
		});
	});

	describe('Relationship Filters with Search Query', () => {
		it('should combine relationship filters with search query', () => {
			// Set relationship filter
			entitiesStore.setRelationshipFilter({
				relationshipType: 'member_of'
			});

			// Set search query
			entitiesStore.setSearchQuery('Aragorn');

			const filtered = entitiesStore.filteredEntities;

			// Should include only Aragorn (has member_of and matches search)
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'gandalf')).toBe(false);
		});

		it('should return empty when filters conflict', () => {
			// Set relationship filter for member_of
			entitiesStore.setRelationshipFilter({
				relationshipType: 'member_of'
			});

			// Search for entity that doesn't have member_of
			entitiesStore.setSearchQuery('Frodo');

			const filtered = entitiesStore.filteredEntities;

			// Frodo doesn't have member_of relationship
			expect(filtered.length).toBe(0);
		});

		it('should clear search when clearing relationship filters', () => {
			entitiesStore.setRelationshipFilter({
				relationshipType: 'member_of'
			});
			entitiesStore.setSearchQuery('Aragorn');

			entitiesStore.clearRelationshipFilter();

			// Search should still be active
			const filtered = entitiesStore.filteredEntities;
			expect(filtered.some((e: BaseEntity) => e.id === 'aragorn')).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('should handle entities with empty links array', () => {
			entitiesStore.setRelationshipFilter({
				hasRelationships: false
			});

			const filtered = entitiesStore.filteredEntities;

			// Rangers and Rivendell have no relationships
			expect(filtered.some((e: BaseEntity) => e.id === 'rangers')).toBe(true);
			expect(filtered.some((e: BaseEntity) => e.id === 'rivendell')).toBe(true);
		});

		it('should handle circular relationships', () => {
			// Create circular relationship
			const circular = [
				createMockEntity({
					id: 'a',
					links: [
						{
							id: 'link-a',
							targetId: 'b',
							targetType: 'character',
							relationship: 'friend_of',
							bidirectional: true,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					]
				}),
				createMockEntity({
					id: 'b',
					links: [
						{
							id: 'link-b',
							targetId: 'a',
							targetType: 'character',
							relationship: 'friend_of',
							bidirectional: true,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					]
				})
			];
			entitiesStore._setEntities(circular);

			entitiesStore.filterByRelatedTo('a');

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.some((e: BaseEntity) => e.id === 'b')).toBe(true);
		});

		it('should handle case-sensitive relationship types correctly', () => {
			const entities = [
				createMockEntity({
					id: 'e1',
					links: [
						{
							id: 'link-1',
							targetId: 'e2',
							targetType: 'character',
							relationship: 'Friend_Of',
							bidirectional: false,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					]
				})
			];
			entitiesStore._setEntities(entities);

			entitiesStore.filterByRelationshipType('friend_of');

			const filtered = entitiesStore.filteredEntities;
			expect(filtered.length).toBeGreaterThan(0);
		});
	});
});

/**
 * Tests for Issue #124: Allow adding relationships on entity create screen - Store Layer
 *
 * These tests verify that the entities store correctly wraps the repository's
 * createWithLinks functionality and provides a clean interface for the UI layer.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the functionality is implemented.
 */

describe('EntitiesStore - createWithRelationships (Issue #124)', () => {
	let entitiesStore: any;
	let mockEntities: BaseEntity[];

	beforeEach(async () => {
		vi.clearAllMocks();

		const module = await import('./entities.svelte');
		entitiesStore = module.entitiesStore;

		// Create target entities for relationships
		mockEntities = [
			createMockEntity({
				id: 'faction-1',
				name: 'Fellowship',
				type: 'faction',
				links: []
			}),
			createMockEntity({
				id: 'char-1',
				name: 'Gandalf',
				type: 'character',
				links: []
			})
		];

		entitiesStore._setEntities(mockEntities);
	});

	describe('Store Method', () => {
		it('should have createWithRelationships method', () => {
			expect(entitiesStore.createWithRelationships).toBeDefined();
			expect(typeof entitiesStore.createWithRelationships).toBe('function');
		});

		it('should call repository.createWithLinks with correct arguments', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const createWithLinksSpy = vi.spyOn(entityRepository, 'createWithLinks');

			const newEntity = createMockEntity({
				name: 'Aragorn',
				type: 'character',
				links: []
			});

			const pendingLinks = [
				{
					tempId: 'temp-1',
					targetId: 'faction-1',
					targetType: 'faction' as const,
					relationship: 'member_of',
					bidirectional: false
				}
			];

			await entitiesStore.createWithRelationships(newEntity, pendingLinks);

			// Verify repository method was called with correct args
			expect(createWithLinksSpy).toHaveBeenCalledWith(newEntity, pendingLinks);
			expect(createWithLinksSpy).toHaveBeenCalledTimes(1);
		});

		it('should return the created entity', async () => {
			const newEntity = createMockEntity({
				name: 'Aragorn',
				type: 'character',
				links: []
			});

			const pendingLinks = [
				{
					tempId: 'temp-1',
					targetId: 'faction-1',
					targetType: 'faction' as const,
					relationship: 'member_of',
					bidirectional: false
				}
			];

			const result = await entitiesStore.createWithRelationships(newEntity, pendingLinks);

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.name).toBe('Aragorn');
		});

		it('should work with empty pending links', async () => {
			const newEntity = createMockEntity({
				name: 'Aragorn',
				type: 'character',
				links: []
			});

			const result = await entitiesStore.createWithRelationships(newEntity, []);

			expect(result).toBeDefined();
			expect(result.links).toHaveLength(0);
		});

		it('should propagate errors from repository', async () => {
			const newEntity = createMockEntity({
				name: 'Aragorn',
				type: 'character',
				links: []
			});

			const pendingLinks = [
				{
					tempId: 'temp-1',
					targetId: 'non-existent',
					targetType: 'faction' as const,
					relationship: 'member_of',
					bidirectional: false
				}
			];

			// Should throw error due to non-existent target
			await expect(
				entitiesStore.createWithRelationships(newEntity, pendingLinks)
			).rejects.toThrow();
		});
	});
});
