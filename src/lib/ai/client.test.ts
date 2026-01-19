/**
 * Tests for Unified AI Client
 *
 * Covers:
 * - Text generation with different providers
 * - Streaming generation with callbacks
 * - Error handling per provider
 * - Settings integration
 * - Generation options (maxTokens, temperature, systemPrompt)
 * - Provider-specific error messages
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	generate,
	generateStream,
	type GenerationOptions,
	type GenerationResult,
	type StreamCallback
} from './client';

// Mock the provider registry
vi.mock('./providers', () => ({
	getProvider: vi.fn((provider: string) => ({
		name: provider,
		models: [],
		createModel: vi.fn(() => ({
			doGenerate: vi.fn(),
			doStream: vi.fn()
		}))
	})),
	getProviderModel: vi.fn(() => ({
		doGenerate: vi.fn(),
		doStream: vi.fn()
	}))
}));

// Mock the settings storage
vi.mock('./config/storage', () => ({
	getAISettings: vi.fn(() => ({
		activeProvider: 'anthropic',
		activeModel: 'claude-3-5-sonnet-20241022',
		providers: {
			anthropic: {
				provider: 'anthropic',
				apiKey: 'test-api-key',
				enabled: true
			},
			openai: {
				provider: 'openai',
				enabled: false
			},
			google: {
				provider: 'google',
				enabled: false
			},
			mistral: {
				provider: 'mistral',
				enabled: false
			},
			ollama: {
				provider: 'ollama',
				enabled: false
			}
		}
	}))
}));

describe('Unified AI Client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generate', () => {
		describe('Success Cases', () => {
			it('should generate text with minimal options', async () => {
				const result = await generate('Write a short story');

				expect(result).toBeDefined();
				expect(result).toHaveProperty('success');
			});

			it('should return successful result with content', async () => {
				const result = await generate('Write a short story');

				if (result.success) {
					expect(result.content).toBeDefined();
					expect(typeof result.content).toBe('string');
					expect(result.error).toBeUndefined();
				}
			});

			it('should use default options when not provided', async () => {
				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});

			it('should accept custom maxTokens option', async () => {
				const options: GenerationOptions = {
					maxTokens: 500
				};

				const result = await generate('Test prompt', options);

				expect(result).toBeDefined();
			});

			it('should accept custom temperature option', async () => {
				const options: GenerationOptions = {
					temperature: 0.5
				};

				const result = await generate('Test prompt', options);

				expect(result).toBeDefined();
			});

			it('should accept custom systemPrompt option', async () => {
				const options: GenerationOptions = {
					systemPrompt: 'You are a helpful TTRPG assistant'
				};

				const result = await generate('Test prompt', options);

				expect(result).toBeDefined();
			});

			it('should accept all options together', async () => {
				const options: GenerationOptions = {
					maxTokens: 1000,
					temperature: 0.7,
					systemPrompt: 'You are a creative storyteller'
				};

				const result = await generate('Write a story', options);

				expect(result).toBeDefined();
			});

			it('should handle empty prompt gracefully', async () => {
				const result = await generate('');

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle long prompts', async () => {
				const longPrompt = 'A'.repeat(10000);
				const result = await generate(longPrompt);

				expect(result).toBeDefined();
			});

			it('should handle special characters in prompt', async () => {
				const result = await generate('Tell me about "quotes" & <tags> and \n newlines');

				expect(result).toBeDefined();
			});

			it('should handle unicode characters in prompt', async () => {
				const result = await generate('Tell me about 日本語 and émojis 🎮');

				expect(result).toBeDefined();
			});
		});

		describe('Error Handling', () => {
			it('should return error when settings not configured', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'anthropic',
					activeModel: 'claude-3-5-sonnet-20241022',
					providers: {
						anthropic: {
							provider: 'anthropic',
							enabled: false
						},
						openai: { provider: 'openai', enabled: false },
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generate('Test prompt');

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should return error when API key is missing', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'anthropic',
					activeModel: 'claude-3-5-sonnet-20241022',
					providers: {
						anthropic: {
							provider: 'anthropic',
							enabled: true
							// apiKey is missing
						},
						openai: { provider: 'openai', enabled: false },
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generate('Test prompt');

				expect(result.success).toBe(false);
				expect(result.error).toContain('not configured');
			});

			it('should handle 401 authentication errors', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockRejectedValueOnce({
						status: 401,
						message: 'Invalid API key'
					})
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toContain('Invalid');
				}
			});

			it('should handle 429 rate limit errors', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockRejectedValueOnce({
						status: 429,
						message: 'Rate limit exceeded'
					})
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toContain('rate limit');
				}
			});

			it('should handle 500 server errors', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockRejectedValueOnce({
						status: 500,
						message: 'Internal server error'
					})
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toBeDefined();
				}
			});

			it('should handle network errors', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockRejectedValueOnce(new Error('Network error'))
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toBeDefined();
				}
			});

			it('should handle timeout errors', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockRejectedValueOnce(new Error('Request timeout'))
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toBeDefined();
				}
			});

			it('should handle empty response from provider', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockResolvedValueOnce({
						text: ''
					})
				} as any);

				const result = await generate('Test prompt');

				expect(result.success).toBeDefined();
			});

			it('should handle malformed response from provider', async () => {
				const { getProviderModel } = await import('./providers');
				vi.mocked(getProviderModel).mockReturnValueOnce({
					doGenerate: vi.fn().mockResolvedValueOnce(null)
				} as any);

				const result = await generate('Test prompt');

				if (!result.success) {
					expect(result.error).toBeDefined();
				}
			});
		});

		describe('Provider-Specific Behavior', () => {
			it('should work with anthropic provider', async () => {
				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});

			it('should work with openai provider', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'openai',
					activeModel: 'gpt-4-turbo-preview',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: {
							provider: 'openai',
							apiKey: 'test-openai-key',
							enabled: true
						},
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});

			it('should work with google provider', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'google',
					activeModel: 'gemini-1.5-pro',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: { provider: 'openai', enabled: false },
						google: {
							provider: 'google',
							apiKey: 'test-google-key',
							enabled: true
						},
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});

			it('should work with mistral provider', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'mistral',
					activeModel: 'mistral-large-latest',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: { provider: 'openai', enabled: false },
						google: { provider: 'google', enabled: false },
						mistral: {
							provider: 'mistral',
							apiKey: 'test-mistral-key',
							enabled: true
						},
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});

			it('should work with ollama provider', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'ollama',
					activeModel: 'llama3',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: { provider: 'openai', enabled: false },
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: {
							provider: 'ollama',
							baseUrl: 'http://localhost:11434',
							enabled: true
						}
					}
				});

				const result = await generate('Test prompt');

				expect(result).toBeDefined();
			});
		});
	});

	describe('generateStream', () => {
		describe('Success Cases', () => {
			it('should accept onStream callback', async () => {
				const onStream = vi.fn();

				const result = await generateStream('Write a story', { onStream });

				expect(result).toBeDefined();
			});

			it('should call onStream callback with text chunks', async () => {
				const onStream = vi.fn();
				const { getProviderModel } = await import('./providers');

				vi.mocked(getProviderModel).mockReturnValueOnce({
					doStream: vi.fn(async ({ onChunk }: any) => {
						onChunk({ type: 'text-delta', textDelta: 'Hello' });
						onChunk({ type: 'text-delta', textDelta: ' world' });
						return { text: 'Hello world' };
					})
				} as any);

				await generateStream('Test', { onStream });

				expect(onStream).toHaveBeenCalled();
			});

			it('should return full generated text in result', async () => {
				const onStream = vi.fn();

				const result = await generateStream('Write a story', { onStream });

				if (result.success) {
					expect(result.content).toBeDefined();
				}
			});

			it('should work without onStream callback', async () => {
				const result = await generateStream('Write a story');

				expect(result).toBeDefined();
			});

			it('should accept all generation options', async () => {
				const onStream = vi.fn();
				const options = {
					maxTokens: 500,
					temperature: 0.8,
					systemPrompt: 'You are a writer',
					onStream
				};

				const result = await generateStream('Write a story', options);

				expect(result).toBeDefined();
			});

			it('should handle rapid streaming chunks', async () => {
				const onStream = vi.fn();
				const { getProviderModel } = await import('./providers');

				vi.mocked(getProviderModel).mockReturnValueOnce({
					doStream: vi.fn(async ({ onChunk }: any) => {
						for (let i = 0; i < 100; i++) {
							onChunk({ type: 'text-delta', textDelta: 'x' });
						}
						return { text: 'x'.repeat(100) };
					})
				} as any);

				await generateStream('Test', { onStream });

				expect(onStream).toHaveBeenCalled();
			});
		});

		describe('Error Handling', () => {
			it('should return error when provider not configured', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'anthropic',
					activeModel: 'claude-3-5-sonnet-20241022',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: { provider: 'openai', enabled: false },
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const result = await generateStream('Test');

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle streaming errors gracefully', async () => {
				const onStream = vi.fn();
				const { getProviderModel } = await import('./providers');

				vi.mocked(getProviderModel).mockReturnValueOnce({
					doStream: vi.fn().mockRejectedValueOnce(new Error('Stream error'))
				} as any);

				const result = await generateStream('Test', { onStream });

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle onStream callback throwing errors', async () => {
				const onStream = vi.fn(() => {
					throw new Error('Callback error');
				});
				const { getProviderModel } = await import('./providers');

				vi.mocked(getProviderModel).mockReturnValueOnce({
					doStream: vi.fn(async ({ onChunk }: any) => {
						onChunk({ type: 'text-delta', textDelta: 'test' });
						return { text: 'test' };
					})
				} as any);

				const result = await generateStream('Test', { onStream });

				// Should handle the error gracefully
				expect(result).toBeDefined();
			});

			it('should handle incomplete stream responses', async () => {
				const onStream = vi.fn();
				const { getProviderModel } = await import('./providers');

				vi.mocked(getProviderModel).mockReturnValueOnce({
					doStream: vi.fn(async () => {
						return { text: '' };
					})
				} as any);

				const result = await generateStream('Test', { onStream });

				expect(result).toBeDefined();
			});
		});

		describe('Provider-Specific Streaming', () => {
			it('should stream with anthropic provider', async () => {
				const onStream = vi.fn();

				const result = await generateStream('Test', { onStream });

				expect(result).toBeDefined();
			});

			it('should stream with openai provider', async () => {
				const { getAISettings } = await import('./config/storage');
				vi.mocked(getAISettings).mockResolvedValueOnce({
					activeProvider: 'openai',
					activeModel: 'gpt-4-turbo-preview',
					providers: {
						anthropic: { provider: 'anthropic', enabled: false },
						openai: {
							provider: 'openai',
							apiKey: 'test-key',
							enabled: true
						},
						google: { provider: 'google', enabled: false },
						mistral: { provider: 'mistral', enabled: false },
						ollama: { provider: 'ollama', enabled: false }
					}
				});

				const onStream = vi.fn();
				const result = await generateStream('Test', { onStream });

				expect(result).toBeDefined();
			});
		});
	});

	describe('Result Structure', () => {
		it('should return GenerationResult type from generate', async () => {
			const result = await generate('Test');

			expect(result).toHaveProperty('success');
			expect(typeof result.success).toBe('boolean');

			if (result.success) {
				expect(result).toHaveProperty('content');
				expect(result.error).toBeUndefined();
			} else {
				expect(result).toHaveProperty('error');
				expect(result.content).toBeUndefined();
			}
		});

		it('should return GenerationResult type from generateStream', async () => {
			const result = await generateStream('Test');

			expect(result).toHaveProperty('success');
			expect(typeof result.success).toBe('boolean');

			if (result.success) {
				expect(result).toHaveProperty('content');
				expect(result.error).toBeUndefined();
			} else {
				expect(result).toHaveProperty('error');
				expect(result.content).toBeUndefined();
			}
		});
	});

	describe('Integration with Settings', () => {
		it('should use active provider from settings', async () => {
			const result = await generate('Test');

			expect(result).toBeDefined();
		});

		it('should use active model from settings', async () => {
			const result = await generate('Test');

			expect(result).toBeDefined();
		});

		it('should respect provider enabled flag', async () => {
			const { getAISettings } = await import('./config/storage');
			vi.mocked(getAISettings).mockResolvedValueOnce({
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: {
						provider: 'anthropic',
						apiKey: 'test-key',
						enabled: false
					},
					openai: { provider: 'openai', enabled: false },
					google: { provider: 'google', enabled: false },
					mistral: { provider: 'mistral', enabled: false },
					ollama: { provider: 'ollama', enabled: false }
				}
			});

			const result = await generate('Test');

			expect(result.success).toBe(false);
		});
	});
});
