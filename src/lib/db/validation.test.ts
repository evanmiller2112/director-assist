/**
 * Tests for Validation Utilities (Issue #504)
 *
 * Tests the three validation modes for runtime schema validation at IndexedDB boundaries.
 *
 * Validation Modes:
 * 1. validateForWrite - Strict validation that throws on invalid data (INSERT/UPDATE operations)
 * 2. validateForRead - Non-blocking validation that warns asynchronously (SELECT operations)
 * 3. validateForImport - Collects validation errors without throwing (IMPORT operations)
 *
 * Testing Strategy:
 * - validateForWrite: Returns validated data on success, throws Error with context on failure
 * - validateForRead: Returns data immediately, logs console.warn asynchronously for invalid data
 * - validateForImport: Returns {valid, errors, data} result object for user feedback
 * - Array variants: Process multiple items with appropriate error handling per mode
 *
 * Coverage:
 * - All three validation modes (write, read, import)
 * - Array validation variants for batch operations
 * - Error message formatting and context inclusion
 * - Asynchronous warning behavior for read mode
 * - Valid vs invalid data handling in each mode
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as v from 'valibot';
import {
	validateForWrite,
	validateForRead,
	validateArrayForRead,
	validateForImport,
	validateArrayForImport
} from '$lib/db/validation';

// Simple test schema for validation utility tests
const TestSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1)),
	age: v.optional(v.number())
});

describe('validateForWrite', () => {
	describe('Valid Data', () => {
		it('should return validated data on valid input', () => {
			const input = { name: 'Gandalf', age: 2000 };
			const result = validateForWrite(TestSchema, input, 'Test Context');

			expect(result).toEqual(input);
		});

		it('should return validated data without optional fields', () => {
			const input = { name: 'Frodo' };
			const result = validateForWrite(TestSchema, input, 'Test Context');

			expect(result).toEqual(input);
		});

		it('should handle data transformation if schema includes transforms', () => {
			const TransformSchema = v.pipe(
				v.object({
					name: v.string(),
					timestamp: v.pipe(v.string(), v.transform((s) => new Date(s)))
				})
			);

			const input = { name: 'Test', timestamp: '2024-01-15T10:00:00.000Z' };
			const result = validateForWrite(TransformSchema, input, 'Transform Test');

			expect(result.name).toBe('Test');
			expect(result.timestamp).toBeInstanceOf(Date);
		});
	});

	describe('Invalid Data', () => {
		it('should throw Error with descriptive message on invalid input', () => {
			const invalidInput = { name: '', age: 25 }; // empty name

			expect(() => {
				validateForWrite(TestSchema, invalidInput, 'Test Context');
			}).toThrow(Error);
		});

		it('should include context parameter in error message', () => {
			const invalidInput = { name: '', age: 25 }; // empty name
			const context = 'Creating new entity';

			try {
				validateForWrite(TestSchema, invalidInput, context);
				expect.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain(context);
			}
		});

		it('should throw Error when required field is missing', () => {
			const invalidInput = { age: 25 }; // missing name

			expect(() => {
				validateForWrite(TestSchema, invalidInput, 'Missing Field Test');
			}).toThrow(Error);
		});

		it('should throw Error when field has wrong type', () => {
			const invalidInput = { name: 'Test', age: '25' }; // age should be number

			expect(() => {
				validateForWrite(TestSchema, invalidInput, 'Type Error Test');
			}).toThrow(Error);
		});
	});
});

describe('validateForRead', () => {
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleWarnSpy.mockRestore();
	});

	describe('Valid Data', () => {
		it('should return data immediately without throwing for valid input', () => {
			const input = { name: 'Gandalf', age: 2000 };
			const result = validateForRead(TestSchema, input, 'Test Context');

			expect(result).toEqual(input);
		});

		it('should NOT console.warn for valid data', async () => {
			const input = { name: 'Frodo' };
			validateForRead(TestSchema, input, 'Valid Data Test');

			// Wait for any async operations
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});
	});

	describe('Invalid Data', () => {
		it('should return data immediately without throwing (even for invalid data)', () => {
			const invalidInput = { name: '', age: 25 }; // empty name

			// Should NOT throw
			expect(() => {
				const result = validateForRead(TestSchema, invalidInput, 'Test Context');
				expect(result).toEqual(invalidInput);
			}).not.toThrow();
		});

		it('should log console.warn asynchronously for invalid data', async () => {
			const invalidInput = { name: '', age: 25 }; // empty name
			const context = 'Reading from database';

			validateForRead(TestSchema, invalidInput, context);

			// Warn should not be called immediately (synchronous)
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			// Wait for async warning
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Now warning should have been logged
			expect(consoleWarnSpy).toHaveBeenCalled();
			const warnMessage = consoleWarnSpy.mock.calls[0][0];
			expect(warnMessage).toContain(context);
		});

		it('should include context in async warning message', async () => {
			const invalidInput = { name: '' };
			const context = 'Database read validation';

			validateForRead(TestSchema, invalidInput, context);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalled();
			const warnMessage = consoleWarnSpy.mock.calls[0][0];
			expect(warnMessage).toContain(context);
		});

		it('should warn about missing required fields', async () => {
			const invalidInput = { age: 25 }; // missing name

			validateForRead(TestSchema, invalidInput, 'Missing Field Test');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalled();
		});

		it('should warn about type mismatches', async () => {
			const invalidInput = { name: 'Test', age: '25' }; // age should be number

			validateForRead(TestSchema, invalidInput, 'Type Mismatch Test');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalled();
		});
	});
});

describe('validateArrayForRead', () => {
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleWarnSpy.mockRestore();
	});

	describe('Valid Data', () => {
		it('should return array immediately for all valid items', () => {
			const input = [
				{ name: 'Gandalf', age: 2000 },
				{ name: 'Frodo', age: 33 },
				{ name: 'Aragorn' }
			];

			const result = validateArrayForRead(TestSchema, input, 'Test Context');
			expect(result).toEqual(input);
		});

		it('should NOT console.warn when all items are valid', async () => {
			const input = [
				{ name: 'Gandalf' },
				{ name: 'Frodo' }
			];

			validateArrayForRead(TestSchema, input, 'Valid Array Test');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});

		it('should handle empty array', () => {
			const input: unknown[] = [];
			const result = validateArrayForRead(TestSchema, input, 'Empty Array Test');

			expect(result).toEqual([]);
		});
	});

	describe('Invalid Data', () => {
		it('should return array immediately, warns asynchronously for invalid items', async () => {
			const input = [
				{ name: 'Gandalf' }, // valid
				{ name: '' }, // invalid: empty name
				{ name: 'Frodo' } // valid
			];

			const result = validateArrayForRead(TestSchema, input, 'Mixed Array Test');

			// Should return immediately
			expect(result).toEqual(input);

			// Warn should not be called immediately
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			// Wait for async warnings
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should have warned about the invalid item
			expect(consoleWarnSpy).toHaveBeenCalled();
		});

		it('should include item index in warning message', async () => {
			const input = [
				{ name: 'Valid' },
				{ name: '' }, // invalid at index 1
				{ name: 'Also Valid' }
			];

			validateArrayForRead(TestSchema, input, 'Index Test');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalled();
			const warnMessage = consoleWarnSpy.mock.calls[0][0];
			expect(warnMessage).toMatch(/index.*1/i);
		});

		it('should warn for each invalid item in array', async () => {
			const input = [
				{ name: '' }, // invalid
				{ name: '' }, // invalid
				{ name: 'Valid' }
			];

			validateArrayForRead(TestSchema, input, 'Multiple Invalid Test');

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should have warned twice (once for each invalid item)
			expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
		});
	});
});

describe('validateForImport', () => {
	describe('Valid Data', () => {
		it('should return {valid: true, errors: [], data: ...} for valid input', () => {
			const input = { name: 'Gandalf', age: 2000 };
			const result = validateForImport(TestSchema, input, 'Test Context');

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.data).toEqual(input);
		});

		it('should handle valid data without optional fields', () => {
			const input = { name: 'Frodo' };
			const result = validateForImport(TestSchema, input, 'Optional Field Test');

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.data).toEqual(input);
		});

		it('should include transformed data in result', () => {
			const TransformSchema = v.pipe(
				v.object({
					name: v.string(),
					timestamp: v.pipe(v.string(), v.transform((s) => new Date(s)))
				})
			);

			const input = { name: 'Test', timestamp: '2024-01-15T10:00:00.000Z' };
			const result = validateForImport(TransformSchema, input, 'Transform Test');

			expect(result.valid).toBe(true);
			if (result.valid && result.data) {
				expect(result.data.timestamp).toBeInstanceOf(Date);
			}
		});
	});

	describe('Invalid Data', () => {
		it('should return {valid: false, errors: [...]} for invalid input', () => {
			const invalidInput = { name: '', age: 25 }; // empty name

			const result = validateForImport(TestSchema, invalidInput, 'Test Context');

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.data).toBeUndefined();
		});

		it('should include descriptive errors in result', () => {
			const invalidInput = { name: '' }; // empty name
			const context = 'Import validation';

			const result = validateForImport(TestSchema, invalidInput, context);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);

			// Errors should be descriptive strings
			result.errors.forEach((error) => {
				expect(typeof error).toBe('string');
				expect(error.length).toBeGreaterThan(0);
			});
		});

		it('should handle missing required fields', () => {
			const invalidInput = { age: 25 }; // missing name

			const result = validateForImport(TestSchema, invalidInput, 'Missing Field Test');

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should handle type mismatches', () => {
			const invalidInput = { name: 'Test', age: '25' }; // age should be number

			const result = validateForImport(TestSchema, invalidInput, 'Type Mismatch Test');

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should NOT throw errors (returns result object instead)', () => {
			const invalidInput = { name: '' };

			expect(() => {
				const result = validateForImport(TestSchema, invalidInput, 'No Throw Test');
				expect(result.valid).toBe(false);
			}).not.toThrow();
		});
	});
});

describe('validateArrayForImport', () => {
	describe('Valid Data', () => {
		it('should return all items as valid with empty errors array', () => {
			const input = [
				{ name: 'Gandalf', age: 2000 },
				{ name: 'Frodo', age: 33 },
				{ name: 'Aragorn' }
			];

			const result = validateArrayForImport(TestSchema, input, 'Valid Array Test');

			expect(result.validItems).toEqual(input);
			expect(result.errors).toEqual([]);
			expect(result.totalCount).toBe(3);
			expect(result.validCount).toBe(3);
			expect(result.errorCount).toBe(0);
		});

		it('should handle empty array', () => {
			const input: unknown[] = [];
			const result = validateArrayForImport(TestSchema, input, 'Empty Array Test');

			expect(result.validItems).toEqual([]);
			expect(result.errors).toEqual([]);
			expect(result.totalCount).toBe(0);
			expect(result.validCount).toBe(0);
			expect(result.errorCount).toBe(0);
		});
	});

	describe('Invalid Data', () => {
		it('should separate valid items from errors', () => {
			const input = [
				{ name: 'Gandalf' }, // valid
				{ name: '' }, // invalid: empty name
				{ name: 'Frodo' }, // valid
				{ age: 33 } // invalid: missing name
			];

			const result = validateArrayForImport(TestSchema, input, 'Mixed Array Test');

			expect(result.validItems).toHaveLength(2);
			expect(result.validItems).toContainEqual({ name: 'Gandalf' });
			expect(result.validItems).toContainEqual({ name: 'Frodo' });

			expect(result.errors).toHaveLength(2);
			expect(result.totalCount).toBe(4);
			expect(result.validCount).toBe(2);
			expect(result.errorCount).toBe(2);
		});

		it('should collect errors with item index in message', () => {
			const input = [
				{ name: 'Valid' },
				{ name: '' }, // invalid at index 1
				{ name: 'Also Valid' },
				{ age: 25 } // invalid at index 3
			];

			const result = validateArrayForImport(TestSchema, input, 'Index Test');

			expect(result.errors).toHaveLength(2);

			// Check that errors include index information
			const errorMessages = result.errors.join(' ');
			expect(errorMessages).toMatch(/index.*1/i);
			expect(errorMessages).toMatch(/index.*3/i);
		});

		it('should handle all items being invalid', () => {
			const input = [
				{ name: '' },
				{ name: '' },
				{ age: 25 }
			];

			const result = validateArrayForImport(TestSchema, input, 'All Invalid Test');

			expect(result.validItems).toEqual([]);
			expect(result.errors).toHaveLength(3);
			expect(result.totalCount).toBe(3);
			expect(result.validCount).toBe(0);
			expect(result.errorCount).toBe(3);
		});

		it('should include descriptive error messages', () => {
			const input = [
				{ name: '' }, // invalid
				{ age: 25 } // invalid
			];

			const result = validateArrayForImport(TestSchema, input, 'Descriptive Errors Test');

			expect(result.errors.length).toBe(2);

			// Each error should be a descriptive string
			result.errors.forEach((error) => {
				expect(typeof error).toBe('string');
				expect(error.length).toBeGreaterThan(0);
			});
		});

		it('should NOT throw errors (returns result object instead)', () => {
			const input = [
				{ name: '' },
				{ name: '' }
			];

			expect(() => {
				const result = validateArrayForImport(TestSchema, input, 'No Throw Test');
				expect(result.errorCount).toBeGreaterThan(0);
			}).not.toThrow();
		});
	});

	describe('Statistics', () => {
		it('should provide accurate count statistics', () => {
			const input = [
				{ name: 'Valid1' },
				{ name: '' }, // invalid
				{ name: 'Valid2' },
				{ name: '' }, // invalid
				{ name: 'Valid3' }
			];

			const result = validateArrayForImport(TestSchema, input, 'Stats Test');

			expect(result.totalCount).toBe(5);
			expect(result.validCount).toBe(3);
			expect(result.errorCount).toBe(2);
			expect(result.validCount + result.errorCount).toBe(result.totalCount);
		});
	});
});
