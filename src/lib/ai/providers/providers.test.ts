/**
 * Tests for Additional AI Provider Adapters
 *
 * Covers Google Gemini, Mistral, and Ollama providers:
 * - Model list exports
 * - Model configuration
 * - createModel functions
 * - Provider-specific requirements
 */
import { describe, it, expect } from 'vitest';

// These imports will fail until the providers are implemented
// This is expected behavior for RED phase TDD
import {
	GOOGLE_MODELS,
	createGoogleModel,
	type ProviderConfig as GoogleConfig
} from './google';
import {
	MISTRAL_MODELS,
	createMistralModel,
	type ProviderConfig as MistralConfig
} from './mistral';
import {
	OLLAMA_MODELS,
	createOllamaModel,
	type ProviderConfig as OllamaConfig
} from './ollama';

describe('Google Gemini Provider', () => {
	describe('GOOGLE_MODELS', () => {
		it('should export array of models', () => {
			expect(Array.isArray(GOOGLE_MODELS)).toBe(true);
			expect(GOOGLE_MODELS.length).toBeGreaterThan(0);
		});

		it('should include Gemini models', () => {
			const geminiModels = GOOGLE_MODELS.filter(m =>
				m.id.includes('gemini')
			);
			expect(geminiModels.length).toBeGreaterThan(0);
		});

		it('should have all models with provider set to google', () => {
			GOOGLE_MODELS.forEach(model => {
				expect(model.provider).toBe('google');
			});
		});

		it('should have required properties', () => {
			GOOGLE_MODELS.forEach(model => {
				expect(model).toHaveProperty('id');
				expect(model).toHaveProperty('displayName');
				expect(model).toHaveProperty('provider');
				expect(model).toHaveProperty('capabilities');
				expect(model).toHaveProperty('tier');
			});
		});

		it('should have valid capabilities', () => {
			GOOGLE_MODELS.forEach(model => {
				expect(model.capabilities).toHaveProperty('streaming');
				expect(model.capabilities).toHaveProperty('maxTokens');
				expect(model.capabilities).toHaveProperty('supportsTools');
			});
		});

		it('should include Gemini Pro models', () => {
			const hasProModel = GOOGLE_MODELS.some(m =>
				m.id.includes('pro')
			);
			expect(hasProModel).toBe(true);
		});

		it('should include Gemini Flash models', () => {
			const hasFlashModel = GOOGLE_MODELS.some(m =>
				m.id.includes('flash')
			);
			expect(hasFlashModel).toBe(true);
		});

		it('should categorize Flash as fast tier', () => {
			const flashModels = GOOGLE_MODELS.filter(m =>
				m.id.includes('flash')
			);
			flashModels.forEach(model => {
				expect(model.tier).toBe('fast');
			});
		});

		it('should categorize Pro as balanced or powerful', () => {
			const proModels = GOOGLE_MODELS.filter(m =>
				m.id.includes('pro') && !m.id.includes('flash')
			);
			proModels.forEach(model => {
				expect(['balanced', 'powerful']).toContain(model.tier);
			});
		});
	});

	describe('createGoogleModel', () => {
		const mockConfig: GoogleConfig = {
			provider: 'google',
			apiKey: 'test-google-key',
			enabled: true
		};

		it('should create model instance', () => {
			const model = createGoogleModel('gemini-1.5-pro', mockConfig);
			expect(model).toBeDefined();
		});

		it('should return object with AI SDK LanguageModel interface', () => {
			const model = createGoogleModel('gemini-1.5-pro', mockConfig);

			expect(model).toHaveProperty('doGenerate');
			expect(model).toHaveProperty('doStream');
		});

		it('should throw error when API key is missing', () => {
			const invalidConfig: GoogleConfig = {
				provider: 'google',
				enabled: true
			};

			expect(() =>
				createGoogleModel('gemini-1.5-pro', invalidConfig)
			).toThrow();
		});

		it('should create models for all listed models', () => {
			GOOGLE_MODELS.forEach(modelInfo => {
				const model = createGoogleModel(modelInfo.id, mockConfig);
				expect(model).toBeDefined();
			});
		});
	});
});

