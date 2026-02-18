/**
 * Integration tests: Location-to-NPC suggestion wiring (Issue #548)
 *
 * Tests the integration between:
 *   - `getSceneSuggestions` (sceneSuggestionService)
 *   - `EntitySuggestionChips` component
 *   - The scene create/edit forms' `location` and `npcsPresent` fields
 *
 * RED Phase: Most tests FAIL because the wiring utility stubs return wrong
 * values (throw or return NOT_IMPLEMENTED). The GREEN phase replaces the stubs
 * with correct logic and wires the forms.
 *
 * Wiring contract (what GREEN phase must implement):
 *   1. sceneSuggestionWiringUtils.handleLocationChange(locationId, selectedIds):
 *      - Returns [] immediately when locationId is falsy
 *      - Calls getSceneSuggestions(locationId, { excludeIds: selectedIds })
 *      - Returns service result, or [] on service error / null result
 *   2. sceneSuggestionWiringUtils.addSuggestedNpc(currentIds, newId):
 *      - Returns new array with newId appended (no mutation, no duplicates)
 *   3. sceneSuggestionWiringUtils.addAllSuggestedNpcs(currentIds, suggestions):
 *      - Returns new array merging currentIds + suggestion IDs (no dupes)
 *   4. Both form pages (+page.svelte for new and [id]/edit) must:
 *      - Import EntitySuggestionChips and getSceneSuggestions
 *      - Declare `locationNpcSuggestions` reactive state
 *      - Render <EntitySuggestionChips> near the npcsPresent field
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock sceneSuggestionService — prevents IndexedDB access during tests
// ---------------------------------------------------------------------------

vi.mock('$lib/services/sceneSuggestionService', () => ({
	getSceneSuggestions: vi.fn()
}));

import {
	getSceneSuggestions,
	type EntitySuggestion
} from '$lib/services/sceneSuggestionService';

// Import the stub module (it exists on disk; its implementations are broken)
import {
	handleLocationChange,
	addSuggestedNpc,
	addAllSuggestedNpcs
} from '$lib/services/sceneSuggestionWiringUtils';

import type { BaseEntity } from '$lib/types';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeNpc(id: string, name: string): BaseEntity {
	const now = new Date('2025-01-01T00:00:00.000Z');
	return {
		id,
		type: 'npc',
		name,
		description: '',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: now,
		updatedAt: now,
		metadata: {}
	};
}

function makeSuggestion(
	id: string,
	name: string,
	confidence: 'high' | 'medium' | 'low' = 'high'
): EntitySuggestion {
	return {
		entity: makeNpc(id, name),
		reason: 'Located at this location',
		confidence,
		sourceRelationship: 'located_at'
	};
}

// ---------------------------------------------------------------------------
// Reset service mock before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.mocked(getSceneSuggestions).mockReset();
	vi.mocked(getSceneSuggestions).mockResolvedValue([]);
});

// ===========================================================================
// 1. handleLocationChange: calls getSceneSuggestions when location is set
// ===========================================================================

describe('sceneSuggestionWiring - handleLocationChange: service called correctly', () => {
	it('should call getSceneSuggestions with location ID when location is set', async () => {
		/**
		 * FAILS (RED): stub returns 'NOT_IMPLEMENTED' and never calls the service.
		 * GREEN: real impl calls getSceneSuggestions(locationId, { excludeIds }) and
		 *        returns the result.
		 */
		await handleLocationChange('loc-001', []).catch(() => {});

		expect(getSceneSuggestions).toHaveBeenCalledWith('loc-001', { excludeIds: [] });
	});

	it('should call getSceneSuggestions with excludeIds matching already-selected NPCs', async () => {
		// FAILS (RED): stub never calls service
		await handleLocationChange('loc-001', ['npc-already-1', 'npc-already-2']).catch(() => {});

		expect(getSceneSuggestions).toHaveBeenCalledWith('loc-001', {
			excludeIds: ['npc-already-1', 'npc-already-2']
		});
	});

	it('should NOT call getSceneSuggestions when location is empty string', async () => {
		// FAILS (RED): stub returns NOT_IMPLEMENTED — the real impl must guard against
		// empty location and return [] without calling the service.
		// This test passes once the real impl has the guard.
		// In RED phase the stub returns NOT_IMPLEMENTED (not calling service), so
		// the service assertion passes... but the return value test below will fail.
		await handleLocationChange('', []).catch(() => {});

		expect(getSceneSuggestions).not.toHaveBeenCalled();
	});

	it('should NOT call getSceneSuggestions when location is undefined', async () => {
		// Same logic — the guard must handle undefined locationId
		await handleLocationChange(undefined as unknown as string, []).catch(() => {});

		expect(getSceneSuggestions).not.toHaveBeenCalled();
	});

	it('should return the suggestions from the service', async () => {
		/**
		 * FAILS (RED): stub returns 'NOT_IMPLEMENTED' not the suggestions.
		 * GREEN: real impl returns the getSceneSuggestions result.
		 */
		const mockSuggestions = [
			makeSuggestion('npc-001', 'Barkeep Joe', 'high'),
			makeSuggestion('npc-002', 'Guard Marta', 'medium')
		];
		vi.mocked(getSceneSuggestions).mockResolvedValue(mockSuggestions);

		const result = await handleLocationChange('loc-001', []).catch(() => null);

		// FAILS: stub returns 'NOT_IMPLEMENTED', not an array
		expect(result).not.toBeNull();
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect((result as EntitySuggestion[])[0].entity.name).toBe('Barkeep Joe');
		expect((result as EntitySuggestion[])[1].entity.name).toBe('Guard Marta');
	});

	it('should return empty array when location is empty string', async () => {
		/**
		 * FAILS (RED): stub returns 'NOT_IMPLEMENTED' for all inputs.
		 * GREEN: real impl returns [] immediately for empty string.
		 */
		const result = await handleLocationChange('', []).catch(() => 'threw');

		expect(result).toEqual([]);
	});
});

