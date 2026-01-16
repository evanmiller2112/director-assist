import { db } from '../index';
import { appConfigRepository } from '../repositories/appConfigRepository';
import type { BaseEntity, Campaign, CampaignMetadata } from '$lib/types';
import { DEFAULT_CAMPAIGN_SETTINGS } from '$lib/types';
import { nanoid } from 'nanoid';

/**
 * Migrates the old singleton Campaign record to a Campaign entity.
 * This migration:
 * 1. Checks if old campaign table has data
 * 2. Checks if a campaign entity already exists (idempotent)
 * 3. Converts the Campaign to a BaseEntity with metadata
 * 4. Saves to the entities table
 * 5. Sets as active campaign in appConfig
 * 6. Leaves old campaign table data for safety
 */
export async function migrateCampaignToEntity(): Promise<void> {
	try {
		// Check if we have any campaign entities already
		const existingCampaigns = await db.entities.where('type').equals('campaign').count();
		if (existingCampaigns > 0) {
			console.log('Campaign migration: Campaign entities already exist, skipping migration');

			// Ensure we have an active campaign set
			const activeCampaignId = await appConfigRepository.getActiveCampaignId();
			if (!activeCampaignId) {
				const firstCampaign = await db.entities.where('type').equals('campaign').first();
				if (firstCampaign) {
					await appConfigRepository.setActiveCampaignId(firstCampaign.id);
					console.log('Campaign migration: Set active campaign to', firstCampaign.id);
				}
			}
			return;
		}

		// Get old campaign data from singleton table
		const oldCampaigns = await db.campaign.toArray();
		const oldCampaign = oldCampaigns[0] as Campaign | undefined;

		if (!oldCampaign) {
			console.log('Campaign migration: No old campaign data found, skipping migration');
			return;
		}

		console.log('Campaign migration: Migrating campaign', oldCampaign.name);

		// Build campaign metadata from old campaign
		const metadata: CampaignMetadata = {
			customEntityTypes: oldCampaign.customEntityTypes ?? [],
			entityTypeOverrides: oldCampaign.entityTypeOverrides ?? [],
			settings: oldCampaign.settings ?? { ...DEFAULT_CAMPAIGN_SETTINGS }
		};

		// Create the campaign entity
		const now = new Date();
		const campaignEntity: BaseEntity = {
			id: oldCampaign.id || nanoid(),
			type: 'campaign',
			name: oldCampaign.name,
			description: oldCampaign.description || '',
			summary: undefined,
			tags: [],
			imageUrl: undefined,
			fields: {
				system: oldCampaign.system || 'System Agnostic',
				setting: oldCampaign.setting || '',
				status: 'active'
			},
			links: [],
			notes: '',
			createdAt: oldCampaign.createdAt || now,
			updatedAt: oldCampaign.updatedAt || now,
			metadata: metadata as unknown as Record<string, unknown>
		};

		// Save to entities table
		await db.entities.add(campaignEntity);
		console.log('Campaign migration: Created campaign entity', campaignEntity.id);

		// Set as active campaign
		await appConfigRepository.setActiveCampaignId(campaignEntity.id);
		console.log('Campaign migration: Set as active campaign');

		// Note: We intentionally leave the old campaign table data
		// It can be cleaned up in a later version after confirming migration success

		console.log('Campaign migration: Migration complete');
	} catch (error) {
		console.error('Campaign migration failed:', error);
		throw error;
	}
}

/**
 * Converts an old Campaign object (from backup) to a campaign entity.
 * Used during import of old backup format.
 */
export function convertOldCampaignToEntity(oldCampaign: Campaign): BaseEntity {
	const metadata: CampaignMetadata = {
		customEntityTypes: oldCampaign.customEntityTypes ?? [],
		entityTypeOverrides: oldCampaign.entityTypeOverrides ?? [],
		settings: oldCampaign.settings ?? { ...DEFAULT_CAMPAIGN_SETTINGS }
	};

	const now = new Date();
	return {
		id: oldCampaign.id || nanoid(),
		type: 'campaign',
		name: oldCampaign.name,
		description: oldCampaign.description || '',
		summary: undefined,
		tags: [],
		imageUrl: undefined,
		fields: {
			system: oldCampaign.system || 'System Agnostic',
			setting: oldCampaign.setting || '',
			status: 'active'
		},
		links: [],
		notes: '',
		createdAt: oldCampaign.createdAt || now,
		updatedAt: oldCampaign.updatedAt || now,
		metadata: metadata as unknown as Record<string, unknown>
	};
}
