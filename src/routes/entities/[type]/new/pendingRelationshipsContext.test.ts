/**
 * Tests for Pending Relationships Context Builder (TDD RED Phase)
 * Issue #232: Strengthen relationship inclusion during AI calls
 *
 * Tests the buildPendingRelationshipsContext() helper function that:
 * - Takes pending relationships from component state
 * - Fetches target entities via entitiesStore.getById()
 * - Builds privacy-safe summaries using buildPrivacySafeSummary()
 * - Returns a formatted context string
 *
 * These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PendingRelationship } from '$lib/types';
import type { BaseEntity } from '$lib/types';

// Mock the stores
vi.mock('$lib/stores', () => ({
	entitiesStore: {
		getById: vi.fn()
	}
}));

// Mock the relationship context builder service
vi.mock('$lib/services/relationshipContextBuilder', () => ({
	buildPrivacySafeSummary: vi.fn()
}));

import { entitiesStore } from '$lib/stores';
import { buildPrivacySafeSummary } from '$lib/services/relationshipContextBuilder';
import { buildPendingRelationshipsContext } from './pendingRelationshipsContext';

describe('buildPendingRelationshipsContext', () => {
	// Test entities
	let mockNPC: BaseEntity;
	let mockLocation: BaseEntity;
	let mockFaction: BaseEntity;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock NPC entity
		mockNPC = {
			id: 'npc-001',
			type: 'npc',
			name: 'Sarah the Bard',
			description: 'A cheerful bard who travels the kingdom singing songs',
			summary: 'Cheerful traveling bard',
			tags: ['bard', 'friendly'],
			fields: {
				role: 'Entertainer',
				personality: 'Optimistic and kind',
				secrets: 'Actually a spy' // Hidden field
			},
			links: [],
			notes: 'DM note: She has a secret mission',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-15'),
			metadata: {}
		};

		// Mock Location entity
		mockLocation = {
			id: 'loc-001',
			type: 'location',
			name: 'The Dancing Dragon Inn',
			description: 'A cozy tavern in the heart of the city',
			summary: 'Popular city tavern',
			tags: ['tavern', 'city'],
			fields: {
				region: 'Capital District',
				atmosphere: 'Warm and welcoming'
			},
			links: [],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};

		// Mock Faction entity
		mockFaction = {
			id: 'faction-001',
			type: 'faction',
			name: 'Adventurers Guild',
			description: 'A guild of brave heroes and explorers',
			summary: 'Guild of adventurers',
			tags: ['guild', 'heroic'],
			fields: {
				headquarters: 'Guild Hall',
				reputation: 'Excellent'
			},
			links: [],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};

		// Setup default mocks
		vi.mocked(entitiesStore.getById).mockReturnValue(undefined);
		vi.mocked(buildPrivacySafeSummary).mockReturnValue('Default summary');
	});

	describe('Core Functionality', () => {
		it('should return empty string when no pending relationships', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [];

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toBe('');
		});

		it('should return formatted string with single relationship', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'best_friends',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue(
				'A cheerful bard who travels the kingdom singing songs'
			);

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Related entities:');
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('best friends'); // Should format underscore to space
			expect(result).toContain('A cheerful bard who travels the kingdom singing songs');
		});

		it('should return formatted string with multiple relationships', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'best_friends',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'lives_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(mockLocation);

			vi.mocked(buildPrivacySafeSummary)
				.mockReturnValueOnce('A cheerful bard who travels the kingdom')
				.mockReturnValueOnce('A cozy tavern in the heart of the city');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Related entities:');
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('best friends');
			expect(result).toContain('The Dancing Dragon Inn');
			expect(result).toContain('lives at');
			expect(result).toContain('A cheerful bard');
			expect(result).toContain('A cozy tavern');
		});

		it('should use header "Related entities:"', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toMatch(/^Related entities:/);
		});

		it('should format each relationship on a new line with dash prefix', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(mockLocation);

			vi.mocked(buildPrivacySafeSummary)
				.mockReturnValueOnce('Bard summary')
				.mockReturnValueOnce('Inn summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			const lines = result.split('\n');
			expect(lines[0]).toBe('Related entities:');
			expect(lines[1]).toMatch(/^- /); // Second line starts with dash
			expect(lines[2]).toMatch(/^- /); // Third line starts with dash
		});
	});

	describe('Entity Fetching', () => {
		it('should call entitiesStore.getById for each relationship', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(mockLocation);

			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(entitiesStore.getById).toHaveBeenCalledTimes(2);
			expect(entitiesStore.getById).toHaveBeenCalledWith('npc-001');
			expect(entitiesStore.getById).toHaveBeenCalledWith('loc-001');
		});

		it('should skip relationships where target entity does not exist (deleted)', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'deleted-entity',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-003',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(undefined) // Deleted entity
				.mockReturnValueOnce(mockLocation);

			vi.mocked(buildPrivacySafeSummary)
				.mockReturnValueOnce('NPC summary')
				.mockReturnValueOnce('Location summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('The Dancing Dragon Inn');
			expect(result).not.toContain('deleted-entity');
			// Should only have 2 relationship lines (plus header)
			const lines = result.split('\n').filter((l) => l.trim());
			expect(lines.length).toBe(3); // Header + 2 relationships
		});

		it('should handle all relationships pointing to deleted entities', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'deleted-1',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'deleted-2',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(undefined);

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toBe(''); // No valid relationships = empty string
		});
	});

	describe('Summary Building', () => {
		it('should call buildPrivacySafeSummary for each valid target entity', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(mockLocation);

			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(buildPrivacySafeSummary).toHaveBeenCalledTimes(2);
			expect(buildPrivacySafeSummary).toHaveBeenCalledWith(mockNPC);
			expect(buildPrivacySafeSummary).toHaveBeenCalledWith(mockLocation);
		});

		it('should not call buildPrivacySafeSummary for deleted entities', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'deleted-entity',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(undefined);

			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(buildPrivacySafeSummary).toHaveBeenCalledTimes(1);
			expect(buildPrivacySafeSummary).toHaveBeenCalledWith(mockNPC);
		});

		it('should use the summary returned by buildPrivacySafeSummary', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'best_friends',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue(
				'This is a custom privacy-safe summary with no secrets'
			);

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('This is a custom privacy-safe summary with no secrets');
		});
	});

	describe('Relationship Label Formatting', () => {
		it('should convert underscores to spaces in relationship labels', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'best_friends_with',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('best friends with');
			expect(result).not.toContain('best_friends_with');
		});

		it('should handle relationship labels with no underscores', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('knows');
		});

		it('should handle relationship labels with multiple underscores', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'sworn_enemy_of',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('sworn enemy of');
		});
	});

	describe('Output Format', () => {
		it('should use format: "- EntityName (relationship): summary"', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'best_friends',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('A cheerful bard');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			// Format should be: - Sarah the Bard (best friends): A cheerful bard
			expect(result).toMatch(/- Sarah the Bard \(best friends\): A cheerful bard/);
		});

		it('should produce output compatible with edit page format', () => {
			// The edit page uses this format:
			// - EntityName (relationship_label): summary
			// We want the new page to use the same format for consistency

			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'faction-001',
					targetType: 'faction',
					relationship: 'member_of',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockFaction);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Guild of adventurers');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Related entities:');
			expect(result).toMatch(/- Adventurers Guild \(member of\): Guild of adventurers/);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty relationship label', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: '',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('()'); // Empty parentheses for empty relationship
		});

		it('should handle entity with very long name', () => {
			// Arrange
			const longNameEntity: BaseEntity = {
				...mockNPC,
				name: 'Sir Reginald Bartholomew Wellington III, Knight Commander of the Order of the Silver Dragon'
			};

			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(longNameEntity);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('A noble knight');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Sir Reginald Bartholomew Wellington III');
			expect(result).toContain('A noble knight');
		});

		it('should handle entity with special characters in name', () => {
			// Arrange
			const specialCharEntity: BaseEntity = {
				...mockNPC,
				name: 'O\'Brien the "Lucky"'
			};

			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(specialCharEntity);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('A lucky merchant');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('O\'Brien the "Lucky"');
		});

		it('should handle very long summary text', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			const longSummary = 'A'.repeat(1000);

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue(longSummary);

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain(longSummary);
			expect(result.length).toBeGreaterThan(1000);
		});

		it('should handle many relationships (stress test)', () => {
			// Arrange
			const manyRelationships: PendingRelationship[] = Array.from({ length: 50 }, (_, i) => ({
				tempId: `temp-${i}`,
				targetId: `entity-${i}`,
				targetType: 'npc' as const,
				relationship: 'knows',
				bidirectional: false
			}));

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Summary');

			// Act
			const result = buildPendingRelationshipsContext(manyRelationships);

			// Assert
			expect(result).toContain('Related entities:');
			const lines = result.split('\n').filter((l) => l.trim());
			expect(lines.length).toBe(51); // Header + 50 relationships
		});
	});

	describe('Integration with Different Entity Types', () => {
		it('should work with NPC entities', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('NPC summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('NPC summary');
		});

		it('should work with Location entities', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockLocation);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Location summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('The Dancing Dragon Inn');
			expect(result).toContain('Location summary');
		});

		it('should work with Faction entities', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'faction-001',
					targetType: 'faction',
					relationship: 'member_of',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockFaction);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Faction summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Adventurers Guild');
			expect(result).toContain('Faction summary');
		});

		it('should work with mixed entity types', () => {
			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				},
				{
					tempId: 'temp-002',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'lives_at',
					bidirectional: false
				},
				{
					tempId: 'temp-003',
					targetId: 'faction-001',
					targetType: 'faction',
					relationship: 'member_of',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById)
				.mockReturnValueOnce(mockNPC)
				.mockReturnValueOnce(mockLocation)
				.mockReturnValueOnce(mockFaction);

			vi.mocked(buildPrivacySafeSummary)
				.mockReturnValueOnce('NPC summary')
				.mockReturnValueOnce('Location summary')
				.mockReturnValueOnce('Faction summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).toContain('Sarah the Bard');
			expect(result).toContain('The Dancing Dragon Inn');
			expect(result).toContain('Adventurers Guild');
			expect(result).toContain('NPC summary');
			expect(result).toContain('Location summary');
			expect(result).toContain('Faction summary');
		});
	});

	describe('Privacy and Security', () => {
		it('should rely on buildPrivacySafeSummary to exclude secrets', () => {
			// buildPrivacySafeSummary is responsible for filtering out secrets
			// This test verifies we're using that function correctly

			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue(
				'A cheerful bard who travels the kingdom' // No secrets included
			);

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(result).not.toContain('Actually a spy'); // Secret should not be in result
			expect(result).toContain('A cheerful bard who travels the kingdom');
		});

		it('should not directly access entity fields for summary', () => {
			// The function should ALWAYS use buildPrivacySafeSummary
			// Never construct summaries directly from entity fields

			// Arrange
			const pendingRelationships: PendingRelationship[] = [
				{
					tempId: 'temp-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false
				}
			];

			vi.mocked(entitiesStore.getById).mockReturnValue(mockNPC);
			vi.mocked(buildPrivacySafeSummary).mockReturnValue('Safe summary');

			// Act
			const result = buildPendingRelationshipsContext(pendingRelationships);

			// Assert
			expect(buildPrivacySafeSummary).toHaveBeenCalledWith(mockNPC);
			expect(result).toContain('Safe summary');
		});
	});
});
