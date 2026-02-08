/**
 * Tests for Session Summary Service (TDD RED Phase - Issue #401)
 *
 * This service generates narrative summaries from session trails,
 * constructing ordered sequences of narrative events into readable text.
 *
 * These tests should FAIL initially as the service doesn't exist yet.
 *
 * Coverage:
 * - Retrieving ordered narrative event trails for sessions
 * - Filtering by session field and narrative_event type
 * - Ordering events chronologically (creation time or leads_to/follows)
 * - Generating formatted narrative summaries
 * - Handling empty sessions and missing data
 * - Error handling for non-existent sessions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTrailForSession, generateSummary } from './sessionSummaryService';
import type { BaseEntity } from '$lib/types';

// Mock the entity repository
vi.mock('$lib/db/repositories/entityRepository', () => ({
	entityRepository: {
		getById: vi.fn()
	}
}));

// Mock Dexie for database queries
vi.mock('$lib/db', () => ({
	db: {
		entities: {
			where: vi.fn(),
			toArray: vi.fn(),
			filter: vi.fn()
		}
	}
}));

import { entityRepository } from '$lib/db/repositories/entityRepository';
import { db } from '$lib/db';

describe('sessionSummaryService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getTrailForSession', () => {
		describe('Successful Trail Retrieval', () => {
			it('should return array of narrative events for session', async () => {
				const sessionId = 'session-123';

				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Tavern Meeting',
					description: 'The party meets at the tavern',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Goblin Ambush',
					description: 'Goblins attack on the road',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory in 3 rounds, earned 2 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event1, event2])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(2);
				expect(result[0]).toEqual(event1);
				expect(result[1]).toEqual(event2);
			});

			it('should filter entities by type "narrative_event"', async () => {
				const sessionId = 'session-filter-test';

				const narrativeEvent: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Combat Scene',
					description: 'A battle',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const npcEntity: BaseEntity = {
					id: 'npc-1',
					type: 'npc',
					name: 'Random NPC',
					description: 'Not a narrative event',
					tags: [],
					fields: {
						session: sessionId // Has session field but wrong type
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([narrativeEvent])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(1);
				expect(result[0].type).toBe('narrative_event');
			});

			it('should filter entities by session field matching sessionId', async () => {
				const sessionId = 'session-456';

				const matchingEvent: BaseEntity = {
					id: 'event-match',
					type: 'narrative_event',
					name: 'Matching Event',
					description: 'Belongs to session-456',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const nonMatchingEvent: BaseEntity = {
					id: 'event-nomatch',
					type: 'narrative_event',
					name: 'Different Session Event',
					description: 'Belongs to different session',
					tags: [],
					fields: {
						eventType: 'combat',
						session: 'session-789' // Different session
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([matchingEvent])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(1);
				expect(result[0].fields.session).toBe(sessionId);
			});

			it('should order events by creation time (oldest first)', async () => {
				const sessionId = 'session-order';

				const event3: BaseEntity = {
					id: 'event-3',
					type: 'narrative_event',
					name: 'Third Event',
					description: 'Happened last',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T12:00:00Z'),
					updatedAt: new Date('2025-01-01T12:00:00Z'),
					metadata: {}
				};

				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'First Event',
					description: 'Happened first',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Second Event',
					description: 'Happened second',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event3, event1, event2])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(3);
				expect(result[0].name).toBe('First Event');
				expect(result[1].name).toBe('Second Event');
				expect(result[2].name).toBe('Third Event');
			});

			it('should use leads_to/follows relationships to determine order when available', async () => {
				const sessionId = 'session-linked';

				const event1: BaseEntity = {
					id: 'event-start',
					type: 'narrative_event',
					name: 'Opening Scene',
					description: 'Start of session',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [
						{
							id: 'link-1',
							sourceId: 'event-start',
							targetId: 'event-middle',
							targetType: 'narrative_event',
							relationship: 'leads_to',
							bidirectional: true,
							reverseRelationship: 'follows'
						}
					],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-middle',
					type: 'narrative_event',
					name: 'Middle Combat',
					description: 'Middle of session',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId
					},
					links: [
						{
							id: 'link-2',
							sourceId: 'event-middle',
							targetId: 'event-start',
							targetType: 'narrative_event',
							relationship: 'follows',
							bidirectional: true,
							reverseRelationship: 'leads_to'
						},
						{
							id: 'link-3',
							sourceId: 'event-middle',
							targetId: 'event-end',
							targetType: 'narrative_event',
							relationship: 'leads_to',
							bidirectional: true,
							reverseRelationship: 'follows'
						}
					],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const event3: BaseEntity = {
					id: 'event-end',
					type: 'narrative_event',
					name: 'Closing Scene',
					description: 'End of session',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [
						{
							id: 'link-4',
							sourceId: 'event-end',
							targetId: 'event-middle',
							targetType: 'narrative_event',
							relationship: 'follows',
							bidirectional: true,
							reverseRelationship: 'leads_to'
						}
					],
					notes: '',
					createdAt: new Date('2025-01-01T12:00:00Z'),
					updatedAt: new Date('2025-01-01T12:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event3, event2, event1])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(3);
				expect(result[0].id).toBe('event-start');
				expect(result[1].id).toBe('event-middle');
				expect(result[2].id).toBe('event-end');
			});

			it('should handle events with no session field gracefully', async () => {
				const sessionId = 'session-missing-field';

				const eventWithSession: BaseEntity = {
					id: 'event-has-session',
					type: 'narrative_event',
					name: 'Has Session Field',
					description: 'Has session',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const eventWithoutSession: BaseEntity = {
					id: 'event-no-session',
					type: 'narrative_event',
					name: 'No Session Field',
					description: 'Missing session field',
					tags: [],
					fields: {
						eventType: 'combat'
						// No session field
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([eventWithSession])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('event-has-session');
			});
		});

		describe('Empty Results', () => {
			it('should return empty array if no events found for session', async () => {
				const sessionId = 'session-empty';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toEqual([]);
				expect(result).toHaveLength(0);
			});

			it('should return empty array for non-existent session', async () => {
				const sessionId = 'nonexistent-session';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toEqual([]);
			});

			it('should handle session with only non-narrative entities', async () => {
				const sessionId = 'session-no-events';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toEqual([]);
			});
		});

		describe('Edge Cases', () => {
			it('should handle events with same creation time', async () => {
				const sessionId = 'session-same-time';
				const sameTime = new Date('2025-01-01T10:00:00Z');

				const event1: BaseEntity = {
					id: 'event-alpha',
					type: 'narrative_event',
					name: 'Alpha Event',
					description: 'First alphabetically',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: sameTime,
					updatedAt: sameTime,
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-beta',
					type: 'narrative_event',
					name: 'Beta Event',
					description: 'Second alphabetically',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: sameTime,
					updatedAt: sameTime,
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event2, event1])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(2);
				// Should maintain some consistent order
				expect(result[0]).toBeDefined();
				expect(result[1]).toBeDefined();
			});

			it('should handle single event for session', async () => {
				const sessionId = 'session-single';

				const singleEvent: BaseEntity = {
					id: 'event-only',
					type: 'narrative_event',
					name: 'Only Event',
					description: 'The only event',
					tags: [],
					fields: {
						eventType: 'montage',
						session: sessionId,
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([singleEvent])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('event-only');
			});

			it('should handle events with circular leads_to/follows relationships', async () => {
				const sessionId = 'session-circular';

				const eventA: BaseEntity = {
					id: 'event-a',
					type: 'narrative_event',
					name: 'Event A',
					description: 'Part of circle',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [
						{
							id: 'link-a-b',
							sourceId: 'event-a',
							targetId: 'event-b',
							targetType: 'narrative_event',
							relationship: 'leads_to',
							bidirectional: true
						}
					],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const eventB: BaseEntity = {
					id: 'event-b',
					type: 'narrative_event',
					name: 'Event B',
					description: 'Part of circle',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId
					},
					links: [
						{
							id: 'link-b-a',
							sourceId: 'event-b',
							targetId: 'event-a',
							targetType: 'narrative_event',
							relationship: 'leads_to',
							bidirectional: true
						}
					],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([eventB, eventA])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				// Should fall back to creation time ordering
				expect(result).toHaveLength(2);
				expect(result[0].id).toBe('event-a');
				expect(result[1].id).toBe('event-b');
			});

			it('should handle large number of events efficiently', async () => {
				const sessionId = 'session-large';

				const events: BaseEntity[] = Array.from({ length: 100 }, (_, i) => ({
					id: `event-${i}`,
					type: 'narrative_event' as const,
					name: `Event ${i}`,
					description: `Event number ${i}`,
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date(`2025-01-01T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`),
					updatedAt: new Date(`2025-01-01T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`),
					metadata: {}
				}));

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue(events)
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession(sessionId);

				expect(result).toHaveLength(100);
				expect(result[0].id).toBe('event-0');
				expect(result[99].id).toBe('event-99');
			});
		});

		describe('Error Handling', () => {
			it('should throw error if database query fails', async () => {
				const sessionId = 'session-error';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockRejectedValue(new Error('Database error'))
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				await expect(getTrailForSession(sessionId)).rejects.toThrow('Database error');
			});

			it('should handle null or undefined sessionId gracefully', async () => {
				// @ts-expect-error - Testing invalid input
				await expect(getTrailForSession(null)).rejects.toThrow();
			});

			it('should handle empty string sessionId', async () => {
				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await getTrailForSession('');

				expect(result).toEqual([]);
			});
		});
	});

	describe('generateSummary', () => {
		describe('Successful Summary Generation', () => {
			it('should generate narrative text from session trail', async () => {
				const sessionId = 'session-summary-1';

				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Tavern Meeting',
					description: 'The party meets at the tavern',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Goblin Ambush',
					description: 'Goblins attack on the road',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory in 3 rounds, earned 2 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event1, event2])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toBeTruthy();
				expect(typeof result).toBe('string');
				expect(result.length).toBeGreaterThan(0);
			});

			it('should include event names in summary', async () => {
				const sessionId = 'session-names';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Dragon Confrontation',
					description: 'Face to face with the dragon',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toContain('Dragon Confrontation');
			});

			it('should include event types in summary', async () => {
				const sessionId = 'session-types';

				const combatEvent: BaseEntity = {
					id: 'event-combat',
					type: 'narrative_event',
					name: 'Battle',
					description: 'A fierce battle',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([combatEvent])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result.toLowerCase()).toMatch(/combat|battle|fight/);
			});

			it('should include outcome field when present', async () => {
				const sessionId = 'session-outcome';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Wilderness Trek',
					description: 'Journey through wilderness',
					tags: [],
					fields: {
						eventType: 'montage',
						session: sessionId,
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result.toLowerCase()).toContain('success');
			});

			it('should connect multiple events with narrative transitions', async () => {
				const sessionId = 'session-transitions';

				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'First Event',
					description: 'Beginning',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Second Event',
					description: 'Middle',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const event3: BaseEntity = {
					id: 'event-3',
					type: 'narrative_event',
					name: 'Third Event',
					description: 'End',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T12:00:00Z'),
					updatedAt: new Date('2025-01-01T12:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event1, event2, event3])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				// Should contain some form of transition words
				expect(result.toLowerCase()).toMatch(/then|next|after|following|subsequently/);
			});

			it('should format different event types appropriately', async () => {
				const sessionId = 'session-format';

				const sceneEvent: BaseEntity = {
					id: 'event-scene',
					type: 'narrative_event',
					name: 'Investigation Scene',
					description: 'Searching for clues',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const combatEvent: BaseEntity = {
					id: 'event-combat',
					type: 'narrative_event',
					name: 'Boss Fight',
					description: 'Epic battle',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory in 10 rounds, earned 5 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T11:00:00Z'),
					updatedAt: new Date('2025-01-01T11:00:00Z'),
					metadata: {}
				};

				const montageEvent: BaseEntity = {
					id: 'event-montage',
					type: 'narrative_event',
					name: 'Training Montage',
					description: 'Heroes train',
					tags: [],
					fields: {
						eventType: 'montage',
						session: sessionId,
						outcome: 'partial_success'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T12:00:00Z'),
					updatedAt: new Date('2025-01-01T12:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([sceneEvent, combatEvent, montageEvent])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toContain('Investigation Scene');
				expect(result).toContain('Boss Fight');
				expect(result).toContain('Training Montage');
			});
		});

		describe('Empty Sessions', () => {
			it('should handle empty trail gracefully', async () => {
				const sessionId = 'session-empty-trail';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toBeTruthy();
				expect(typeof result).toBe('string');
			});

			it('should return appropriate message for session with no events', async () => {
				const sessionId = 'session-no-events';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result.toLowerCase()).toMatch(/no events|empty|nothing/);
			});
		});

		describe('Edge Cases', () => {
			it('should handle single event session', async () => {
				const sessionId = 'session-single-event';

				const event: BaseEntity = {
					id: 'event-only',
					type: 'narrative_event',
					name: 'Solo Event',
					description: 'Only event',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toContain('Solo Event');
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle events without outcome field', async () => {
				const sessionId = 'session-no-outcome';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Scene Without Outcome',
					description: 'Simple scene',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
						// No outcome field
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toContain('Scene Without Outcome');
			});

			it('should handle very long event names', async () => {
				const sessionId = 'session-long-name';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'The Incredibly Long and Extremely Detailed Name of an Epic Battle That Took Place at the Ancient Ruins Near the Forgotten Temple of the Lost Gods',
					description: 'Long name event',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toBeDefined();
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle special characters in event names', async () => {
				const sessionId = 'session-special-chars';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Battle @ "The Dragon\'s Lair" & More!',
					description: 'Special characters',
					tags: [],
					fields: {
						eventType: 'combat',
						session: sessionId,
						outcome: 'Victory'
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result).toContain('Dragon');
			});

			it('should handle large number of events', async () => {
				const sessionId = 'session-many-events';

				const events: BaseEntity[] = Array.from({ length: 20 }, (_, i) => ({
					id: `event-${i}`,
					type: 'narrative_event' as const,
					name: `Event ${i}`,
					description: `Event number ${i}`,
					tags: [],
					fields: {
						eventType: i % 2 === 0 ? 'scene' : 'combat',
						session: sessionId,
						...(i % 2 === 1 ? { outcome: 'Victory' } : {})
					},
					links: [],
					notes: '',
					createdAt: new Date(`2025-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`),
					updatedAt: new Date(`2025-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`),
					metadata: {}
				}));

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue(events)
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				expect(result.length).toBeGreaterThan(100); // Should be substantial
				expect(result).toContain('Event 0');
				expect(result).toContain('Event 19');
			});
		});

		describe('Error Handling', () => {
			it('should throw error if getTrailForSession fails', async () => {
				const sessionId = 'session-trail-error';

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockRejectedValue(new Error('Trail fetch failed'))
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				await expect(generateSummary(sessionId)).rejects.toThrow('Trail fetch failed');
			});

			it('should handle null sessionId', async () => {
				// @ts-expect-error - Testing invalid input
				await expect(generateSummary(null)).rejects.toThrow();
			});

			it('should handle undefined sessionId', async () => {
				// @ts-expect-error - Testing invalid input
				await expect(generateSummary(undefined)).rejects.toThrow();
			});

			it('should handle empty string sessionId', async () => {
				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary('');

				expect(result).toBeDefined();
			});
		});

		describe('Narrative Quality', () => {
			it('should produce readable text (not JSON or raw data)', async () => {
				const sessionId = 'session-readable';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Market Chase',
					description: 'Chase through marketplace',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				// Should not look like JSON
				expect(result).not.toMatch(/^\s*{/);
				expect(result).not.toMatch(/^\s*\[/);
				// Should contain words
				expect(result).toMatch(/\w+\s+\w+/);
			});

			it('should use proper sentence structure', async () => {
				const sessionId = 'session-sentences';

				const event: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Throne Room',
					description: 'Meeting the king',
					tags: [],
					fields: {
						eventType: 'scene',
						session: sessionId
					},
					links: [],
					notes: '',
					createdAt: new Date('2025-01-01T10:00:00Z'),
					updatedAt: new Date('2025-01-01T10:00:00Z'),
					metadata: {}
				};

				const mockFilter = vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue([event])
				});

				vi.mocked(db.entities.filter).mockReturnValue(mockFilter() as any);

				const result = await generateSummary(sessionId);

				// Should have sentence-like structure
				expect(result).toMatch(/[.!?]/); // Has punctuation
			});
		});
	});
});
