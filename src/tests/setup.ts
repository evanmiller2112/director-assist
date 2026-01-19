import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Cleanup after each test case
afterEach(() => {
	cleanup();
});

// Mock the AI SDK to work with test mocks
vi.mock('ai', async () => {
	return {
		generateText: vi.fn(async ({ model, prompt, maxTokens, temperature, system }: any) => {
			// Call the model's doGenerate if it exists (for mocked models)
			if (model && typeof model.doGenerate === 'function') {
				return await model.doGenerate({
					mode: { type: 'regular' },
					inputFormat: 'prompt',
					prompt: system
						? [
								{ role: 'system', content: [{ type: 'text', text: system }] },
								{ role: 'user', content: [{ type: 'text', text: prompt }] }
							]
						: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
					maxTokens,
					temperature
				});
			}
			// Default mock response
			return { text: 'mock response', usage: { promptTokens: 10, completionTokens: 20 } };
		}),
		streamText: vi.fn(({ model, prompt, maxTokens, temperature, system }: any) => {
			// Call the model's doStream if it exists (for mocked models)
			if (model && typeof model.doStream === 'function') {
				// Collect chunks from onChunk callback
				const chunks: string[] = [];

				// Wrap doStream call to handle errors gracefully
				const streamPromise = Promise.resolve().then(() =>
					model.doStream({
						mode: { type: 'regular' },
						inputFormat: 'prompt',
						prompt: system
							? [
									{ role: 'system', content: [{ type: 'text', text: system }] },
									{ role: 'user', content: [{ type: 'text', text: prompt }] }
								]
							: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
						maxTokens,
						temperature,
						onChunk: (chunk: any) => {
							// Store chunks for streaming
							if (chunk.type === 'text-delta') {
								chunks.push(chunk.textDelta);
							}
						}
					})
				);

				return {
					textStream: (async function* () {
						// Wait for doStream to complete/fail
						try {
							const result = await streamPromise;
							for (const chunk of chunks) {
								yield chunk;
							}
						} catch (error) {
							// If stream fails, re-throw so the iteration fails
							throw error;
						}
					})(),
					text: streamPromise.then((r: any) => r?.text || ''),
					usage: streamPromise.then((r: any) => r?.usage).catch(() => undefined)
				};
			}

			// Default mock response
			return {
				textStream: (async function* () {
					yield 'mock';
					yield ' stream';
				})(),
				text: Promise.resolve('mock stream'),
				usage: Promise.resolve({ promptTokens: 10, completionTokens: 20 })
			};
		})
	};
});

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation(query => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}
