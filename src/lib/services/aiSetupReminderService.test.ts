/**
 * Tests for AI Setup Reminder Service (Issue #195)
 *
 * This service manages the AI setup reminder banner state that prompts users to
 * configure AI when they haven't set up any API keys yet.
 *
 * Covers:
 * - localStorage get/set operations for dismissal state
 * - Checking if any API key is configured (legacy or provider-specific)
 * - Checking if Ollama baseUrl is configured
 * - SSR safety (typeof window checks)
 * - shouldShowAiSetupBanner logic:
 *   - Never show if AI is explicitly disabled
 *   - Never show if any API key exists (legacy or provider-specific)
 *   - Never show if Ollama baseUrl is configured
 *   - Never show if permanently dismissed
 *   - Show if no API keys AND not dismissed AND AI not disabled
 * - Edge cases: corrupted localStorage data, null values, invalid strings
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	isAiSetupDismissed,
	setAiSetupDismissed,
	hasAnyApiKey,
	shouldShowAiSetupBanner
} from './aiSetupReminderService';

describe('aiSetupReminderService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let mockStore: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		mockStore = {};
		originalLocalStorage = global.localStorage;

		global.localStorage = {
			getItem: vi.fn((key: string) => mockStore[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStore[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStore[key];
			}),
			clear: vi.fn(() => {
				Object.keys(mockStore).forEach((key) => delete mockStore[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('isAiSetupDismissed', () => {
		describe('No Saved Dismissal', () => {
			it('should return false when dismissal key does not exist', () => {
				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false when localStorage is empty', () => {
				mockStore = {};
				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false when only other keys exist', () => {
				mockStore['some-other-key'] = 'value';
				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});
		});

		describe('Valid Saved Dismissal', () => {
			it('should return true when dismissal is set to "true"', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(true);
			});

			it('should return true for "true" string exactly', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				expect(isAiSetupDismissed()).toBe(true);
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return false for "false" string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'false';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for empty string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = '';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for whitespace string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = '   ';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for "null" string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'null';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for "undefined" string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'undefined';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for "1" string', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = '1';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for "True" (capitalized)', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'True';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for "TRUE" (uppercase)', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'TRUE';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});

			it('should return false for malformed JSON', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = '{"dismissed": true}';

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);
			});
		});

		describe('SSR Context Handling', () => {
			it('should return false in SSR context (window undefined)', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const dismissed = isAiSetupDismissed();
				expect(dismissed).toBe(false);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => isAiSetupDismissed()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setAiSetupDismissed', () => {
		describe('Setting Dismissal State', () => {
			it('should set dismissal to "true" in localStorage', () => {
				setAiSetupDismissed();

				expect(mockStore['dm-assist-ai-setup-dismissed']).toBeDefined();
				expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');
			});

			it('should overwrite existing value', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'false';

				setAiSetupDismissed();

				expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');
			});

			it('should be idempotent (calling multiple times)', () => {
				setAiSetupDismissed();
				setAiSetupDismissed();
				setAiSetupDismissed();

				expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setAiSetupDismissed()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setAiSetupDismissed();

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-ai-setup-dismissed']).toBeUndefined();
			});
		});
	});

	describe('hasAnyApiKey', () => {
		describe('No API Keys', () => {
			it('should return false when no keys exist', () => {
				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return false when localStorage is empty', () => {
				mockStore = {};
				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return false when only unrelated keys exist', () => {
				mockStore['some-other-key'] = 'value';
				mockStore['dm-assist-campaign-name'] = 'Test Campaign';
				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return false for empty API key strings', () => {
				mockStore['dm-assist-api-key'] = '';
				mockStore['ai-provider-anthropic-apikey'] = '';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return false for whitespace API key strings', () => {
				mockStore['dm-assist-api-key'] = '   ';
				mockStore['ai-provider-openai-apikey'] = '  ';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});
		});

		describe('Legacy API Key', () => {
			it('should return true when legacy key exists', () => {
				mockStore['dm-assist-api-key'] = 'sk-test-legacy-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true for any non-empty legacy key', () => {
				mockStore['dm-assist-api-key'] = 'any-value';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true even if legacy key is very short', () => {
				mockStore['dm-assist-api-key'] = 'x';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});
		});

		describe('Provider-Specific API Keys', () => {
			it('should return true for Anthropic API key', () => {
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-test-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true for OpenAI API key', () => {
				mockStore['ai-provider-openai-apikey'] = 'sk-openai-test-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true for Google API key', () => {
				mockStore['ai-provider-google-apikey'] = 'google-test-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true for Mistral API key', () => {
				mockStore['ai-provider-mistral-apikey'] = 'mistral-test-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true when multiple provider keys exist', () => {
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';
				mockStore['ai-provider-openai-apikey'] = 'sk-openai-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true if any single provider key exists', () => {
				mockStore['ai-provider-anthropic-apikey'] = '';
				mockStore['ai-provider-openai-apikey'] = 'sk-openai-key';
				mockStore['ai-provider-google-apikey'] = '';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});
		});

		describe('Ollama Configuration', () => {
			it('should return true when Ollama baseUrl exists', () => {
				mockStore['ai-provider-ollama-baseurl'] = 'http://localhost:11434';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true for any non-empty Ollama baseUrl', () => {
				mockStore['ai-provider-ollama-baseurl'] = 'https://ollama.example.com';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return false for empty Ollama baseUrl', () => {
				mockStore['ai-provider-ollama-baseurl'] = '';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return false for whitespace Ollama baseUrl', () => {
				mockStore['ai-provider-ollama-baseurl'] = '   ';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});

			it('should return true when both API key and Ollama baseUrl exist', () => {
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';
				mockStore['ai-provider-ollama-baseurl'] = 'http://localhost:11434';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});
		});

		describe('Mixed Scenarios', () => {
			it('should return true if legacy key exists even with empty provider keys', () => {
				mockStore['dm-assist-api-key'] = 'legacy-key';
				mockStore['ai-provider-anthropic-apikey'] = '';
				mockStore['ai-provider-openai-apikey'] = '';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should return true if provider key exists even with empty legacy key', () => {
				mockStore['dm-assist-api-key'] = '';
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(true);
			});

			it('should check all providers before returning false', () => {
				mockStore['ai-provider-anthropic-apikey'] = '';
				mockStore['ai-provider-openai-apikey'] = '';
				mockStore['ai-provider-google-apikey'] = '';
				mockStore['ai-provider-mistral-apikey'] = '';
				mockStore['ai-provider-ollama-baseurl'] = '';

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);
			});
		});

		describe('SSR Context Handling', () => {
			it('should return false in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const hasKey = hasAnyApiKey();
				expect(hasKey).toBe(false);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => hasAnyApiKey()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('shouldShowAiSetupBanner', () => {
		describe('Never Show Conditions', () => {
			it('should not show when AI is explicitly disabled AND user has dismissed', () => {
				// AI disabled and dismissed - don't show
				const result = shouldShowAiSetupBanner(false, true, false);

				expect(result).toBe(false);
			});

			it('should not show when AI is disabled AND has API key', () => {
				// AI disabled with API key configured - don't show
				const result = shouldShowAiSetupBanner(false, false, true);

				expect(result).toBe(false);
			});

			it('should not show when any API key exists', () => {
				// AI enabled, not dismissed, but has API key
				mockStore['dm-assist-api-key'] = 'sk-test-key';

				const result = shouldShowAiSetupBanner(true, false, true);

				expect(result).toBe(false);
			});

			it('should not show when Ollama is configured', () => {
				// AI enabled, not dismissed, but has Ollama baseUrl
				mockStore['ai-provider-ollama-baseurl'] = 'http://localhost:11434';

				const result = shouldShowAiSetupBanner(true, false, true);

				expect(result).toBe(false);
			});

			it('should not show when permanently dismissed', () => {
				// AI enabled, no API keys, but dismissed
				const result = shouldShowAiSetupBanner(true, true, false);

				expect(result).toBe(false);
			});

			it('should not show when dismissed even if AI enabled and no keys', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				const result = shouldShowAiSetupBanner(true, true, false);

				expect(result).toBe(false);
			});
		});

		describe('Show Conditions', () => {
			// ISSUE #214: NEW USER SCENARIO - This test will FAIL until bug is fixed
			it('should show banner for NEW USER with no setup (aiEnabled=false, hasApiKey=false, isDismissed=false)', () => {
				// This is the catch-22 bug: new users have aiEnabled=false by default,
				// but the function currently rejects them at the !aiEnabled check.
				// The banner SHOULD show to help them get started with AI setup.
				const result = shouldShowAiSetupBanner(false, false, false);

				expect(result).toBe(true);
			});

			it('should show when AI enabled, not dismissed, and no API keys', () => {
				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should show when all conditions are met for existing users (AI enabled, no keys, not dismissed)', () => {
				// Existing user who enabled AI but hasn't configured keys
				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should show even after other banners are dismissed', () => {
				// Other dismissal keys should not affect AI setup banner
				mockStore['dm-assist-last-backup-prompt-dismissed-at'] = new Date().toISOString();

				const result = shouldShowAiSetupBanner(false, false, false);

				expect(result).toBe(true);
			});
		});

		describe('Priority Logic', () => {
			it('should prioritize API key existence first - never show if keys exist', () => {
				// If API key exists, shouldn't show regardless of other states
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';

				const result = shouldShowAiSetupBanner(true, false, true);

				expect(result).toBe(false);
			});

			it('should prioritize API key existence even if AI disabled', () => {
				// If API key exists, don't show even if AI is disabled
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';

				const result = shouldShowAiSetupBanner(false, false, true);

				expect(result).toBe(false);
			});

			it('should check dismissal state second - never show if dismissed', () => {
				// No API keys but dismissed - should not show
				const result = shouldShowAiSetupBanner(true, true, false);

				expect(result).toBe(false);
			});

			it('should respect dismissal even for new users', () => {
				// New user scenario but already dismissed - don't show
				const result = shouldShowAiSetupBanner(false, true, false);

				expect(result).toBe(false);
			});

			it('should show banner only after checking keys and dismissal', () => {
				// No keys, not dismissed - should show (aiEnabled state doesn't matter)
				const resultDisabled = shouldShowAiSetupBanner(false, false, false);
				const resultEnabled = shouldShowAiSetupBanner(true, false, false);

				expect(resultDisabled).toBe(true);
				expect(resultEnabled).toBe(true);
			});
		});

		describe('Edge Cases', () => {
			it('should handle corrupted dismissal state gracefully', () => {
				mockStore['dm-assist-ai-setup-dismissed'] = 'invalid';

				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should handle empty API keys correctly', () => {
				mockStore['dm-assist-api-key'] = '';
				mockStore['ai-provider-anthropic-apikey'] = '';

				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should handle whitespace API keys correctly', () => {
				mockStore['dm-assist-api-key'] = '   ';
				mockStore['ai-provider-openai-apikey'] = '  ';

				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should handle multiple providers with only one valid key', () => {
				mockStore['ai-provider-anthropic-apikey'] = '';
				mockStore['ai-provider-openai-apikey'] = 'sk-openai-key';
				mockStore['ai-provider-google-apikey'] = '';

				const result = shouldShowAiSetupBanner(true, false, true);

				expect(result).toBe(false);
			});
		});

		describe('Integration Scenarios', () => {
			// ISSUE #214: Critical test for new user experience
			it('should handle fresh new user flow (aiEnabled=false by default, no keys, not dismissed)', () => {
				// Fresh user: aiEnabled starts as false, no keys, not dismissed
				// Banner MUST show to help them get started - this is the bug fix
				const result = shouldShowAiSetupBanner(false, false, false);

				expect(result).toBe(true);
			});

			it('should handle existing user with AI enabled but no keys', () => {
				// User who enabled AI but hasn't configured keys yet
				const result = shouldShowAiSetupBanner(true, false, false);

				expect(result).toBe(true);
			});

			it('should handle user who dismisses banner permanently', () => {
				// User dismisses the banner - should not show again
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				const result = shouldShowAiSetupBanner(false, true, false);

				expect(result).toBe(false);
			});

			it('should handle user who clicks "I\'m a Player" (dismisses without disabling AI)', () => {
				// User indicates they're a player, not DM - dismiss banner
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				const result = shouldShowAiSetupBanner(false, true, false);

				expect(result).toBe(false);
			});

			it('should handle user who configures API key', () => {
				// User configures API key - banner should not show
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';

				const result = shouldShowAiSetupBanner(false, false, true);

				expect(result).toBe(false);
			});

			it('should handle user who configures Ollama', () => {
				// User configures Ollama instead of API key
				mockStore['ai-provider-ollama-baseurl'] = 'http://localhost:11434';

				const result = shouldShowAiSetupBanner(false, false, true);

				expect(result).toBe(false);
			});

			it('should show again if user removes API key and un-dismisses', () => {
				// User had dismissed and configured key, then removed key and dismissal
				mockStore = {}; // Clear everything

				const result = shouldShowAiSetupBanner(false, false, false);

				expect(result).toBe(true);
			});

			it('should not show if user has API key even if they dismissed before', () => {
				// User configured key after dismissing - still don't show
				mockStore['ai-provider-anthropic-apikey'] = 'sk-ant-key';
				mockStore['dm-assist-ai-setup-dismissed'] = 'true';

				const result = shouldShowAiSetupBanner(false, true, true);

				expect(result).toBe(false);
			});
		});
	});
});
