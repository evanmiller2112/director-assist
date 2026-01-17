import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { entityRepository } from './entityRepository';
import { db } from '../index';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity, EntityLink, ChainNode } from '$lib/types';

describe('EntityRepository - Enhanced EntityLink Data Model (Issue #65)', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;

	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear database before each test
		await db.entities.clear();

		// Create test entities
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Aragorn',
			type: 'character',
			links: []
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Fellowship of the Ring',
			type: 'faction',
			links: []
		});

		// Add entities to database
		await db.entities.add(sourceEntity);
		await db.entities.add(targetEntity);
	});

	afterEach(async () => {
		// Clean up
		await db.entities.clear();
	});

	describe('EntityLink Interface - New Fields', () => {
		describe('sourceId field', () => {
			it('should populate sourceId when creating a link', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'member_of',
					false
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				expect(updatedSource).toBeDefined();
				expect(updatedSource!.links).toHaveLength(1);

				const link = updatedSource!.links[0];
				expect(link.sourceId).toBe(sourceEntity.id);
			});

			it('should populate sourceId for bidirectional links on both sides', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'member_of',
					true
				);

				// Check forward link
				const updatedSource = await db.entities.get(sourceEntity.id);
				expect(updatedSource!.links[0].sourceId).toBe(sourceEntity.id);

				// Check reverse link
				const updatedTarget = await db.entities.get(targetEntity.id);
				expect(updatedTarget!.links[0].sourceId).toBe(targetEntity.id);
			});

			it('should require sourceId for new links', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				// sourceId should always be populated
				expect(link.sourceId).toBeDefined();
				expect(link.sourceId).toBe(sourceEntity.id);
			});
		});

		describe('strength field', () => {
			it('should accept "strong" strength value', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					false,
					undefined, // notes
					'strong'
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];
				expect(link.strength).toBe('strong');
			});

			it('should accept "moderate" strength value', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					undefined,
					'moderate'
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];
				expect(link.strength).toBe('moderate');
			});

			it('should accept "weak" strength value', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					undefined,
					'weak'
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];
				expect(link.strength).toBe('weak');
			});

			it('should be optional (undefined when not provided)', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];
				expect(link.strength).toBeUndefined();
			});

			it('should propagate strength to bidirectional reverse links', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					true,
					undefined,
					'strong'
				);

				// Both sides should have the same strength
				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				expect(updatedSource!.links[0].strength).toBe('strong');
				expect(updatedTarget!.links[0].strength).toBe('strong');
			});
		});

		describe('timestamp fields (createdAt, updatedAt)', () => {
			it('should set createdAt timestamp when creating a link', async () => {
				const beforeCreate = new Date();
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'member_of',
					false
				);
				const afterCreate = new Date();

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.createdAt).toBeDefined();
				expect(new Date(link.createdAt!).getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
				expect(new Date(link.createdAt!).getTime()).toBeLessThanOrEqual(afterCreate.getTime());
			});

			it('should set updatedAt timestamp when creating a link', async () => {
				const beforeCreate = new Date();
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'member_of',
					false
				);
				const afterCreate = new Date();

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.updatedAt).toBeDefined();
				expect(new Date(link.updatedAt!).getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
				expect(new Date(link.updatedAt!).getTime()).toBeLessThanOrEqual(afterCreate.getTime());
			});

			it('should set timestamps for bidirectional links on both sides', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					true
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				// Both links should have timestamps
				expect(updatedSource!.links[0].createdAt).toBeDefined();
				expect(updatedSource!.links[0].updatedAt).toBeDefined();
				expect(updatedTarget!.links[0].createdAt).toBeDefined();
				expect(updatedTarget!.links[0].updatedAt).toBeDefined();
			});

			it('should have createdAt and updatedAt equal when first created', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(new Date(link.createdAt!).getTime()).toEqual(new Date(link.updatedAt!).getTime());
			});
		});

		describe('metadata field', () => {
			it('should accept metadata with tags', async () => {
				const metadata = { tags: ['alliance', 'quest'] };

				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					false,
					undefined,
					undefined,
					metadata
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata).toBeDefined();
				expect(link.metadata?.tags).toEqual(['alliance', 'quest']);
			});

			it('should accept metadata with tension value', async () => {
				const metadata = { tension: 7 };

				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'enemy_of',
					false,
					undefined,
					undefined,
					metadata
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata).toBeDefined();
				expect(link.metadata?.tension).toBe(7);
			});

			it('should accept metadata with both tags and tension', async () => {
				const metadata = {
					tags: ['rivalry', 'conflict'],
					tension: 8
				};

				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'enemy_of',
					false,
					undefined,
					undefined,
					metadata
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata?.tags).toEqual(['rivalry', 'conflict']);
				expect(link.metadata?.tension).toBe(8);
			});

			it('should be optional (undefined when not provided)', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata).toBeUndefined();
			});

			it('should accept empty metadata object', async () => {
				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					undefined,
					undefined,
					{}
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata).toEqual({});
			});

			it('should support extensible metadata fields beyond tags and tension', async () => {
				const metadata = {
					tags: ['test'],
					tension: 5,
					customField: 'custom value',
					anotherField: 42
				};

				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					undefined,
					undefined,
					metadata as any
				);

				const updatedSource = await db.entities.get(sourceEntity.id);
				const link = updatedSource!.links[0];

				expect(link.metadata).toMatchObject(metadata);
			});
		});
	});

	describe('addLink() Method - Parameter Updates', () => {
		it('should accept strength as optional parameter', async () => {
			// Should not throw when strength is provided
			await expect(
				entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					false,
					undefined,
					'strong'
				)
			).resolves.not.toThrow();
		});

		it('should accept metadata as optional parameter', async () => {
			const metadata = { tags: ['test'], tension: 5 };

			// Should not throw when metadata is provided
			await expect(
				entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					undefined,
					undefined,
					metadata
				)
			).resolves.not.toThrow();
		});

		it('should work with existing notes parameter', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'member_of',
				false,
				'Joined at the Council'
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const link = updatedSource!.links[0];

			expect(link.notes).toBe('Joined at the Council');
		});

		it('should accept all new optional parameters together', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'allied_with',
				true,
				'Strong alliance formed',
				'strong',
				{ tags: ['alliance'], tension: 2 }
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const link = updatedSource!.links[0];

			expect(link.notes).toBe('Strong alliance formed');
			expect(link.strength).toBe('strong');
			expect(link.metadata).toEqual({ tags: ['alliance'], tension: 2 });
		});

		it('should maintain backward compatibility with existing call signatures', async () => {
			// Old signature: (sourceId, targetId, relationship, bidirectional, notes)
			await expect(
				entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'knows',
					false,
					'Old style call'
				)
			).resolves.not.toThrow();

			const updatedSource = await db.entities.get(sourceEntity.id);
			expect(updatedSource!.links[0].notes).toBe('Old style call');
		});
	});

	describe('updateLink() Method - New Functionality', () => {
		let linkId: string;

		beforeEach(async () => {
			// Create a link to update
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'knows',
				false,
				'Initial notes'
			);

			const entity = await db.entities.get(sourceEntity.id);
			linkId = entity!.links[0].id;
		});

		it('should update link notes', async () => {
			await entityRepository.updateLink(sourceEntity.id, linkId, {
				notes: 'Updated notes'
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const link = updatedEntity!.links.find((l) => l.id === linkId);

			expect(link?.notes).toBe('Updated notes');
		});

		it('should update link relationship', async () => {
			await entityRepository.updateLink(sourceEntity.id, linkId, {
				relationship: 'friend_of'
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const link = updatedEntity!.links.find((l) => l.id === linkId);

			expect(link?.relationship).toBe('friend_of');
		});

		it('should update link strength', async () => {
			await entityRepository.updateLink(sourceEntity.id, linkId, {
				strength: 'strong'
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const link = updatedEntity!.links.find((l) => l.id === linkId);

			expect(link?.strength).toBe('strong');
		});

		it('should update link metadata', async () => {
			const newMetadata = { tags: ['updated'], tension: 9 };

			await entityRepository.updateLink(sourceEntity.id, linkId, {
				metadata: newMetadata
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const link = updatedEntity!.links.find((l) => l.id === linkId);

			expect(link?.metadata).toEqual(newMetadata);
		});

		it('should update multiple fields at once', async () => {
			await entityRepository.updateLink(sourceEntity.id, linkId, {
				notes: 'Multi-update',
				relationship: 'allied_with',
				strength: 'moderate',
				metadata: { tags: ['multi'], tension: 5 }
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const link = updatedEntity!.links.find((l) => l.id === linkId);

			expect(link?.notes).toBe('Multi-update');
			expect(link?.relationship).toBe('allied_with');
			expect(link?.strength).toBe('moderate');
			expect(link?.metadata).toEqual({ tags: ['multi'], tension: 5 });
		});

		it('should update updatedAt timestamp when link is modified', async () => {
			// Get initial link
			const initialEntity = await db.entities.get(sourceEntity.id);
			const initialLink = initialEntity!.links.find((l) => l.id === linkId);
			const initialUpdatedAt = new Date(initialLink!.updatedAt!).getTime();

			// Small delay to ensure time difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await entityRepository.updateLink(sourceEntity.id, linkId, {
				notes: 'Time update test'
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const updatedLink = updatedEntity!.links.find((l) => l.id === linkId);
			const newUpdatedAt = new Date(updatedLink!.updatedAt!).getTime();

			expect(newUpdatedAt).toBeGreaterThanOrEqual(initialUpdatedAt);
		});

		it('should NOT update createdAt timestamp when link is modified', async () => {
			const initialEntity = await db.entities.get(sourceEntity.id);
			const initialLink = initialEntity!.links.find((l) => l.id === linkId);
			const initialCreatedAt = new Date(initialLink!.createdAt!).getTime();

			await entityRepository.updateLink(sourceEntity.id, linkId, {
				notes: 'Created should not change'
			});

			const updatedEntity = await db.entities.get(sourceEntity.id);
			const updatedLink = updatedEntity!.links.find((l) => l.id === linkId);

			expect(new Date(updatedLink!.createdAt!).getTime()).toEqual(initialCreatedAt);
		});

		it('should throw error if link not found', async () => {
			await expect(
				entityRepository.updateLink(sourceEntity.id, 'nonexistent-id', {
					notes: 'Should fail'
				})
			).rejects.toThrow();
		});

		it('should throw error if source entity not found', async () => {
			await expect(
				entityRepository.updateLink('nonexistent-source', linkId, {
					notes: 'Should fail'
				})
			).rejects.toThrow();
		});

		describe('Bidirectional Link Updates', () => {
			let bidirectionalLinkId: string;
			let reverseLinkId: string;

			beforeEach(async () => {
				// Create bidirectional link
				await db.entities.update(sourceEntity.id, { links: [] });
				await db.entities.update(targetEntity.id, { links: [] });

				await entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'allied_with',
					true,
					'Bidirectional alliance'
				);

				const source = await db.entities.get(sourceEntity.id);
				const target = await db.entities.get(targetEntity.id);
				bidirectionalLinkId = source!.links[0].id;
				reverseLinkId = target!.links[0].id;
			});

			it('should update relationship on both sides when updating bidirectional link', async () => {
				await entityRepository.updateLink(sourceEntity.id, bidirectionalLinkId, {
					relationship: 'enemy_of'
				});

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				const forwardLink = updatedSource!.links.find((l) => l.id === bidirectionalLinkId);
				const reverseLink = updatedTarget!.links.find((l) => l.id === reverseLinkId);

				expect(forwardLink?.relationship).toBe('enemy_of');
				expect(reverseLink?.relationship).toBe(
					entityRepository.getInverseRelationship('enemy_of')
				);
			});

			it('should update strength on both sides of bidirectional link', async () => {
				await entityRepository.updateLink(sourceEntity.id, bidirectionalLinkId, {
					strength: 'weak'
				});

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				expect(updatedSource!.links[0].strength).toBe('weak');
				expect(updatedTarget!.links[0].strength).toBe('weak');
			});

			it('should update metadata on both sides of bidirectional link', async () => {
				const metadata = { tags: ['sync'], tension: 7 };

				await entityRepository.updateLink(sourceEntity.id, bidirectionalLinkId, {
					metadata
				});

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				expect(updatedSource!.links[0].metadata).toEqual(metadata);
				expect(updatedTarget!.links[0].metadata).toEqual(metadata);
			});

			it('should NOT sync notes field to reverse link', async () => {
				await entityRepository.updateLink(sourceEntity.id, bidirectionalLinkId, {
					notes: 'Source-specific notes'
				});

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				expect(updatedSource!.links[0].notes).toBe('Source-specific notes');
				// Target should keep original notes or not have this change
				expect(updatedTarget!.links[0].notes).not.toBe('Source-specific notes');
			});

			it('should update updatedAt timestamp on both sides', async () => {
				// Small delay to ensure time difference
				await new Promise((resolve) => setTimeout(resolve, 10));

				await entityRepository.updateLink(sourceEntity.id, bidirectionalLinkId, {
					relationship: 'friend_of'
				});

				const updatedSource = await db.entities.get(sourceEntity.id);
				const updatedTarget = await db.entities.get(targetEntity.id);

				// Both sides should have updatedAt defined
				expect(updatedSource!.links[0].updatedAt).toBeDefined();
				expect(updatedTarget!.links[0].updatedAt).toBeDefined();
			});
		});
	});

	describe('Backward Compatibility', () => {
		it('should work with existing links without new fields', async () => {
			// Create an old-style link without new fields
			const oldLink: EntityLink = {
				id: 'old-link-1',
				targetId: targetEntity.id,
				targetType: targetEntity.type,
				relationship: 'knows',
				bidirectional: false,
				notes: 'Old link'
				// No sourceId, strength, metadata, or timestamps
			} as any;

			await db.entities.update(sourceEntity.id, {
				links: [oldLink]
			});

			// Should be able to retrieve and work with this link
			const entity = await db.entities.get(sourceEntity.id);
			expect(entity!.links).toHaveLength(1);
			expect(entity!.links[0].id).toBe('old-link-1');
			expect(entity!.links[0].notes).toBe('Old link');
		});

		it('should allow removing old links without new fields', async () => {
			const oldLink: EntityLink = {
				id: 'old-link-1',
				targetId: targetEntity.id,
				targetType: targetEntity.type,
				relationship: 'knows',
				bidirectional: false
			} as any;

			await db.entities.update(sourceEntity.id, {
				links: [oldLink]
			});

			// Should successfully remove old-style link
			await expect(
				entityRepository.removeLink(sourceEntity.id, targetEntity.id)
			).resolves.not.toThrow();

			const entity = await db.entities.get(sourceEntity.id);
			expect(entity!.links).toHaveLength(0);
		});

		it('should handle mixed old and new links in same entity', async () => {
			// Old link without new fields
			const oldLink: EntityLink = {
				id: 'old-link',
				targetId: targetEntity.id,
				targetType: targetEntity.type,
				relationship: 'knows',
				bidirectional: false
			} as any;

			await db.entities.update(sourceEntity.id, {
				links: [oldLink]
			});

			// Add a new link with all new fields
			const anotherTarget = createMockEntity({
				id: 'target-2',
				name: 'Gandalf',
				type: 'character'
			});
			await db.entities.add(anotherTarget);

			await entityRepository.addLink(
				sourceEntity.id,
				anotherTarget.id,
				'friend_of',
				false,
				'New link',
				'strong',
				{ tags: ['friendship'] }
			);

			const entity = await db.entities.get(sourceEntity.id);
			expect(entity!.links).toHaveLength(2);

			// Old link should still be there
			const oldRetrieved = entity!.links.find((l) => l.id === 'old-link');
			expect(oldRetrieved).toBeDefined();
			expect(oldRetrieved!.sourceId).toBeUndefined();

			// New link should have all fields
			const newRetrieved = entity!.links.find((l) => l.targetId === anotherTarget.id);
			expect(newRetrieved).toBeDefined();
			expect(newRetrieved!.sourceId).toBe(sourceEntity.id);
			expect(newRetrieved!.strength).toBe('strong');
			expect(newRetrieved!.metadata).toBeDefined();
		});

		it('should not break getLinkedEntities with old links', async () => {
			const oldLink: EntityLink = {
				id: 'old-link',
				targetId: targetEntity.id,
				targetType: targetEntity.type,
				relationship: 'knows',
				bidirectional: false
			} as any;

			await db.entities.update(sourceEntity.id, {
				links: [oldLink]
			});

			const linkedEntities = await entityRepository.getLinkedEntities(sourceEntity.id);
			expect(linkedEntities).toHaveLength(1);
			expect(linkedEntities[0].id).toBe(targetEntity.id);
		});

		it('should handle updateLink for old links without timestamps', async () => {
			const oldLink: EntityLink = {
				id: 'old-link',
				targetId: targetEntity.id,
				targetType: targetEntity.type,
				relationship: 'knows',
				bidirectional: false,
				notes: 'Old note'
			} as any;

			await db.entities.update(sourceEntity.id, {
				links: [oldLink]
			});

			// Should be able to update old link
			await expect(
				entityRepository.updateLink(sourceEntity.id, 'old-link', {
					notes: 'Updated old link',
					strength: 'moderate'
				})
			).resolves.not.toThrow();

			const entity = await db.entities.get(sourceEntity.id);
			const link = entity!.links.find((l) => l.id === 'old-link');

			expect(link?.notes).toBe('Updated old link');
			expect(link?.strength).toBe('moderate');
			// Should now have updatedAt timestamp
			expect(link?.updatedAt).toBeDefined();
		});
	});

	describe('Edge Cases and Validation', () => {
		it('should handle tension values outside 0-10 range', async () => {
			const metadata = { tension: 15 };

			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'enemy_of',
				false,
				undefined,
				undefined,
				metadata
			);

			const entity = await db.entities.get(sourceEntity.id);
			// Should store the value even if out of typical range
			expect(entity!.links[0].metadata?.tension).toBe(15);
		});

		it('should handle empty tags array in metadata', async () => {
			const metadata = { tags: [] };

			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'knows',
				false,
				undefined,
				undefined,
				metadata
			);

			const entity = await db.entities.get(sourceEntity.id);
			expect(entity!.links[0].metadata?.tags).toEqual([]);
		});

		it('should handle very long notes with new fields', async () => {
			const longNotes = 'A'.repeat(5000);

			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'knows',
				false,
				longNotes,
				'weak',
				{ tags: ['test'] }
			);

			const entity = await db.entities.get(sourceEntity.id);
			expect(entity!.links[0].notes).toBe(longNotes);
			expect(entity!.links[0].strength).toBe('weak');
		});

		it('should preserve all new fields when updating entity', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'allied_with',
				false,
				'Alliance notes',
				'strong',
				{ tags: ['alliance'], tension: 3 }
			);

			// Update the entity itself (not the link)
			await entityRepository.update(sourceEntity.id, {
				name: 'Updated Aragorn'
			});

			const entity = await db.entities.get(sourceEntity.id);
			const link = entity!.links[0];

			// All link fields should be preserved
			expect(link.notes).toBe('Alliance notes');
			expect(link.strength).toBe('strong');
			expect(link.metadata).toEqual({ tags: ['alliance'], tension: 3 });
			expect(link.sourceId).toBe(sourceEntity.id);
			expect(link.createdAt).toBeDefined();
			expect(link.updatedAt).toBeDefined();
		});

		it('should handle null metadata values', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'knows',
				false,
				undefined,
				undefined,
				null as any
			);

			const entity = await db.entities.get(sourceEntity.id);
			// Should handle null gracefully (either as undefined or null)
			expect(entity!.links[0].metadata === null || entity!.links[0].metadata === undefined).toBe(
				true
			);
		});
	});

	describe('Asymmetric Bidirectional Relationships (reverseRelationship)', () => {
		it('should use custom reverseRelationship when provided for bidirectional link', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'patron_of',
				true, // bidirectional
				undefined, // notes
				undefined, // strength
				undefined, // metadata
				'client_of' // reverseRelationship
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const updatedTarget = await db.entities.get(targetEntity.id);

			// Forward link should have patron_of
			expect(updatedSource!.links[0].relationship).toBe('patron_of');
			// Reverse link should have client_of (NOT inverse_of_patron_of)
			expect(updatedTarget!.links[0].relationship).toBe('client_of');
		});

		it('should store reverseRelationship field on forward link', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'patron_of',
				true,
				undefined,
				undefined,
				undefined,
				'client_of'
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const forwardLink = updatedSource!.links[0];

			// Forward link should store the reverseRelationship
			expect(forwardLink.reverseRelationship).toBe('client_of');
		});

		it('should use reverseRelationship as relationship on reverse link', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'teacher_of',
				true,
				undefined,
				undefined,
				undefined,
				'student_of'
			);

			const updatedTarget = await db.entities.get(targetEntity.id);
			const reverseLink = updatedTarget!.links[0];

			// Reverse link's relationship should be the reverseRelationship value
			expect(reverseLink.relationship).toBe('student_of');
		});

		it('should store original relationship as reverseRelationship on reverse link', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'patron_of',
				true,
				undefined,
				undefined,
				undefined,
				'client_of'
			);

			const updatedTarget = await db.entities.get(targetEntity.id);
			const reverseLink = updatedTarget!.links[0];

			// Reverse link should store the original relationship as its reverseRelationship
			expect(reverseLink.reverseRelationship).toBe('patron_of');
		});

		it('should fall back to getInverseRelationship when reverseRelationship is not provided', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'member_of',
				true,
				undefined,
				undefined,
				undefined
				// reverseRelationship NOT provided
			);

			const updatedTarget = await db.entities.get(targetEntity.id);
			const reverseLink = updatedTarget!.links[0];

			// Should use the inverse mapping from getInverseRelationship
			expect(reverseLink.relationship).toBe('has_member');
			// reverseRelationship field should not be set
			expect(reverseLink.reverseRelationship).toBeUndefined();
		});

		it('should maintain backward compatibility when reverseRelationship is undefined', async () => {
			// Old-style bidirectional link without reverseRelationship
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'allied_with',
				true,
				'Old alliance'
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const updatedTarget = await db.entities.get(targetEntity.id);

			// Should use symmetric relationship (allied_with on both sides)
			expect(updatedSource!.links[0].relationship).toBe('allied_with');
			expect(updatedTarget!.links[0].relationship).toBe('allied_with');
			// reverseRelationship should not be set
			expect(updatedSource!.links[0].reverseRelationship).toBeUndefined();
			expect(updatedTarget!.links[0].reverseRelationship).toBeUndefined();
		});

		it('should handle asymmetric relationships correctly (patron_of/client_of example)', async () => {
			// Create a patron entity (wealthy merchant)
			const patronEntity = createMockEntity({
				id: 'patron-1',
				name: 'Wealthy Merchant',
				type: 'npc',
				links: []
			});

			// Create a client entity (struggling artist)
			const clientEntity = createMockEntity({
				id: 'client-1',
				name: 'Struggling Artist',
				type: 'character',
				links: []
			});

			await db.entities.add(patronEntity);
			await db.entities.add(clientEntity);

			// Merchant is patron_of Artist (Artist is client_of Merchant)
			await entityRepository.addLink(
				patronEntity.id,
				clientEntity.id,
				'patron_of',
				true,
				'Financial support for artistic endeavors',
				'strong',
				{ tags: ['patronage'], tension: 2 },
				'client_of'
			);

			const updatedPatron = await db.entities.get(patronEntity.id);
			const updatedClient = await db.entities.get(clientEntity.id);

			const patronLink = updatedPatron!.links[0];
			const clientLink = updatedClient!.links[0];

			// Patron's link
			expect(patronLink.targetId).toBe(clientEntity.id);
			expect(patronLink.relationship).toBe('patron_of');
			expect(patronLink.reverseRelationship).toBe('client_of');
			expect(patronLink.bidirectional).toBe(true);

			// Client's link
			expect(clientLink.targetId).toBe(patronEntity.id);
			expect(clientLink.relationship).toBe('client_of');
			expect(clientLink.reverseRelationship).toBe('patron_of');
			expect(clientLink.bidirectional).toBe(true);

			// Both should have same strength and metadata
			expect(patronLink.strength).toBe('strong');
			expect(clientLink.strength).toBe('strong');
			expect(patronLink.metadata).toEqual({ tags: ['patronage'], tension: 2 });
			expect(clientLink.metadata).toEqual({ tags: ['patronage'], tension: 2 });

			// Notes are link-specific (should only be on patron's side)
			expect(patronLink.notes).toBe('Financial support for artistic endeavors');
			expect(clientLink.notes).toBeUndefined();
		});

		it('should not set reverseRelationship on non-bidirectional links', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'patron_of',
				false, // NOT bidirectional
				undefined,
				undefined,
				undefined,
				'client_of' // This should be ignored
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const forwardLink = updatedSource!.links[0];

			// Link should be created but reverseRelationship parameter should not matter
			expect(forwardLink.relationship).toBe('patron_of');
			// No reverse link should be created
			const updatedTarget = await db.entities.get(targetEntity.id);
			expect(updatedTarget!.links).toHaveLength(0);
		});

		it('should accept reverseRelationship as optional 8th parameter in correct position', async () => {
			// Full parameter list:
			// sourceId, targetId, relationship, bidirectional, notes, strength, metadata, reverseRelationship
			await expect(
				entityRepository.addLink(
					sourceEntity.id,
					targetEntity.id,
					'master_of',
					true, // bidirectional
					'Master-apprentice relationship', // notes
					'strong', // strength
					{ tags: ['teaching'], tension: 1 }, // metadata
					'apprentice_of' // reverseRelationship
				)
			).resolves.not.toThrow();

			const updatedSource = await db.entities.get(sourceEntity.id);
			const link = updatedSource!.links[0];

			expect(link.relationship).toBe('master_of');
			expect(link.reverseRelationship).toBe('apprentice_of');
			expect(link.notes).toBe('Master-apprentice relationship');
			expect(link.strength).toBe('strong');
			expect(link.metadata).toEqual({ tags: ['teaching'], tension: 1 });
		});

		it('should handle multiple asymmetric relationships on same entity', async () => {
			// Create multiple entities
			const apprentice1 = createMockEntity({
				id: 'apprentice-1',
				name: 'First Apprentice',
				type: 'character',
				links: []
			});

			const apprentice2 = createMockEntity({
				id: 'apprentice-2',
				name: 'Second Apprentice',
				type: 'character',
				links: []
			});

			const client = createMockEntity({
				id: 'client-1',
				name: 'Client',
				type: 'npc',
				links: []
			});

			await db.entities.add(apprentice1);
			await db.entities.add(apprentice2);
			await db.entities.add(client);

			// Source is master of two apprentices
			await entityRepository.addLink(
				sourceEntity.id,
				apprentice1.id,
				'master_of',
				true,
				undefined,
				undefined,
				undefined,
				'apprentice_of'
			);

			await entityRepository.addLink(
				sourceEntity.id,
				apprentice2.id,
				'master_of',
				true,
				undefined,
				undefined,
				undefined,
				'apprentice_of'
			);

			// Source is also patron of a client
			await entityRepository.addLink(
				sourceEntity.id,
				client.id,
				'patron_of',
				true,
				undefined,
				undefined,
				undefined,
				'client_of'
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			expect(updatedSource!.links).toHaveLength(3);

			// Check each link has correct asymmetric relationship
			const masterLink1 = updatedSource!.links.find((l) => l.targetId === apprentice1.id);
			const masterLink2 = updatedSource!.links.find((l) => l.targetId === apprentice2.id);
			const patronLink = updatedSource!.links.find((l) => l.targetId === client.id);

			expect(masterLink1?.relationship).toBe('master_of');
			expect(masterLink1?.reverseRelationship).toBe('apprentice_of');

			expect(masterLink2?.relationship).toBe('master_of');
			expect(masterLink2?.reverseRelationship).toBe('apprentice_of');

			expect(patronLink?.relationship).toBe('patron_of');
			expect(patronLink?.reverseRelationship).toBe('client_of');

			// Check reverse links
			const updatedApprentice1 = await db.entities.get(apprentice1.id);
			expect(updatedApprentice1!.links[0].relationship).toBe('apprentice_of');
			expect(updatedApprentice1!.links[0].reverseRelationship).toBe('master_of');

			const updatedClient = await db.entities.get(client.id);
			expect(updatedClient!.links[0].relationship).toBe('client_of');
			expect(updatedClient!.links[0].reverseRelationship).toBe('patron_of');
		});

		it('should handle symmetric relationships that could use reverseRelationship but dont need to', async () => {
			// friend_of is symmetric - both sides use same relationship
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'friend_of',
				true,
				undefined,
				undefined,
				undefined,
				'friend_of' // Explicitly providing same relationship
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const updatedTarget = await db.entities.get(targetEntity.id);

			// Both should have friend_of
			expect(updatedSource!.links[0].relationship).toBe('friend_of');
			expect(updatedTarget!.links[0].relationship).toBe('friend_of');

			// reverseRelationship should be stored
			expect(updatedSource!.links[0].reverseRelationship).toBe('friend_of');
			expect(updatedTarget!.links[0].reverseRelationship).toBe('friend_of');
		});

		it('should preserve reverseRelationship through JSON serialization', async () => {
			await entityRepository.addLink(
				sourceEntity.id,
				targetEntity.id,
				'employer_of',
				true,
				undefined,
				undefined,
				undefined,
				'employee_of'
			);

			const updatedSource = await db.entities.get(sourceEntity.id);
			const link = updatedSource!.links[0];

			// Serialize and deserialize (simulating database round-trip)
			const serialized = JSON.stringify(link);
			const deserialized = JSON.parse(serialized);

			expect(deserialized.relationship).toBe('employer_of');
			expect(deserialized.reverseRelationship).toBe('employee_of');
		});
	});
});

