/**
 * Tests for Player Export Field Config Service (TDD RED Phase)
 * GitHub Issue #437: Settings UI for per-category player export field defaults
 *
 * Tests the service functions for managing per-category field visibility
 * defaults stored in CampaignMetadata.playerExportFieldConfig.
 *
 * RED Phase: These tests SHOULD FAIL because the implementation does not exist yet.
 */
import { describe, it, expect } from 'vitest';
import {
	getPlayerExportFieldConfig,
	getFieldVisibilitySetting,
	setFieldVisibilitySetting,
	removeFieldVisibilitySetting,
	resetEntityTypeConfig,
	getHardcodedDefault,
	getCategoryVisibilitySetting,
	setCategoryVisibilitySetting,
	removeCategoryVisibilitySetting,
	resetAllCategoryVisibility
} from './playerExportFieldConfigService';
import type { CampaignMetadata } from '$lib/types/campaign';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
import type { FieldDefinition } from '$lib/types/entities';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCampaignMetadata(
	overrides: Partial<CampaignMetadata> = {}
): CampaignMetadata {
	return {
		customEntityTypes: [],
		entityTypeOverrides: [],
		settings: {
			customRelationships: [],
			enabledEntityTypes: [],
			theme: 'system'
		},
		...overrides
	};
}

function makeFieldDef(overrides: Partial<FieldDefinition> = {}): FieldDefinition {
	return {
		key: 'someField',
		label: 'Some Field',
		type: 'text',
		required: false,
		order: 1,
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getPlayerExportFieldConfig', () => {
	it('returns config from campaign metadata when present', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true, secret: false } }
		};
		const metadata = makeCampaignMetadata({
			playerExportFieldConfig: config
		});

		const result = getPlayerExportFieldConfig(metadata);
		expect(result).toEqual(config);
	});

	it('returns empty config when metadata has no playerExportFieldConfig', () => {
		const metadata = makeCampaignMetadata();

		const result = getPlayerExportFieldConfig(metadata);
		expect(result).toEqual({ fieldVisibility: {} });
	});

	it('returns empty config when playerExportFieldConfig is undefined', () => {
		const metadata = makeCampaignMetadata({
			playerExportFieldConfig: undefined
		});

		const result = getPlayerExportFieldConfig(metadata);
		expect(result).toEqual({ fieldVisibility: {} });
	});
});

describe('getFieldVisibilitySetting', () => {
	it('returns true when field is set to visible', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = getFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result).toBe(true);
	});

	it('returns false when field is set to hidden', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { secret_plan: false } }
		};

		const result = getFieldVisibilitySetting(config, 'npc', 'secret_plan');
		expect(result).toBe(false);
	});

	it('returns undefined when field not configured', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = getFieldVisibilitySetting(config, 'npc', 'alignment');
		expect(result).toBeUndefined();
	});

	it('returns undefined when entity type not configured', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = getFieldVisibilitySetting(config, 'location', 'population');
		expect(result).toBeUndefined();
	});

	it('returns undefined when fieldVisibility is empty', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
		};

		const result = getFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result).toBeUndefined();
	});
});

describe('setFieldVisibilitySetting', () => {
	it('sets visibility for new entity type and field', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
		};

		const result = setFieldVisibilitySetting(config, 'npc', 'occupation', true);
		expect(result.fieldVisibility.npc.occupation).toBe(true);
	});

	it('updates existing visibility setting', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = setFieldVisibilitySetting(config, 'npc', 'occupation', false);
		expect(result.fieldVisibility.npc.occupation).toBe(false);
	});

	it('preserves other entity type configs', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true },
				location: { population: false }
			}
		};

		const result = setFieldVisibilitySetting(config, 'npc', 'occupation', false);
		expect(result.fieldVisibility.location).toEqual({ population: false });
	});

	it('preserves other field configs within same entity type', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true, alignment: false }
			}
		};

		const result = setFieldVisibilitySetting(config, 'npc', 'occupation', false);
		expect(result.fieldVisibility.npc.alignment).toBe(false);
		expect(result.fieldVisibility.npc.occupation).toBe(false);
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};
		const originalJson = JSON.stringify(config);

		setFieldVisibilitySetting(config, 'npc', 'occupation', false);
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('does not mutate original config when adding new entity type', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
		};
		const originalJson = JSON.stringify(config);

		setFieldVisibilitySetting(config, 'npc', 'occupation', true);
		expect(JSON.stringify(config)).toBe(originalJson);
	});
});

