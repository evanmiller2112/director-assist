/**
 * AI Module
 *
 * Main entry point for multi-provider AI functionality.
 * Re-exports all public APIs for easy importing.
 */

// Client functions
export { generate, generateStream, type GenerationOptions, type GenerationResult } from './client';

// Provider registry
export {
	getProvider,
	getProviderModels,
	getProviderModel,
	isProviderConfigured,
	type AIProvider,
	type AIModelInfo,
	type ProviderConfig,
	type ModelTier
} from './providers';

// Configuration and storage
export {
	getApiKey,
	setApiKey,
	deleteApiKey,
	getProviderSettings,
	setProviderSettings,
	getAISettings,
	type AIProviderSettings
} from './config';