describe('EntityRepository - Relationship Query Methods (Issue #71)', () => {
	let character1: BaseEntity;
	let character2: BaseEntity;
	let character3: BaseEntity;
	let faction1: BaseEntity;
	let faction2: BaseEntity;
	let location1: BaseEntity;

	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear database before each test
		await db.entities.clear();

		// Create test entities with a variety of relationships
		character1 = createMockEntity({
			id: 'char-1',
			name: 'Aragorn',
			type: 'character',
			links: []
		});

		character2 = createMockEntity({
			id: 'char-2',
			name: 'Legolas',
			type: 'character',
			links: []
		});

		character3 = createMockEntity({
			id: 'char-3',
			name: 'Gimli',
			type: 'character',
			links: []
		});

		faction1 = createMockEntity({
			id: 'faction-1',
			name: 'Fellowship of the Ring',
			type: 'faction',
			links: []
		});

		faction2 = createMockEntity({
			id: 'faction-2',
			name: 'Rangers of the North',
			type: 'faction',
			links: []
		});

		location1 = createMockEntity({
			id: 'loc-1',
			name: 'Rivendell',
			type: 'location',
			links: []
		});

		// Add all entities to database
		await db.entities.bulkAdd([
			character1,
			character2,
			character3,
			faction1,
			faction2,
			location1
		]);
	});

	afterEach(async () => {
		// Clean up
		await db.entities.clear();
	});

	describe('queryByRelationship', () => {
		it('should find all entities with a specific relationship type', async () => {
			// Create various relationships
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character2.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character3.id, faction2.id, 'member_of', false);
			await entityRepository.addLink(character1.id, character2.id, 'friend_of', true);

			const results = await entityRepository.queryByRelationship('member_of');

			expect(results).toHaveLength(3);
			expect(results.map((e) => e.id).sort()).toEqual(['char-1', 'char-2', 'char-3']);
		});

		it('should return empty array when no entities have the relationship', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);

			const results = await entityRepository.queryByRelationship('enemy_of');

			expect(results).toEqual([]);
		});

		it('should return empty array when database is empty', async () => {
			await db.entities.clear();

			const results = await entityRepository.queryByRelationship('member_of');

			expect(results).toEqual([]);
		});

		it('should find entities with bidirectional relationships', async () => {
			await entityRepository.addLink(character1.id, character2.id, 'allied_with', true);
			await entityRepository.addLink(character2.id, character3.id, 'allied_with', true);

			const results = await entityRepository.queryByRelationship('allied_with');

			expect(results).toHaveLength(3);
			expect(results.map((e) => e.id).sort()).toEqual(['char-1', 'char-2', 'char-3']);
		});

		it('should not duplicate entities with multiple links of same type', async () => {
			// Character 1 has two 'member_of' relationships
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, faction2.id, 'member_of', false);

			const results = await entityRepository.queryByRelationship('member_of');

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('char-1');
		});

		it('should handle case-sensitive relationship names', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);

			const results = await entityRepository.queryByRelationship('Member_Of');

			expect(results).toEqual([]);
		});

		it('should work with custom relationship types', async () => {
			await entityRepository.addLink(character1.id, location1.id, 'resides_at', false);
			await entityRepository.addLink(character2.id, location1.id, 'resides_at', false);

			const results = await entityRepository.queryByRelationship('resides_at');

			expect(results).toHaveLength(2);
		});
	});

	describe('getEntitiesWithRelationshipType', () => {
		describe('outgoing direction', () => {
			it('should find entities linked from source with specific relationship', async () => {
				await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
				await entityRepository.addLink(character1.id, faction2.id, 'member_of', false);
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'member_of',
					{ direction: 'outgoing' }
				);

				expect(results).toHaveLength(2);
				expect(results.map((e) => e.id).sort()).toEqual(['faction-1', 'faction-2']);
			});

			it('should return empty array when no outgoing relationships match', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'member_of',
					{ direction: 'outgoing' }
				);

				expect(results).toEqual([]);
			});

			it('should not include incoming relationships', async () => {
				await entityRepository.addLink(character2.id, character1.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'friend_of',
					{ direction: 'outgoing' }
				);

				expect(results).toEqual([]);
			});
		});

		describe('incoming direction', () => {
			it('should find entities linking to target with specific relationship', async () => {
				await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
				await entityRepository.addLink(character2.id, faction1.id, 'member_of', false);
				await entityRepository.addLink(character3.id, faction1.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					faction1.id,
					'member_of',
					{ direction: 'incoming' }
				);

				expect(results).toHaveLength(2);
				expect(results.map((e) => e.id).sort()).toEqual(['char-1', 'char-2']);
			});

			it('should return empty array when no incoming relationships match', async () => {
				await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					faction1.id,
					'friend_of',
					{ direction: 'incoming' }
				);

				expect(results).toEqual([]);
			});

			it('should not include outgoing relationships', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'friend_of',
					{ direction: 'incoming' }
				);

				expect(results).toEqual([]);
			});
		});

		describe('both direction (default)', () => {
			it('should find entities in both directions with specific relationship', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);
				await entityRepository.addLink(character3.id, character1.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'friend_of',
					{ direction: 'both' }
				);

				expect(results).toHaveLength(2);
				expect(results.map((e) => e.id).sort()).toEqual(['char-2', 'char-3']);
			});

			it('should use "both" as default when direction not specified', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);
				await entityRepository.addLink(character3.id, character1.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'friend_of'
				);

				expect(results).toHaveLength(2);
			});

			it('should not duplicate entities in bidirectional relationships', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'allied_with', true);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'allied_with',
					{ direction: 'both' }
				);

				expect(results).toHaveLength(1);
				expect(results[0].id).toBe('char-2');
			});

			it('should return empty array when no relationships match in either direction', async () => {
				await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);

				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'enemy_of',
					{ direction: 'both' }
				);

				expect(results).toEqual([]);
			});
		});

		describe('edge cases', () => {
			it('should return empty array for non-existent entity', async () => {
				const results = await entityRepository.getEntitiesWithRelationshipType(
					'nonexistent-id',
					'member_of'
				);

				expect(results).toEqual([]);
			});

			it('should return empty array when entity has no links', async () => {
				const results = await entityRepository.getEntitiesWithRelationshipType(
					character1.id,
					'member_of'
				);

				expect(results).toEqual([]);
			});

			it('should handle inverse relationship types for bidirectional links', async () => {
				await entityRepository.addLink(character1.id, faction1.id, 'member_of', true);

				// Query from faction side for inverse relationship
				const results = await entityRepository.getEntitiesWithRelationshipType(
					faction1.id,
					'has_member',
					{ direction: 'outgoing' }
				);

				expect(results).toHaveLength(1);
				expect(results[0].id).toBe('char-1');
			});
		});
	});

	describe('getRelationshipTypes', () => {
		it('should return all unique relationship types in the database', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);
			await entityRepository.addLink(character2.id, character3.id, 'allied_with', true);

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toHaveLength(3);
			expect(types.sort()).toEqual(['allied_with', 'friend_of', 'member_of']);
		});

		it('should not duplicate relationship types', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character2.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character3.id, faction2.id, 'member_of', false);

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toHaveLength(1);
			expect(types[0]).toBe('member_of');
		});

		it('should return empty array when no links exist', async () => {
			const types = await entityRepository.getRelationshipTypes();

			expect(types).toEqual([]);
		});

		it('should return empty array when database is empty', async () => {
			await db.entities.clear();

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toEqual([]);
		});

		it('should include inverse relationship types from bidirectional links', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', true);

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toHaveLength(2);
			expect(types.sort()).toEqual(['has_member', 'member_of']);
		});

		it('should handle custom relationship types', async () => {
			await entityRepository.addLink(character1.id, location1.id, 'resides_at', false);
			await entityRepository.addLink(character2.id, faction1.id, 'commands', false);

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toHaveLength(2);
			expect(types.sort()).toEqual(['commands', 'resides_at']);
		});

		it('should include all relationships from entities with multiple links', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);
			await entityRepository.addLink(character1.id, location1.id, 'located_at', false);

			const types = await entityRepository.getRelationshipTypes();

			expect(types).toHaveLength(3);
		});
	});

	describe('getRelationshipStats', () => {
		it('should count relationships by type', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character2.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, character2.id, 'friend_of', false);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				member_of: 2,
				friend_of: 1
			});
		});

		it('should return empty object when no links exist', async () => {
			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({});
		});

		it('should return empty object when database is empty', async () => {
			await db.entities.clear();

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({});
		});

		it('should count bidirectional relationships on both sides', async () => {
			await entityRepository.addLink(character1.id, character2.id, 'allied_with', true);
			await entityRepository.addLink(character2.id, character3.id, 'friend_of', true);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				allied_with: 2,
				friend_of: 2
			});
		});

		it('should count inverse relationships separately', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', true);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				member_of: 1,
				has_member: 1
			});
		});

		it('should handle multiple relationships of the same type', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, faction2.id, 'member_of', false);
			await entityRepository.addLink(character2.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character3.id, faction2.id, 'member_of', false);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				member_of: 4
			});
		});

		it('should count custom relationship types', async () => {
			await entityRepository.addLink(character1.id, location1.id, 'resides_at', false);
			await entityRepository.addLink(character2.id, location1.id, 'resides_at', false);
			await entityRepository.addLink(character3.id, faction1.id, 'commands', false);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				resides_at: 2,
				commands: 1
			});
		});

		it('should handle mixed relationship types', async () => {
			await entityRepository.addLink(character1.id, faction1.id, 'member_of', false);
			await entityRepository.addLink(character1.id, character2.id, 'friend_of', true);
			await entityRepository.addLink(character2.id, character3.id, 'enemy_of', false);
			await entityRepository.addLink(character3.id, faction2.id, 'member_of', false);

			const stats = await entityRepository.getRelationshipStats();

			expect(stats).toEqual({
				member_of: 2,
				friend_of: 2,
				enemy_of: 1
			});
		});
	});
});

