/**
 * Tests for Player Field Visibility Service (TDD RED Phase)
 * GitHub Issue #436: Data model for player export field visibility configuration
 *
 * Tests the cascade resolution function isFieldPlayerVisible() which determines
 * whether a specific field should be included in a player export.
 *
 * Cascade priority (highest to lowest):
 * 1. Per-entity override (entity.metadata.playerExportFieldOverrides[fieldKey])
 * 2. Per-category default (config.fieldVisibility[entityType][fieldKey])
 * 3. Hardcoded rules (current behavior: notes=false, hidden section=false,
 *    preparation on sessions=false, everything else=true)
 *
 * RED Phase: These tests SHOULD FAIL because the implementation does not exist yet.
 */
import { describe, it, expect } from 'vitest';
import { isFieldPlayerVisible } from './playerFieldVisibility';
import type { BaseEntity, FieldDefinition } from '$lib/types/entities';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeEntity(overrides: Partial<BaseEntity> = {}): BaseEntity {
	return {
		id: 'test-entity-1',
		type: 'npc',
		name: 'Test Entity',
		description: 'A test entity',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-10'),
		metadata: {},
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

describe('isFieldPlayerVisible', () => {
	// -----------------------------------------------------------------------
	// 1. Cascade priority tests
	// -----------------------------------------------------------------------
	describe('Cascade priority', () => {
		it('per-entity override wins over category default', () => {
			// Category default says hidden, but entity override says visible
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { occupation: true } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { occupation: false } }
			};
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('per-entity override wins over category default (reverse: override excludes)', () => {
			// Category default says visible, but entity override says hidden
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { occupation: false } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { occupation: true } }
			};
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('per-entity override wins over hardcoded rules (force-include notes)', () => {
			// Hardcoded rule: 'notes' is always false
			// But per-entity override says true
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { notes: true } }
			});
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('per-entity override wins over hardcoded rules (force-include hidden section field)', () => {
			// Hardcoded rule: field with section='hidden' is false
			// But per-entity override says true
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { secret_motivation: true } }
			});
			const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_motivation',
				fieldDef,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(true);
		});

		it('per-entity override wins over hardcoded rules (force-include preparation on session)', () => {
			const entity = makeEntity({
				type: 'session',
				metadata: { playerExportFieldOverrides: { preparation: true } }
			});
			const fieldDef = makeFieldDef({ key: 'preparation' });

			const result = isFieldPlayerVisible(
				'preparation',
				fieldDef,
				'session',
				entity,
				undefined
			);
			expect(result).toBe(true);
		});

		it('category default wins over hardcoded rules (include normally-hidden notes)', () => {
			// Category default explicitly includes 'notes'
			// Hardcoded rule would say false
			const entity = makeEntity(); // no overrides
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { notes: true } }
			};
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('category default wins over hardcoded rules (exclude normally-visible field)', () => {
			// Category default explicitly excludes 'occupation'
			// Hardcoded rule would say true (normal visible field)
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { occupation: false } }
			};
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('hardcoded rules used when no config and no overrides exist', () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});
	});

	// -----------------------------------------------------------------------
	// 2. Per-entity override tests
	// -----------------------------------------------------------------------
	describe('Per-entity overrides', () => {
		it('override explicitly includes a normally-hidden field (notes)', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { notes: true } }
			});
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('override explicitly excludes a normally-visible field', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { occupation: false } }
			});
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('override set to true for field with hidden section', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { secret_plan: true } }
			});
			const fieldDef = makeFieldDef({ key: 'secret_plan', section: 'hidden' });

			const result = isFieldPlayerVisible('secret_plan', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('override set to false for field with hidden section (redundant but explicit)', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { secret_plan: false } }
			});
			const fieldDef = makeFieldDef({ key: 'secret_plan', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_plan',
				fieldDef,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(false);
		});

		it('undefined override field falls through to category default', () => {
			// Entity has overrides object, but not for this specific field
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { other_field: true } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { occupation: false } }
			};
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('undefined override field falls through to hardcoded rules when no config', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { other_field: true } }
			});
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// 3. Per-category default tests
	// -----------------------------------------------------------------------
	describe('Per-category defaults', () => {
		it('category config includes a field -> true', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { background: true } }
			};
			const fieldDef = makeFieldDef({ key: 'background' });

			const result = isFieldPlayerVisible('background', fieldDef, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('category config excludes a field -> false', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { background: false } }
			};
			const fieldDef = makeFieldDef({ key: 'background' });

			const result = isFieldPlayerVisible('background', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('field not in category config falls through to hardcoded rules (visible field)', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { other_field: true } }
			};
			const fieldDef = makeFieldDef({ key: 'occupation' });

			// 'occupation' not in config -> hardcoded: true (normal field)
			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('field not in category config falls through to hardcoded rules (notes field)', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { other_field: true } }
			};
			const fieldDef = makeFieldDef({ key: 'notes' });

			// 'notes' not in config -> hardcoded: false
			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('field not in category config falls through to hardcoded rules (hidden section)', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { other_field: true } }
			};
			const fieldDef = makeFieldDef({ key: 'secret_plan', section: 'hidden' });

			// 'secret_plan' not in config -> hardcoded: false (hidden section)
			const result = isFieldPlayerVisible('secret_plan', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('unknown entity type not in config falls through to hardcoded rules', () => {
			const entity = makeEntity({ type: 'custom_monster' });
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { hitpoints: true } }
			};
			const fieldDef = makeFieldDef({ key: 'hitpoints' });

			// 'custom_monster' not in config -> hardcoded: true (normal field)
			const result = isFieldPlayerVisible(
				'hitpoints',
				fieldDef,
				'custom_monster',
				entity,
				config
			);
			expect(result).toBe(true);
		});

		it('category config with multiple fields works correctly', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						occupation: true,
						alignment: true,
						secret_weakness: false,
						background: true
					}
				}
			};

			expect(
				isFieldPlayerVisible(
					'occupation',
					makeFieldDef({ key: 'occupation' }),
					'npc',
					entity,
					config
				)
			).toBe(true);
			expect(
				isFieldPlayerVisible(
					'secret_weakness',
					makeFieldDef({ key: 'secret_weakness' }),
					'npc',
					entity,
					config
				)
			).toBe(false);
		});

		it('different entity types have independent configs', () => {
			const npcEntity = makeEntity({ type: 'npc' });
			const locationEntity = makeEntity({ type: 'location' });
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { population: false },
					location: { population: true }
				}
			};
			const fieldDef = makeFieldDef({ key: 'population' });

			expect(
				isFieldPlayerVisible('population', fieldDef, 'npc', npcEntity, config)
			).toBe(false);
			expect(
				isFieldPlayerVisible('population', fieldDef, 'location', locationEntity, config)
			).toBe(true);
		});
	});

	// -----------------------------------------------------------------------
	// 4. Hardcoded rules (backward compatibility)
	// -----------------------------------------------------------------------
	describe('Hardcoded rules (backward compatibility)', () => {
		it("'notes' field -> false (unless overridden)", () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it("field with section: 'hidden' -> false (unless overridden)", () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_motivation',
				fieldDef,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(false);
		});

		it("'preparation' field for session type -> false (unless overridden)", () => {
			const entity = makeEntity({ type: 'session' });
			const fieldDef = makeFieldDef({ key: 'preparation' });

			const result = isFieldPlayerVisible(
				'preparation',
				fieldDef,
				'session',
				entity,
				undefined
			);
			expect(result).toBe(false);
		});

		it("'preparation' field for non-session type -> true", () => {
			const entity = makeEntity({ type: 'npc' });
			const fieldDef = makeFieldDef({ key: 'preparation' });

			const result = isFieldPlayerVisible(
				'preparation',
				fieldDef,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(true);
		});

		it('regular visible field -> true', () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'alignment' });

			const result = isFieldPlayerVisible('alignment', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('field with no FieldDefinition (undefined) -> true (safe default)', () => {
			const entity = makeEntity();

			const result = isFieldPlayerVisible(
				'some_custom_field',
				undefined,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(true);
		});

		it("field with section other than 'hidden' -> true", () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'occupation', section: 'public' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('field with no section -> true', () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'occupation' });
			// fieldDef has no section property set (undefined by default from makeFieldDef)

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it("'notes' field on any entity type -> false", () => {
			const types = ['npc', 'character', 'location', 'faction', 'item', 'session', 'deity'];
			const fieldDef = makeFieldDef({ key: 'notes' });

			for (const entityType of types) {
				const entity = makeEntity({ type: entityType });
				const result = isFieldPlayerVisible(
					'notes',
					fieldDef,
					entityType,
					entity,
					undefined
				);
				expect(result).toBe(false);
			}
		});
	});

	// -----------------------------------------------------------------------
	// 5. Edge cases
	// -----------------------------------------------------------------------
	describe('Edge cases', () => {
		it('config is undefined -> backward compatible (notes hidden)', () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('config is undefined -> backward compatible (regular field visible)', () => {
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('config.fieldVisibility is empty object -> backward compatible', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = { fieldVisibility: {} };
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('config.fieldVisibility is empty object -> regular field still visible', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = { fieldVisibility: {} };
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('entity.metadata has no playerExportFieldOverrides -> falls through', () => {
			const entity = makeEntity({ metadata: { someOtherKey: 'value' } });
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('entity.metadata is empty object -> falls through', () => {
			const entity = makeEntity({ metadata: {} });
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('entity.metadata.playerExportFieldOverrides is empty object -> falls through', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: {} }
			});
			const fieldDef = makeFieldDef({ key: 'notes' });

			// Empty overrides object: 'notes' not listed, so falls through to hardcoded -> false
			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('entity.metadata.playerExportFieldOverrides is empty object -> regular field visible', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: {} }
			});
			const fieldDef = makeFieldDef({ key: 'occupation' });

			const result = isFieldPlayerVisible('occupation', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('handles built-in entity types correctly', () => {
			const builtInTypes = [
				'character',
				'npc',
				'location',
				'faction',
				'item',
				'session',
				'scene',
				'deity',
				'timeline_event',
				'world_rule'
			];
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'some_field' });

			for (const type of builtInTypes) {
				const e = { ...entity, type };
				const result = isFieldPlayerVisible('some_field', fieldDef, type, e, undefined);
				expect(result).toBe(true);
			}
		});

		it('handles custom entity types', () => {
			const entity = makeEntity({ type: 'custom_monster' });
			const fieldDef = makeFieldDef({ key: 'hit_dice' });

			const result = isFieldPlayerVisible(
				'hit_dice',
				fieldDef,
				'custom_monster',
				entity,
				undefined
			);
			expect(result).toBe(true);
		});

		it('handles custom entity type with config', () => {
			const entity = makeEntity({ type: 'custom_vehicle' });
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { custom_vehicle: { speed: true, secret_weapon: false } }
			};

			expect(
				isFieldPlayerVisible(
					'speed',
					makeFieldDef({ key: 'speed' }),
					'custom_vehicle',
					entity,
					config
				)
			).toBe(true);
			expect(
				isFieldPlayerVisible(
					'secret_weapon',
					makeFieldDef({ key: 'secret_weapon' }),
					'custom_vehicle',
					entity,
					config
				)
			).toBe(false);
		});

		it('per-entity override with config undefined still works', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { notes: true } }
			});
			const fieldDef = makeFieldDef({ key: 'notes' });

			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('category config entry for entity type is empty object -> falls through to hardcoded', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: {} }
			};
			const fieldDef = makeFieldDef({ key: 'notes' });

			// npc config exists but is empty -> 'notes' not in config -> hardcoded -> false
			const result = isFieldPlayerVisible('notes', fieldDef, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('full cascade: override > category > hardcoded for same field', () => {
			// All three levels set for 'secret_motivation':
			// Hardcoded: hidden section -> false
			// Category: true
			// Entity override: false
			// Expected: entity override wins -> false
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { secret_motivation: false } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { secret_motivation: true } }
			};
			const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_motivation',
				fieldDef,
				'npc',
				entity,
				config
			);
			expect(result).toBe(false);
		});

		it('full cascade: no override, category > hardcoded', () => {
			// Hardcoded: hidden section -> false
			// Category: true
			// No entity override
			// Expected: category wins -> true
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { secret_motivation: true } }
			};
			const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_motivation',
				fieldDef,
				'npc',
				entity,
				config
			);
			expect(result).toBe(true);
		});

		it('full cascade: no override, no category -> hardcoded', () => {
			// Hardcoded: hidden section -> false
			// No category config
			// No entity override
			// Expected: hardcoded -> false
			const entity = makeEntity();
			const fieldDef = makeFieldDef({ key: 'secret_motivation', section: 'hidden' });

			const result = isFieldPlayerVisible(
				'secret_motivation',
				fieldDef,
				'npc',
				entity,
				undefined
			);
			expect(result).toBe(false);
		});

		it('preparation field on session with category override to include it', () => {
			const entity = makeEntity({ type: 'session' });
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { session: { preparation: true } }
			};
			const fieldDef = makeFieldDef({ key: 'preparation' });

			const result = isFieldPlayerVisible(
				'preparation',
				fieldDef,
				'session',
				entity,
				config
			);
			expect(result).toBe(true);
		});

		it('preparation field on session with category override to exclude it (redundant)', () => {
			const entity = makeEntity({ type: 'session' });
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { session: { preparation: false } }
			};
			const fieldDef = makeFieldDef({ key: 'preparation' });

			const result = isFieldPlayerVisible(
				'preparation',
				fieldDef,
				'session',
				entity,
				config
			);
			expect(result).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// 6. Core field visibility (GitHub Issue #522)
	// -----------------------------------------------------------------------
	describe('Core field visibility', () => {
		it('isFieldPlayerVisible returns true for __core_description with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_description', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_summary with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_summary', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_tags with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_tags', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_imageUrl with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_imageUrl', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_createdAt with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_createdAt', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_updatedAt with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_updatedAt', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('isFieldPlayerVisible returns true for __core_relationships with no overrides', () => {
			const entity = makeEntity();
			const result = isFieldPlayerVisible('__core_relationships', undefined, 'npc', entity, undefined);
			expect(result).toBe(true);
		});

		it('per-entity override to false hides __core_description', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { __core_description: false } }
			});
			const result = isFieldPlayerVisible('__core_description', undefined, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('per-entity override to false hides __core_tags', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { __core_tags: false } }
			});
			const result = isFieldPlayerVisible('__core_tags', undefined, 'npc', entity, undefined);
			expect(result).toBe(false);
		});

		it('per-category default to false hides __core_summary', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { __core_summary: false } }
			};
			const result = isFieldPlayerVisible('__core_summary', undefined, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('per-category default to false hides __core_imageUrl', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { __core_imageUrl: false } }
			};
			const result = isFieldPlayerVisible('__core_imageUrl', undefined, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('per-entity override true overrides category false for __core_description', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { __core_description: true } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { __core_description: false } }
			};
			const result = isFieldPlayerVisible('__core_description', undefined, 'npc', entity, config);
			expect(result).toBe(true);
		});

		it('per-entity override false overrides category true for __core_relationships', () => {
			const entity = makeEntity({
				metadata: { playerExportFieldOverrides: { __core_relationships: false } }
			});
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { __core_relationships: true } }
			};
			const result = isFieldPlayerVisible('__core_relationships', undefined, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('core field with undefined fieldDef works correctly', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { __core_createdAt: false } }
			};
			const result = isFieldPlayerVisible('__core_createdAt', undefined, 'npc', entity, config);
			expect(result).toBe(false);
		});

		it('all core fields default to visible when no config exists', () => {
			const entity = makeEntity();
			const coreFields = [
				'__core_description',
				'__core_summary',
				'__core_tags',
				'__core_imageUrl',
				'__core_createdAt',
				'__core_updatedAt',
				'__core_relationships'
			];

			for (const fieldKey of coreFields) {
				const result = isFieldPlayerVisible(fieldKey, undefined, 'npc', entity, undefined);
				expect(result).toBe(true);
			}
		});

		it('multiple core fields can be hidden simultaneously via category config', () => {
			const entity = makeEntity();
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						__core_description: false,
						__core_tags: false,
						__core_relationships: false
					}
				}
			};

			expect(isFieldPlayerVisible('__core_description', undefined, 'npc', entity, config)).toBe(false);
			expect(isFieldPlayerVisible('__core_tags', undefined, 'npc', entity, config)).toBe(false);
			expect(isFieldPlayerVisible('__core_relationships', undefined, 'npc', entity, config)).toBe(false);
			expect(isFieldPlayerVisible('__core_summary', undefined, 'npc', entity, config)).toBe(true);
		});
	});
});