describe('Mistral Provider', () => {
	describe('MISTRAL_MODELS', () => {
		it('should export array of models', () => {
			expect(Array.isArray(MISTRAL_MODELS)).toBe(true);
			expect(MISTRAL_MODELS.length).toBeGreaterThan(0);
		});

		it('should include Mistral models', () => {
			const mistralModels = MISTRAL_MODELS.filter(m =>
				m.id.includes('mistral')
			);
			expect(mistralModels.length).toBeGreaterThan(0);
		});

		it('should have all models with provider set to mistral', () => {
			MISTRAL_MODELS.forEach(model => {
				expect(model.provider).toBe('mistral');
			});
		});

		it('should have required properties', () => {
			MISTRAL_MODELS.forEach(model => {
				expect(model).toHaveProperty('id');
				expect(model).toHaveProperty('displayName');
				expect(model).toHaveProperty('provider');
				expect(model).toHaveProperty('capabilities');
				expect(model).toHaveProperty('tier');
			});
		});

		it('should have valid capabilities', () => {
			MISTRAL_MODELS.forEach(model => {
				expect(model.capabilities).toHaveProperty('streaming');
				expect(model.capabilities).toHaveProperty('maxTokens');
				expect(model.capabilities).toHaveProperty('supportsTools');
			});
		});

		it('should include Mistral Large model', () => {
			const hasLarge = MISTRAL_MODELS.some(m =>
				m.id.includes('large')
			);
			expect(hasLarge).toBe(true);
		});

		it('should include Mistral Small or Medium models', () => {
			const hasSmallerModel = MISTRAL_MODELS.some(m =>
				m.id.includes('small') || m.id.includes('medium')
			);
			expect(hasSmallerModel).toBe(true);
		});

		it('should categorize models by tier appropriately', () => {
			MISTRAL_MODELS.forEach(model => {
				expect(['fast', 'balanced', 'powerful']).toContain(model.tier);
			});
		});
	});

	describe('createMistralModel', () => {
		const mockConfig: MistralConfig = {
			provider: 'mistral',
			apiKey: 'test-mistral-key',
			enabled: true
		};

		it('should create model instance', () => {
			const model = createMistralModel('mistral-large-latest', mockConfig);
			expect(model).toBeDefined();
		});

		it('should return object with AI SDK LanguageModel interface', () => {
			const model = createMistralModel('mistral-large-latest', mockConfig);

			expect(model).toHaveProperty('doGenerate');
			expect(model).toHaveProperty('doStream');
		});

		it('should throw error when API key is missing', () => {
			const invalidConfig: MistralConfig = {
				provider: 'mistral',
				enabled: true
			};

			expect(() =>
				createMistralModel('mistral-large-latest', invalidConfig)
			).toThrow();
		});

		it('should create models for all listed models', () => {
			MISTRAL_MODELS.forEach(modelInfo => {
				const model = createMistralModel(modelInfo.id, mockConfig);
				expect(model).toBeDefined();
			});
		});
	});
});

