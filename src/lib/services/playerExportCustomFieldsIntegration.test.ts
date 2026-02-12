/**
 * Integration Tests: Custom Fields with Player Export Visibility System
 * GitHub Issue #440
 *
 * Verifies that custom fields (from custom entity types and from entity type
 * overrides' additionalFields) fully participate in the player export visibility
 * system. Uses REAL implementations (no mocks).
 *
 * Custom field sources tested:
 * 1. Custom entity types (EntityTypeDefinition where isBuiltIn: false)
 * 2. Entity type overrides (built-in types with additionalFields via EntityTypeOverride)
 *
 * Services exercised:
 * - isFieldPlayerVisible (cascade: per-entity override > category config > hardcoded)
 * - playerExportFieldConfigService (CRUD for category-level config)
 * - entityFieldVisibilityService (per-entity override helpers)
 * - filterEntitiesForPlayer / filterEntityForPlayer (end-to-end filtering)
 */
import { describe, it, expect } from 'vitest';
import { isFieldPlayerVisible } from './playerFieldVisibility';
import {
	getFieldVisibilitySetting,
	setFieldVisibilitySetting,
	resetEntityTypeConfig,
	getHardcodedDefault
} from './playerExportFieldConfigService';
import {
	getFieldOverrideState,
	setFieldOverride,
	getResolvedFieldVisibility
} from './entityFieldVisibilityService';
import {
	filterEntityForPlayer,
	filterEntitiesForPlayer
} from './playerExportFilterService';
import type {
	BaseEntity,
	EntityTypeDefinition,
	EntityTypeOverride,
	FieldDefinition
} from '$lib/types/entities';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCustomEntityType(): EntityTypeDefinition {
	return {
		type: 'custom_vehicle',
		label: 'Vehicle',
		labelPlural: 'Vehicles',
		icon: 'car',
		color: 'orange',
		isBuiltIn: false,
		fieldDefinitions: [
			{ key: 'speed', label: 'Speed', type: 'number', required: false, order: 1 },
			{ key: 'fuel_type', label: 'Fuel Type', type: 'text', required: false, order: 2 },
			{
				key: 'secret_weapon',
				label: 'Secret Weapon',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 3
			}
		],
		defaultRelationships: []
	};
}

function makeEntityTypeOverrideWithAdditionalFields(): EntityTypeOverride {
	return {
		type: 'npc',
		additionalFields: [
			{
				key: 'custom_weakness',
				label: 'Custom Weakness',
				type: 'textarea',
				required: false,
				order: 100
			},
			{
				key: 'custom_secret',
				label: 'Custom Secret',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 101
			}
		]
	};
}

function makeNpcTypeDefinition(): EntityTypeDefinition {
	return {
		type: 'npc',
		label: 'NPC',
		labelPlural: 'NPCs',
		icon: 'users',
		color: 'blue',
		isBuiltIn: true,
		fieldDefinitions: [
			{ key: 'occupation', label: 'Occupation', type: 'text', required: false, order: 1 },
			{
				key: 'secret_motivation',
				label: 'Secret Motivation',
				type: 'textarea',
				required: false,
				section: 'hidden',
				order: 2
			}
		],
		defaultRelationships: []
	};
}

/**
 * Build an NPC type definition that merges the base fields with the
 * additionalFields from an EntityTypeOverride, mimicking what the app
 * does at runtime.
 */
function makeNpcTypeWithAdditionalFields(): EntityTypeDefinition {
	const base = makeNpcTypeDefinition();
	const override = makeEntityTypeOverrideWithAdditionalFields();
	return {
		...base,
		fieldDefinitions: [...base.fieldDefinitions, ...(override.additionalFields ?? [])]
	};
}

function makeCustomVehicleEntity(overrides: Partial<BaseEntity> = {}): BaseEntity {
	return {
		id: 'vehicle-1',
		type: 'custom_vehicle',
		name: 'War Wagon',
		description: 'An armored wagon',
		tags: ['military'],
		fields: {
			speed: 60,
			fuel_type: 'horse-drawn',
			secret_weapon: 'Concealed ballista'
		},
		links: [],
		notes: 'DM notes about the wagon',
		createdAt: new Date('2025-06-01'),
		updatedAt: new Date('2025-06-10'),
		metadata: {},
		...overrides
	};
}

