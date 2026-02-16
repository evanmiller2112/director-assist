/**
 * Validation Utilities for Runtime Schema Validation (Issue #504)
 *
 * Three validation modes for different use cases:
 * 1. validateForWrite - Strict synchronous validation that throws on failure
 * 2. validateForRead - Non-blocking validation that warns asynchronously
 * 3. validateForImport - Collects validation errors without throwing
 */

import * as v from 'valibot';

/**
 * Format validation issues into a readable error message.
 */
function formatIssues(issues: v.BaseIssue<unknown>[]): string {
	return issues
		.map((issue) => {
			const path = issue.path?.map((p) => p.key).join('.') || 'root';
			return `${path}: ${issue.message}`;
		})
		.join('; ');
}

/**
 * Validate data for WRITE operations (INSERT/UPDATE).
 * Strict synchronous validation that throws on invalid data.
 *
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @param context - Context string for error messages (e.g., "Creating entity")
 * @returns Validated and potentially transformed data
 * @throws Error if validation fails
 */
export function validateForWrite<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: TSchema,
	data: unknown,
	context: string
): v.InferOutput<TSchema> {
	const result = v.safeParse(schema, data);

	if (!result.success) {
		const errorDetails = formatIssues(result.issues);
		throw new Error(`Validation failed (${context}): ${errorDetails}`);
	}

	return result.output;
}

/**
 * Validate data for READ operations (SELECT).
 * Non-blocking validation that returns data immediately and warns asynchronously.
 *
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @param context - Context string for warning messages (e.g., "Reading from entities table")
 * @returns Data immediately (typed as validated)
 */
export function validateForRead<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: TSchema,
	data: unknown,
	context: string
): v.InferOutput<TSchema> {
	// Return data immediately (type assertion)
	const typedData = data as v.InferOutput<TSchema>;

	// Defer validation to microtask queue (async warning)
	queueMicrotask(() => {
		const result = v.safeParse(schema, data);
		if (!result.success) {
			const errorDetails = formatIssues(result.issues);
			console.warn(`Validation warning (${context}): ${errorDetails}`);
		}
	});

	return typedData;
}

/**
 * Validate array of data for READ operations.
 * Non-blocking validation that returns array immediately and warns per invalid item.
 *
 * @param schema - Valibot schema to validate against
 * @param data - Array of data to validate
 * @param context - Context string for warning messages
 * @returns Array immediately (typed as validated)
 */
export function validateArrayForRead<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: TSchema,
	data: unknown[],
	context: string
): v.InferOutput<TSchema>[] {
	// Return data immediately (type assertion)
	const typedData = data as v.InferOutput<TSchema>[];

	// Defer validation to microtask queue (async warnings)
	queueMicrotask(() => {
		data.forEach((item, index) => {
			const result = v.safeParse(schema, item);
			if (!result.success) {
				const errorDetails = formatIssues(result.issues);
				console.warn(`Validation warning (${context}) at index ${index}: ${errorDetails}`);
			}
		});
	});

	return typedData;
}

/**
 * Result object for import validation.
 */
export interface ImportValidationResult<T> {
	valid: boolean;
	errors: string[];
	data?: T;
}

/**
 * Validate data for IMPORT operations.
 * Blocking validation that collects errors without throwing.
 *
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @param context - Context string for error messages
 * @returns Result object with valid flag, errors array, and data
 */
export function validateForImport<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: TSchema,
	data: unknown,
	context: string
): ImportValidationResult<v.InferOutput<TSchema>> {
	const result = v.safeParse(schema, data);

	if (!result.success) {
		const errors = result.issues.map((issue) => {
			const path = issue.path?.map((p) => p.key).join('.') || 'root';
			return `${path}: ${issue.message}`;
		});

		return {
			valid: false,
			errors,
			data: undefined
		};
	}

	return {
		valid: true,
		errors: [],
		data: result.output
	};
}

/**
 * Result object for array import validation.
 */
export interface ArrayImportValidationResult<T> {
	validItems: T[];
	errors: string[];
	totalCount: number;
	validCount: number;
	errorCount: number;
}

/**
 * Validate array of data for IMPORT operations.
 * Blocking validation that separates valid items from errors.
 *
 * @param schema - Valibot schema to validate against
 * @param data - Array of data to validate
 * @param context - Context string for error messages
 * @returns Result object with valid items, errors, and statistics
 */
export function validateArrayForImport<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: TSchema,
	data: unknown[],
	context: string
): ArrayImportValidationResult<v.InferOutput<TSchema>> {
	const validItems: v.InferOutput<TSchema>[] = [];
	const errors: string[] = [];

	data.forEach((item, index) => {
		const result = v.safeParse(schema, item);

		if (result.success) {
			validItems.push(result.output);
		} else {
			const errorDetails = result.issues
				.map((issue) => {
					const path = issue.path?.map((p) => p.key).join('.') || 'root';
					return `${path}: ${issue.message}`;
				})
				.join('; ');

			errors.push(`Item at index ${index}: ${errorDetails}`);
		}
	});

	return {
		validItems,
		errors,
		totalCount: data.length,
		validCount: validItems.length,
		errorCount: errors.length
	};
}
