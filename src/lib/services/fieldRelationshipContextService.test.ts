/**
 * Tests for Field Relationship Context Service
 *
 * Service that builds relationship context specifically for per-field AI generation.
 * Determines when to include context, formats it appropriately, and provides reasons
 * for inclusion/exclusion decisions.
 *
 * These are FAILING tests written following TDD principles.
 * They define the expected behavior before implementation.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	buildFieldRelationshipContext,
	type FieldRelationshipContextOptions,
	type FieldRelationshipContextResult
} from './fieldRelationshipContextService';
import type { EntityId, EntityType } from '$lib/types';

// Mock the dependencies
vi.mock('./relationshipContextBuilder', () => ({
	buildRelationshipContext: vi.fn(),
	formatRelationshipContextForPrompt: vi.fn()
}));

vi.mock('./relationshipContextSettingsService', () => ({
	getRelationshipContextSettings: vi.fn()
}));

vi.mock('../utils/relationshipContextFields', () => ({
	shouldIncludeRelationshipContext: vi.fn(),
	getFieldRelationshipContextBudget: vi.fn()
}));

// Import mocked functions for spy usage
import { buildRelationshipContext, formatRelationshipContextForPrompt } from './relationshipContextBuilder';
import { getRelationshipContextSettings } from './relationshipContextSettingsService';
import { shouldIncludeRelationshipContext, getFieldRelationshipContextBudget } from '../utils/relationshipContextFields';

describe('fieldRelationshipContextService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('buildFieldRelationshipContext', () => {
		describe('Settings: Disabled State', () => {
			it('should return "disabled" reason when settings.enabled is false', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: false,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('disabled');
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should not call relationship builder when disabled', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: false,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				await buildFieldRelationshipContext(options);

				expect(buildRelationshipContext).not.toHaveBeenCalled();
			});
		});

		describe('Entity Validation', () => {
			it('should return "no_entity" reason when entityId is missing', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: undefined as any,
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_entity');
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should return "no_entity" reason when entityId is null', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: null as any,
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_entity');
			});

			it('should return "no_entity" reason when entityId is empty string', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: '',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_entity');
			});
		});

		describe('Field Relevance Check', () => {
			it('should return "field_not_relevant" when field should not include context', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(false);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'appearance' // Low priority field
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('field_not_relevant');
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should call shouldIncludeRelationshipContext with correct arguments', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(false);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'character',
					targetField: 'equipment'
				};

				await buildFieldRelationshipContext(options);

				expect(shouldIncludeRelationshipContext).toHaveBeenCalledWith('equipment', 'character');
			});

			it('should not call relationship builder for non-relevant fields', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(false);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'appearance'
				};

				await buildFieldRelationshipContext(options);

				expect(buildRelationshipContext).not.toHaveBeenCalled();
			});
		});

		describe('Force Include Override', () => {
			it('should include context when forceInclude is true, even for non-relevant fields', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(false);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(1000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test NPC',
					relatedEntities: [
						{
							relationship: 'member_of',
							entityId: 'guild-1',
							entityType: 'faction',
							name: 'Thieves Guild',
							summary: 'A shadowy organization',
							direction: 'outgoing',
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('=== Relationships ===\n...');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'appearance', // Non-relevant field
					forceInclude: true
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(true);
				expect(result.reason).toBe('included');
				expect(buildRelationshipContext).toHaveBeenCalled();
			});

			it('should still respect disabled settings even with forceInclude', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: false, // Disabled
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'appearance',
					forceInclude: true
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('disabled');
			});

			it('should still check for entity existence even with forceInclude', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: '', // Missing
					entityType: 'npc',
					targetField: 'appearance',
					forceInclude: true
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_entity');
			});
		});

		describe('Relationship Existence Check', () => {
			it('should return "no_relationships" when entity has no relationships', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Lonely NPC',
					relatedEntities: [], // No relationships
					totalCharacters: 0,
					truncated: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_relationships');
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should call buildRelationshipContext with correct budget', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(2000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test NPC',
					relatedEntities: [],
					totalCharacters: 0,
					truncated: false
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'background'
				};

				await buildFieldRelationshipContext(options);

				expect(getFieldRelationshipContextBudget).toHaveBeenCalledWith('background', 4000);
				expect(buildRelationshipContext).toHaveBeenCalledWith('entity-123', {
					maxCharacters: 2000,
					maxRelatedEntities: 20
				});
			});
		});

		describe('Successful Context Building', () => {
			it('should return "included" with formatted context when relationships exist', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				const mockRelationshipContext = {
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Thorin',
					relatedEntities: [
						{
							relationship: 'member_of',
							entityId: 'guild-1',
							entityType: 'faction' as EntityType,
							name: 'Thieves Guild',
							summary: 'A shadowy organization of skilled thieves',
							direction: 'outgoing' as const,
							depth: 1
						},
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Elara',
							summary: 'A wise elven ranger',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 250,
					truncated: false
				};

				const formattedContext = `=== Relationships for Thorin ===
[Relationship: member_of] Thieves Guild (Faction): A shadowy organization of skilled thieves
[Relationship: knows] Elara (NPC): A wise elven ranger`;

				vi.mocked(buildRelationshipContext).mockResolvedValue(mockRelationshipContext);
				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue(formattedContext);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(true);
				expect(result.reason).toBe('included');
				expect(result.formattedContext).toBe(formattedContext);
				expect(result.characterCount).toBe(formattedContext.length);
			});

			it('should call formatRelationshipContextForPrompt with relationship context', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				const mockRelationshipContext = {
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'located_at',
							entityId: 'loc-1',
							entityType: 'location' as EntityType,
							name: 'Tavern',
							summary: 'A busy tavern',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				};

				vi.mocked(buildRelationshipContext).mockResolvedValue(mockRelationshipContext);
				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('formatted');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				await buildFieldRelationshipContext(options);

				expect(formatRelationshipContextForPrompt).toHaveBeenCalledWith(mockRelationshipContext);
			});

			it('should return correct character count', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				const mockRelationshipContext = {
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'member_of',
							entityId: 'guild-1',
							entityType: 'faction' as EntityType,
							name: 'Guild',
							summary: 'Test guild',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				};

				const formattedContext = 'This is a test string with exactly 44 chars!';

				vi.mocked(buildRelationshipContext).mockResolvedValue(mockRelationshipContext);
				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue(formattedContext);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.characterCount).toBe(44);
			});
		});

		describe('Budget Allocation', () => {
			it('should use field-specific budget for high priority fields', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000); // 75% of 4000

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Friend',
							summary: 'A friend',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('context');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality' // High priority
				};

				await buildFieldRelationshipContext(options);

				expect(buildRelationshipContext).toHaveBeenCalledWith('entity-123', {
					maxCharacters: 3000,
					maxRelatedEntities: 20
				});
			});

			it('should use field-specific budget for medium priority fields', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(2000); // 50% of 4000

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'located_at',
							entityId: 'loc-1',
							entityType: 'location' as EntityType,
							name: 'Place',
							summary: 'A place',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('context');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'background' // Medium priority
				};

				await buildFieldRelationshipContext(options);

				expect(buildRelationshipContext).toHaveBeenCalledWith('entity-123', {
					maxCharacters: 2000,
					maxRelatedEntities: 20
				});
			});

			it('should respect custom settings maxCharacters', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 15,
					maxCharacters: 8000, // Custom high limit
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(6000); // 75% of 8000

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Friend',
							summary: 'A friend',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('context');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				await buildFieldRelationshipContext(options);

				expect(buildRelationshipContext).toHaveBeenCalledWith('entity-123', {
					maxCharacters: 6000,
					maxRelatedEntities: 15
				});
			});
		});

		describe('Error Handling', () => {
			it('should handle errors from buildRelationshipContext gracefully', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				vi.mocked(buildRelationshipContext).mockRejectedValue(new Error('Database error'));

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_relationships');
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should handle errors from formatRelationshipContextForPrompt', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Friend',
							summary: 'A friend',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 100,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockImplementation(() => {
					throw new Error('Formatting error');
				});

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(false);
				expect(result.reason).toBe('no_relationships');
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long formatted context', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Friend',
							summary: 'A very long summary...'.repeat(100),
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 3000,
					truncated: true
				});

				const veryLongContext = 'Context...'.repeat(500);
				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue(veryLongContext);

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				expect(result.included).toBe(true);
				expect(result.characterCount).toBe(veryLongContext.length);
			});

			it('should handle empty formatted context', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
				vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

				vi.mocked(buildRelationshipContext).mockResolvedValue({
					sourceEntityId: 'entity-123',
					sourceEntityName: 'Test',
					relatedEntities: [
						{
							relationship: 'knows',
							entityId: 'npc-2',
							entityType: 'npc' as EntityType,
							name: 'Friend',
							summary: '',
							direction: 'outgoing' as const,
							depth: 1
						}
					],
					totalCharacters: 0,
					truncated: false
				});

				vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('');

				const options: FieldRelationshipContextOptions = {
					entityId: 'entity-123',
					entityType: 'npc',
					targetField: 'personality'
				};

				const result = await buildFieldRelationshipContext(options);

				// Even though formatted context is empty, we have relationships so should include
				expect(result.included).toBe(true);
				expect(result.formattedContext).toBe('');
				expect(result.characterCount).toBe(0);
			});

			it('should handle various entity types correctly', async () => {
				vi.mocked(getRelationshipContextSettings).mockReturnValue({
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				});

				const entityTypes: EntityType[] = ['npc', 'character', 'faction', 'location', 'item'];

				for (const entityType of entityTypes) {
					vi.clearAllMocks();

					vi.mocked(shouldIncludeRelationshipContext).mockReturnValue(true);
					vi.mocked(getFieldRelationshipContextBudget).mockReturnValue(3000);

					vi.mocked(buildRelationshipContext).mockResolvedValue({
						sourceEntityId: `${entityType}-1`,
						sourceEntityName: `Test ${entityType}`,
						relatedEntities: [
							{
								relationship: 'test',
								entityId: 'other-1',
								entityType: 'npc',
								name: 'Other',
								summary: 'Summary',
								direction: 'outgoing' as const,
								depth: 1
							}
						],
						totalCharacters: 100,
						truncated: false
					});

					vi.mocked(formatRelationshipContextForPrompt).mockReturnValue('context');

					const options: FieldRelationshipContextOptions = {
						entityId: `${entityType}-1`,
						entityType: entityType,
						targetField: 'description'
					};

					const result = await buildFieldRelationshipContext(options);

					expect(result.included).toBe(true);
					expect(shouldIncludeRelationshipContext).toHaveBeenCalledWith('description', entityType);
				}
			});
		});
	});
});
