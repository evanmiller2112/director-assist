/**
 * Tests for AI Provider Settings Storage
 *
 * Covers:
 * - API key storage and retrieval from localStorage
 * - Provider settings storage in appConfigRepository
 * - Combined settings retrieval
 * - Default values handling
 * - Multiple provider configurations
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	getApiKey,
	setApiKey,
	getProviderSettings,
	setProviderSettings,
	getAISettings,
	deleteApiKey,
	type AIProvider,
	type AIProviderSettings,
	type ProviderConfig
} from './storage';

// Mock the appConfigRepository
vi.mock('$lib/db/repositories/appConfigRepository', () => ({
	appConfigRepository: {
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn()
	}
}));

describe('AI Provider Settings Storage', () => {
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

		vi.clearAllMocks();
	});

	describe('getApiKey', () => {
		it('should retrieve anthropic API key from localStorage', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-anthropic-apikey') return 'test-anthropic-key';
				return null;
			});

			const apiKey = getApiKey('anthropic');

			expect(apiKey).toBe('test-anthropic-key');
			expect(localStorage.getItem).toHaveBeenCalledWith('ai-provider-anthropic-apikey');
		});

		it('should retrieve openai API key from localStorage', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-openai-apikey') return 'test-openai-key';
				return null;
			});

			const apiKey = getApiKey('openai');

			expect(apiKey).toBe('test-openai-key');
			expect(localStorage.getItem).toHaveBeenCalledWith('ai-provider-openai-apikey');
		});

		it('should retrieve google API key from localStorage', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-google-apikey') return 'test-google-key';
				return null;
			});

			const apiKey = getApiKey('google');

			expect(apiKey).toBe('test-google-key');
			expect(localStorage.getItem).toHaveBeenCalledWith('ai-provider-google-apikey');
		});

		it('should retrieve mistral API key from localStorage', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-mistral-apikey') return 'test-mistral-key';
				return null;
			});

			const apiKey = getApiKey('mistral');

			expect(apiKey).toBe('test-mistral-key');
			expect(localStorage.getItem).toHaveBeenCalledWith('ai-provider-mistral-apikey');
		});

		it('should retrieve ollama baseUrl from localStorage', () => {
			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-ollama-baseurl') return 'http://localhost:11434';
				return null;
			});

			const baseUrl = getApiKey('ollama');

			expect(baseUrl).toBe('http://localhost:11434');
			expect(localStorage.getItem).toHaveBeenCalledWith('ai-provider-ollama-baseurl');
		});

		it('should return null when API key does not exist', () => {
			const apiKey = getApiKey('anthropic');

			expect(apiKey).toBeNull();
		});

		it('should return null when localStorage is not available', () => {
			// Simulate server-side or unavailable localStorage
			const originalLocalStorage = global.localStorage;
			delete (global as any).localStorage;

			const apiKey = getApiKey('anthropic');

			expect(apiKey).toBeNull();

			global.localStorage = originalLocalStorage;
		});

		it('should handle empty string as null', () => {
			global.localStorage.getItem = vi.fn(() => '');

			const apiKey = getApiKey('anthropic');

			expect(apiKey).toBeNull();
		});

		it('should trim whitespace from API keys', () => {
			global.localStorage.getItem = vi.fn(() => '  test-key-with-spaces  ');

			const apiKey = getApiKey('anthropic');

			expect(apiKey).toBe('test-key-with-spaces');
		});
	});

	describe('setApiKey', () => {
		it('should store anthropic API key in localStorage', () => {
			setApiKey('anthropic', 'my-anthropic-key');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-anthropic-apikey',
				'my-anthropic-key'
			);
		});

		it('should store openai API key in localStorage', () => {
			setApiKey('openai', 'my-openai-key');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-openai-apikey',
				'my-openai-key'
			);
		});

		it('should store google API key in localStorage', () => {
			setApiKey('google', 'my-google-key');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-google-apikey',
				'my-google-key'
			);
		});

		it('should store mistral API key in localStorage', () => {
			setApiKey('mistral', 'my-mistral-key');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-mistral-apikey',
				'my-mistral-key'
			);
		});

		it('should store ollama baseUrl in localStorage', () => {
			setApiKey('ollama', 'http://localhost:11434');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-ollama-baseurl',
				'http://localhost:11434'
			);
		});

		it('should handle setting multiple API keys', () => {
			setApiKey('anthropic', 'key-1');
			setApiKey('openai', 'key-2');

			expect(localStorage.setItem).toHaveBeenCalledTimes(2);
		});

		it('should overwrite existing API key', () => {
			setApiKey('anthropic', 'old-key');
			setApiKey('anthropic', 'new-key');

			expect(localStorage.setItem).toHaveBeenLastCalledWith(
				'ai-provider-anthropic-apikey',
				'new-key'
			);
		});

		it('should handle localStorage not available', () => {
			const originalLocalStorage = global.localStorage;
			delete (global as any).localStorage;

			expect(() => setApiKey('anthropic', 'test-key')).not.toThrow();

			global.localStorage = originalLocalStorage;
		});
	});

	describe('deleteApiKey', () => {
		it('should remove anthropic API key from localStorage', () => {
			deleteApiKey('anthropic');

			expect(localStorage.removeItem).toHaveBeenCalledWith('ai-provider-anthropic-apikey');
		});

		it('should remove openai API key from localStorage', () => {
			deleteApiKey('openai');

			expect(localStorage.removeItem).toHaveBeenCalledWith('ai-provider-openai-apikey');
		});

		it('should remove google API key from localStorage', () => {
			deleteApiKey('google');

			expect(localStorage.removeItem).toHaveBeenCalledWith('ai-provider-google-apikey');
		});

		it('should remove mistral API key from localStorage', () => {
			deleteApiKey('mistral');

			expect(localStorage.removeItem).toHaveBeenCalledWith('ai-provider-mistral-apikey');
		});

		it('should remove ollama baseUrl from localStorage', () => {
			deleteApiKey('ollama');

			expect(localStorage.removeItem).toHaveBeenCalledWith('ai-provider-ollama-baseurl');
		});

		it('should handle deleting non-existent key', () => {
			expect(() => deleteApiKey('anthropic')).not.toThrow();
		});
	});

	describe('getProviderSettings', () => {
		it('should retrieve provider settings from appConfigRepository', async () => {
			const mockSettings: AIProviderSettings = {
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: {
						provider: 'anthropic',
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
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(mockSettings);

			const settings = await getProviderSettings();

			expect(settings).toEqual(mockSettings);
			expect(appConfigRepository.get).toHaveBeenCalledWith('ai-provider-settings');
		});

		it('should return default settings when none exist', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(undefined);

			const settings = await getProviderSettings();

			expect(settings).toBeDefined();
			expect(settings.activeProvider).toBe('anthropic');
			expect(settings.providers).toHaveProperty('anthropic');
			expect(settings.providers).toHaveProperty('openai');
			expect(settings.providers).toHaveProperty('google');
			expect(settings.providers).toHaveProperty('mistral');
			expect(settings.providers).toHaveProperty('ollama');
		});

		it('should return default model for anthropic', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(undefined);

			const settings = await getProviderSettings();

			expect(settings.activeModel).toBeTruthy();
		});

		it('should include all five providers in default settings', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(undefined);

			const settings = await getProviderSettings();

			const providers = Object.keys(settings.providers);
			expect(providers).toHaveLength(5);
			expect(providers).toContain('anthropic');
			expect(providers).toContain('openai');
			expect(providers).toContain('google');
			expect(providers).toContain('mistral');
			expect(providers).toContain('ollama');
		});

		it('should set all providers as disabled by default', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(undefined);

			const settings = await getProviderSettings();

			Object.values(settings.providers).forEach((config) => {
				expect(config.enabled).toBe(false);
			});
		});
	});

	describe('setProviderSettings', () => {
		it('should save provider settings to appConfigRepository', async () => {
			const settings: AIProviderSettings = {
				activeProvider: 'openai',
				activeModel: 'gpt-4-turbo-preview',
				providers: {
					anthropic: {
						provider: 'anthropic',
						enabled: false
					},
					openai: {
						provider: 'openai',
						enabled: true
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
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');

			await setProviderSettings(settings);

			expect(appConfigRepository.set).toHaveBeenCalledWith('ai-provider-settings', settings);
		});

		it('should handle partial provider settings', async () => {
			const partialSettings = {
				activeProvider: 'anthropic' as AIProvider,
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: {
						provider: 'anthropic' as AIProvider,
						enabled: true
					}
				}
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');

			await setProviderSettings(partialSettings as AIProviderSettings);

			expect(appConfigRepository.set).toHaveBeenCalled();
		});

		it('should handle updating existing settings', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');

			const existingSettings: AIProviderSettings = {
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: { provider: 'anthropic', enabled: true },
					openai: { provider: 'openai', enabled: false },
					google: { provider: 'google', enabled: false },
					mistral: { provider: 'mistral', enabled: false },
					ollama: { provider: 'ollama', enabled: false }
				}
			};

			const updatedSettings: AIProviderSettings = {
				...existingSettings,
				activeProvider: 'openai',
				activeModel: 'gpt-4-turbo-preview'
			};

			await setProviderSettings(updatedSettings);

			expect(appConfigRepository.set).toHaveBeenCalledWith(
				'ai-provider-settings',
				updatedSettings
			);
		});
	});

	describe('getAISettings', () => {
		it('should combine provider settings with API keys', async () => {
			const mockSettings: AIProviderSettings = {
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: {
						provider: 'anthropic',
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
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(mockSettings);

			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-anthropic-apikey') return 'anthropic-key';
				if (key === 'ai-provider-openai-apikey') return 'openai-key';
				return null;
			});

			const settings = await getAISettings();

			expect(settings.activeProvider).toBe('anthropic');
			expect(settings.activeModel).toBe('claude-3-5-sonnet-20241022');
			expect(settings.providers.anthropic.apiKey).toBe('anthropic-key');
			expect(settings.providers.openai.apiKey).toBe('openai-key');
		});

		it('should handle providers without API keys', async () => {
			const mockSettings: AIProviderSettings = {
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: { provider: 'anthropic', enabled: true },
					openai: { provider: 'openai', enabled: false },
					google: { provider: 'google', enabled: false },
					mistral: { provider: 'mistral', enabled: false },
					ollama: { provider: 'ollama', enabled: false }
				}
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(mockSettings);

			const settings = await getAISettings();

			expect(settings.providers.anthropic.apiKey).toBeUndefined();
			expect(settings.providers.openai.apiKey).toBeUndefined();
		});

		it('should include ollama baseUrl when present', async () => {
			const mockSettings: AIProviderSettings = {
				activeProvider: 'ollama',
				activeModel: 'llama3',
				providers: {
					anthropic: { provider: 'anthropic', enabled: false },
					openai: { provider: 'openai', enabled: false },
					google: { provider: 'google', enabled: false },
					mistral: { provider: 'mistral', enabled: false },
					ollama: { provider: 'ollama', enabled: true }
				}
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(mockSettings);

			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-ollama-baseurl') return 'http://localhost:11434';
				return null;
			});

			const settings = await getAISettings();

			expect(settings.providers.ollama.baseUrl).toBe('http://localhost:11434');
		});

		it('should merge all API keys into provider configs', async () => {
			const mockSettings: AIProviderSettings = {
				activeProvider: 'anthropic',
				activeModel: 'claude-3-5-sonnet-20241022',
				providers: {
					anthropic: { provider: 'anthropic', enabled: true },
					openai: { provider: 'openai', enabled: true },
					google: { provider: 'google', enabled: true },
					mistral: { provider: 'mistral', enabled: true },
					ollama: { provider: 'ollama', enabled: true }
				}
			};

			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(mockSettings);

			global.localStorage.getItem = vi.fn((key: string) => {
				if (key === 'ai-provider-anthropic-apikey') return 'anthropic-key';
				if (key === 'ai-provider-openai-apikey') return 'openai-key';
				if (key === 'ai-provider-google-apikey') return 'google-key';
				if (key === 'ai-provider-mistral-apikey') return 'mistral-key';
				if (key === 'ai-provider-ollama-baseurl') return 'http://localhost:11434';
				return null;
			});

			const settings = await getAISettings();

			expect(settings.providers.anthropic.apiKey).toBe('anthropic-key');
			expect(settings.providers.openai.apiKey).toBe('openai-key');
			expect(settings.providers.google.apiKey).toBe('google-key');
			expect(settings.providers.mistral.apiKey).toBe('mistral-key');
			expect(settings.providers.ollama.baseUrl).toBe('http://localhost:11434');
		});

		it('should work when no settings exist in repository', async () => {
			const { appConfigRepository } = await import('$lib/db/repositories/appConfigRepository');
			vi.mocked(appConfigRepository.get).mockResolvedValueOnce(undefined);

			const settings = await getAISettings();

			expect(settings).toBeDefined();
			expect(settings.activeProvider).toBeDefined();
			expect(settings.providers).toBeDefined();
		});
	});

	describe('Storage Key Format', () => {
		it('should use consistent key format for anthropic', () => {
			setApiKey('anthropic', 'test');

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-anthropic-apikey',
				'test'
			);
		});

		it('should use consistent key format for openai', () => {
			setApiKey('openai', 'test');

			expect(localStorage.setItem).toHaveBeenCalledWith('ai-provider-openai-apikey', 'test');
		});

		it('should use consistent key format for google', () => {
			setApiKey('google', 'test');

			expect(localStorage.setItem).toHaveBeenCalledWith('ai-provider-google-apikey', 'test');
		});

		it('should use consistent key format for mistral', () => {
			setApiKey('mistral', 'test');

			expect(localStorage.setItem).toHaveBeenCalledWith('ai-provider-mistral-apikey', 'test');
		});

		it('should use baseurl key format for ollama', () => {
			setApiKey('ollama', 'test');

			expect(localStorage.setItem).toHaveBeenCalledWith('ai-provider-ollama-baseurl', 'test');
		});
	});

	describe('Edge Cases', () => {
		it('should handle corrupted localStorage data', () => {
			global.localStorage.getItem = vi.fn(() => {
				throw new Error('localStorage corrupted');
			});

			expect(() => getApiKey('anthropic')).not.toThrow();
		});

		it('should handle very long API keys', () => {
			const longKey = 'a'.repeat(10000);
			setApiKey('anthropic', longKey);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-anthropic-apikey',
				longKey
			);
		});

		it('should handle special characters in API keys', () => {
			const specialKey = 'sk-test_key!@#$%^&*()_+-=[]{}|;:,.<>?';
			setApiKey('anthropic', specialKey);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-anthropic-apikey',
				specialKey
			);
		});

		it('should handle unicode in baseUrl for ollama', () => {
			const unicodeUrl = 'http://localhost:11434/日本語';
			setApiKey('ollama', unicodeUrl);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'ai-provider-ollama-baseurl',
				unicodeUrl
			);
		});
	});
});