// ===========================================================================
// 2. handleLocationChange: excludeIds reflects current npcsPresent selection
// ===========================================================================

describe('sceneSuggestionWiring - handleLocationChange: excludeIds reflects current selection', () => {
	it('should pass currently selected NPC IDs as excludeIds', async () => {
		// FAILS (RED): stub does not call service
		await handleLocationChange('loc-tavern', ['npc-already-selected']).catch(() => {});

		expect(getSceneSuggestions).toHaveBeenCalledWith('loc-tavern', {
			excludeIds: ['npc-already-selected']
		});
	});

	it('should pass updated excludeIds on subsequent calls after NPC selection', async () => {
		// FAILS (RED): stub does not call service at all
		await handleLocationChange('loc-001', []).catch(() => {});
		expect(getSceneSuggestions).toHaveBeenLastCalledWith('loc-001', { excludeIds: [] });

		await handleLocationChange('loc-001', ['npc-newly-added']).catch(() => {});
		expect(getSceneSuggestions).toHaveBeenLastCalledWith('loc-001', {
			excludeIds: ['npc-newly-added']
		});
	});

	it('should forward all selected NPC IDs as excludeIds', async () => {
		// FAILS (RED): stub does not call service
		const manySelected = ['npc-a', 'npc-b', 'npc-c', 'npc-d'];
		await handleLocationChange('loc-001', manySelected).catch(() => {});

		expect(getSceneSuggestions).toHaveBeenCalledWith('loc-001', {
			excludeIds: manySelected
		});
	});
});

// ===========================================================================
// 3. addSuggestedNpc: appends an NPC ID to the npcsPresent list
// ===========================================================================

