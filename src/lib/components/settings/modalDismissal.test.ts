/**
 * Regression test: Modal dismissal bug prevention
 *
 * Modals with `$bindable(false)` open prop must set `open = false` in their
 * close handler before calling the callback. Without this, the $effect that
 * syncs `open` with dialogElement.showModal()/close() never fires, and the
 * modal stays open.
 *
 * This test statically analyzes modal source files to ensure the pattern is
 * followed, preventing regression of the bug fixed in all three settings modals.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Find the close/cancel handler function in a modal source and verify
 * it sets `open = false` before calling the callback.
 */
function extractCloseHandlers(source: string): { name: string; body: string }[] {
	const handlers: { name: string; body: string }[] = [];
	// Match function declarations like: function handleClose() { ... }
	// or function handleCancel() { ... }
	const funcRegex = /function\s+(handle(?:Close|Cancel))\s*\([^)]*\)\s*\{/g;
	let match;

	while ((match = funcRegex.exec(source)) !== null) {
		const funcName = match[1];
		const startIndex = match.index + match[0].length;

		// Extract the function body by counting braces
		let braceCount = 1;
		let i = startIndex;
		while (i < source.length && braceCount > 0) {
			if (source[i] === '{') braceCount++;
			if (source[i] === '}') braceCount--;
			i++;
		}

		const body = source.slice(startIndex, i - 1);
		handlers.push({ name: funcName, body });
	}

	return handlers;
}

describe('Modal dismissal pattern', () => {
	const settingsDir = resolve(__dirname);

	// Find all .svelte files in the settings directory that use $bindable open
	const modalFiles = readdirSync(settingsDir)
		.filter((file) => file.endsWith('.svelte'))
		.filter((file) => {
			const content = readFileSync(resolve(settingsDir, file), 'utf-8');
			return content.includes('$bindable(false)') && content.includes('open');
		});

	it('should find at least 3 modals with $bindable open prop', () => {
		expect(modalFiles.length).toBeGreaterThanOrEqual(3);
	});

	for (const file of modalFiles) {
		describe(file, () => {
			const filePath = resolve(settingsDir, file);
			const source = readFileSync(filePath, 'utf-8');
			const handlers = extractCloseHandlers(source);

			it('should have a handleClose or handleCancel function', () => {
				expect(handlers.length).toBeGreaterThan(0);
			});

			for (const handler of handlers) {
				it(`${handler.name}() should set open = false`, () => {
					expect(handler.body).toContain('open = false');
				});
			}
		});
	}
});