describe('EntityRepository - getRelationshipChain() (Issue #69)', () => {
	// Test entities for building complex relationship graphs
	let aragorn: BaseEntity;
	let legolas: BaseEntity;
	let gimli: BaseEntity;
	let gandalf: BaseEntity;
	let frodo: BaseEntity;
	let sam: BaseEntity;
	let fellowship: BaseEntity;
	let rivendell: BaseEntity;
	let gondor: BaseEntity;
	let rohan: BaseEntity;

	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();

		// Create a network of entities for testing graph traversal
		aragorn = createMockEntity({
			id: 'aragorn',
			name: 'Aragorn',
			type: 'character',
			links: []
		});

		legolas = createMockEntity({
			id: 'legolas',
			name: 'Legolas',
			type: 'character',
			links: []
		});

		gimli = createMockEntity({
			id: 'gimli',
			name: 'Gimli',
			type: 'character',
			links: []
		});

		gandalf = createMockEntity({
			id: 'gandalf',
			name: 'Gandalf',
			type: 'npc',
			links: []
		});

		frodo = createMockEntity({
			id: 'frodo',
			name: 'Frodo',
			type: 'character',
			links: []
		});

		sam = createMockEntity({
			id: 'sam',
			name: 'Sam',
			type: 'character',
			links: []
		});

		fellowship = createMockEntity({
			id: 'fellowship',
			name: 'Fellowship of the Ring',
			type: 'faction',
			links: []
		});

		rivendell = createMockEntity({
			id: 'rivendell',
			name: 'Rivendell',
			type: 'location',
			links: []
		});

		gondor = createMockEntity({
			id: 'gondor',
			name: 'Gondor',
			type: 'faction',
			links: []
		});

		rohan = createMockEntity({
			id: 'rohan',
			name: 'Rohan',
			type: 'faction',
			links: []
		});

		await db.entities.bulkAdd([
			aragorn,
			legolas,
			gimli,
			gandalf,
			frodo,
			sam,
			fellowship,
			rivendell,
			gondor,
			rohan
		]);
	});

	afterEach(async () => {
		await db.entities.clear();
	});

	describe('Basic Traversal', () => {
		it('should return empty array for entity with no links', async () => {
			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toEqual([]);
		});

		it('should return direct connections at depth 1', async () => {
			// Aragorn -> Fellowship
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe(fellowship.id);
			expect(chain[0].depth).toBe(1);
			expect(chain[0].path).toHaveLength(1);
			expect(chain[0].path[0].relationship).toBe('member_of');
		});

		it('should find multiple direct connections', async () => {
			// Aragorn -> Fellowship, Gondor, Rivendell
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, gondor.id, 'heir_of', false);
			await entityRepository.addLink(aragorn.id, rivendell.id, 'located_at', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(3);
			expect(chain.every((node) => node.depth === 1)).toBe(true);
			expect(chain.map((n) => n.entity.id).sort()).toEqual([
				'fellowship',
				'gondor',
				'rivendell'
			]);
		});

		it('should find indirect connections at depth 2', async () => {
			// Aragorn -> Fellowship -> Legolas
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(2);

			const fellowshipNode = chain.find((n) => n.entity.id === 'fellowship');
			const legolasNode = chain.find((n) => n.entity.id === 'legolas');

			expect(fellowshipNode?.depth).toBe(1);
			expect(legolasNode?.depth).toBe(2);
		});

		it('should track complete path through chain', async () => {
			// Aragorn -> Fellowship -> Gandalf
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, gandalf.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);
			const gandalfNode = chain.find((n) => n.entity.id === 'gandalf');

			expect(gandalfNode).toBeDefined();
			expect(gandalfNode!.path).toHaveLength(2);
			expect(gandalfNode!.path[0].targetId).toBe('fellowship');
			expect(gandalfNode!.path[0].relationship).toBe('member_of');
			expect(gandalfNode!.path[1].targetId).toBe('gandalf');
			expect(gandalfNode!.path[1].relationship).toBe('has_member');
		});

		it('should handle bidirectional relationships', async () => {
			// Aragorn <-> Legolas (bidirectional)
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', true);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('legolas');
			expect(chain[0].depth).toBe(1);
		});
	});

	describe('Cycle Handling', () => {
		it('should not revisit already visited entities', async () => {
			// Create a cycle: Aragorn -> Fellowship -> Aragorn
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, aragorn.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Should only include Fellowship once (at depth 1), not revisit Aragorn
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
			expect(chain.some((n) => n.entity.id === 'aragorn')).toBe(false);
		});

		it('should handle self-referential links', async () => {
			// Entity links to itself
			await entityRepository.addLink(aragorn.id, aragorn.id, 'mentors', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Should not include itself in the chain
			expect(chain).toEqual([]);
		});

		it('should handle circular relationships in larger graphs', async () => {
			// Create: Aragorn -> Legolas -> Gimli -> Aragorn (circular, outgoing only)
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);
			await entityRepository.addLink(gimli.id, aragorn.id, 'friend_of', false);

			// Use direction: 'outgoing' to test directional cycle handling
			const chain = await entityRepository.getRelationshipChain(aragorn.id, { direction: 'outgoing' });

			// Should find Legolas (depth 1) and Gimli (depth 2), but not revisit Aragorn
			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['gimli', 'legolas']);
			expect(chain.find((n) => n.entity.id === 'legolas')?.depth).toBe(1);
			expect(chain.find((n) => n.entity.id === 'gimli')?.depth).toBe(2);
		});

		it('should handle diamond-shaped graph without duplication', async () => {
			// Aragorn -> Legolas -> Gandalf
			//        -> Gimli    -> Gandalf (Gandalf reachable via two paths)
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, gimli.id, 'friend_of', false);
			await entityRepository.addLink(legolas.id, gandalf.id, 'knows', false);
			await entityRepository.addLink(gimli.id, gandalf.id, 'knows', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Should find each entity only once
			const entityIds = chain.map((n) => n.entity.id).sort();
			expect(entityIds).toEqual(['gandalf', 'gimli', 'legolas']);

			// Gandalf should appear at depth 2 (first discovery via BFS)
			const gandalfNode = chain.find((n) => n.entity.id === 'gandalf');
			expect(gandalfNode?.depth).toBe(2);
		});
	});

	describe('maxDepth Parameter', () => {
		it('should respect maxDepth = 1', async () => {
			// Aragorn -> Fellowship -> Legolas -> Gimli
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, { maxDepth: 1 });

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
			expect(chain[0].depth).toBe(1);
		});

		it('should respect maxDepth = 2', async () => {
			// Aragorn -> Fellowship -> Legolas -> Gimli
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, { maxDepth: 2 });

			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
			expect(chain.every((n) => n.depth <= 2)).toBe(true);
		});

		it('should use default maxDepth = 3', async () => {
			// Aragorn -> Fellowship -> Legolas -> Gimli -> Gandalf
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);
			await entityRepository.addLink(gimli.id, gandalf.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Default depth of 3 should include Fellowship, Legolas, Gimli (not Gandalf at depth 4)
			expect(chain).toHaveLength(3);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'gimli', 'legolas']);
			expect(chain.some((n) => n.entity.id === 'gandalf')).toBe(false);
		});

		it('should handle maxDepth = 0', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, { maxDepth: 0 });

			expect(chain).toEqual([]);
		});

		it('should handle very large maxDepth', async () => {
			// Aragorn -> Fellowship -> Legolas
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, { maxDepth: 100 });

			// Should find all reachable nodes regardless of high maxDepth
			expect(chain).toHaveLength(2);
		});
	});

	describe('relationshipTypes Filter', () => {
		it('should filter by single relationship type', async () => {
			// Aragorn -> Fellowship (member_of)
			// Aragorn -> Legolas (friend_of)
			// Aragorn -> Gondor (heir_of)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, gondor.id, 'heir_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				relationshipTypes: ['member_of']
			});

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});

		it('should filter by multiple relationship types', async () => {
			// Aragorn -> Fellowship (member_of)
			// Aragorn -> Legolas (friend_of)
			// Aragorn -> Gondor (heir_of)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, gondor.id, 'heir_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				relationshipTypes: ['member_of', 'friend_of']
			});

			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
		});

		it('should apply relationship filter across all depths', async () => {
			// Aragorn -> Fellowship (member_of) -> Legolas (has_member) -> Gimli (friend_of)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				relationshipTypes: ['member_of', 'has_member']
			});

			// Should only traverse member_of and has_member links
			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
			expect(chain.some((n) => n.entity.id === 'gimli')).toBe(false);
		});

		it('should return empty array when no relationships match filter', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				relationshipTypes: ['enemy_of']
			});

			expect(chain).toEqual([]);
		});

		it('should handle empty relationshipTypes array', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				relationshipTypes: []
			});

			// Empty filter should match nothing
			expect(chain).toEqual([]);
		});
	});

	describe('entityTypes Filter', () => {
		it('should filter by single entity type', async () => {
			// Aragorn -> Fellowship (faction), Legolas (character), Rivendell (location)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, rivendell.id, 'located_at', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['faction']
			});

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
			expect(chain[0].entity.type).toBe('faction');
		});

		it('should filter by multiple entity types', async () => {
			// Aragorn -> Fellowship (faction), Legolas (character), Rivendell (location)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, rivendell.id, 'located_at', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['faction', 'character']
			});

			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
		});

		it('should apply entity type filter across all depths', async () => {
			// Aragorn -> Legolas (character) -> Fellowship (faction) -> Gandalf (npc)
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(legolas.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, gandalf.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['character']
			});

			// Should only include character type entities
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('legolas');
		});

		it('should return empty array when no entities match type filter', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['location']
			});

			expect(chain).toEqual([]);
		});

		it('should handle empty entityTypes array', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: []
			});

			// Empty filter should match nothing
			expect(chain).toEqual([]);
		});

		it('should still traverse through filtered-out entities', async () => {
			// Aragorn -> Fellowship (faction) -> Legolas (character)
			// Filter for character types only
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['character']
			});

			// Should find Legolas even though Fellowship is filtered out
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('legolas');
			expect(chain[0].depth).toBe(2);
		});
	});

	describe('direction Filter', () => {
		it('should traverse only outgoing relationships', async () => {
			// Aragorn -> Fellowship (outgoing)
			// Legolas -> Aragorn (incoming)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, aragorn.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				direction: 'outgoing'
			});

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});

		it('should traverse only incoming relationships', async () => {
			// Aragorn -> Fellowship (outgoing)
			// Legolas -> Aragorn (incoming)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, aragorn.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				direction: 'incoming'
			});

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('legolas');
		});

		it('should traverse both directions by default', async () => {
			// Aragorn -> Fellowship (outgoing)
			// Legolas -> Aragorn (incoming)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, aragorn.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				direction: 'both'
			});

			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
		});

		it('should use both as default when direction not specified', async () => {
			// Aragorn -> Fellowship (outgoing)
			// Legolas -> Aragorn (incoming)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, aragorn.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(2);
		});

		it('should handle bidirectional links with outgoing direction', async () => {
			// Aragorn <-> Fellowship (bidirectional)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', true);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				direction: 'outgoing'
			});

			// Should find Fellowship via the outgoing link
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});

		it('should handle bidirectional links with incoming direction', async () => {
			// Aragorn <-> Fellowship (bidirectional)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', true);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				direction: 'incoming'
			});

			// Should find Fellowship via the reverse link
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});
	});

	describe('Path Tracking', () => {
		it('should maintain complete path for each node', async () => {
			// Aragorn -> Fellowship -> Legolas
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);
			const legolasNode = chain.find((n) => n.entity.id === 'legolas');

			expect(legolasNode?.path).toHaveLength(2);
			expect(legolasNode?.path[0].targetId).toBe('fellowship');
			expect(legolasNode?.path[1].targetId).toBe('legolas');
		});

		it('should track shortest path with BFS', async () => {
			// Create two paths to Gimli:
			// Aragorn -> Fellowship -> Gimli (length 2)
			// Aragorn -> Legolas -> Gandalf -> Gimli (length 3)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, gimli.id, 'has_member', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(legolas.id, gandalf.id, 'friend_of', false);
			await entityRepository.addLink(gandalf.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);
			const gimliNode = chain.find((n) => n.entity.id === 'gimli');

			// Should find shortest path (via Fellowship)
			expect(gimliNode?.depth).toBe(2);
			expect(gimliNode?.path).toHaveLength(2);
			expect(gimliNode?.path[0].targetId).toBe('fellowship');
			expect(gimliNode?.path[1].targetId).toBe('gimli');
		});

		it('should track path for depth 1 nodes', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain[0].path).toHaveLength(1);
			expect(chain[0].path[0].targetId).toBe('fellowship');
		});

		it('should have unique paths for each node', async () => {
			// Aragorn -> Fellowship -> Legolas
			//        -> Gondor     -> Gimli
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(aragorn.id, gondor.id, 'heir_of', false);
			await entityRepository.addLink(gondor.id, gimli.id, 'allied_with', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);
			const legolasNode = chain.find((n) => n.entity.id === 'legolas');
			const gimliNode = chain.find((n) => n.entity.id === 'gimli');

			expect(legolasNode?.path[0].targetId).toBe('fellowship');
			expect(gimliNode?.path[0].targetId).toBe('gondor');
		});
	});

	describe('Result Ordering', () => {
		it('should sort results by depth first', async () => {
			// Create entities at different depths
			// Aragorn -> Fellowship (depth 1) -> Legolas (depth 2)
			//        -> Gimli (depth 1)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(aragorn.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// First two should be depth 1, last should be depth 2
			expect(chain[0].depth).toBe(1);
			expect(chain[1].depth).toBe(1);
			expect(chain[2].depth).toBe(2);
		});

		it('should sort by name within same depth', async () => {
			// Create multiple entities at depth 1
			// Aragorn -> Legolas, Gimli, Gandalf
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, gimli.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, gandalf.id, 'knows', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			const depth1Names = chain.filter((n) => n.depth === 1).map((n) => n.entity.name);
			expect(depth1Names).toEqual(['Gandalf', 'Gimli', 'Legolas']);
		});

		it('should maintain depth and name ordering across multiple depths', async () => {
			// Aragorn -> Gimli (1), Legolas (1) -> Fellowship (2), Gandalf (2)
			await entityRepository.addLink(aragorn.id, gimli.id, 'friend_of', false);
			await entityRepository.addLink(aragorn.id, legolas.id, 'friend_of', false);
			await entityRepository.addLink(gimli.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, gandalf.id, 'knows', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain[0].depth).toBe(1);
			expect(chain[0].entity.name).toBe('Gimli');
			expect(chain[1].depth).toBe(1);
			expect(chain[1].entity.name).toBe('Legolas');
			expect(chain[2].depth).toBe(2);
			// Either Fellowship or Gandalf, alphabetically sorted
			expect(chain[2].entity.name).toBe('Fellowship of the Ring');
			expect(chain[3].depth).toBe(2);
			expect(chain[3].entity.name).toBe('Gandalf');
		});
	});

	describe('Edge Cases', () => {
		it('should handle non-existent start entity', async () => {
			const chain = await entityRepository.getRelationshipChain('nonexistent-id');

			expect(chain).toEqual([]);
		});

		it('should handle entity with many connections', async () => {
			// Fellowship connected to many members
			await entityRepository.addLink(fellowship.id, aragorn.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, gimli.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, gandalf.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, frodo.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, sam.id, 'has_member', false);

			const chain = await entityRepository.getRelationshipChain(fellowship.id);

			expect(chain).toHaveLength(6);
			expect(chain.every((n) => n.depth === 1)).toBe(true);
		});

		it('should handle deep chains beyond maxDepth', async () => {
			// Create chain: A -> B -> C -> D -> E -> F
			const entities = [aragorn, legolas, gimli, gandalf, frodo, sam];
			for (let i = 0; i < entities.length - 1; i++) {
				await entityRepository.addLink(entities[i].id, entities[i + 1].id, 'friend_of', false);
			}

			const chain = await entityRepository.getRelationshipChain(aragorn.id, { maxDepth: 3 });

			// Should stop at depth 3
			expect(chain).toHaveLength(3);
			expect(chain[chain.length - 1].depth).toBe(3);
		});

		it('should handle disconnected graph components', async () => {
			// Aragorn -> Fellowship
			// Legolas -> Gimli (disconnected from Aragorn)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(legolas.id, gimli.id, 'friend_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Should only find Fellowship (not Legolas or Gimli)
			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});

		it('should combine multiple filters', async () => {
			// Aragorn -> Fellowship (faction, member_of) -> Legolas (character, has_member)
			//        -> Gandalf (npc, knows)
			//        -> Rivendell (location, located_at)
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(aragorn.id, gandalf.id, 'knows', false);
			await entityRepository.addLink(aragorn.id, rivendell.id, 'located_at', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, {
				entityTypes: ['faction', 'character'],
				relationshipTypes: ['member_of', 'has_member'],
				maxDepth: 2
			});

			// Should find Fellowship (faction, member_of, depth 1)
			// and Legolas (character, has_member, depth 2)
			expect(chain).toHaveLength(2);
			expect(chain.map((n) => n.entity.id).sort()).toEqual(['fellowship', 'legolas']);
		});

		it('should handle empty database', async () => {
			await db.entities.clear();

			const chain = await entityRepository.getRelationshipChain('any-id');

			expect(chain).toEqual([]);
		});

		it('should handle undefined options', async () => {
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id, undefined);

			expect(chain).toHaveLength(1);
		});
	});

	describe('Complex Graph Scenarios', () => {
		it('should handle complete graph traversal', async () => {
			// Create a complex network
			// Aragorn -> Fellowship, Gondor
			// Fellowship -> Legolas, Gimli
			// Gondor -> Rohan
			// Legolas -> Rivendell
			await entityRepository.addLink(aragorn.id, fellowship.id, 'member_of', false);
			await entityRepository.addLink(aragorn.id, gondor.id, 'heir_of', false);
			await entityRepository.addLink(fellowship.id, legolas.id, 'has_member', false);
			await entityRepository.addLink(fellowship.id, gimli.id, 'has_member', false);
			await entityRepository.addLink(gondor.id, rohan.id, 'allied_with', false);
			await entityRepository.addLink(legolas.id, rivendell.id, 'from', false);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			// Should find all reachable entities
			expect(chain).toHaveLength(6);
			const depths = new Map(chain.map((n) => [n.entity.id, n.depth]));
			expect(depths.get('fellowship')).toBe(1);
			expect(depths.get('gondor')).toBe(1);
			expect(depths.get('legolas')).toBe(2);
			expect(depths.get('gimli')).toBe(2);
			expect(depths.get('rohan')).toBe(2);
			expect(depths.get('rivendell')).toBe(3);
		});

		it('should handle asymmetric bidirectional relationships', async () => {
			// Aragorn <-> Fellowship (patron_of / client_of)
			await entityRepository.addLink(
				aragorn.id,
				fellowship.id,
				'patron_of',
				true,
				undefined,
				undefined,
				undefined,
				'client_of'
			);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(1);
			expect(chain[0].entity.id).toBe('fellowship');
		});

		it('should work with relationship metadata', async () => {
			// Links with strength and metadata should still be traversed
			await entityRepository.addLink(
				aragorn.id,
				fellowship.id,
				'member_of',
				false,
				'Strong bond',
				'strong',
				{ tags: ['fellowship'], tension: 2 }
			);

			const chain = await entityRepository.getRelationshipChain(aragorn.id);

			expect(chain).toHaveLength(1);
			expect(chain[0].path[0].strength).toBe('strong');
			expect(chain[0].path[0].metadata?.tags).toEqual(['fellowship']);
		});
	});
});
