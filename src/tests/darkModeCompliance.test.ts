/**
 * Dark Mode Compliance Test (Regression Prevention)
 *
 * Static analysis test that scans all .svelte files for two categories of violations:
 *
 * Rule 1 — "Dark text without dark variant":
 *   text-gray-900 (or similar dark text) WITHOUT a dark:text-* on the same line.
 *   Catches: developer adds a dark text color but forgets the dark mode counterpart.
 *
 * Rule 2 — "Dark background without any text color":
 *   dark:bg-slate-700 (or similar) on a line that has NO text color class at all
 *   (neither text-{color} nor dark:text-*). The element relies entirely on inherited
 *   text color, which may be dark/invisible against the dark background.
 *   Lines that already have a light text color (e.g. text-white) are NOT flagged
 *   since they're readable on dark backgrounds.
 *
 * Lines can be exempted with a <!-- dark-mode-exempt --> comment on the same or previous line.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

// Rule 1: Standalone dark text classes that require a dark: counterpart.
// Negative lookbehind excludes pseudo-prefixed variants like hover:text-slate-700.
const DARK_TEXT_PATTERN =
	/(?<![\w-]:)text-(?:gray-(?:700|800|900)|black|slate-(?:700|800|900))\b/;

// Rule 2: Explicit dark-mode background on a text-displaying element.
// Matches elements that have dark:bg-* AND a text-sizing or font-weight class
// (text-xs, text-sm, font-semibold, etc.), indicating they render visible text.
// Container divs that only set backgrounds are excluded — they inherit text color.
const DARK_BG_PATTERN =
	/(?<![\w-]:)dark:bg-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white)\b/;
const TEXT_ELEMENT_INDICATOR =
	/\b(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:medium|semibold|bold|extrabold|black))\b/;

// The fix both rules look for: a dark:text-* class on the same line.
const DARK_MODE_TEXT_PATTERN = /\bdark:text-/;

// Rule 2 also checks: does the line have ANY text color class already?
// Text color classes use text-{colorName}-{shade} or text-{keyword}.
// We exclude text sizing classes (text-xs, text-sm, text-base, text-lg, etc.).
const ANY_TEXT_COLOR_PATTERN =
	/(?<![\w-]:)text-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white|transparent|current|inherit)\b/;

// Exemption marker — add <!-- dark-mode-exempt --> to suppress false positives.
const EXEMPTION_PATTERN = /dark-mode-exempt/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViolationRule = 'dark-text-without-variant' | 'dark-bg-without-text';

interface Violation {
	file: string;
	line: number;
	content: string;
	rule: ViolationRule;
}

const RULE_LABELS: Record<ViolationRule, string> = {
	'dark-text-without-variant': 'Dark text class without dark: variant',
	'dark-bg-without-text': 'Dark background with no text color (inherited)',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively find all .svelte files under a directory. */
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
 * NOTE: exemption comments are checked BEFORE stripping.
 */
function stripStyleAndComments(content: string): string {
	let result = content.replace(/<style[\s\S]*?<\/style>/g, (match) => {
		return match.replace(/[^\n]/g, '');
	});

	result = result.replace(/<!--[\s\S]*?-->/g, (match) => {
		return match.replace(/[^\n]/g, '');
	});

	return result;
}

/** Scan a single file for dark mode text violations. */
function scanFile(filePath: string): Violation[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const originalLines = content.split('\n');
	const stripped = stripStyleAndComments(content);
	const lines = stripped.split('\n');
	const violations: Violation[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check exemptions on original (un-stripped) content so comments are visible
		if (EXEMPTION_PATTERN.test(originalLines[i])) continue;
		if (i > 0 && EXEMPTION_PATTERN.test(originalLines[i - 1])) continue;

		const hasDarkText = DARK_MODE_TEXT_PATTERN.test(line);

		// Rule 1: dark text class without a dark: variant
		if (DARK_TEXT_PATTERN.test(line) && !hasDarkText) {
			violations.push({
				file: filePath,
				line: i + 1,
				content: originalLines[i].trim(),
				rule: 'dark-text-without-variant',
			});
		}

		// Rule 2: dark background on a text-displaying element with NO text color at all.
		// Only fires when the line has dark:bg-*, a text-sizing/font-weight class (indicating
		// it renders text), but neither dark:text-* nor any text color class.
		// Container divs without text utilities are excluded to avoid false positives.
		if (
			DARK_BG_PATTERN.test(line) &&
			TEXT_ELEMENT_INDICATOR.test(line) &&
			!hasDarkText &&
			!ANY_TEXT_COLOR_PATTERN.test(line)
		) {
			violations.push({
				file: filePath,
				line: i + 1,
				content: originalLines[i].trim(),
				rule: 'dark-bg-without-text',
			});
		}
	}

	return violations;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

const srcDir = path.resolve(__dirname, '..');
const svelteFiles = findSvelteFiles(srcDir);
const allViolations: Map<string, Violation[]> = new Map();

for (const file of svelteFiles) {
	const violations = scanFile(file);
	if (violations.length > 0) {
		allViolations.set(file, violations);
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dark Mode Text Compliance', () => {
	it('should find .svelte files to scan', () => {
		expect(svelteFiles.length).toBeGreaterThan(0);
	});

	// One test per file — makes failures easy to locate
	for (const file of svelteFiles) {
		const relativePath = path.relative(srcDir, file);
		const violations = allViolations.get(file) || [];

		it(`${relativePath} should have no dark mode violations`, () => {
			if (violations.length > 0) {
				const message = violations
					.map((v) => `  Line ${v.line} [${RULE_LABELS[v.rule]}]: ${v.content}`)
					.join('\n');
				expect.fail(
					`Found ${violations.length} dark mode violation(s) in ${relativePath}:\n${message}\n\n` +
						'Rule 1: Dark text classes (text-gray-700…900, text-black, text-slate-700…900) need a dark:text-* variant on the same line.\n' +
						'Rule 2: Elements with dark:bg-* and no text color class at all need an explicit text-* + dark:text-* pair.\n' +
						'Exempt a line by adding <!-- dark-mode-exempt --> on it or the line above.'
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
					const byRule = violations.reduce(
						(acc, v) => {
							acc[v.rule] = (acc[v.rule] || 0) + 1;
							return acc;
						},
						{} as Record<string, number>
					);
					const ruleBreakdown = Object.entries(byRule)
						.map(([rule, count]) => `${RULE_LABELS[rule as ViolationRule]}: ${count}`)
						.join(', ');
					return `${relativePath}: ${violations.length} violation(s) (${ruleBreakdown})`;
				})
				.join('\n  ');
			expect.fail(
				`Found ${totalViolations} total dark mode violation(s):\n  ${summary}`
			);
		}
	});
});