describe('sceneSuggestionWiring - addSuggestedNpc: adds NPC to selected list', () => {
	it('should return a new array containing the new NPC ID', () => {
		// FAILS (RED): stub throws "not implemented"
		expect(() => {
			const result = addSuggestedNpc(['npc-existing'], 'npc-suggested');
			expect(result).toContain('npc-suggested');
			expect(result).toContain('npc-existing');
			expect(result).toHaveLength(2);
		}).not.toThrow();
	});

	it('should not add a duplicate ID when the NPC is already selected', () => {
		// FAILS (RED): stub throws
		expect(() => {
			const result = addSuggestedNpc(['npc-existing'], 'npc-existing');
			expect(result).toHaveLength(1);
		}).not.toThrow();
	});

	it('should work when npcsPresent is empty', () => {
		// FAILS (RED): stub throws
		expect(() => {
			const result = addSuggestedNpc([], 'npc-first');
			expect(result).toEqual(['npc-first']);
		}).not.toThrow();
	});

	it('should not mutate the original array', () => {
		// FAILS (RED): stub throws — real impl must return a new array
		const original = ['npc-a'];

		expect(() => {
			addSuggestedNpc(original, 'npc-b');
		}).not.toThrow();

		// Even if the above didn't throw, original must be unchanged
		expect(original).toHaveLength(1);
		expect(original).toEqual(['npc-a']);
	});

	it('should support accumulating multiple successive suggestions', () => {
		// FAILS (RED): first call throws
		let npcs: string[] = [];

		expect(() => {
			npcs = addSuggestedNpc(npcs, 'npc-001');
			npcs = addSuggestedNpc(npcs, 'npc-002');
			npcs = addSuggestedNpc(npcs, 'npc-003');
		}).not.toThrow();

		// These will only run if the above did not throw
		expect(npcs).toHaveLength(3);
		expect(npcs).toContain('npc-001');
		expect(npcs).toContain('npc-002');
		expect(npcs).toContain('npc-003');
	});
});

// ===========================================================================
// 4. addAllSuggestedNpcs: adds all suggestions to npcsPresent at once
// ===========================================================================

describe('sceneSuggestionWiring - addAllSuggestedNpcs: adds all suggestions to npcsPresent', () => {
	it('should return an array containing all suggestion entity IDs', () => {
		// FAILS (RED): stub throws
		const suggestions: EntitySuggestion[] = [
			makeSuggestion('npc-a', 'Alpha'),
			makeSuggestion('npc-b', 'Beta'),
			makeSuggestion('npc-c', 'Gamma')
		];

		expect(() => {
			const result = addAllSuggestedNpcs([], suggestions);
			expect(result).toHaveLength(3);
			expect(result).toContain('npc-a');
			expect(result).toContain('npc-b');
			expect(result).toContain('npc-c');
		}).not.toThrow();
	});

	it('should merge with existing selected NPCs without duplicates', () => {
		// FAILS (RED): stub throws
		const suggestions: EntitySuggestion[] = [
			makeSuggestion('npc-existing', 'Already There'),
			makeSuggestion('npc-new', 'New NPC')
		];

		expect(() => {
			const result = addAllSuggestedNpcs(['npc-existing'], suggestions);
			const count = result.filter((id) => id === 'npc-existing').length;
			expect(count).toBe(1);
			expect(result).toContain('npc-new');
		}).not.toThrow();
	});

	it('should return empty array when both inputs are empty', () => {
		// FAILS (RED): stub throws
		expect(() => {
			const result = addAllSuggestedNpcs([], []);
			expect(result).toEqual([]);
		}).not.toThrow();
	});
});

// ===========================================================================
// 5. handleLocationChange: clears suggestions when location is cleared
// ===========================================================================

describe('sceneSuggestionWiring - handleLocationChange: clears suggestions on empty location', () => {
	it('should return empty array when location is empty string', async () => {
		// FAILS (RED): stub returns 'NOT_IMPLEMENTED'
		const result = await handleLocationChange('', ['npc-001']).catch(() => 'threw');
		expect(result).toEqual([]);
	});

	it('should not call the service when location is cleared', async () => {
		// Passes in RED phase because stub does NOT call service (it just returns NOT_IMPLEMENTED)
		// This test validates the boundary — still documents the contract.
		await handleLocationChange('', []).catch(() => {});
		expect(getSceneSuggestions).not.toHaveBeenCalled();
	});

	it('should return [] for empty location even when service would return results', async () => {
		// FAILS (RED): stub ignores location and always returns NOT_IMPLEMENTED
		const mockSuggestions = [makeSuggestion('npc-001', 'Joe')];
		vi.mocked(getSceneSuggestions).mockResolvedValue(mockSuggestions);

		const result = await handleLocationChange('', []).catch(() => 'threw');

		expect(result).toEqual([]);
	});
});

