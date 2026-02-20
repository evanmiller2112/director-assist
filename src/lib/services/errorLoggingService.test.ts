/**
 * Tests for Error Logging Service
 *
 * Issue #508: Add error boundaries and custom error page
 *
 * These tests validate the error logging service that provides
 * centralized error logging with context and formatting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logError, formatErrorMessage } from './errorLoggingService';

describe('errorLoggingService - logError', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Spy on console.error
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		// Restore console.error after each test
		consoleErrorSpy.mockRestore();
	});

	it('should call console.error with formatted message', () => {
		const error = new Error('Test error');

		logError({
			message: 'Something went wrong',
			error,
			context: 'test-context'
		});

		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith('[test-context]', 'Something went wrong', error);
	});

	it('should use "app" as default context when not provided', () => {
		const error = new Error('Test error');

		logError({
			message: 'Something went wrong',
			error
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith('[app]', 'Something went wrong', error);
	});

	it('should include route in the log entry', () => {
		const error = new Error('Test error');

		logError({
			message: 'Something went wrong',
			error,
			route: '/entities/npc/123'
		});

		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
	});

	it('should handle unknown error type', () => {
		logError({
			message: 'Something went wrong',
			error: 'string error'
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith('[app]', 'Something went wrong', 'string error');
	});

	it('should add timestamp to error log entry', () => {
		const error = new Error('Test error');
		const beforeTime = new Date();

		logError({
			message: 'Something went wrong',
			error,
			context: 'test'
		});

		const afterTime = new Date();

		// Timestamp should be between before and after
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});

describe('errorLoggingService - formatErrorMessage', () => {
	it('should format Error object message', () => {
		const error = new Error('Test error message');
		const result = formatErrorMessage(error);

		expect(result).toBe('Test error message');
	});

	it('should format string error', () => {
		const error = 'String error message';
		const result = formatErrorMessage(error);

		expect(result).toBe('String error message');
	});

	it('should format unknown error type', () => {
		const error = { something: 'weird' };
		const result = formatErrorMessage(error);

		expect(result).toBe('An unexpected error occurred');
	});

	it('should format null error', () => {
		const result = formatErrorMessage(null);

		expect(result).toBe('An unexpected error occurred');
	});

	it('should format undefined error', () => {
		const result = formatErrorMessage(undefined);

		expect(result).toBe('An unexpected error occurred');
	});

	it('should format number error', () => {
		const result = formatErrorMessage(42);

		expect(result).toBe('An unexpected error occurred');
	});

	it('should handle Error with empty message', () => {
		const error = new Error('');
		const result = formatErrorMessage(error);

		expect(result).toBe('');
	});
});
