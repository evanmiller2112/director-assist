/**
 * Tests for Unified Player Export Formatter (TDD RED Phase)
 *
 * The index module provides a single formatPlayerExport function that
 * delegates to the appropriate formatter based on the format option.
 *
 * Key requirements:
 * - Route to correct formatter based on format
 * - Pass through options correctly
 * - Handle invalid formats gracefully
 * - Maintain consistent return type
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatPlayerExport } from './index';
import * as jsonFormatter from './jsonFormatter';
import * as htmlFormatter from './htmlFormatter';
import * as markdownFormatter from './markdownFormatter';
import {
	createCompletePlayerExport,
	createEmptyPlayerExport,
	createDefaultOptions
} from './testFixtures';
import type { PlayerExportFormat } from '$lib/types/playerExport';

// Mock the individual formatters
vi.mock('./jsonFormatter', () => ({
	formatAsJson: vi.fn()
}));

vi.mock('./htmlFormatter', () => ({
	formatAsHtml: vi.fn()
}));

vi.mock('./markdownFormatter', () => ({
	formatAsMarkdown: vi.fn()
}));

describe('formatPlayerExport', () => {
	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Set up default mock implementations
		vi.mocked(jsonFormatter.formatAsJson).mockReturnValue('{"mocked": "json"}');
		vi.mocked(htmlFormatter.formatAsHtml).mockReturnValue('<html>mocked</html>');
		vi.mocked(markdownFormatter.formatAsMarkdown).mockReturnValue('# Mocked Markdown');
	});

	describe('Format Routing', () => {
		it('should call JSON formatter when format is "json"', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(jsonFormatter.formatAsJson).toHaveBeenCalledTimes(1);
			expect(htmlFormatter.formatAsHtml).not.toHaveBeenCalled();
			expect(markdownFormatter.formatAsMarkdown).not.toHaveBeenCalled();
		});

		it('should call HTML formatter when format is "html"', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'html' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(htmlFormatter.formatAsHtml).toHaveBeenCalledTimes(1);
			expect(jsonFormatter.formatAsJson).not.toHaveBeenCalled();
			expect(markdownFormatter.formatAsMarkdown).not.toHaveBeenCalled();
		});

		it('should call Markdown formatter when format is "markdown"', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'markdown' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(markdownFormatter.formatAsMarkdown).toHaveBeenCalledTimes(1);
			expect(jsonFormatter.formatAsJson).not.toHaveBeenCalled();
			expect(htmlFormatter.formatAsHtml).not.toHaveBeenCalled();
		});
	});

	describe('Parameter Passing', () => {
		it('should pass playerExport to JSON formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(jsonFormatter.formatAsJson).toHaveBeenCalledWith(playerExport, options);
		});

		it('should pass playerExport to HTML formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'html' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(htmlFormatter.formatAsHtml).toHaveBeenCalledWith(playerExport, options);
		});

		it('should pass playerExport to Markdown formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'markdown' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(markdownFormatter.formatAsMarkdown).toHaveBeenCalledWith(playerExport, options);
		});

		it('should pass options to formatters', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				format: 'json' as PlayerExportFormat,
				includeTimestamps: false,
				includeImages: false,
				groupByType: true
			};

			formatPlayerExport(playerExport, options);

			expect(jsonFormatter.formatAsJson).toHaveBeenCalledWith(playerExport, options);
		});

		it('should pass all option variations correctly', () => {
			const playerExport = createEmptyPlayerExport();

			// Test with all true
			const optionsAllTrue = {
				format: 'html' as PlayerExportFormat,
				includeTimestamps: true,
				includeImages: true,
				groupByType: true
			};

			formatPlayerExport(playerExport, optionsAllTrue);

			expect(htmlFormatter.formatAsHtml).toHaveBeenCalledWith(playerExport, optionsAllTrue);

			vi.clearAllMocks();

			// Test with all false
			const optionsAllFalse = {
				format: 'markdown' as PlayerExportFormat,
				includeTimestamps: false,
				includeImages: false,
				groupByType: false
			};

			formatPlayerExport(playerExport, optionsAllFalse);

			expect(markdownFormatter.formatAsMarkdown).toHaveBeenCalledWith(playerExport, optionsAllFalse);
		});
	});

	describe('Return Value', () => {
		it('should return result from JSON formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };
			const expectedResult = '{"test": "data"}';

			vi.mocked(jsonFormatter.formatAsJson).mockReturnValue(expectedResult);

			const result = formatPlayerExport(playerExport, options);

			expect(result).toBe(expectedResult);
		});

		it('should return result from HTML formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'html' as PlayerExportFormat };
			const expectedResult = '<html><body>Test</body></html>';

			vi.mocked(htmlFormatter.formatAsHtml).mockReturnValue(expectedResult);

			const result = formatPlayerExport(playerExport, options);

			expect(result).toBe(expectedResult);
		});

		it('should return result from Markdown formatter', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'markdown' as PlayerExportFormat };
			const expectedResult = '# Test Campaign\n\nContent here';

			vi.mocked(markdownFormatter.formatAsMarkdown).mockReturnValue(expectedResult);

			const result = formatPlayerExport(playerExport, options);

			expect(result).toBe(expectedResult);
		});
	});

	describe('Error Handling', () => {
		it('should throw error for unknown format', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				...createDefaultOptions(),
				format: 'xml' as PlayerExportFormat // Invalid format
			};

			expect(() => formatPlayerExport(playerExport, options)).toThrow();
		});

		it('should throw descriptive error message for unknown format', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				...createDefaultOptions(),
				format: 'pdf' as PlayerExportFormat // Invalid format
			};

			expect(() => formatPlayerExport(playerExport, options)).toThrow(/format|unknown|unsupported/i);
		});

		it('should not catch errors from individual formatters', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };
			const expectedError = new Error('Formatter error');

			vi.mocked(jsonFormatter.formatAsJson).mockImplementation(() => {
				throw expectedError;
			});

			expect(() => formatPlayerExport(playerExport, options)).toThrow(expectedError);
		});
	});

	// Note: Integration tests with real formatters are covered by the individual
	// formatter test files (jsonFormatter.test.ts, htmlFormatter.test.ts, markdownFormatter.test.ts).
	// This test file focuses on the routing logic of formatPlayerExport().

	describe('Type Safety', () => {
		it('should accept valid PlayerExportFormat values', () => {
			const playerExport = createCompletePlayerExport();

			// All these should compile and run without error
			expect(() => {
				formatPlayerExport(playerExport, { ...createDefaultOptions(), format: 'json' });
				formatPlayerExport(playerExport, { ...createDefaultOptions(), format: 'html' });
				formatPlayerExport(playerExport, { ...createDefaultOptions(), format: 'markdown' });
			}).not.toThrow();
		});

		it('should return string type', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			const result = formatPlayerExport(playerExport, options);

			expect(typeof result).toBe('string');
		});
	});

	describe('Empty Data Handling', () => {
		it('should handle empty export with JSON format', () => {
			const playerExport = createEmptyPlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});

		it('should handle empty export with HTML format', () => {
			const playerExport = createEmptyPlayerExport();
			const options = { ...createDefaultOptions(), format: 'html' as PlayerExportFormat };

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});

		it('should handle empty export with Markdown format', () => {
			const playerExport = createEmptyPlayerExport();
			const options = { ...createDefaultOptions(), format: 'markdown' as PlayerExportFormat };

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});
	});

	describe('Options Variations', () => {
		it('should work with minimal options', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				format: 'json' as PlayerExportFormat,
				includeTimestamps: false,
				includeImages: false,
				groupByType: false
			};

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});

		it('should work with maximal options', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				format: 'html' as PlayerExportFormat,
				includeTimestamps: true,
				includeImages: true,
				groupByType: true
			};

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});

		it('should handle partial options with defaults', () => {
			const playerExport = createCompletePlayerExport();
			const options = {
				format: 'markdown' as PlayerExportFormat
				// Other options should use defaults
			};

			expect(() => formatPlayerExport(playerExport, options)).not.toThrow();
		});
	});

	describe('Performance', () => {
		it('should call formatter only once per invocation', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			expect(jsonFormatter.formatAsJson).toHaveBeenCalledTimes(1);
		});

		it('should not call other formatters unnecessarily', () => {
			const playerExport = createCompletePlayerExport();
			const options = { ...createDefaultOptions(), format: 'json' as PlayerExportFormat };

			formatPlayerExport(playerExport, options);

			// Only JSON formatter should be called
			expect(jsonFormatter.formatAsJson).toHaveBeenCalled();
			expect(htmlFormatter.formatAsHtml).not.toHaveBeenCalled();
			expect(markdownFormatter.formatAsMarkdown).not.toHaveBeenCalled();
		});
	});

	// Note: Consistency tests across formats are covered by the individual
	// formatter test files which verify each formatter produces correct output.
});
