/**
 * Dark Mode Compliance Test (Regression Prevention)
 *
 * Static analysis test that scans all .svelte files for dark text color violations.
 * Any use of text-gray-700, text-gray-800, text-gray-900, text-black,
 * text-slate-700, text-slate-800, or text-slate-900 WITHOUT a corresponding
 * dark:text-* on the same line is flagged as a violation.
 *
 * This prevents future regressions where developers add dark text classes
 * but forget the dark mode counterpart, causing unreadable text on dark backgrounds.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Standalone dark text classes that require a dark: counterpart.
// Uses negative lookbehind to exclude pseudo-class prefixed variants like
// hover:text-slate-700 (which need dark:hover:text-*, not dark:text-*).
const DARK_TEXT_PATTERN =
	/(?<![\w-]:)text-(?:gray-(?:700|800|900)|black|slate-(?:700|800|900))\b/;

// The corresponding dark mode fix
const DARK_MODE_TEXT_PATTERN = /\bdark:text-/;

interface Violation {
	file: string;
	line: number;
	content: string;
}

/**
 * Recursively find all .svelte files under a directory
 */
function findSvelteFiles(dir: string): string[] {
	const results: string[] = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.svelte-kit') {
			results.push(...findSvelteFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.svelte')) {
			results.push(fullPath);
		}
	}

	return results;
}

/**
 * Strip <style> blocks and HTML comments from content,
 * preserving line numbers by replacing removed content with empty lines.
 */
function stripStyleAndComments(content: string): string {
	// Replace <style>...</style> blocks with empty lines
	let result = content.replace(/<style[\s\S]*?<\/style>/g, (match) => {
		return match.replace(/[^\n]/g, '');
	});

	// Replace HTML comments with empty lines
	result = result.replace(/<!--[\s\S]*?-->/g, (match) => {
		return match.replace(/[^\n]/g, '');
	});

	return result;
}

/**
 * Scan a single file for dark mode text violations
 */
function scanFile(filePath: string): Violation[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const stripped = stripStyleAndComments(content);
	const lines = stripped.split('\n');
	const violations: Violation[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (DARK_TEXT_PATTERN.test(line) && !DARK_MODE_TEXT_PATTERN.test(line)) {
			violations.push({
				file: filePath,
				line: i + 1,
				content: content.split('\n')[i].trim()
			});
		}
	}

	return violations;
}

// Scan all svelte files
const srcDir = path.resolve(__dirname, '..');
const svelteFiles = findSvelteFiles(srcDir);
const allViolations: Map<string, Violation[]> = new Map();

for (const file of svelteFiles) {
	const violations = scanFile(file);
	if (violations.length > 0) {
		allViolations.set(file, violations);
	}
}

describe('Dark Mode Text Compliance', () => {
	it('should find .svelte files to scan', () => {
		expect(svelteFiles.length).toBeGreaterThan(0);
	});

	// Generate one test per file that has violations
	for (const file of svelteFiles) {
		const relativePath = path.relative(srcDir, file);
		const violations = allViolations.get(file) || [];

		it(`${relativePath} should have no dark text classes without dark: variants`, () => {
			if (violations.length > 0) {
				const message = violations
					.map((v) => `  Line ${v.line}: ${v.content}`)
					.join('\n');
				expect.fail(
					`Found ${violations.length} dark mode violation(s) in ${relativePath}:\n${message}\n\n` +
						'Each dark text class (text-gray-700, text-gray-800, text-gray-900, text-black, ' +
						'text-slate-700, text-slate-800, text-slate-900) needs a corresponding dark:text-* variant on the same line.'
				);
			}
		});
	}

	it('should have zero total violations across all files', () => {
		const totalViolations = Array.from(allViolations.values()).reduce(
			(sum, v) => sum + v.length,
			0
		);
		if (totalViolations > 0) {
			const summary = Array.from(allViolations.entries())
				.map(([file, violations]) => {
					const relativePath = path.relative(srcDir, file);
					return `${relativePath}: ${violations.length} violation(s)`;
				})
				.join('\n  ');
			expect.fail(
				`Found ${totalViolations} total dark mode violation(s):\n  ${summary}`
			);
		}
	});
});