function makeNpcEntity(overrides: Partial<BaseEntity> = {}): BaseEntity {
	return {
		id: 'npc-1',
		type: 'npc',
		name: 'Thalira',
		description: 'A mysterious merchant',
		tags: ['merchant'],
		fields: {
			occupation: 'Merchant',
			secret_motivation: 'Spy for the crown',
			custom_weakness: 'Afraid of fire',
			custom_secret: 'Has a hidden twin'
		},
		links: [],
		notes: 'DM notes about Thalira',
		createdAt: new Date('2025-06-01'),
		updatedAt: new Date('2025-06-10'),
		metadata: {},
		...overrides
	};
}

// ---------------------------------------------------------------------------
// 1. isFieldPlayerVisible with custom entity types and custom fields
// ---------------------------------------------------------------------------
describe('isFieldPlayerVisible with custom fields', () => {
	describe('custom entity type fields respect cascade', () => {
		it('custom field defaults to visible when no config or overrides exist', () => {
			const entity = makeCustomVehicleEntity();
			const fieldDef: FieldDefinition = { key: 'speed', label: 'Speed', type: 'number', required: false, order: 1 };

			expect(isFieldPlayerVisible('speed', fieldDef, 'custom_vehicle', entity, undefined)).toBe(true);
		});

		it('custom field with section: hidden is hidden by default (hardcoded rule)', () => {
			const entity = makeCustomVehicleEntity();
			const fieldDef: FieldDefinition = {
				key: 'secret_weapon',
				label: 'Secret Weapon',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 3
			};

			expect(
				isFieldPlayerVisible('secret_weapon', fieldDef, 'custom_vehicle', entity, undefined)
			).toBe(false);
		});

		it('category config overrides hardcoded rule for custom entity type field', () => {
			const entity = makeCustomVehicleEntity();
			const fieldDef: FieldDefinition = {
				key: 'secret_weapon',
				label: 'Secret Weapon',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 3
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { custom_vehicle: { secret_weapon: true } }
			};

			// Category config says visible, overriding the section:'hidden' hardcoded rule
			expect(
				isFieldPlayerVisible('secret_weapon', fieldDef, 'custom_vehicle', entity, config)
			).toBe(true);
		});

		it('per-entity override wins over category config for custom entity type', () => {
			const entity = makeCustomVehicleEntity({
				metadata: { playerExportFieldOverrides: { speed: false } }
			});
			const fieldDef: FieldDefinition = { key: 'speed', label: 'Speed', type: 'number', required: false, order: 1 };
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { custom_vehicle: { speed: true } }
			};

			// Entity override (false) wins over category config (true)
			expect(isFieldPlayerVisible('speed', fieldDef, 'custom_vehicle', entity, config)).toBe(false);
		});

		it('per-entity override force-includes a hidden custom field', () => {
			const entity = makeCustomVehicleEntity({
				metadata: { playerExportFieldOverrides: { secret_weapon: true } }
			});
			const fieldDef: FieldDefinition = {
				key: 'secret_weapon',
				label: 'Secret Weapon',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 3
			};

			expect(
				isFieldPlayerVisible('secret_weapon', fieldDef, 'custom_vehicle', entity, undefined)
			).toBe(true);
		});
	});

	describe('additionalFields on built-in types respect cascade', () => {
		it('additional field with no section defaults to visible', () => {
			const entity = makeNpcEntity();
			const fieldDef: FieldDefinition = {
				key: 'custom_weakness',
				label: 'Custom Weakness',
				type: 'textarea',
				required: false,
				order: 100
			};

			expect(isFieldPlayerVisible('custom_weakness', fieldDef, 'npc', entity, undefined)).toBe(true);
		});

		it('additional field with section: hidden defaults to hidden', () => {
			const entity = makeNpcEntity();
			const fieldDef: FieldDefinition = {
				key: 'custom_secret',
				label: 'Custom Secret',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 101
			};

			expect(isFieldPlayerVisible('custom_secret', fieldDef, 'npc', entity, undefined)).toBe(false);
		});

		it('category config can reveal a hidden additional field', () => {
			const entity = makeNpcEntity();
			const fieldDef: FieldDefinition = {
				key: 'custom_secret',
				label: 'Custom Secret',
				type: 'text',
				required: false,
				section: 'hidden',
				order: 101
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: { npc: { custom_secret: true } }
			};

			expect(isFieldPlayerVisible('custom_secret', fieldDef, 'npc', entity, config)).toBe(true);
		});

		it('per-entity override hides a normally visible additional field', () => {
			const entity = makeNpcEntity({
				metadata: { playerExportFieldOverrides: { custom_weakness: false } }
			});
			const fieldDef: FieldDefinition = {
				key: 'custom_weakness',
				label: 'Custom Weakness',
				type: 'textarea',
				required: false,
				order: 100
			};

			expect(isFieldPlayerVisible('custom_weakness', fieldDef, 'npc', entity, undefined)).toBe(false);
		});
	});
});