describe('Ollama Provider', () => {
	describe('OLLAMA_MODELS', () => {
		it('should export array of models', () => {
			expect(Array.isArray(OLLAMA_MODELS)).toBe(true);
			expect(OLLAMA_MODELS.length).toBeGreaterThan(0);
		});

		it('should have all models with provider set to ollama', () => {
			OLLAMA_MODELS.forEach(model => {
				expect(model.provider).toBe('ollama');
			});
		});

		it('should have required properties', () => {
			OLLAMA_MODELS.forEach(model => {
				expect(model).toHaveProperty('id');
				expect(model).toHaveProperty('displayName');
				expect(model).toHaveProperty('provider');
				expect(model).toHaveProperty('capabilities');
				expect(model).toHaveProperty('tier');
			});
		});

		it('should have valid capabilities', () => {
			OLLAMA_MODELS.forEach(model => {
				expect(model.capabilities).toHaveProperty('streaming');
				expect(model.capabilities).toHaveProperty('maxTokens');
				expect(model.capabilities).toHaveProperty('supportsTools');
			});
		});

		it('should include popular local models', () => {
			const modelIds = OLLAMA_MODELS.map(m => m.id);

			// Should include at least one popular model
			const hasPopularModel = modelIds.some(id =>
				id.includes('llama') ||
				id.includes('mistral') ||
				id.includes('phi') ||
				id.includes('gemma')
			);
			expect(hasPopularModel).toBe(true);
		});

		it('should include Llama models', () => {
			const hasLlama = OLLAMA_MODELS.some(m =>
				m.id.includes('llama')
			);
			expect(hasLlama).toBe(true);
		});

		it('should categorize smaller models as fast', () => {
			const smallModels = OLLAMA_MODELS.filter(m =>
				m.id.includes('7b') || m.id.includes('3b')
			);
			if (smallModels.length > 0) {
				smallModels.forEach(model => {
					expect(model.tier).toBe('fast');
				});
			}
		});

		it('should categorize larger models appropriately', () => {
			const largeModels = OLLAMA_MODELS.filter(m =>
				m.id.includes('70b') || m.id.includes('34b')
			);
			if (largeModels.length > 0) {
				largeModels.forEach(model => {
					expect(['balanced', 'powerful']).toContain(model.tier);
				});
			}
		});
	});

	describe('createOllamaModel', () => {
		const mockConfig: OllamaConfig = {
			provider: 'ollama',
			baseUrl: 'http://localhost:11434',
			enabled: true
		};

		it('should create model instance with baseUrl', () => {
			const model = createOllamaModel('llama3', mockConfig);
			expect(model).toBeDefined();
		});

		it('should return object with AI SDK LanguageModel interface', () => {
			const model = createOllamaModel('llama3', mockConfig);

			expect(model).toHaveProperty('doGenerate');
			expect(model).toHaveProperty('doStream');
		});

		it('should throw error when baseUrl is missing', () => {
			const invalidConfig: OllamaConfig = {
				provider: 'ollama',
				enabled: true
			};

			expect(() =>
				createOllamaModel('llama3', invalidConfig)
			).toThrow();
		});

		it('should accept custom baseUrl', () => {
			const customConfig: OllamaConfig = {
				provider: 'ollama',
				baseUrl: 'http://192.168.1.100:11434',
				enabled: true
			};

			const model = createOllamaModel('llama3', customConfig);
			expect(model).toBeDefined();
		});

		it('should create models for all listed models', () => {
			OLLAMA_MODELS.forEach(modelInfo => {
				const model = createOllamaModel(modelInfo.id, mockConfig);
				expect(model).toBeDefined();
			});
		});

		it('should not require API key', () => {
			const config: OllamaConfig = {
				provider: 'ollama',
				baseUrl: 'http://localhost:11434',
				enabled: true
				// No apiKey property
			};

			expect(() =>
				createOllamaModel('llama3', config)
			).not.toThrow();
		});

		it('should handle baseUrl with trailing slash', () => {
			const configWithSlash: OllamaConfig = {
				provider: 'ollama',
				baseUrl: 'http://localhost:11434/',
				enabled: true
			};

			const model = createOllamaModel('llama3', configWithSlash);
			expect(model).toBeDefined();
		});
	});

	describe('Local Model Characteristics', () => {
		it('should mark all models as supporting streaming', () => {
			OLLAMA_MODELS.forEach(model => {
				expect(model.capabilities.streaming).toBe(true);
			});
		});

		it('should have reasonable maxTokens for local models', () => {
			OLLAMA_MODELS.forEach(model => {
				// Local models typically have 2048-4096 context
				expect(model.capabilities.maxTokens).toBeGreaterThan(0);
				expect(model.capabilities.maxTokens).toBeLessThanOrEqual(32768);
			});
		});
	});
});

describe('Cross-Provider Consistency', () => {
	it('should have consistent model info structure across all providers', () => {
		const allModels = [
			...GOOGLE_MODELS,
			...MISTRAL_MODELS,
			...OLLAMA_MODELS
		];

		allModels.forEach(model => {
			expect(model).toMatchObject({
				id: expect.any(String),
				displayName: expect.any(String),
				provider: expect.stringMatching(/^(google|mistral|ollama)$/),
				capabilities: {
					streaming: expect.any(Boolean),
					maxTokens: expect.any(Number),
					supportsTools: expect.any(Boolean)
				},
				tier: expect.stringMatching(/^(fast|balanced|powerful)$/)
			});
		});
	});

	it('should have unique model IDs per provider', () => {
		const providers = [
			{ name: 'google', models: GOOGLE_MODELS },
			{ name: 'mistral', models: MISTRAL_MODELS },
			{ name: 'ollama', models: OLLAMA_MODELS }
		];

		providers.forEach(({ name, models }) => {
			const ids = models.map(m => m.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});
	});

	it('should have non-empty display names', () => {
		const allModels = [
			...GOOGLE_MODELS,
			...MISTRAL_MODELS,
			...OLLAMA_MODELS
		];

		allModels.forEach(model => {
			expect(model.displayName).toBeTruthy();
			expect(model.displayName.length).toBeGreaterThan(0);
		});
	});
});