// ===========================================================================
// 6. handleLocationChange: graceful error handling
// ===========================================================================

describe('sceneSuggestionWiring - handleLocationChange: service error handling', () => {
	it('should return empty array when service throws', async () => {
		vi.mocked(getSceneSuggestions).mockRejectedValue(new Error('DB error'));

		// FAILS (RED): stub returns NOT_IMPLEMENTED before even calling service.
		// GREEN: real impl must catch service errors and return [].
		const result = await handleLocationChange('loc-001', []).catch(() => 'threw');

		expect(result).toEqual([]);
	});

	it('should return empty array when service returns null', async () => {
		vi.mocked(getSceneSuggestions).mockResolvedValue(null as unknown as EntitySuggestion[]);

		// FAILS (RED): stub returns NOT_IMPLEMENTED.
		// GREEN: real impl must handle null and return [].
		const result = await handleLocationChange('loc-001', []).catch(() => 'threw');

		expect(result).toEqual([]);
	});
});

// ===========================================================================
// 7. Form pages contain the required wiring (source-file inspection)
// ===========================================================================

describe('sceneSuggestionWiring - Form pages contain required wiring', () => {
	/**
	 * These tests read the Svelte source files using Node.js `fs` and assert
	 * that the wiring code is present. All FAIL in RED phase because the
	 * imports and component usage don't exist in the pages yet.
	 *
	 * Source inspection avoids rendering the full SvelteKit pages, which
	 * depend on IndexedDB, $app/stores, and reactive Svelte stores that are
	 * difficult to mock at the page level.
	 */

	it('new scene form imports EntitySuggestionChips', async () => {
		// FAILS: EntitySuggestionChips is not imported in the new form
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/new/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('EntitySuggestionChips');
	});

	it('new scene form imports getSceneSuggestions from sceneSuggestionService', async () => {
		// FAILS: getSceneSuggestions is not imported in the new form
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/new/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('getSceneSuggestions');
	});

	it('new scene form uses EntitySuggestionChips in the HTML template section', async () => {
		// FAILS: EntitySuggestionChips is not rendered in the template yet
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/new/+page.svelte'),
			'utf-8'
		);

		// Component must appear in the template (after the closing </script>)
		const templatePart = content.slice(content.lastIndexOf('</script>'));
		expect(templatePart).toContain('EntitySuggestionChips');
	});

	it('new scene form declares a locationNpcSuggestions reactive state variable', async () => {
		// FAILS: the state variable does not exist in the new form yet
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/new/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('locationNpcSuggestions');
	});

	it('edit scene form imports EntitySuggestionChips', async () => {
		// FAILS: EntitySuggestionChips is not imported in the edit form
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/[id]/edit/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('EntitySuggestionChips');
	});

	it('edit scene form imports getSceneSuggestions from sceneSuggestionService', async () => {
		// FAILS: getSceneSuggestions is not imported in the edit form
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/[id]/edit/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('getSceneSuggestions');
	});

	it('edit scene form uses EntitySuggestionChips in the HTML template section', async () => {
		// FAILS: EntitySuggestionChips is not rendered in the template yet
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/[id]/edit/+page.svelte'),
			'utf-8'
		);

		const templatePart = content.slice(content.lastIndexOf('</script>'));
		expect(templatePart).toContain('EntitySuggestionChips');
	});

	it('edit scene form declares a locationNpcSuggestions reactive state variable', async () => {
		// FAILS: the state variable does not exist in the edit form yet
		const { readFileSync } = await import('fs');
		const { resolve } = await import('path');

		const content = readFileSync(
			resolve('src/routes/entities/[type]/[id]/edit/+page.svelte'),
			'utf-8'
		);

		expect(content).toContain('locationNpcSuggestions');
	});
});

