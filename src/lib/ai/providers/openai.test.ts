/**
 * Tests for OpenAI Provider Adapter
 *
 * Covers:
 * - Model list exports
 * - Model configuration (IDs, names, capabilities, tiers)
 * - createModel function
 * - GPT-4, GPT-3.5 model support
 */
import { describe, it, expect } from 'vitest';
import {
	OPENAI_MODELS,
	createOpenAIModel,
	type ProviderConfig
} from './openai';

describe('OpenAI Provider', () => {
	describe('OPENAI_MODELS', () => {
		it('should export array of models', () => {
			expect(Array.isArray(OPENAI_MODELS)).toBe(true);
			expect(OPENAI_MODELS.length).toBeGreaterThan(0);
		});

		it('should include GPT-4 models', () => {
			const gpt4Models = OPENAI_MODELS.filter(m =>
				m.id.includes('gpt-4')
			);
			expect(gpt4Models.length).toBeGreaterThan(0);
		});

		it('should include GPT-3.5 models', () => {
			const gpt35Models = OPENAI_MODELS.filter(m =>
				m.id.includes('gpt-3.5')
			);
			expect(gpt35Models.length).toBeGreaterThan(0);
		});

		it('should have all models with provider set to openai', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model.provider).toBe('openai');
			});
		});

		it('should have all models with required properties', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model).toHaveProperty('id');
				expect(model).toHaveProperty('displayName');
				expect(model).toHaveProperty('provider');
				expect(model).toHaveProperty('capabilities');
				expect(model).toHaveProperty('tier');

				expect(typeof model.id).toBe('string');
				expect(typeof model.displayName).toBe('string');
			});
		});

		it('should have valid capabilities', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model.capabilities).toHaveProperty('streaming');
				expect(model.capabilities).toHaveProperty('maxTokens');
				expect(model.capabilities).toHaveProperty('supportsTools');

				expect(typeof model.capabilities.streaming).toBe('boolean');
				expect(typeof model.capabilities.maxTokens).toBe('number');
				expect(typeof model.capabilities.supportsTools).toBe('boolean');
			});
		});

		it('should categorize GPT-3.5 as fast tier', () => {
			const gpt35Models = OPENAI_MODELS.filter(m =>
				m.id.includes('gpt-3.5')
			);
			gpt35Models.forEach(model => {
				expect(model.tier).toBe('fast');
			});
		});

		it('should categorize GPT-4 Turbo as balanced or powerful', () => {
			const gpt4TurboModels = OPENAI_MODELS.filter(m =>
				m.id.includes('gpt-4') && m.id.includes('turbo')
			);
			if (gpt4TurboModels.length > 0) {
				gpt4TurboModels.forEach(model => {
					expect(['balanced', 'powerful']).toContain(model.tier);
				});
			}
		});

		it('should have unique model IDs', () => {
			const ids = OPENAI_MODELS.map(m => m.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should mark all models as supporting streaming', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model.capabilities.streaming).toBe(true);
			});
		});

		it('should have appropriate maxTokens for each model', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model.capabilities.maxTokens).toBeGreaterThan(0);
			});
		});
	});

	describe('createOpenAIModel', () => {
		const mockConfig: ProviderConfig = {
			provider: 'openai',
			apiKey: 'test-openai-key',
			enabled: true
		};

		it('should create model instance', () => {
			const model = createOpenAIModel('gpt-4-turbo-preview', mockConfig);
			expect(model).toBeDefined();
		});

		it('should return object with AI SDK LanguageModel interface', () => {
			const model = createOpenAIModel('gpt-4-turbo-preview', mockConfig);

			expect(model).toHaveProperty('doGenerate');
			expect(model).toHaveProperty('doStream');
			// Use type assertion to access internal SDK properties
			expect(typeof (model as unknown as { doGenerate: unknown }).doGenerate).toBe('function');
			expect(typeof (model as unknown as { doStream: unknown }).doStream).toBe('function');
		});

		it('should throw error when API key is missing', () => {
			const invalidConfig: ProviderConfig = {
				provider: 'openai',
				enabled: true
			};

			expect(() =>
				createOpenAIModel('gpt-4-turbo-preview', invalidConfig)
			).toThrow();
		});

		it('should throw error for invalid model ID', () => {
			expect(() =>
				createOpenAIModel('invalid-model', mockConfig)
			).toThrow();
		});

		it('should create models for all listed models', () => {
			OPENAI_MODELS.forEach(modelInfo => {
				const model = createOpenAIModel(modelInfo.id, mockConfig);
				expect(model).toBeDefined();
			});
		});
	});

	describe('Model Metadata', () => {
		it('should have display names matching OpenAI branding', () => {
			OPENAI_MODELS.forEach(model => {
				expect(model.displayName).toContain('GPT');
			});
		});

		it('should mark newer models as supporting tools', () => {
			const gpt4Models = OPENAI_MODELS.filter(m =>
				m.id.includes('gpt-4')
			);
			gpt4Models.forEach(model => {
				expect(model.capabilities.supportsTools).toBe(true);
			});
		});
	});
});
