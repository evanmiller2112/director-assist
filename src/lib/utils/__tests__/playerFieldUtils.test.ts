/**
 * Tests for playerFieldUtils
 * Issue #443: Read-only entity display components for player view
 */

import { describe, it, expect } from 'vitest';
import type { PlayerEntity } from '$lib/types/playerExport';
import type { FieldDefinition } from '$lib/types/entities';
import {
	getDisplayablePlayerFields,
	resolvePlayerEntityName,
	resolvePlayerEntityType
} from '../playerFieldUtils';

describe('getDisplayablePlayerFields', () => {
	it('returns fields that have values in the entity', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				playerName: 'John Doe',
				level: 5,
				hasSpells: true
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'playerName', label: 'Player Name', type: 'text', required: true, order: 1 },
			{ key: 'level', label: 'Level', type: 'number', required: false, order: 2 },
			{ key: 'hasSpells', label: 'Has Spells', type: 'boolean', required: false, order: 3 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(3);
		expect(result[0].field.key).toBe('playerName');
		expect(result[0].value).toBe('John Doe');
		expect(result[1].field.key).toBe('level');
		expect(result[1].value).toBe(5);
		expect(result[2].field.key).toBe('hasSpells');
		expect(result[2].value).toBe(true);
	});

	it('excludes fields with null values', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'npc',
			name: 'Test NPC',
			description: 'A test NPC',
			tags: [],
			fields: {
				role: 'Guard',
				voice: null
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'role', label: 'Role', type: 'text', required: false, order: 1 },
			{ key: 'voice', label: 'Voice', type: 'text', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(1);
		expect(result[0].field.key).toBe('role');
	});

	it('excludes fields with undefined values', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'npc',
			name: 'Test NPC',
			description: 'A test NPC',
			tags: [],
			fields: {
				role: 'Guard',
				voice: undefined
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'role', label: 'Role', type: 'text', required: false, order: 1 },
			{ key: 'voice', label: 'Voice', type: 'text', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(1);
		expect(result[0].field.key).toBe('role');
	});

	it('excludes fields with empty string values', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'npc',
			name: 'Test NPC',
			description: 'A test NPC',
			tags: [],
			fields: {
				role: 'Guard',
				voice: ''
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'role', label: 'Role', type: 'text', required: false, order: 1 },
			{ key: 'voice', label: 'Voice', type: 'text', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(1);
		expect(result[0].field.key).toBe('role');
	});

	it('excludes fields with empty arrays', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'location',
			name: 'Test Location',
			description: 'A test location',
			tags: [],
			fields: {
				locationType: 'city',
				features: []
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'locationType', label: 'Type', type: 'select', required: false, order: 1 },
			{ key: 'features', label: 'Features', type: 'tags', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(1);
		expect(result[0].field.key).toBe('locationType');
	});

	it('includes fields with boolean false values', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				hasSpells: false,
				hasWeapons: true
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'hasSpells', label: 'Has Spells', type: 'boolean', required: false, order: 1 },
			{ key: 'hasWeapons', label: 'Has Weapons', type: 'boolean', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(2);
		expect(result[0].field.key).toBe('hasSpells');
		expect(result[0].value).toBe(false);
		expect(result[1].field.key).toBe('hasWeapons');
		expect(result[1].value).toBe(true);
	});

	it('excludes fields with section: "hidden"', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				playerName: 'John Doe',
				secrets: 'This character has a dark past'
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'playerName', label: 'Player Name', type: 'text', required: true, order: 1 },
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 2,
				section: 'hidden'
			}
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(1);
		expect(result[0].field.key).toBe('playerName');
	});

	it('preserves field order', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				playerName: 'John Doe',
				level: 5,
				class: 'Fury'
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'level', label: 'Level', type: 'number', required: false, order: 2 },
			{ key: 'playerName', label: 'Player Name', type: 'text', required: true, order: 1 },
			{ key: 'class', label: 'Class', type: 'text', required: false, order: 3 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(3);
		expect(result[0].field.key).toBe('playerName'); // order: 1
		expect(result[1].field.key).toBe('level'); // order: 2
		expect(result[2].field.key).toBe('class'); // order: 3
	});

	it('handles entity with no matching field definitions', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				playerName: 'John Doe',
				level: 5
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [
			{ key: 'role', label: 'Role', type: 'text', required: false, order: 1 },
			{ key: 'voice', label: 'Voice', type: 'text', required: false, order: 2 }
		];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(0);
	});

	it('handles empty field definitions', () => {
		const entity: PlayerEntity = {
			id: 'e1',
			type: 'character',
			name: 'Test Character',
			description: 'A test character',
			tags: [],
			fields: {
				playerName: 'John Doe',
				level: 5
			},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const fieldDefs: FieldDefinition[] = [];

		const result = getDisplayablePlayerFields(entity, fieldDefs);

		expect(result).toHaveLength(0);
	});
});

describe('resolvePlayerEntityName', () => {
	const entities: PlayerEntity[] = [
		{
			id: 'e1',
			type: 'character',
			name: 'Aragorn',
			description: 'A ranger',
			tags: [],
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'e2',
			type: 'npc',
			name: 'Gandalf',
			description: 'A wizard',
			tags: [],
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('returns entity name when found', () => {
		const result = resolvePlayerEntityName('e1', entities);
		expect(result).toBe('Aragorn');
	});

	it('returns "Unknown" when entity not found', () => {
		const result = resolvePlayerEntityName('e999', entities);
		expect(result).toBe('Unknown');
	});

	it('returns "Unknown" for empty string id', () => {
		const result = resolvePlayerEntityName('', entities);
		expect(result).toBe('Unknown');
	});
});

describe('resolvePlayerEntityType', () => {
	const entities: PlayerEntity[] = [
		{
			id: 'e1',
			type: 'character',
			name: 'Aragorn',
			description: 'A ranger',
			tags: [],
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'e2',
			type: 'npc',
			name: 'Gandalf',
			description: 'A wizard',
			tags: [],
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('returns entity type when found', () => {
		const result = resolvePlayerEntityType('e1', entities);
		expect(result).toBe('character');
	});

	it('returns empty string when entity not found', () => {
		const result = resolvePlayerEntityType('e999', entities);
		expect(result).toBe('');
	});

	it('returns empty string for empty string id', () => {
		const result = resolvePlayerEntityType('', entities);
		expect(result).toBe('');
	});
});
