/**
 * Tests for Forge Steel Import Service (TDD RED Phase - Issue #238)
 *
 * These tests define expected behavior for importing Forge Steel character data
 * into Director Assist character entities. Tests should FAIL initially.
 *
 * Covers:
 * - JSON validation and parsing
 * - Field mapping from Forge Steel to Director Assist
 * - Conflict detection with existing characters
 * - Error handling for malformed data
 * - Edge cases (null/undefined values, empty objects, missing fields)
 */

import { describe, it, expect } from 'vitest';
import {
	validateForgeSteelImport,
	mapForgeSteelHeroToEntity
} from '$lib/services/forgeSteelImportService';
import type { ForgeSteelHero } from '$lib/types/forgeSteel';
import type { NewEntity } from '$lib/types';

describe('forgeSteelImportService', () => {
	describe('validateForgeSteelImport', () => {
		describe('Valid Import Data', () => {
			it('should accept valid Forge Steel hero with all fields', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'A brave warrior seeking redemption',
						defeated: false
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should accept hero with null ancestry', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Concept Character',
					ancestry: null,
					class: { name: 'Shadow', level: 2 },
					state: {
						notes: 'Still deciding ancestry',
						defeated: false
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
				expect(result.warnings).toContain(
					'Character has no ancestry defined - concept field will be incomplete'
				);
			});

			it('should accept hero with null class', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Concept Character',
					ancestry: { name: 'Dwarf' },
					class: null,
					state: {
						notes: 'Still deciding class',
						defeated: false
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
				expect(result.warnings).toContain(
					'Character has no class defined - concept field will be incomplete'
				);
			});

			it('should warn when both ancestry and class are null', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Early Concept',
					ancestry: null,
					class: null,
					state: {
						notes: 'Just a name so far',
						defeated: false
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
				expect(result.warnings).toContain(
					'Character has no ancestry defined - concept field will be incomplete'
				);
				expect(result.warnings).toContain(
					'Character has no class defined - concept field will be incomplete'
				);
			});

			it('should accept hero with empty notes', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Silent Bob',
					ancestry: { name: 'Human' },
					class: { name: 'Shadow', level: 3 },
					state: {
						notes: '',
						defeated: false
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
			});

			it('should accept defeated hero', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-456',
					name: 'Fallen Hero',
					ancestry: { name: 'Elf' },
					class: { name: 'Conduit', level: 5 },
					state: {
						notes: 'Died in the Battle of the Crimson Fields',
						defeated: true
					}
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
			});
		});

		describe('Invalid Import Data', () => {
			it('should reject null data', () => {
				const result = validateForgeSteelImport(null as unknown as ForgeSteelHero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Import data is null or undefined');
			});

			it('should reject undefined data', () => {
				const result = validateForgeSteelImport(undefined as unknown as ForgeSteelHero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Import data is null or undefined');
			});

			it('should reject non-object data', () => {
				const result = validateForgeSteelImport('not an object' as unknown as ForgeSteelHero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Import data must be an object');
			});

			it('should reject array data', () => {
				const result = validateForgeSteelImport([] as unknown as ForgeSteelHero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Import data must be an object');
			});

			it('should reject hero missing name field', () => {
				const hero = {
					id: 'hero-123',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: name');
			});

			it('should reject hero with empty name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: '',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Character name cannot be empty');
			});

			it('should reject hero with whitespace-only name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: '   ',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Character name cannot be empty');
			});

			it('should reject hero missing id field', () => {
				const hero = {
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: id');
			});

			it('should reject hero missing state field', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: state');
			});

			it('should reject empty object', () => {
				const result = validateForgeSteelImport({} as ForgeSteelHero, []);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should collect multiple validation errors', () => {
				const hero = {
					ancestry: null,
					class: null
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(1);
			});
		});

		describe('Conflict Detection', () => {
			it('should detect conflict when character name already exists', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const existingNames = ['Gandalf', 'Aric Steelheart', 'Frodo'];
				const result = validateForgeSteelImport(hero, existingNames);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					'A character named "Aric Steelheart" already exists. Please rename before importing.'
				);
			});

			it('should detect conflict with case-insensitive name matching', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const existingNames = ['aric steelheart'];
				const result = validateForgeSteelImport(hero, existingNames);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					'A character named "Aric Steelheart" already exists. Please rename before importing.'
				);
			});

			it('should pass validation when name does not conflict', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const existingNames = ['Gandalf', 'Frodo', 'Aragorn'];
				const result = validateForgeSteelImport(hero, existingNames);
				expect(result.valid).toBe(true);
			});

			it('should handle empty existing names array', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(true);
			});

			it('should trim whitespace when checking conflicts', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: ' Aric Steelheart ',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const existingNames = ['Aric Steelheart'];
				const result = validateForgeSteelImport(hero, existingNames);
				expect(result.valid).toBe(false);
			});
		});

		describe('Malformed JSON Handling', () => {
			it('should handle object with invalid ancestry type', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: 'Human',
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid ancestry structure');
			});

			it('should handle object with invalid class type', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: 'Fury',
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid class structure');
			});

			it('should handle object with invalid state type', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: 'active'
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelImport(hero, []);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid state structure');
			});
		});
	});

	describe('mapForgeSteelHeroToEntity', () => {
		describe('Complete Hero Mapping', () => {
			it('should map hero with all fields to NewEntity', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'A brave warrior seeking redemption for past mistakes',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.type).toBe('character');
				expect(entity.name).toBe('Aric Steelheart');
				expect(entity.description).toBe('');
				expect(entity.tags).toContain('forge-steel-import');
				expect(entity.fields.concept).toBe('Human Fury');
				expect(entity.fields.background).toBe(
					'A brave warrior seeking redemption for past mistakes'
				);
				expect(entity.fields.status).toBe('active');
				expect(entity.notes).toBe('Imported from Forge Steel');
			});

			it('should map defeated hero with status deceased', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-456',
					name: 'Fallen Hero',
					ancestry: { name: 'Elf' },
					class: { name: 'Conduit', level: 5 },
					state: {
						notes: 'Died in the Battle of the Crimson Fields',
						defeated: true
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.status).toBe('deceased');
			});

			it('should map active hero with status active', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-789',
					name: 'Active Hero',
					ancestry: { name: 'Dwarf' },
					class: { name: 'Fury', level: 3 },
					state: {
						notes: 'Still adventuring',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.status).toBe('active');
			});
		});

		describe('Field Mapping - Direct Fields', () => {
			it('should map name field directly', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Test Character',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.name).toBe('Test Character');
			});

			it('should trim whitespace from name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: '  Test Character  ',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.name).toBe('Test Character');
			});
		});

		describe('Field Mapping - Concept Field', () => {
			it('should combine ancestry and class into concept field', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Human Fury');
			});

			it('should use only ancestry when class is null', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Dwarf' },
					class: null,
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Dwarf');
			});

			it('should use only class when ancestry is null', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: null,
					class: { name: 'Shadow', level: 2 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Shadow');
			});

			it('should set empty concept when both ancestry and class are null', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: null,
					class: null,
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('');
			});

			it('should handle multi-word ancestry names', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'High Elf' },
					class: { name: 'Conduit', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('High Elf Conduit');
			});

			it('should handle multi-word class names', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Shadow Dancer', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Human Shadow Dancer');
			});
		});

		describe('Field Mapping - Background Field', () => {
			it('should map state.notes to background field', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Born in the northern kingdoms, trained as a warrior from youth',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe(
					'Born in the northern kingdoms, trained as a warrior from youth'
				);
			});

			it('should handle empty notes', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe('');
			});

			it('should preserve multiline notes', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Line 1\nLine 2\nLine 3',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe('Line 1\nLine 2\nLine 3');
			});

			it('should preserve special characters in notes', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Notes with "quotes" and \'apostrophes\' and <brackets>',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe(
					'Notes with "quotes" and \'apostrophes\' and <brackets>'
				);
			});
		});

		describe('Field Mapping - Status Field', () => {
			it('should map defeated: true to status "deceased"', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Fallen Hero',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Died in battle',
						defeated: true
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.status).toBe('deceased');
			});

			it('should map defeated: false to status "active"', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Active Hero',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Still adventuring',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.status).toBe('active');
			});
		});

		describe('Entity Structure', () => {
			it('should set type to "character"', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.type).toBe('character');
			});

			it('should set empty description', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.description).toBe('');
			});

			it('should add "forge-steel-import" tag', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.tags).toContain('forge-steel-import');
			});

			it('should set notes to "Imported from Forge Steel"', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.notes).toBe('Imported from Forge Steel');
			});

			it('should initialize empty links array', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.links).toEqual([]);
			});

			it('should initialize empty metadata object', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.metadata).toEqual({});
			});

			it('should return a NewEntity type (no id, createdAt, updatedAt)', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero) as NewEntity;

				expect(entity).not.toHaveProperty('id');
				expect(entity).not.toHaveProperty('createdAt');
				expect(entity).not.toHaveProperty('updatedAt');
				expect(entity).toHaveProperty('type');
				expect(entity).toHaveProperty('name');
				expect(entity).toHaveProperty('fields');
			});
		});

		describe('Edge Cases', () => {
			it('should handle ancestry with additional properties', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: {
						name: 'Human',
						description: 'Versatile and ambitious',
						traits: ['Bonus Feat']
					} as any,
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Human Fury');
			});

			it('should handle class with additional properties', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: {
						name: 'Fury',
						level: 5,
						subclass: 'Berserker',
						abilities: ['Rage', 'Reckless Attack']
					} as any,
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Human Fury');
			});

			it('should handle state with additional properties', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'Character notes',
						defeated: false,
						health: 100,
						conditions: ['inspired']
					} as any
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe('Character notes');
				expect(entity.fields.status).toBe('active');
			});

			it('should handle very long notes', () => {
				const longNotes = 'A'.repeat(10000);
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: longNotes,
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe(longNotes);
			});

			it('should handle special characters in ancestry name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Half-Elf (High Elf)' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Half-Elf (High Elf) Fury');
			});

			it('should handle special characters in class name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury (Berserker Path)', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.concept).toBe('Human Fury (Berserker Path)');
			});

			it('should handle unicode characters in name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Árïç Stëëlhëärt',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.name).toBe('Árïç Stëëlhëärt');
			});

			it('should handle emoji in notes', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'A brave warrior 🗡️ seeking redemption ✨',
						defeated: false
					}
				};
				const entity = mapForgeSteelHeroToEntity(hero);

				expect(entity.fields.background).toBe('A brave warrior 🗡️ seeking redemption ✨');
			});
		});
	});
});