describe('removeFieldVisibilitySetting', () => {
	it('removes specific field from config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true, alignment: false } }
		};

		const result = removeFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result.fieldVisibility.npc.occupation).toBeUndefined();
		expect('occupation' in result.fieldVisibility.npc).toBe(false);
	});

	it('preserves other fields in same entity type', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true, alignment: false } }
		};

		const result = removeFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result.fieldVisibility.npc.alignment).toBe(false);
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true, alignment: false } }
		};
		const originalJson = JSON.stringify(config);

		removeFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('cleans up empty entity type entries', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = removeFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result.fieldVisibility.npc).toBeUndefined();
		expect('npc' in result.fieldVisibility).toBe(false);
	});

	it('preserves other entity type configs when cleaning up', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true },
				location: { population: false }
			}
		};

		const result = removeFieldVisibilitySetting(config, 'npc', 'occupation');
		expect(result.fieldVisibility.npc).toBeUndefined();
		expect(result.fieldVisibility.location).toEqual({ population: false });
	});

	it('handles removing field from non-existent entity type gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = removeFieldVisibilitySetting(config, 'location', 'population');
		// Should return config unchanged (no mutation, but structurally identical)
		expect(result.fieldVisibility).toEqual(config.fieldVisibility);
	});

	it('handles removing non-existent field gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = removeFieldVisibilitySetting(config, 'npc', 'alignment');
		expect(result.fieldVisibility.npc.occupation).toBe(true);
	});
});

describe('resetEntityTypeConfig', () => {
	it('removes all field configs for entity type', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true, alignment: false, secret: false }
			}
		};

		const result = resetEntityTypeConfig(config, 'npc');
		expect(result.fieldVisibility.npc).toBeUndefined();
		expect('npc' in result.fieldVisibility).toBe(false);
	});

	it('preserves other entity type configs', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true },
				location: { population: false },
				character: { level: true }
			}
		};

		const result = resetEntityTypeConfig(config, 'npc');
		expect(result.fieldVisibility.npc).toBeUndefined();
		expect(result.fieldVisibility.location).toEqual({ population: false });
		expect(result.fieldVisibility.character).toEqual({ level: true });
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true },
				location: { population: false }
			}
		};
		const originalJson = JSON.stringify(config);

		resetEntityTypeConfig(config, 'npc');
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('handles resetting non-existent entity type gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = resetEntityTypeConfig(config, 'location');
		expect(result.fieldVisibility).toEqual(config.fieldVisibility);
	});

	it('returns config with empty fieldVisibility when last entity type is removed', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: { npc: { occupation: true } }
		};

		const result = resetEntityTypeConfig(config, 'npc');
		expect(result.fieldVisibility).toEqual({});
	});
});

describe('getHardcodedDefault', () => {
	it("returns false for 'notes' field", () => {
		const fieldDef = makeFieldDef({ key: 'notes' });

		const result = getHardcodedDefault('notes', fieldDef, 'npc');
		expect(result).toBe(false);
	});

	it("returns false for field with section: 'hidden'", () => {
		const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

		const result = getHardcodedDefault('secret_motivation', fieldDef, 'npc');
		expect(result).toBe(false);
	});

	it("returns false for 'preparation' on session entity type", () => {
		const fieldDef = makeFieldDef({ key: 'preparation' });

		const result = getHardcodedDefault('preparation', fieldDef, 'session');
		expect(result).toBe(false);
	});

	it("returns true for 'preparation' on non-session entity type", () => {
		const fieldDef = makeFieldDef({ key: 'preparation' });

		const result = getHardcodedDefault('preparation', fieldDef, 'npc');
		expect(result).toBe(true);
	});

	it('returns true for regular visible field', () => {
		const fieldDef = makeFieldDef({ key: 'occupation' });

		const result = getHardcodedDefault('occupation', fieldDef, 'npc');
		expect(result).toBe(true);
	});

	it('returns true when fieldDef is undefined', () => {
		const result = getHardcodedDefault('some_custom_field', undefined, 'npc');
		expect(result).toBe(true);
	});

	it("returns false for 'notes' even without fieldDef", () => {
		const result = getHardcodedDefault('notes', undefined, 'npc');
		expect(result).toBe(false);
	});

	it("returns true for field with section other than 'hidden'", () => {
		const fieldDef = makeFieldDef({ key: 'bio', section: 'public' });

		const result = getHardcodedDefault('bio', fieldDef, 'npc');
		expect(result).toBe(true);
	});

	it('returns true for field with no section', () => {
		const fieldDef = makeFieldDef({ key: 'level' });

		const result = getHardcodedDefault('level', fieldDef, 'character');
		expect(result).toBe(true);
	});

	it("returns false for 'notes' regardless of entity type", () => {
		const fieldDef = makeFieldDef({ key: 'notes' });
		const types = ['npc', 'character', 'location', 'faction', 'item', 'session', 'deity'];

		for (const entityType of types) {
			const result = getHardcodedDefault('notes', fieldDef, entityType);
			expect(result).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// Issue #520: Category-level entity visibility via categoryVisibility
// ---------------------------------------------------------------------------

describe('getCategoryVisibilitySetting', () => {
	it('returns true when category is set to visible', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: true
			}
		};

		const result = getCategoryVisibilitySetting(config, 'npc');
		expect(result).toBe(true);
	});

	it('returns false when category is set to hidden', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false
			}
		};

		const result = getCategoryVisibilitySetting(config, 'npc');
		expect(result).toBe(false);
	});

	it('returns undefined when category not configured', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: true
			}
		};

		const result = getCategoryVisibilitySetting(config, 'location');
		expect(result).toBeUndefined();
	});

	it('returns undefined when categoryVisibility is undefined', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
			// categoryVisibility not defined
		};

		const result = getCategoryVisibilitySetting(config, 'npc');
		expect(result).toBeUndefined();
	});

	it('returns undefined when categoryVisibility is empty', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {}
		};

		const result = getCategoryVisibilitySetting(config, 'npc');
		expect(result).toBeUndefined();
	});
});

