import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
	it('should extract message from Error object', () => {
		const error = new Error('Test error message');
		expect(getErrorMessage(error)).toBe('Test error message');
	});

	it('should handle string errors', () => {
		expect(getErrorMessage('String error')).toBe('String error');
	});

	it('should handle number errors with default message', () => {
		expect(getErrorMessage(42)).toBe('An unknown error occurred');
	});

	it('should handle null with default message', () => {
		expect(getErrorMessage(null)).toBe('An unknown error occurred');
	});

	it('should handle undefined with default message', () => {
		expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
	});

	it('should handle object errors with default message', () => {
		expect(getErrorMessage({ foo: 'bar' })).toBe('An unknown error occurred');
	});

	it('should handle custom Error subclasses', () => {
		class CustomError extends Error {
			constructor(message: string) {
				super(message);
				this.name = 'CustomError';
			}
		}
		const error = new CustomError('Custom error message');
		expect(getErrorMessage(error)).toBe('Custom error message');
	});
});
