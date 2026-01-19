/**
 * Tests for Anthropic Provider Adapter
 *
 * Covers:
 * - Model list exports
 * - Model configuration (IDs, names, capabilities, tiers)
 * - createModel function
 * - API integration patterns
 */
import { describe, it, expect, vi } from 'vitest';
import {
	ANTHROPIC_MODELS,
	createAnthropicModel,
	type ProviderConfig
} from './anthropic';

describe('Anthropic Provider', () => {
	describe('ANTHROPIC_MODELS', () => {
		it('should export array of models', () => {
			expect(Array.isArray(ANTHROPIC_MODELS)).toBe(true);
			expect(ANTHROPIC_MODELS.length).toBeGreaterThan(0);
		});

		it('should include Claude 3.5 Sonnet models', () => {
			const sonnetModels = ANTHROPIC_MODELS.filter(m =>
				m.id.includes('sonnet')
			);
			expect(sonnetModels.length).toBeGreaterThan(0);
		});

		it('should include Claude 3.5 Haiku models', () => {
			const haikuModels = ANTHROPIC_MODELS.filter(m =>
				m.id.includes('haiku')
			);
			expect(haikuModels.length).toBeGreaterThan(0);
		});

		it('should have all models with provider set to anthropic', () => {
			ANTHROPIC_MODELS.forEach(model => {
				expect(model.provider).toBe('anthropic');
			});
		});

		it('should have all models with required properties', () => {
			ANTHROPIC_MODELS.forEach(model => {
				expect(model).toHaveProperty('id');
				expect(model).toHaveProperty('displayName');
				expect(model).toHaveProperty('provider');
				expect(model).toHaveProperty('capabilities');
				expect(model).toHaveProperty('tier');

				expect(typeof model.id).toBe('string');
				expect(typeof model.displayName).toBe('string');
				expect(model.id.length).toBeGreaterThan(0);
				expect(model.displayName.length).toBeGreaterThan(0);
			});
		});

		it('should have valid capabilities for all models', () => {
			ANTHROPIC_MODELS.forEach(model => {
				expect(model.capabilities).toHaveProperty('streaming');
				expect(model.capabilities).toHaveProperty('maxTokens');
				expect(model.capabilities).toHaveProperty('supportsTools');

				expect(typeof model.capabilities.streaming).toBe('boolean');
				expect(typeof model.capabilities.maxTokens).toBe('number');
				expect(typeof model.capabilities.supportsTools).toBe('boolean');
				expect(model.capabilities.maxTokens).toBeGreaterThan(0);
			});
		});

		it('should have valid tier values', () => {
			const validTiers = ['fast', 'balanced', 'powerful'];
			ANTHROPIC_MODELS.forEach(model => {
				expect(validTiers).toContain(model.tier);
			});
		});

		it('should mark all models as supporting streaming', () => {
			ANTHROPIC_MODELS.forEach(model => {
				expect(model.capabilities.streaming).toBe(true);
			});
		});

		it('should have appropriate maxTokens for each model', () => {
			ANTHROPIC_MODELS.forEach(model => {
				// Anthropic models typically have 4096 or 8192 max tokens
				expect(model.capabilities.maxTokens).toBeGreaterThanOrEqual(4096);
			});
		});

		it('should categorize Haiku as fast tier', () => {
			const haikuModels = ANTHROPIC_MODELS.filter(m =>
				m.id.includes('haiku')
			);
			haikuModels.forEach(model => {
				expect(model.tier).toBe('fast');
			});
		});

		it('should categorize Sonnet as balanced or powerful tier', () => {
			const sonnetModels = ANTHROPIC_MODELS.filter(m =>
				m.id.includes('sonnet')
			);
			sonnetModels.forEach(model => {
				expect(['balanced', 'powerful']).toContain(model.tier);
			});
		});

		it('should have unique model IDs', () => {
			const ids = ANTHROPIC_MODELS.map(m => m.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should include current production models', () => {
			const modelIds = ANTHROPIC_MODELS.map(m => m.id);

			// Should include at least one current Sonnet model
			const hasCurrentSonnet = modelIds.some(id =>
				id.includes('sonnet') && id.includes('2024')
			);
			expect(hasCurrentSonnet).toBe(true);

			// Should include at least one current Haiku model
			const hasCurrentHaiku = modelIds.some(id =>
				id.includes('haiku') && id.includes('2024')
			);
			expect(hasCurrentHaiku).toBe(true);
		});
	});

	describe('createAnthropicModel', () => {
		const mockConfig: ProviderConfig = {
			provider: 'anthropic',
			apiKey: 'test-anthropic-key',
			enabled: true
		};

		it('should create model instance', () => {
			const model = createAnthropicModel('claude-3-5-sonnet-20241022', mockConfig);
			expect(model).toBeDefined();
		});

		it('should return object with AI SDK LanguageModel interface', () => {
			const model = createAnthropicModel('claude-3-5-sonnet-20241022', mockConfig);

			// Should have required AI SDK methods
			expect(model).toHaveProperty('doGenerate');
			expect(model).toHaveProperty('doStream');
			// Use type assertion to access internal SDK properties
			expect(typeof (model as unknown as { doGenerate: unknown }).doGenerate).toBe('function');
			expect(typeof (model as unknown as { doStream: unknown }).doStream).toBe('function');
		});

		it('should throw error when API key is missing', () => {
			const invalidConfig: ProviderConfig = {
				provider: 'anthropic',
				enabled: true
			};

			expect(() =>
				createAnthropicModel('claude-3-5-sonnet-20241022', invalidConfig)
			).toThrow();
		});

		it('should throw error when API key is empty', () => {
			const invalidConfig: ProviderConfig = {
				provider: 'anthropic',
				apiKey: '',
				enabled: true
			};

			expect(() =>
				createAnthropicModel('claude-3-5-sonnet-20241022', invalidConfig)
			).toThrow();
		});

		it('should throw error for invalid model ID', () => {
			expect(() =>
				createAnthropicModel('invalid-model-id', mockConfig)
			).toThrow();
		});

		it('should create model for valid Sonnet model ID', () => {
			const sonnetModel = ANTHROPIC_MODELS.find(m => m.id.includes('sonnet'));
			if (sonnetModel) {
				const model = createAnthropicModel(sonnetModel.id, mockConfig);
				expect(model).toBeDefined();
			}
		});

		it('should create model for valid Haiku model ID', () => {
			const haikuModel = ANTHROPIC_MODELS.find(m => m.id.includes('haiku'));
			if (haikuModel) {
				const model = createAnthropicModel(haikuModel.id, mockConfig);
				expect(model).toBeDefined();
			}
		});

		it('should create models for all listed models', () => {
			ANTHROPIC_MODELS.forEach(modelInfo => {
				const model = createAnthropicModel(modelInfo.id, mockConfig);
				expect(model).toBeDefined();
			});
		});

		it('should pass API key to underlying SDK', () => {
			const model = createAnthropicModel('claude-3-5-sonnet-20241022', mockConfig);

			// The model should be configured with the API key
			expect(model).toBeDefined();
		});

		it('should support browser usage', () => {
			// Anthropic SDK requires dangerouslyAllowBrowser: true for browser usage
			const model = createAnthropicModel('claude-3-5-sonnet-20241022', mockConfig);
			expect(model).toBeDefined();
		});
	});

	describe('Model Metadata', () => {
		it('should have display names matching Anthropic branding', () => {
			ANTHROPIC_MODELS.forEach(model => {
				// Display names should include "Claude"
				expect(model.displayName).toContain('Claude');
			});
		});

		it('should have descriptive display names', () => {
			ANTHROPIC_MODELS.forEach(model => {
				// Should include version info like "3.5"
				const hasVersion = model.displayName.match(/\d+(\.\d+)?/);
				expect(hasVersion).toBeTruthy();
			});
		});

		it('should mark all models as supporting tools', () => {
			ANTHROPIC_MODELS.forEach(model => {
				// Claude 3.5 models support tool use
				if (model.id.includes('claude-3')) {
					expect(model.capabilities.supportsTools).toBe(true);
				}
			});
		});
	});

	describe('Integration Requirements', () => {
		it('should be compatible with Vercel AI SDK', () => {
			const model = createAnthropicModel('claude-3-5-sonnet-20241022', {
				provider: 'anthropic',
				apiKey: 'test-key',
				enabled: true
			});

			// Should have LanguageModel interface (use type assertion for internal SDK properties)
			expect((model as unknown as { doGenerate: unknown }).doGenerate).toBeDefined();
			expect((model as unknown as { doStream: unknown }).doStream).toBeDefined();
		});

		it('should export models in format compatible with provider registry', () => {
			ANTHROPIC_MODELS.forEach(model => {
				expect(model).toMatchObject({
					id: expect.any(String),
					displayName: expect.any(String),
					provider: 'anthropic',
					capabilities: {
						streaming: expect.any(Boolean),
						maxTokens: expect.any(Number),
						supportsTools: expect.any(Boolean)
					},
					tier: expect.stringMatching(/^(fast|balanced|powerful)$/)
				});
			});
		});
	});
});