describe('setCategoryVisibilitySetting', () => {
	it('sets visibility for new category', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {}
		};

		const result = setCategoryVisibilitySetting(config, 'npc', false);
		expect(result.categoryVisibility?.npc).toBe(false);
	});

	it('creates categoryVisibility object if it does not exist', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
			// categoryVisibility not defined
		};

		const result = setCategoryVisibilitySetting(config, 'npc', true);
		expect(result.categoryVisibility).toBeDefined();
		expect(result.categoryVisibility?.npc).toBe(true);
	});

	it('updates existing visibility setting', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: true
			}
		};

		const result = setCategoryVisibilitySetting(config, 'npc', false);
		expect(result.categoryVisibility?.npc).toBe(false);
	});

	it('preserves other category configs', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: true,
				location: false
			}
		};

		const result = setCategoryVisibilitySetting(config, 'npc', false);
		expect(result.categoryVisibility?.location).toBe(false);
		expect(result.categoryVisibility?.npc).toBe(false);
	});

	it('preserves fieldVisibility config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true }
			},
			categoryVisibility: {}
		};

		const result = setCategoryVisibilitySetting(config, 'npc', false);
		expect(result.fieldVisibility.npc.occupation).toBe(true);
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: true
			}
		};
		const originalJson = JSON.stringify(config);

		setCategoryVisibilitySetting(config, 'npc', false);
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('does not mutate original config when creating categoryVisibility', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
		};
		const originalJson = JSON.stringify(config);

		setCategoryVisibilitySetting(config, 'npc', true);
		expect(JSON.stringify(config)).toBe(originalJson);
	});
});

describe('removeCategoryVisibilitySetting', () => {
	it('removes specific category from config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false,
				location: true
			}
		};

		const result = removeCategoryVisibilitySetting(config, 'npc');
		expect(result.categoryVisibility?.npc).toBeUndefined();
		expect('npc' in (result.categoryVisibility ?? {})).toBe(false);
	});

	it('preserves other category configs', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false,
				location: true
			}
		};

		const result = removeCategoryVisibilitySetting(config, 'npc');
		expect(result.categoryVisibility?.location).toBe(true);
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false,
				location: true
			}
		};
		const originalJson = JSON.stringify(config);

		removeCategoryVisibilitySetting(config, 'npc');
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('removes categoryVisibility entirely when last category is removed', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false
			}
		};

		const result = removeCategoryVisibilitySetting(config, 'npc');
		expect(result.categoryVisibility).toBeUndefined();
		expect('categoryVisibility' in result).toBe(false);
	});

	it('preserves fieldVisibility when cleaning up categoryVisibility', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true }
			},
			categoryVisibility: {
				npc: false
			}
		};

		const result = removeCategoryVisibilitySetting(config, 'npc');
		expect(result.fieldVisibility.npc.occupation).toBe(true);
	});

	it('handles removing category from non-existent categoryVisibility gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
			// categoryVisibility not defined
		};

		const result = removeCategoryVisibilitySetting(config, 'npc');
		expect(result.fieldVisibility).toEqual(config.fieldVisibility);
	});

	it('handles removing non-existent category gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false
			}
		};

		const result = removeCategoryVisibilitySetting(config, 'location');
		expect(result.categoryVisibility?.npc).toBe(false);
	});
});

describe('resetAllCategoryVisibility', () => {
	it('removes entire categoryVisibility object', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false,
				location: true,
				character: false
			}
		};

		const result = resetAllCategoryVisibility(config);
		expect(result.categoryVisibility).toBeUndefined();
		expect('categoryVisibility' in result).toBe(false);
	});

	it('preserves fieldVisibility config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true },
				location: { population: false }
			},
			categoryVisibility: {
				npc: false,
				location: true
			}
		};

		const result = resetAllCategoryVisibility(config);
		expect(result.fieldVisibility.npc.occupation).toBe(true);
		expect(result.fieldVisibility.location.population).toBe(false);
	});

	it('does not mutate original config', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {},
			categoryVisibility: {
				npc: false,
				location: true
			}
		};
		const originalJson = JSON.stringify(config);

		resetAllCategoryVisibility(config);
		expect(JSON.stringify(config)).toBe(originalJson);
	});

	it('handles config without categoryVisibility gracefully', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {}
		};

		const result = resetAllCategoryVisibility(config);
		expect(result.fieldVisibility).toEqual(config.fieldVisibility);
		expect('categoryVisibility' in result).toBe(false);
	});

	it('returns config with only fieldVisibility when categoryVisibility is removed', () => {
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: { occupation: true }
			},
			categoryVisibility: {
				npc: false
			}
		};

		const result = resetAllCategoryVisibility(config);
		expect(Object.keys(result)).toEqual(['fieldVisibility']);
	});
});
