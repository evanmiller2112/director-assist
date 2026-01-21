/**
 * Tests for Forge Steel Import Type Definitions (TDD RED Phase - Issue #238)
 *
 * These tests define expected behavior for Forge Steel type validation and type guards.
 * Tests should FAIL initially since no implementation exists yet.
 *
 * Covers:
 * - ForgeSteelHero interface validation
 * - Type guards for Forge Steel data structures
 * - Required field validation (name)
 * - Optional field handling (ancestry, class)
 * - Null/undefined handling for complex nested objects
 * - State object validation
 */

import { describe, it, expect } from 'vitest';
import {
	isForgeSteelHero,
	isForgeSteelAncestry,
	isForgeSteelClass,
	isForgeSteelState,
	validateForgeSteelHeroStructure
} from '$lib/types/forgeSteel';
import type { ForgeSteelHero } from '$lib/types/forgeSteel';

describe('forgeSteel - Type Guards', () => {
	describe('isForgeSteelHero', () => {
		describe('Valid Forge Steel Hero Objects', () => {
			it('should accept valid hero with all required fields', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'A brave warrior',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});

			it('should accept hero with null ancestry', () => {
				const hero = {
					id: 'hero-123',
					name: 'Concept Character',
					ancestry: null,
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});

			it('should accept hero with null class', () => {
				const hero = {
					id: 'hero-123',
					name: 'Concept Character',
					ancestry: { name: 'Dwarf' },
					class: null,
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});

			it('should accept hero with both ancestry and class null', () => {
				const hero = {
					id: 'hero-123',
					name: 'Early Concept',
					ancestry: null,
					class: null,
					state: {
						notes: 'Still developing this character',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});

			it('should accept hero with empty notes', () => {
				const hero = {
					id: 'hero-123',
					name: 'Silent Bob',
					ancestry: { name: 'Human' },
					class: { name: 'Shadow', level: 3 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});

			it('should accept hero with defeated true', () => {
				const hero = {
					id: 'hero-456',
					name: 'Fallen Hero',
					ancestry: { name: 'Elf' },
					class: { name: 'Conduit', level: 5 },
					state: {
						notes: 'Died in the Battle of the Crimson Fields',
						defeated: true
					}
				};
				expect(isForgeSteelHero(hero)).toBe(true);
			});
		});

		describe('Invalid Forge Steel Hero Objects', () => {
			it('should reject object missing id field', () => {
				const hero = {
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object missing name field', () => {
				const hero = {
					id: 'hero-123',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object with empty string name', () => {
				const hero = {
					id: 'hero-123',
					name: '',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object with whitespace-only name', () => {
				const hero = {
					id: 'hero-123',
					name: '   ',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object missing state field', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 }
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object with invalid id type', () => {
				const hero = {
					id: 123,
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject object with invalid name type', () => {
				const hero = {
					id: 'hero-123',
					name: 123,
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				expect(isForgeSteelHero(hero)).toBe(false);
			});

			it('should reject null', () => {
				expect(isForgeSteelHero(null)).toBe(false);
			});

			it('should reject undefined', () => {
				expect(isForgeSteelHero(undefined)).toBe(false);
			});

			it('should reject array', () => {
				expect(isForgeSteelHero([])).toBe(false);
			});

			it('should reject string', () => {
				expect(isForgeSteelHero('not a hero')).toBe(false);
			});

			it('should reject number', () => {
				expect(isForgeSteelHero(42)).toBe(false);
			});
		});
	});

	describe('isForgeSteelAncestry', () => {
		it('should accept valid ancestry object with name', () => {
			const ancestry = { name: 'Human' };
			expect(isForgeSteelAncestry(ancestry)).toBe(true);
		});

		it('should accept ancestry with additional properties', () => {
			const ancestry = {
				name: 'Dwarf',
				description: 'Stout and hardy',
				traits: ['Darkvision', 'Stonecunning']
			};
			expect(isForgeSteelAncestry(ancestry)).toBe(true);
		});

		it('should accept null ancestry', () => {
			expect(isForgeSteelAncestry(null)).toBe(true);
		});

		it('should reject ancestry missing name field', () => {
			const ancestry = { description: 'Some ancestry' };
			expect(isForgeSteelAncestry(ancestry)).toBe(false);
		});

		it('should reject ancestry with empty string name', () => {
			const ancestry = { name: '' };
			expect(isForgeSteelAncestry(ancestry)).toBe(false);
		});

		it('should reject ancestry with non-string name', () => {
			const ancestry = { name: 123 };
			expect(isForgeSteelAncestry(ancestry)).toBe(false);
		});

		it('should reject undefined', () => {
			expect(isForgeSteelAncestry(undefined)).toBe(false);
		});

		it('should reject non-object types', () => {
			expect(isForgeSteelAncestry('Human')).toBe(false);
			expect(isForgeSteelAncestry(123)).toBe(false);
			expect(isForgeSteelAncestry(true)).toBe(false);
		});
	});

	describe('isForgeSteelClass', () => {
		it('should accept valid class object with name and level', () => {
			const heroClass = { name: 'Fury', level: 1 };
			expect(isForgeSteelClass(heroClass)).toBe(true);
		});

		it('should accept class with higher level', () => {
			const heroClass = { name: 'Shadow', level: 10 };
			expect(isForgeSteelClass(heroClass)).toBe(true);
		});

		it('should accept class with additional properties', () => {
			const heroClass = {
				name: 'Conduit',
				level: 5,
				subclass: 'Elementalist',
				abilities: ['Fireball', 'Ice Bolt']
			};
			expect(isForgeSteelClass(heroClass)).toBe(true);
		});

		it('should accept null class', () => {
			expect(isForgeSteelClass(null)).toBe(true);
		});

		it('should reject class missing name field', () => {
			const heroClass = { level: 5 };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject class missing level field', () => {
			const heroClass = { name: 'Fury' };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject class with empty string name', () => {
			const heroClass = { name: '', level: 1 };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject class with non-number level', () => {
			const heroClass = { name: 'Fury', level: '1' };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject class with zero level', () => {
			const heroClass = { name: 'Fury', level: 0 };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject class with negative level', () => {
			const heroClass = { name: 'Fury', level: -1 };
			expect(isForgeSteelClass(heroClass)).toBe(false);
		});

		it('should reject undefined', () => {
			expect(isForgeSteelClass(undefined)).toBe(false);
		});

		it('should reject non-object types', () => {
			expect(isForgeSteelClass('Fury')).toBe(false);
			expect(isForgeSteelClass(1)).toBe(false);
		});
	});

	describe('isForgeSteelState', () => {
		it('should accept valid state with notes and defeated', () => {
			const state = {
				notes: 'Some character notes',
				defeated: false
			};
			expect(isForgeSteelState(state)).toBe(true);
		});

		it('should accept state with empty notes', () => {
			const state = {
				notes: '',
				defeated: false
			};
			expect(isForgeSteelState(state)).toBe(true);
		});

		it('should accept state with defeated true', () => {
			const state = {
				notes: 'Fell in battle',
				defeated: true
			};
			expect(isForgeSteelState(state)).toBe(true);
		});

		it('should accept state with additional properties', () => {
			const state = {
				notes: 'Character notes',
				defeated: false,
				health: 100,
				conditions: ['poisoned']
			};
			expect(isForgeSteelState(state)).toBe(true);
		});

		it('should reject state missing notes field', () => {
			const state = {
				defeated: false
			};
			expect(isForgeSteelState(state)).toBe(false);
		});

		it('should reject state missing defeated field', () => {
			const state = {
				notes: 'Some notes'
			};
			expect(isForgeSteelState(state)).toBe(false);
		});

		it('should reject state with non-string notes', () => {
			const state = {
				notes: 123,
				defeated: false
			};
			expect(isForgeSteelState(state)).toBe(false);
		});

		it('should reject state with non-boolean defeated', () => {
			const state = {
				notes: 'Some notes',
				defeated: 'false'
			};
			expect(isForgeSteelState(state)).toBe(false);
		});

		it('should reject null', () => {
			expect(isForgeSteelState(null)).toBe(false);
		});

		it('should reject undefined', () => {
			expect(isForgeSteelState(undefined)).toBe(false);
		});

		it('should reject non-object types', () => {
			expect(isForgeSteelState('state')).toBe(false);
			expect(isForgeSteelState(123)).toBe(false);
		});
	});

	describe('validateForgeSteelHeroStructure', () => {
		describe('Valid Heroes', () => {
			it('should return no errors for complete valid hero', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Aric Steelheart',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: {
						notes: 'A brave warrior',
						defeated: false
					}
				};
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should return no errors for hero with null ancestry', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Concept Hero',
					ancestry: null,
					class: { name: 'Fury', level: 1 },
					state: {
						notes: '',
						defeated: false
					}
				};
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should return no errors for hero with null class', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: 'Concept Hero',
					ancestry: { name: 'Elf' },
					class: null,
					state: {
						notes: '',
						defeated: false
					}
				};
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('Invalid Heroes - Missing Fields', () => {
			it('should return error for missing id', () => {
				const hero = {
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: id');
			});

			it('should return error for missing name', () => {
				const hero = {
					id: 'hero-123',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: name');
			});

			it('should return error for empty name', () => {
				const hero: ForgeSteelHero = {
					id: 'hero-123',
					name: '',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				};
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Hero name cannot be empty');
			});

			it('should return error for missing state', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Missing required field: state');
			});
		});

		describe('Invalid Heroes - Type Errors', () => {
			it('should return error for invalid id type', () => {
				const hero = {
					id: 123,
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field "id" must be a string');
			});

			it('should return error for invalid name type', () => {
				const hero = {
					id: 'hero-123',
					name: 123,
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field "name" must be a string');
			});

			it('should return error for invalid ancestry structure', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { description: 'No name field' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid ancestry structure');
			});

			it('should return error for invalid class structure', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury' },
					state: { notes: '', defeated: false }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid class structure');
			});

			it('should return error for invalid state structure', () => {
				const hero = {
					id: 'hero-123',
					name: 'Aric',
					ancestry: { name: 'Human' },
					class: { name: 'Fury', level: 1 },
					state: { notes: '' }
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Invalid state structure');
			});
		});

		describe('Multiple Errors', () => {
			it('should return all validation errors', () => {
				const hero = {
					id: 123,
					name: '',
					ancestry: { description: 'Invalid' },
					class: { name: 'Fury' },
					state: null
				} as unknown as ForgeSteelHero;
				const result = validateForgeSteelHeroStructure(hero);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(1);
				expect(result.errors).toContain('Field "id" must be a string');
				expect(result.errors).toContain('Hero name cannot be empty');
			});
		});
	});
});
