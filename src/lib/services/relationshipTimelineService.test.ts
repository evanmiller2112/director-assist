/**
 * Tests for Relationship Timeline Service (TDD RED Phase)
 * GitHub Issue #145: Relationship Timeline View
 *
 * This service builds and filters timeline events from entity relationships,
 * providing chronological visualization of when relationships were created
 * and modified across the campaign.
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 *
 * Covers:
 * - buildTimelineEvents: event generation from entity links
 * - filterTimelineEvents: filtering by various criteria
 * - getAvailableFilterOptions: extracting unique filter values
 * - Edge cases: empty data, missing timestamps, bidirectional deduplication
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	buildTimelineEvents,
	filterTimelineEvents,
	getAvailableFilterOptions
} from './relationshipTimelineService';
import type { RelationshipTimelineEvent, TimelineFilterOptions } from '$lib/types/relationshipTimeline';
import type { BaseEntity } from '$lib/types';
import { createMockEntity } from '../../tests/utils/testUtils';

describe('relationshipTimelineService', () => {
	describe('buildTimelineEvents', () => {
		describe('Empty and No-Link Cases', () => {
			it('should return empty array for empty entities array', () => {
				const events = buildTimelineEvents([]);

				expect(events).toEqual([]);
			});

			it('should return empty array for entities with no links', () => {
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Aldric',
						type: 'character',
						links: []
					}),
					createMockEntity({
						id: 'loc-1',
						name: 'Tavern',
						type: 'location',
						links: []
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events).toEqual([]);
			});
		});

		describe('Created Events', () => {
			it('should generate "created" event from link.createdAt', () => {
				const linkCreatedAt = new Date('2025-01-15T10:00:00Z');
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Aldric',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'faction-1',
								targetType: 'faction',
								relationship: 'member_of',
								bidirectional: false,
								createdAt: linkCreatedAt
							}
						]
					}),
					createMockEntity({
						id: 'faction-1',
						name: 'Knights Order',
						type: 'faction'
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(1);
				expect(events[0].eventType).toBe('created');
				expect(events[0].timestamp).toEqual(linkCreatedAt);
				expect(events[0].sourceEntity.id).toBe('char-1');
				expect(events[0].sourceEntity.name).toBe('Aldric');
				expect(events[0].targetEntity.id).toBe('faction-1');
				expect(events[0].targetEntity.name).toBe('Knights Order');
				expect(events[0].relationship).toBe('member_of');
			});

			it('should include correct source and target entity information', () => {
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'npc-1',
						name: 'Merchant',
						type: 'npc',
						links: [
							{
								id: 'link-1',
								sourceId: 'npc-1',
								targetId: 'loc-1',
								targetType: 'location',
								relationship: 'located_at',
								bidirectional: false,
								createdAt: new Date('2025-01-10T08:00:00Z')
							}
						]
					}),
					createMockEntity({
						id: 'loc-1',
						name: 'Market Square',
						type: 'location'
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events[0].sourceEntity).toEqual({
					id: 'npc-1',
					name: 'Merchant',
					type: 'npc'
				});
				expect(events[0].targetEntity).toEqual({
					id: 'loc-1',
					name: 'Market Square',
					type: 'location'
				});
			});

			it('should include link metadata in events', () => {
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Hero',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'npc-1',
								targetType: 'npc',
								relationship: 'ally',
								bidirectional: true,
								reverseRelationship: 'ally',
								strength: 'strong',
								notes: 'Trusted companion',
								metadata: { tags: ['ally', 'friend'], tension: 0 },
								createdAt: new Date('2025-01-05T12:00:00Z')
							}
						]
					}),
					createMockEntity({
						id: 'npc-1',
						name: 'Companion',
						type: 'npc'
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events[0].bidirectional).toBe(true);
				expect(events[0].reverseRelationship).toBe('ally');
				expect(events[0].strength).toBe('strong');
				expect(events[0].notes).toBe('Trusted companion');
				expect(events[0].metadata).toEqual({ tags: ['ally', 'friend'], tension: 0 });
				expect(events[0].linkCreatedAt).toEqual(new Date('2025-01-05T12:00:00Z'));
			});
		});

		describe('Modified Events', () => {
			it('should generate "modified" event when link.updatedAt !== link.createdAt', () => {
				const createdAt = new Date('2025-01-10T10:00:00Z');
				const updatedAt = new Date('2025-01-20T14:00:00Z');
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Aldric',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'faction-1',
								targetType: 'faction',
								relationship: 'member_of',
								bidirectional: false,
								createdAt: createdAt,
								updatedAt: updatedAt
							}
						]
					}),
					createMockEntity({
						id: 'faction-1',
						name: 'Knights Order',
						type: 'faction'
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(2);

				const createdEvent = events.find(e => e.eventType === 'created');
				const modifiedEvent = events.find(e => e.eventType === 'modified');

				expect(createdEvent).toBeDefined();
				expect(createdEvent?.timestamp).toEqual(createdAt);

				expect(modifiedEvent).toBeDefined();
				expect(modifiedEvent?.timestamp).toEqual(updatedAt);
				expect(modifiedEvent?.linkUpdatedAt).toEqual(updatedAt);
			});

			it('should not generate "modified" event when updatedAt equals createdAt', () => {
				const timestamp = new Date('2025-01-15T10:00:00Z');
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Aldric',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'faction-1',
								targetType: 'faction',
								relationship: 'member_of',
								bidirectional: false,
								createdAt: timestamp,
								updatedAt: timestamp
							}
						]
					}),
					createMockEntity({
						id: 'faction-1',
						name: 'Knights Order',
						type: 'faction'
					})
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(1);
				expect(events[0].eventType).toBe('created');
			});
		});

		describe('Bidirectional Link Deduplication', () => {
			it('should deduplicate bidirectional links (only one event per pair)', () => {
				const createdAt = new Date('2025-01-15T10:00:00Z');
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Alice',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'char-2',
								targetType: 'character',
								relationship: 'friend',
								bidirectional: true,
								createdAt: createdAt
							}
						]
					}),
					createMockEntity({
						id: 'char-2',
						name: 'Bob',
						type: 'character',
						links: [
							{
								id: 'link-2',
								sourceId: 'char-2',
								targetId: 'char-1',
								targetType: 'character',
								relationship: 'friend',
								bidirectional: true,
								createdAt: createdAt
							}
						]
					})
				];

				const events = buildTimelineEvents(entities);

				// Should only generate events for one direction of the bidirectional link
				// Using lexicographic ordering of IDs (char-1 < char-2)
				expect(events.length).toBe(1);
				expect(events[0].sourceEntity.id).toBe('char-1');
				expect(events[0].targetEntity.id).toBe('char-2');
			});
		});

		describe('Sorting', () => {
			it('should sort events by timestamp (newest first)', () => {
				const date1 = new Date('2025-01-10T10:00:00Z');
				const date2 = new Date('2025-01-15T10:00:00Z');
				const date3 = new Date('2025-01-20T10:00:00Z');

				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Character',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'npc-1',
								targetType: 'npc',
								relationship: 'knows',
								bidirectional: false,
								createdAt: date2
							},
							{
								id: 'link-2',
								sourceId: 'char-1',
								targetId: 'npc-2',
								targetType: 'npc',
								relationship: 'knows',
								bidirectional: false,
								createdAt: date1
							},
							{
								id: 'link-3',
								sourceId: 'char-1',
								targetId: 'npc-3',
								targetType: 'npc',
								relationship: 'knows',
								bidirectional: false,
								createdAt: date3
							}
						]
					}),
					createMockEntity({ id: 'npc-1', name: 'NPC1', type: 'npc' }),
					createMockEntity({ id: 'npc-2', name: 'NPC2', type: 'npc' }),
					createMockEntity({ id: 'npc-3', name: 'NPC3', type: 'npc' })
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(3);
				expect(events[0].timestamp).toEqual(date3);
				expect(events[1].timestamp).toEqual(date2);
				expect(events[2].timestamp).toEqual(date1);
			});
		});

		describe('Timestamp Fallback', () => {
			it('should handle links without timestamps gracefully (uses entity timestamps as fallback)', () => {
				const entityCreatedAt = new Date('2025-01-01T00:00:00Z');
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Character',
						type: 'character',
						createdAt: entityCreatedAt,
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'npc-1',
								targetType: 'npc',
								relationship: 'knows',
								bidirectional: false
								// No createdAt or updatedAt
							}
						]
					}),
					createMockEntity({ id: 'npc-1', name: 'NPC', type: 'npc' })
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(1);
				expect(events[0].timestamp).toEqual(entityCreatedAt);
			});
		});

		describe('Multiple Links', () => {
			it('should handle multiple links on same entity', () => {
				const entities: BaseEntity[] = [
					createMockEntity({
						id: 'char-1',
						name: 'Hero',
						type: 'character',
						links: [
							{
								id: 'link-1',
								sourceId: 'char-1',
								targetId: 'faction-1',
								targetType: 'faction',
								relationship: 'member_of',
								bidirectional: false,
								createdAt: new Date('2025-01-10T10:00:00Z')
							},
							{
								id: 'link-2',
								sourceId: 'char-1',
								targetId: 'loc-1',
								targetType: 'location',
								relationship: 'located_at',
								bidirectional: false,
								createdAt: new Date('2025-01-15T10:00:00Z')
							},
							{
								id: 'link-3',
								sourceId: 'char-1',
								targetId: 'npc-1',
								targetType: 'npc',
								relationship: 'ally',
								bidirectional: true,
								createdAt: new Date('2025-01-20T10:00:00Z')
							}
						]
					}),
					createMockEntity({ id: 'faction-1', name: 'Faction', type: 'faction' }),
					createMockEntity({ id: 'loc-1', name: 'Location', type: 'location' }),
					createMockEntity({ id: 'npc-1', name: 'NPC', type: 'npc' })
				];

				const events = buildTimelineEvents(entities);

				expect(events.length).toBe(3);
			});
		});
	});

	describe('filterTimelineEvents', () => {
		let allEvents: RelationshipTimelineEvent[];

		// Setup common test data
		beforeEach(() => {
			allEvents = [
				{
					id: 'event-1',
					eventType: 'created',
					timestamp: new Date('2025-01-10T10:00:00Z'),
					sourceEntity: { id: 'char-1', name: 'Aldric', type: 'character' },
					targetEntity: { id: 'faction-1', name: 'Knights Order', type: 'faction' },
					relationship: 'member_of',
					bidirectional: false,
					strength: 'strong',
					notes: 'Sworn oath to defend'
				},
				{
					id: 'event-2',
					eventType: 'created',
					timestamp: new Date('2025-01-15T12:00:00Z'),
					sourceEntity: { id: 'char-1', name: 'Aldric', type: 'character' },
					targetEntity: { id: 'loc-1', name: 'Castle', type: 'location' },
					relationship: 'located_at',
					bidirectional: false,
					strength: 'moderate'
				},
				{
					id: 'event-3',
					eventType: 'modified',
					timestamp: new Date('2025-01-20T14:00:00Z'),
					sourceEntity: { id: 'char-1', name: 'Aldric', type: 'character' },
					targetEntity: { id: 'faction-1', name: 'Knights Order', type: 'faction' },
					relationship: 'member_of',
					bidirectional: false,
					strength: 'strong',
					notes: 'Updated relationship strength'
				},
				{
					id: 'event-4',
					eventType: 'created',
					timestamp: new Date('2025-01-25T08:00:00Z'),
					sourceEntity: { id: 'npc-1', name: 'Merchant', type: 'npc' },
					targetEntity: { id: 'loc-1', name: 'Castle', type: 'location' },
					relationship: 'visits',
					bidirectional: false,
					strength: 'weak',
					notes: 'Weekly supply deliveries to the castle'
				},
				{
					id: 'event-5',
					eventType: 'created',
					timestamp: new Date('2025-02-01T16:00:00Z'),
					sourceEntity: { id: 'char-2', name: 'Mage', type: 'character' },
					targetEntity: { id: 'item-1', name: 'Magic Staff', type: 'item' },
					relationship: 'owns',
					bidirectional: false
				}
			];
		});

		describe('No Filters', () => {
			it('should return all events when no filters applied', () => {
				const filtered = filterTimelineEvents(allEvents, {});

				expect(filtered).toEqual(allEvents);
				expect(filtered.length).toBe(5);
			});
		});

		describe('Entity Filters', () => {
			it('should filter by entityId (matches source or target)', () => {
				const filtered = filterTimelineEvents(allEvents, { entityId: 'char-1' });

				expect(filtered.length).toBe(3);
				expect(filtered.every(e =>
					e.sourceEntity.id === 'char-1' || e.targetEntity.id === 'char-1'
				)).toBe(true);
			});

			it('should filter by entityType', () => {
				const filtered = filterTimelineEvents(allEvents, { entityType: 'character' });

				expect(filtered.length).toBe(4);
				expect(filtered.every(e =>
					e.sourceEntity.type === 'character' || e.targetEntity.type === 'character'
				)).toBe(true);
			});
		});

		describe('Relationship Filters', () => {
			it('should filter by relationshipType', () => {
				const filtered = filterTimelineEvents(allEvents, { relationshipType: 'member_of' });

				expect(filtered.length).toBe(2);
				expect(filtered.every(e => e.relationship === 'member_of')).toBe(true);
			});

			it('should filter by strength', () => {
				const filtered = filterTimelineEvents(allEvents, { strength: 'strong' });

				expect(filtered.length).toBe(2);
				expect(filtered.every(e => e.strength === 'strong')).toBe(true);
			});

			it('should return all events when strength is "all"', () => {
				const filtered = filterTimelineEvents(allEvents, { strength: 'all' });

				expect(filtered.length).toBe(5);
			});
		});

		describe('Date Range Filters', () => {
			it('should filter by date range (from)', () => {
				const dateFrom = new Date('2025-01-20T00:00:00Z');
				const filtered = filterTimelineEvents(allEvents, { dateFrom });

				expect(filtered.length).toBe(3);
				expect(filtered.every(e => e.timestamp >= dateFrom)).toBe(true);
			});

			it('should filter by date range (to)', () => {
				const dateTo = new Date('2025-01-20T00:00:00Z');
				const filtered = filterTimelineEvents(allEvents, { dateTo });

				expect(filtered.length).toBe(2);
				expect(filtered.every(e => e.timestamp <= dateTo)).toBe(true);
			});

			it('should filter by date range (both from and to)', () => {
				const dateFrom = new Date('2025-01-12T00:00:00Z');
				const dateTo = new Date('2025-01-22T00:00:00Z');
				const filtered = filterTimelineEvents(allEvents, { dateFrom, dateTo });

				expect(filtered.length).toBe(2);
				expect(filtered.every(e => e.timestamp >= dateFrom && e.timestamp <= dateTo)).toBe(true);
			});
		});

		describe('Event Type Filters', () => {
			it('should filter by eventType ("created" only)', () => {
				const filtered = filterTimelineEvents(allEvents, { eventType: 'created' });

				expect(filtered.length).toBe(4);
				expect(filtered.every(e => e.eventType === 'created')).toBe(true);
			});

			it('should filter by eventType ("modified" only)', () => {
				const filtered = filterTimelineEvents(allEvents, { eventType: 'modified' });

				expect(filtered.length).toBe(1);
				expect(filtered.every(e => e.eventType === 'modified')).toBe(true);
			});

			it('should return all events when eventType is "all"', () => {
				const filtered = filterTimelineEvents(allEvents, { eventType: 'all' });

				expect(filtered.length).toBe(5);
			});
		});

		describe('Search Query Filters', () => {
			it('should filter by searchQuery (matches entity names)', () => {
				const filtered = filterTimelineEvents(allEvents, { searchQuery: 'Aldric' });

				expect(filtered.length).toBe(3);
				expect(filtered.every(e =>
					e.sourceEntity.name.includes('Aldric') || e.targetEntity.name.includes('Aldric')
				)).toBe(true);
			});

			it('should filter by searchQuery (matches notes)', () => {
				const filtered = filterTimelineEvents(allEvents, { searchQuery: 'castle' });

				expect(filtered.length).toBe(2);
				// Should match both the "Castle" location name and the notes mentioning "castle"
			});

			it('should perform case-insensitive search', () => {
				const filtered = filterTimelineEvents(allEvents, { searchQuery: 'MERCHANT' });

				expect(filtered.length).toBe(1);
				expect(filtered[0].sourceEntity.name).toBe('Merchant');
			});
		});

		describe('Combined Filters', () => {
			it('should combine multiple filters with AND logic', () => {
				const filters: TimelineFilterOptions = {
					entityType: 'character',
					eventType: 'created',
					strength: 'strong'
				};
				const filtered = filterTimelineEvents(allEvents, filters);

				expect(filtered.length).toBe(1);
				expect(filtered[0].id).toBe('event-1');
			});

			it('should handle complex multi-filter scenarios', () => {
				const filters: TimelineFilterOptions = {
					entityId: 'char-1',
					dateFrom: new Date('2025-01-14T00:00:00Z'),
					dateTo: new Date('2025-01-22T00:00:00Z'),
					eventType: 'all'
				};
				const filtered = filterTimelineEvents(allEvents, filters);

				expect(filtered.length).toBe(2);
				expect(filtered.every(e => e.sourceEntity.id === 'char-1')).toBe(true);
			});
		});
	});

	describe('getAvailableFilterOptions', () => {
		describe('Empty Events', () => {
			it('should return empty arrays for no events', () => {
				const options = getAvailableFilterOptions([]);

				expect(options.entityTypes).toEqual([]);
				expect(options.relationshipTypes).toEqual([]);
				expect(options.entities).toEqual([]);
			});
		});

		describe('Extracting Unique Values', () => {
			it('should return unique entity types', () => {
				const events: RelationshipTimelineEvent[] = [
					{
						id: 'event-1',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'faction-1', name: 'Order', type: 'faction' },
						relationship: 'member_of',
						bidirectional: false
					},
					{
						id: 'event-2',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-2', name: 'Mage', type: 'character' },
						targetEntity: { id: 'loc-1', name: 'Tower', type: 'location' },
						relationship: 'located_at',
						bidirectional: false
					}
				];

				const options = getAvailableFilterOptions(events);

				expect(options.entityTypes).toContain('character');
				expect(options.entityTypes).toContain('faction');
				expect(options.entityTypes).toContain('location');
				expect(options.entityTypes.length).toBe(3);
			});

			it('should return unique relationship types', () => {
				const events: RelationshipTimelineEvent[] = [
					{
						id: 'event-1',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'faction-1', name: 'Order', type: 'faction' },
						relationship: 'member_of',
						bidirectional: false
					},
					{
						id: 'event-2',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'loc-1', name: 'Tower', type: 'location' },
						relationship: 'located_at',
						bidirectional: false
					},
					{
						id: 'event-3',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-2', name: 'Mage', type: 'character' },
						targetEntity: { id: 'faction-1', name: 'Order', type: 'faction' },
						relationship: 'member_of',
						bidirectional: false
					}
				];

				const options = getAvailableFilterOptions(events);

				expect(options.relationshipTypes).toContain('member_of');
				expect(options.relationshipTypes).toContain('located_at');
				expect(options.relationshipTypes.length).toBe(2);
			});

			it('should return unique entities (deduplicated)', () => {
				const events: RelationshipTimelineEvent[] = [
					{
						id: 'event-1',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'faction-1', name: 'Order', type: 'faction' },
						relationship: 'member_of',
						bidirectional: false
					},
					{
						id: 'event-2',
						eventType: 'created',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'loc-1', name: 'Tower', type: 'location' },
						relationship: 'located_at',
						bidirectional: false
					},
					{
						id: 'event-3',
						eventType: 'modified',
						timestamp: new Date(),
						sourceEntity: { id: 'char-1', name: 'Hero', type: 'character' },
						targetEntity: { id: 'faction-1', name: 'Order', type: 'faction' },
						relationship: 'member_of',
						bidirectional: false
					}
				];

				const options = getAvailableFilterOptions(events);

				// Should have 3 unique entities: char-1, faction-1, loc-1
				expect(options.entities.length).toBe(3);

				const entityIds = options.entities.map(e => e.id);
				expect(entityIds).toContain('char-1');
				expect(entityIds).toContain('faction-1');
				expect(entityIds).toContain('loc-1');

				// Verify no duplicates
				const uniqueIds = new Set(entityIds);
				expect(uniqueIds.size).toBe(entityIds.length);
			});
		});
	});
});
