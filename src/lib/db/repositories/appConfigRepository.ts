import { db, type AppConfig } from '../index';

// Keys used in app config
export const APP_CONFIG_KEYS = {
	ACTIVE_CAMPAIGN_ID: 'activeCampaignId',
	ACTIVE_CONVERSATION_ID: 'activeConversationId'
} as const;

export const appConfigRepository = {
	// Get a config value by key
	async get<T>(key: string): Promise<T | undefined> {
		const config = await db.appConfig.get(key);
		return config?.value as T | undefined;
	},

	// Set a config value
	async set(key: string, value: unknown): Promise<void> {
		await db.appConfig.put({ key, value });
	},

	// Delete a config value
	async delete(key: string): Promise<void> {
		await db.appConfig.delete(key);
	},

	// Get the active campaign ID
	async getActiveCampaignId(): Promise<string | null> {
		const id = await this.get<string>(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID);
		return id ?? null;
	},

	// Set the active campaign ID
	async setActiveCampaignId(id: string): Promise<void> {
		await this.set(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID, id);
	},

	// Clear active campaign ID
	async clearActiveCampaignId(): Promise<void> {
		await this.delete(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID);
	},

	// Get the active conversation ID
	async getActiveConversationId(): Promise<string | null> {
		const id = await this.get<string>(APP_CONFIG_KEYS.ACTIVE_CONVERSATION_ID);
		return id ?? null;
	},

	// Set the active conversation ID
	async setActiveConversationId(id: string): Promise<void> {
		await this.set(APP_CONFIG_KEYS.ACTIVE_CONVERSATION_ID, id);
	},

	// Clear active conversation ID
	async clearActiveConversationId(): Promise<void> {
		await this.delete(APP_CONFIG_KEYS.ACTIVE_CONVERSATION_ID);
	},

	// Clear all app config
	async clear(): Promise<void> {
		await db.appConfig.clear();
	}
};