// ---------------------------------------------------------------------------
// 2. playerExportFieldConfigService with custom entity types
// ---------------------------------------------------------------------------
describe('playerExportFieldConfigService with custom entity types', () => {
	it('can set and get visibility for a custom entity type field', () => {
		let config: PlayerExportFieldConfig = { fieldVisibility: {} };

		config = setFieldVisibilitySetting(config, 'custom_vehicle', 'speed', false);
		config = setFieldVisibilitySetting(config, 'custom_vehicle', 'fuel_type', true);
		config = setFieldVisibilitySetting(config, 'custom_vehicle', 'secret_weapon', true);

		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'speed')).toBe(false);
		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'fuel_type')).toBe(true);
		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'secret_weapon')).toBe(true);
	});

	it('returns undefined for unconfigured custom entity type fields', () => {
		const config: PlayerExportFieldConfig = { fieldVisibility: {} };

		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'speed')).toBeUndefined();
	});

	it('resets config for a custom entity type', () => {
		let config: PlayerExportFieldConfig = { fieldVisibility: {} };
		config = setFieldVisibilitySetting(config, 'custom_vehicle', 'speed', false);
		config = setFieldVisibilitySetting(config, 'custom_vehicle', 'fuel_type', true);
		config = setFieldVisibilitySetting(config, 'npc', 'occupation', true);

		config = resetEntityTypeConfig(config, 'custom_vehicle');

		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'speed')).toBeUndefined();
		expect(getFieldVisibilitySetting(config, 'custom_vehicle', 'fuel_type')).toBeUndefined();
		// NPC config is untouched
		expect(getFieldVisibilitySetting(config, 'npc', 'occupation')).toBe(true);
	});

	it('getHardcodedDefault works for custom entity type fields', () => {
		const vehicleType = makeCustomEntityType();
		const speedDef = vehicleType.fieldDefinitions.find((f) => f.key === 'speed')!;
		const secretDef = vehicleType.fieldDefinitions.find((f) => f.key === 'secret_weapon')!;

		expect(getHardcodedDefault('speed', speedDef, 'custom_vehicle')).toBe(true);
		expect(getHardcodedDefault('secret_weapon', secretDef, 'custom_vehicle')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// 3. filterEntitiesForPlayer with custom entity types
// ---------------------------------------------------------------------------
describe('filterEntitiesForPlayer with custom fields', () => {
	it('filters a custom entity type using hardcoded rules (no config)', () => {
		const vehicleTypeDef = makeCustomEntityType();
		const entity = makeCustomVehicleEntity();

		const result = filterEntitiesForPlayer([entity], [vehicleTypeDef]);

		expect(result).toHaveLength(1);
		const exported = result[0];
		// 'speed' and 'fuel_type' are visible (no hidden section)
		expect(exported.fields.speed).toBe(60);
		expect(exported.fields.fuel_type).toBe('horse-drawn');
		// 'secret_weapon' has section:'hidden' -> excluded by hardcoded rule
		expect('secret_weapon' in exported.fields).toBe(false);
		// 'notes' is always excluded from PlayerEntity at top level
		expect('notes' in exported).toBe(false);
	});

	it('filters a custom entity type using category config', () => {
		const vehicleTypeDef = makeCustomEntityType();
		const entity = makeCustomVehicleEntity();
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				custom_vehicle: {
					speed: false, // hide speed
					secret_weapon: true // reveal secret weapon
				}
			}
		};

		const result = filterEntitiesForPlayer([entity], [vehicleTypeDef], config);

		expect(result).toHaveLength(1);
		const exported = result[0];
		expect('speed' in exported.fields).toBe(false); // hidden by config
		expect(exported.fields.fuel_type).toBe('horse-drawn'); // no config -> hardcoded: visible
		expect(exported.fields.secret_weapon).toBe('Concealed ballista'); // revealed by config
	});

	it('filters built-in entity with additional custom fields', () => {
		const npcTypeDef = makeNpcTypeWithAdditionalFields();
		const entity = makeNpcEntity();

		const result = filterEntitiesForPlayer([entity], [npcTypeDef]);

		expect(result).toHaveLength(1);
		const exported = result[0];
		// Built-in field: occupation (visible by default)
		expect(exported.fields.occupation).toBe('Merchant');
		// Built-in hidden field: secret_motivation (section:'hidden' -> excluded)
		expect('secret_motivation' in exported.fields).toBe(false);
		// Additional field: custom_weakness (no section -> visible)
		expect(exported.fields.custom_weakness).toBe('Afraid of fire');
		// Additional field: custom_secret (section:'hidden' -> excluded)
		expect('custom_secret' in exported.fields).toBe(false);
	});

	it('filters built-in entity with additional fields and category config', () => {
		const npcTypeDef = makeNpcTypeWithAdditionalFields();
		const entity = makeNpcEntity();
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: {
					custom_weakness: false, // hide the custom weakness
					custom_secret: true // reveal the custom secret
				}
			}
		};

		const result = filterEntitiesForPlayer([entity], [npcTypeDef], config);

		expect(result).toHaveLength(1);
		const exported = result[0];
		expect(exported.fields.occupation).toBe('Merchant'); // no config -> hardcoded: visible
		expect('custom_weakness' in exported.fields).toBe(false); // hidden by config
		expect(exported.fields.custom_secret).toBe('Has a hidden twin'); // revealed by config
	});

	it('respects playerVisible=false on custom entity type entities', () => {
		const vehicleTypeDef = makeCustomEntityType();
		const hiddenVehicle = makeCustomVehicleEntity({ playerVisible: false });

		const result = filterEntitiesForPlayer([hiddenVehicle], [vehicleTypeDef]);

		expect(result).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 4. End-to-end integration scenarios
// ---------------------------------------------------------------------------
describe('end-to-end integration: custom entity type with config + per-entity overrides', () => {
	it('full scenario: per-entity override > category config > hardcoded for custom type', () => {
		const vehicleTypeDef = makeCustomEntityType();
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				custom_vehicle: {
					speed: false, // hide speed at category level
					secret_weapon: true // reveal secret weapon at category level
				}
			}
		};

		// Entity overrides: force speed visible (overrides category hide),
		// and force secret_weapon hidden (overrides category reveal)
		const entity = makeCustomVehicleEntity({
			metadata: {
				playerExportFieldOverrides: {
					speed: true,
					secret_weapon: false
				}
			}
		});

		const result = filterEntitiesForPlayer([entity], [vehicleTypeDef], config);

		expect(result).toHaveLength(1);
		const exported = result[0];
		// speed: entity override (true) wins over category config (false)
		expect(exported.fields.speed).toBe(60);
		// fuel_type: no override, no config -> hardcoded: visible
		expect(exported.fields.fuel_type).toBe('horse-drawn');
		// secret_weapon: entity override (false) wins over category config (true)
		expect('secret_weapon' in exported.fields).toBe(false);
	});
});

describe('end-to-end integration: built-in type with additionalFields + config + per-entity overrides', () => {
	it('full scenario: all three cascade levels interact for additional fields', () => {
		const npcTypeDef = makeNpcTypeWithAdditionalFields();
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				npc: {
					occupation: false, // hide built-in field at category level
					custom_weakness: false, // hide additional field at category level
					custom_secret: true // reveal hidden additional field at category level
				}
			}
		};

		// Entity overrides: force occupation visible, force custom_secret hidden
		const entity = makeNpcEntity({
			metadata: {
				playerExportFieldOverrides: {
					occupation: true,
					custom_secret: false
				}
			}
		});

		const result = filterEntitiesForPlayer([entity], [npcTypeDef], config);

		expect(result).toHaveLength(1);
		const exported = result[0];
		// occupation: entity override (true) wins over category config (false)
		expect(exported.fields.occupation).toBe('Merchant');
		// secret_motivation: no override, no config -> hardcoded: hidden (section:'hidden')
		expect('secret_motivation' in exported.fields).toBe(false);
		// custom_weakness: no override -> category config (false) -> hidden
		expect('custom_weakness' in exported.fields).toBe(false);
		// custom_secret: entity override (false) wins over category config (true)
		expect('custom_secret' in exported.fields).toBe(false);
	});

	it('entityFieldVisibilityService helpers work with custom field keys', () => {
		// Use the entity-level helpers to set overrides for custom fields
		let metadata: Record<string, unknown> = {};

		// Set override for a custom additional field
		metadata = setFieldOverride(metadata, 'custom_weakness', false);
		expect(getFieldOverrideState(metadata, 'custom_weakness')).toBe(false);

		// Set override for a custom entity type field
		metadata = setFieldOverride(metadata, 'speed', true);
		expect(getFieldOverrideState(metadata, 'speed')).toBe(true);

		// Unset field -> inherit
		expect(getFieldOverrideState(metadata, 'fuel_type')).toBeUndefined();

		// getResolvedFieldVisibility with a custom field
		const resolved = getResolvedFieldVisibility(metadata, 'custom_weakness', true);
		expect(resolved.visible).toBe(false);
		expect(resolved.isOverridden).toBe(true);

		const inherited = getResolvedFieldVisibility(metadata, 'fuel_type', true);
		expect(inherited.visible).toBe(true);
		expect(inherited.isOverridden).toBe(false);
	});

	it('mixed custom and built-in entities are filtered together', () => {
		const vehicleTypeDef = makeCustomEntityType();
		const npcTypeDef = makeNpcTypeWithAdditionalFields();
		const config: PlayerExportFieldConfig = {
			fieldVisibility: {
				custom_vehicle: { secret_weapon: true },
				npc: { custom_secret: true }
			}
		};

		const vehicleEntity = makeCustomVehicleEntity();
		const npcEntity = makeNpcEntity();
		const hiddenNpc = makeNpcEntity({ id: 'npc-2', name: 'Hidden NPC', playerVisible: false });

		const result = filterEntitiesForPlayer(
			[vehicleEntity, npcEntity, hiddenNpc],
			[vehicleTypeDef, npcTypeDef],
			config
		);

		expect(result).toHaveLength(2);
		// Vehicle is exported with secret_weapon revealed
		const vehicle = result.find((e) => e.type === 'custom_vehicle')!;
		expect(vehicle).toBeDefined();
		expect(vehicle.fields.secret_weapon).toBe('Concealed ballista');
		expect(vehicle.fields.speed).toBe(60);

		// NPC is exported with custom_secret revealed
		const npc = result.find((e) => e.type === 'npc')!;
		expect(npc).toBeDefined();
		expect(npc.fields.custom_secret).toBe('Has a hidden twin');
		expect(npc.fields.occupation).toBe('Merchant');
		// secret_motivation still hidden (no config override, section:'hidden')
		expect('secret_motivation' in npc.fields).toBe(false);

		// Hidden NPC excluded
		expect(result.find((e) => e.name === 'Hidden NPC')).toBeUndefined();
	});
});