// ===========================================================================
// 8. Scene entity type field configuration (pre-conditions that should PASS)
// ===========================================================================

describe('sceneSuggestionWiring - Scene entity field configuration', () => {
	/**
	 * These tests verify the scene entity type already has the correct field
	 * schema. They PASS in the RED phase — the fields exist — confirming the
	 * infrastructure is in place for the wiring to be added.
	 */

	it('location field exists as entity-ref pointing to location entities', async () => {
		const { BUILT_IN_ENTITY_TYPES } = await import('$lib/config/entityTypes');

		const sceneType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
		expect(sceneType).toBeDefined();

		const locationField = sceneType!.fieldDefinitions.find((f) => f.key === 'location');
		expect(locationField).toBeDefined();
		expect(locationField!.type).toBe('entity-ref');
		expect(locationField!.entityTypes).toContain('location');
	});

	it('npcsPresent field exists as entity-refs pointing to npc entities', async () => {
		const { BUILT_IN_ENTITY_TYPES } = await import('$lib/config/entityTypes');

		const sceneType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
		expect(sceneType).toBeDefined();

		const npcsPresentField = sceneType!.fieldDefinitions.find((f) => f.key === 'npcsPresent');
		expect(npcsPresentField).toBeDefined();
		expect(npcsPresentField!.type).toBe('entity-refs');
		expect(npcsPresentField!.entityTypes).toContain('npc');
	});

	it('location field appears before npcsPresent in field ordering', async () => {
		const { BUILT_IN_ENTITY_TYPES } = await import('$lib/config/entityTypes');

		const sceneType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
		const locationField = sceneType!.fieldDefinitions.find((f) => f.key === 'location');
		const npcsPresentField = sceneType!.fieldDefinitions.find((f) => f.key === 'npcsPresent');

		expect(locationField!.order).toBeLessThan(npcsPresentField!.order);
	});
});

// ===========================================================================
// 9. Suggestion data shape is compatible with EntitySuggestionChips props
// ===========================================================================

describe('sceneSuggestionWiring - Suggestion data shape compatible with EntitySuggestionChips', () => {
	it('should pass through suggestions with all fields EntitySuggestionChips needs', async () => {
		// FAILS (RED): stub returns NOT_IMPLEMENTED, not the service result
		const mockSuggestion = makeSuggestion('npc-001', 'Test NPC', 'high');
		vi.mocked(getSceneSuggestions).mockResolvedValue([mockSuggestion]);

		const result = await handleLocationChange('loc-001', []).catch(() => null);

		// FAILS: stub returns NOT_IMPLEMENTED not an array
		expect(result).not.toBeNull();
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(1);

		const suggestion = (result as EntitySuggestion[])[0];
		expect(suggestion).toHaveProperty('entity');
		expect(suggestion).toHaveProperty('reason');
		expect(suggestion).toHaveProperty('confidence');
		expect(suggestion).toHaveProperty('sourceRelationship');
		expect(suggestion.entity).toHaveProperty('id');
		expect(suggestion.entity).toHaveProperty('name');
	});

	it('should preserve service sort order (high -> medium -> low confidence)', async () => {
		// FAILS (RED): stub returns NOT_IMPLEMENTED not the service result
		const mockSuggestions = [
			makeSuggestion('npc-h', 'High NPC', 'high'),
			makeSuggestion('npc-m', 'Medium NPC', 'medium'),
			makeSuggestion('npc-l', 'Low NPC', 'low')
		];
		vi.mocked(getSceneSuggestions).mockResolvedValue(mockSuggestions);

		const result = await handleLocationChange('loc-001', []).catch(() => null);

		// FAILS: stub returns NOT_IMPLEMENTED
		expect(result).not.toBeNull();
		const suggestions = result as EntitySuggestion[];
		expect(suggestions[0].confidence).toBe('high');
		expect(suggestions[1].confidence).toBe('medium');
		expect(suggestions[2].confidence).toBe('low');
	});
});
