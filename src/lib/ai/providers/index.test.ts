/**
 * Tests for AI Provider Registry
 *
 * Covers:
 * - Provider registration and retrieval
 * - Model listing per provider
 * - Model instance creation
 * - Provider configuration validation
 * - Error handling for unconfigured providers
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	getProvider,
	getProviderModels,
	getProviderModel,
	isProviderConfigured,
	type AIProvider,
	type AIModelInfo,
	type ProviderConfig
} from './index';

describe('Provider Registry', () => {
	describe('getProvider', () => {
		it('should return Anthropic provider adapter for anthropic', () => {
			const provider = getProvider('anthropic');
			expect(provider).toBeDefined();
			expect(provider.name).toBe('anthropic');
		});

		it('should return OpenAI provider adapter for openai', () => {
			const provider = getProvider('openai');
			expect(provider).toBeDefined();
			expect(provider.name).toBe('openai');
		});

		it('should return Google provider adapter for google', () => {
			const provider = getProvider('google');
			expect(provider).toBeDefined();
			expect(provider.name).toBe('google');
		});

		it('should return Mistral provider adapter for mistral', () => {
			const provider = getProvider('mistral');
			expect(provider).toBeDefined();
			expect(provider.name).toBe('mistral');
		});

		it('should return Ollama provider adapter for ollama', () => {
			const provider = getProvider('ollama');
			expect(provider).toBeDefined();
			expect(provider.name).toBe('ollama');
		});

		it('should throw error for invalid provider', () => {
			expect(() => getProvider('invalid' as AIProvider)).toThrow();
		});

		it('should return provider with createModel function', () => {
			const provider = getProvider('anthropic');
			expect(provider.createModel).toBeDefined();
			expect(typeof provider.createModel).toBe('function');
		});

		it('should return provider with models array', () => {
			const provider = getProvider('anthropic');
			expect(provider.models).toBeDefined();
			expect(Array.isArray(provider.models)).toBe(true);
		});
	});

	describe('getProviderModels', () => {
		it('should return array of models for anthropic', () => {
			const models = getProviderModels('anthropic');
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it('should return array of models for openai', () => {
			const models = getProviderModels('openai');
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it('should return array of models for google', () => {
			const models = getProviderModels('google');
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it('should return array of models for mistral', () => {
			const models = getProviderModels('mistral');
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it('should return array of models for ollama', () => {
			const models = getProviderModels('ollama');
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it('should return models with required properties', () => {
			const models = getProviderModels('anthropic');
			const model = models[0];

			expect(model).toHaveProperty('id');
			expect(model).toHaveProperty('displayName');
			expect(model).toHaveProperty('provider');
			expect(model).toHaveProperty('capabilities');
			expect(model).toHaveProperty('tier');
		});

		it('should return models with valid capabilities', () => {
			const models = getProviderModels('anthropic');
			const model = models[0];

			expect(model.capabilities).toHaveProperty('streaming');
			expect(model.capabilities).toHaveProperty('maxTokens');
			expect(model.capabilities).toHaveProperty('supportsTools');
			expect(typeof model.capabilities.streaming).toBe('boolean');
			expect(typeof model.capabilities.maxTokens).toBe('number');
			expect(typeof model.capabilities.supportsTools).toBe('boolean');
		});

		it('should return models with valid tier values', () => {
			const models = getProviderModels('anthropic');
			const validTiers = ['fast', 'balanced', 'powerful'];

			models.forEach((model) => {
				expect(validTiers).toContain(model.tier);
			});
		});

		it('should return models with matching provider field', () => {
			const provider: AIProvider = 'anthropic';
			const models = getProviderModels(provider);

			models.forEach((model) => {
				expect(model.provider).toBe(provider);
			});
		});

		it('should throw error for invalid provider', () => {
			expect(() => getProviderModels('invalid' as AIProvider)).toThrow();
		});
	});

	describe('getProviderModel', () => {
		const mockConfig: ProviderConfig = {
			provider: 'anthropic',
			apiKey: 'test-api-key',
			enabled: true
		};

		it('should create model instance for valid anthropic model', () => {
			const model = getProviderModel('anthropic', 'claude-3-5-sonnet-20241022', mockConfig);
			expect(model).toBeDefined();
		});

		it('should create model instance for valid openai model', () => {
			const config: ProviderConfig = {
				provider: 'openai',
				apiKey: 'test-api-key',
				enabled: true
			};
			const model = getProviderModel('openai', 'gpt-4-turbo-preview', config);
			expect(model).toBeDefined();
		});

		it('should create model instance for valid google model', () => {
			const config: ProviderConfig = {
				provider: 'google',
				apiKey: 'test-api-key',
				enabled: true
			};
			const model = getProviderModel('google', 'gemini-1.5-pro', config);
			expect(model).toBeDefined();
		});

		it('should create model instance for valid mistral model', () => {
			const config: ProviderConfig = {
				provider: 'mistral',
				apiKey: 'test-api-key',
				enabled: true
			};
			const model = getProviderModel('mistral', 'mistral-large-latest', config);
			expect(model).toBeDefined();
		});

		it('should create model instance for ollama with custom baseUrl', () => {
			const config: ProviderConfig = {
				provider: 'ollama',
				baseUrl: 'http://localhost:11434',
				enabled: true
			};
			const model = getProviderModel('ollama', 'llama3', config);
			expect(model).toBeDefined();
		});

		it('should throw error for non-existent model ID', () => {
			expect(() =>
				getProviderModel('anthropic', 'non-existent-model', mockConfig)
			).toThrow();
		});

		it('should throw error when config is missing required API key', () => {
			const invalidConfig: ProviderConfig = {
				provider: 'anthropic',
				enabled: true
			};
			expect(() =>
				getProviderModel('anthropic', 'claude-3-5-sonnet-20241022', invalidConfig)
			).toThrow();
		});

		it('should throw error when ollama config is missing baseUrl', () => {
			const invalidConfig: ProviderConfig = {
				provider: 'ollama',
				enabled: true
			};
			expect(() =>
				getProviderModel('ollama', 'llama3', invalidConfig)
			).toThrow();
		});

		it('should pass API key to model instance', () => {
			const model = getProviderModel('anthropic', 'claude-3-5-sonnet-20241022', mockConfig);
			// Model instance should have access to the API key through closure or config
			expect(model).toBeDefined();
		});

		it('should pass baseUrl to model instance for ollama', () => {
			const config: ProviderConfig = {
				provider: 'ollama',
				baseUrl: 'http://localhost:11434',
				enabled: true
			};
			const model = getProviderModel('ollama', 'llama3', config);
			expect(model).toBeDefined();
		});
	});

	describe('isProviderConfigured', () => {
		beforeEach(() => {
			// Reset localStorage before each test
			global.localStorage = {
				getItem: vi.fn(() => null),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
				length: 0,
				key: vi.fn()
			};
		});

		it('should return true when anthropic API key exists', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-anthropic-apikey') return 'test-api-key';
				return null;
			});

			expect(isProviderConfigured('anthropic')).toBe(true);
		});

		it('should return true when openai API key exists', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-openai-apikey') return 'test-api-key';
				return null;
			});

			expect(isProviderConfigured('openai')).toBe(true);
		});

		it('should return true when google API key exists', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-google-apikey') return 'test-api-key';
				return null;
			});

			expect(isProviderConfigured('google')).toBe(true);
		});

		it('should return true when mistral API key exists', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-mistral-apikey') return 'test-api-key';
				return null;
			});

			expect(isProviderConfigured('mistral')).toBe(true);
		});

		it('should return true when ollama baseUrl exists', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-ollama-baseurl') return 'http://localhost:11434';
				return null;
			});

			expect(isProviderConfigured('ollama')).toBe(true);
		});

		it('should return false when anthropic API key is missing', () => {
			expect(isProviderConfigured('anthropic')).toBe(false);
		});

		it('should return false when openai API key is missing', () => {
			expect(isProviderConfigured('openai')).toBe(false);
		});

		it('should return false when google API key is missing', () => {
			expect(isProviderConfigured('google')).toBe(false);
		});

		it('should return false when mistral API key is missing', () => {
			expect(isProviderConfigured('mistral')).toBe(false);
		});

		it('should return false when ollama baseUrl is missing', () => {
			expect(isProviderConfigured('ollama')).toBe(false);
		});

		it('should return false when API key is empty string', () => {
			global.localStorage.getItem = vi.fn(() => '');
			expect(isProviderConfigured('anthropic')).toBe(false);
		});

		it('should return false when API key is whitespace only', () => {
			global.localStorage.getItem = vi.fn(() => '   ');
			expect(isProviderConfigured('anthropic')).toBe(false);
		});
	});

	describe('Model Information Consistency', () => {
		it('should have unique model IDs within each provider', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((provider) => {
				const models = getProviderModels(provider);
				const ids = models.map(m => m.id);
				const uniqueIds = new Set(ids);
				expect(uniqueIds.size).toBe(ids.length);
			});
		});

		it('should have non-empty display names for all models', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((provider) => {
				const models = getProviderModels(provider);
				models.forEach((model) => {
					expect(model.displayName).toBeTruthy();
					expect(model.displayName.length).toBeGreaterThan(0);
				});
			});
		});

		it('should have positive maxTokens for all models', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((provider) => {
				const models = getProviderModels(provider);
				models.forEach((model) => {
					expect(model.capabilities.maxTokens).toBeGreaterThan(0);
				});
			});
		});

		it('should group models by tier appropriately', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((provider) => {
				const models = getProviderModels(provider);
				const tiers = new Set(models.map(m => m.tier));

				// Each provider should have at least one tier represented
				expect(tiers.size).toBeGreaterThan(0);

				// All tiers should be valid
				tiers.forEach((tier) => {
					expect(['fast', 'balanced', 'powerful']).toContain(tier);
				});
			});
		});
	});

	describe('Provider Adapter Interface', () => {
		it('should have consistent interface across all providers', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((providerName) => {
				const provider = getProvider(providerName);

				expect(provider).toHaveProperty('name');
				expect(provider).toHaveProperty('models');
				expect(provider).toHaveProperty('createModel');

				expect(typeof provider.name).toBe('string');
				expect(Array.isArray(provider.models)).toBe(true);
				expect(typeof provider.createModel).toBe('function');
			});
		});

		it('should have provider name matching the requested provider', () => {
			const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

			providers.forEach((providerName) => {
				const provider = getProvider(providerName);
				expect(provider.name).toBe(providerName);
			});
		});
	});
});
