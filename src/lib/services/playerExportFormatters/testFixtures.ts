/**
 * Shared Test Fixtures for Player Export Formatters
 *
 * Provides realistic test data with diverse entity types, relationships,
 * special characters, and various optional fields.
 */
import type { PlayerExport, PlayerEntity, PlayerEntityLink, PlayerExportOptions } from '$lib/types/playerExport';

/**
 * Creates a base player export with realistic campaign data
 */
export function createBasePlayerExport(): PlayerExport {
	const exportDate = new Date('2025-01-15T10:30:00Z');

	return {
		version: '1.0.0',
		exportedAt: exportDate,
		campaignName: 'The Lost Kingdom of Aethermoor',
		campaignDescription: 'An epic fantasy campaign where heroes seek to restore the fallen kingdom and uncover ancient secrets.',
		entities: []
	};
}

/**
 * Creates a character entity with all fields
 */
export function createCharacterEntity(): PlayerEntity {
	return {
		id: 'char-001',
		type: 'character',
		name: 'Sir Aldric "The Bold" Stormwind',
		description: 'A noble knight with a mysterious past & divine purpose. Known for his <legendary> bravery in the "War of Shadows".',
		summary: 'Noble knight seeking redemption',
		tags: ['hero', 'paladin', 'nobility'],
		imageUrl: 'https://example.com/images/aldric.png',
		fields: {
			class: 'Paladin',
			level: 12,
			alignment: 'Lawful Good',
			backstory: 'Born to nobility but renounced his title after a vision from the gods.',
			equipment: ['Holy Avenger', 'Plate Armor +2', 'Shield of Faith']
		},
		links: [
			{
				id: 'link-001',
				targetId: 'npc-001',
				targetType: 'npc',
				relationship: 'mentor_of',
				bidirectional: true,
				reverseRelationship: 'student_of',
				strength: 'strong'
			},
			{
				id: 'link-002',
				targetId: 'loc-001',
				targetType: 'location',
				relationship: 'resides_at',
				bidirectional: false
			}
		],
		createdAt: new Date('2025-01-01T08:00:00Z'),
		updatedAt: new Date('2025-01-10T14:30:00Z')
	};
}

/**
 * Creates an NPC entity with minimal fields
 */
export function createNpcEntity(): PlayerEntity {
	return {
		id: 'npc-001',
		type: 'npc',
		name: 'Elara Moonwhisper',
		description: 'An enigmatic elf mage who speaks in riddles.',
		tags: ['ally', 'magic-user'],
		fields: {
			race: 'Elf',
			occupation: 'Court Wizard',
			specialAbility: 'Can see glimpses of possible futures'
		},
		links: [],
		createdAt: new Date('2025-01-02T09:15:00Z'),
		updatedAt: new Date('2025-01-08T16:45:00Z')
	};
}

/**
 * Creates a location entity
 */
export function createLocationEntity(): PlayerEntity {
	return {
		id: 'loc-001',
		type: 'location',
		name: 'Castle Ravencrest',
		description: 'A towering fortress built into the mountainside, its spires reaching toward the clouds. Home to the Order of the Silver Dawn.',
		summary: 'Fortress headquarters of the Silver Dawn',
		tags: ['fortress', 'safe-haven', 'mountain'],
		imageUrl: 'https://example.com/images/castle.jpg',
		fields: {
			region: 'Northern Mountains',
			population: 500,
			defenses: 'Stone walls, magical wards, trained guards',
			keyLocations: ['Great Hall', 'Training Grounds', 'Library of Lore']
		},
		links: [
			{
				id: 'link-003',
				targetId: 'fac-001',
				targetType: 'faction',
				relationship: 'headquarters_of',
				bidirectional: true,
				reverseRelationship: 'headquartered_at',
				strength: 'strong'
			}
		],
		createdAt: new Date('2025-01-01T10:00:00Z'),
		updatedAt: new Date('2025-01-05T11:20:00Z')
	};
}

/**
 * Creates a faction entity
 */
export function createFactionEntity(): PlayerEntity {
	return {
		id: 'fac-001',
		type: 'faction',
		name: 'Order of the Silver Dawn',
		description: 'A holy order dedicated to protecting the realm from darkness. Their motto: "Light perseveres."',
		tags: ['good', 'lawful', 'religious'],
		fields: {
			alignment: 'Lawful Good',
			goals: 'Defend the innocent, preserve ancient knowledge, combat evil',
			leader: 'High Paladin Marcus Brightshield',
			memberCount: 250
		},
		links: [],
		createdAt: new Date('2025-01-01T09:00:00Z'),
		updatedAt: new Date('2025-01-01T09:00:00Z')
	};
}

/**
 * Creates an entity with special characters to test escaping
 */
export function createEntityWithSpecialChars(): PlayerEntity {
	return {
		id: 'special-001',
		type: 'item',
		name: 'Tome of <Ancient> Knowledge & "Forbidden" Secrets',
		description: 'Contains text like: <script>alert("test")</script> and **bold** markdown & HTML entities.',
		tags: ['artifact', 'book', 'magic'],
		fields: {
			htmlContent: '<div class="magic">Magical text</div>',
			markdownContent: '# Header\n## Subheader\n- List item\n> Quote',
			specialChars: 'Symbols: < > & " \' ` | \\ / * _ [ ] ( ) { } # + - . !',
			jsonContent: '{"key": "value", "nested": {"array": [1, 2, 3]}}'
		},
		links: [],
		createdAt: new Date('2025-01-03T12:00:00Z'),
		updatedAt: new Date('2025-01-03T12:00:00Z')
	};
}

/**
 * Creates an entity without optional fields
 */
export function createMinimalEntity(): PlayerEntity {
	return {
		id: 'minimal-001',
		type: 'encounter',
		name: 'Ambush at Darkwood',
		description: 'A group of bandits attacks the party.',
		tags: [],
		fields: {},
		links: [],
		createdAt: new Date('2025-01-04T14:00:00Z'),
		updatedAt: new Date('2025-01-04T14:00:00Z')
	};
}

/**
 * Creates a complete player export with multiple entities
 */
export function createCompletePlayerExport(): PlayerExport {
	const playerExport = createBasePlayerExport();

	playerExport.entities = [
		createCharacterEntity(),
		createNpcEntity(),
		createLocationEntity(),
		createFactionEntity(),
		createEntityWithSpecialChars(),
		createMinimalEntity()
	];

	return playerExport;
}

/**
 * Creates an empty player export (no entities)
 */
export function createEmptyPlayerExport(): PlayerExport {
	return {
		version: '1.0.0',
		exportedAt: new Date('2025-01-15T10:30:00Z'),
		campaignName: 'Empty Campaign',
		campaignDescription: 'A campaign with no entities yet.',
		entities: []
	};
}

/**
 * Creates default export options
 */
export function createDefaultOptions(): PlayerExportOptions {
	return {
		format: 'json',
		includeTimestamps: true,
		includeImages: true,
		groupByType: true
	};
}

/**
 * Creates export options with all optional features disabled
 */
export function createMinimalOptions(): PlayerExportOptions {
	return {
		format: 'json',
		includeTimestamps: false,
		includeImages: false,
		groupByType: false
	};
}
