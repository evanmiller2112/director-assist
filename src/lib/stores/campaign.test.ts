import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity } from '$lib/types';

/**
 * Test Strategy: Campaign Store System Management
 *
 * RED Phase (TDD): These tests define the expected behavior for system profile
 * management in the campaign store. Tests will FAIL until the system-aware
 * functionality is implemented.
 *
 * The campaign store should:
 * 1. Store and retrieve the active game system ID (e.g., 'draw-steel', 'system-agnostic')
 * 2. Provide getCurrentSystemProfile() to get the full system profile
 * 3. Support setSystemProfile() to change the active system
 * 4. Default to 'draw-steel' (this is a Draw Steel-focused tool)
 *
 * Key Test Scenarios:
 * 1. Campaign without systemId defaults to 'draw-steel'
 * 2. Campaign with systemId returns correct system profile
 * 3. setSystemProfile() updates the campaign metadata
 * 4. getCurrentSystemProfile() returns full SystemProfile object
 * 5. System changes are persisted to database
 */

// Mock the database and repositories
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getAll: vi.fn(() => ({
			subscribe: vi.fn()
		})),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	},
	appConfigRepository: {
		getActiveCampaignId: vi.fn(),
		setActiveCampaignId: vi.fn()
	}
}));

vi.mock('$lib/db', () => ({
	db: {
		entities: {
			where: vi.fn(() => ({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [])
				}))
			})),
			add: vi.fn(),
			update: vi.fn()
		}
	}
}));

// Mock the system profiles
vi.mock('$lib/config/systems', () => ({
	getSystemProfile: vi.fn((id: string) => {
		if (id === 'draw-steel') {
			return {
				id: 'draw-steel',
				name: 'Draw Steel',
				entityTypeModifications: {
					character: {
						additionalFields: [
							{ key: 'ancestry', label: 'Ancestry', type: 'text', required: false, order: 10 }
						]
					}
				},
				terminology: { gm: 'Director' }
			};
		}
		if (id === 'system-agnostic') {
			return {
				id: 'system-agnostic',
				name: 'System Agnostic',
				entityTypeModifications: {},
				terminology: { gm: 'GM' }
			};
		}
		return undefined;
	}),
	getAllSystemProfiles: vi.fn(() => [
		{
			id: 'system-agnostic',
			name: 'System Agnostic',
			entityTypeModifications: {},
			terminology: { gm: 'GM' }
		},
		{
			id: 'draw-steel',
			name: 'Draw Steel',
			entityTypeModifications: {},
			terminology: { gm: 'Director' }
		}
	])
}));

describe('campaignStore - System Management (Issue #5)', () => {
	let campaignStore: any;
	let mockDb: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Import fresh mocks
		const dbModule = await import('$lib/db');
		mockDb = dbModule.db;

		// Dynamically import the store to get a fresh instance
		const module = await import('./campaign.svelte');
		campaignStore = module.campaignStore;
	});

	describe('getCurrentSystemProfile()', () => {
		it('should exist as a method on campaign store', () => {
			expect(campaignStore.getCurrentSystemProfile).toBeDefined();
			expect(typeof campaignStore.getCurrentSystemProfile).toBe('function');
		});

		it('should return draw-steel profile when campaign has no systemId (default)', async () => {
			// Mock campaign without systemId field - defaults to draw-steel for this Draw Steel-focused tool
			const campaignWithoutSystem: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {
					system: 'D&D 5e', // Old field, not systemId
					setting: 'Forgotten Realms',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			// Set up mock to return this campaign
			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaignWithoutSystem])
				}))
			});

			await campaignStore.load();

			const profile = campaignStore.getCurrentSystemProfile();

			expect(profile).toBeDefined();
			expect(profile?.id).toBe('draw-steel');
			expect(profile?.name).toBe('Draw Steel');
		});

		it('should return draw-steel profile when campaign has systemId set to draw-steel', async () => {
			const campaignWithDrawSteel: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Draw Steel Campaign',
				description: 'A Draw Steel campaign',
				tags: [],
				fields: {
					system: 'Draw Steel',
					setting: 'Fantasy Setting',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel', // New field
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaignWithDrawSteel])
				}))
			});

			await campaignStore.load();

			const profile = campaignStore.getCurrentSystemProfile();

			expect(profile).toBeDefined();
			expect(profile?.id).toBe('draw-steel');
			expect(profile?.name).toBe('Draw Steel');
			expect(profile?.terminology?.gm).toBe('Director');
		});

		it('should return null when no campaign is loaded', () => {
			campaignStore._resetForTesting();
			const profile = campaignStore.getCurrentSystemProfile();

			expect(profile).toBeNull();
		});

		it('should return system-agnostic for unknown systemId', async () => {
			const campaignWithUnknownSystem: BaseEntity = {
				id: 'campaign-3',
				type: 'campaign',
				name: 'Unknown System Campaign',
				description: 'Campaign with unknown system',
				tags: [],
				fields: {
					system: 'Unknown System',
					setting: 'Setting',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'unknown-system-id',
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaignWithUnknownSystem])
				}))
			});

			await campaignStore.load();

			const profile = campaignStore.getCurrentSystemProfile();

			expect(profile).toBeDefined();
			expect(profile?.id).toBe('system-agnostic');
		});
	});

	describe('setSystemProfile()', () => {
		it('should exist as a method on campaign store', () => {
			expect(campaignStore.setSystemProfile).toBeDefined();
			expect(typeof campaignStore.setSystemProfile).toBe('function');
		});

		it('should update campaign metadata with systemId', async () => {
			const baseCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'System Agnostic',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [baseCampaign])
				}))
			});

			await campaignStore.load();

			// Change to Draw Steel
			await campaignStore.setSystemProfile('draw-steel');

			// Verify database update was called
			expect(mockDb.entities.update).toHaveBeenCalled();

			const updateCall = mockDb.entities.update.mock.calls[0];
			expect(updateCall[0]).toBe('campaign-1'); // Campaign ID
			expect(updateCall[1].metadata.systemId).toBe('draw-steel');
		});

		it('should update local campaign state', async () => {
			const baseCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'System Agnostic',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [baseCampaign])
				}))
			});

			await campaignStore.load();

			// Mock the update to succeed
			mockDb.entities.update.mockResolvedValue(undefined);

			await campaignStore.setSystemProfile('draw-steel');

			// Verify the store now returns the new system profile
			const profile = campaignStore.getCurrentSystemProfile();
			expect(profile?.id).toBe('draw-steel');
		});

		it('should throw error if no campaign is loaded', async () => {
			campaignStore._resetForTesting();
			await expect(campaignStore.setSystemProfile('draw-steel')).rejects.toThrow();
		});

		it('should accept system-agnostic as valid system ID', async () => {
			const campaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'Draw Steel',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaign])
				}))
			});

			await campaignStore.load();

			mockDb.entities.update.mockResolvedValue(undefined);

			await campaignStore.setSystemProfile('system-agnostic');

			const profile = campaignStore.getCurrentSystemProfile();
			expect(profile?.id).toBe('system-agnostic');
		});

		it('should update updatedAt timestamp', async () => {
			const campaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'System Agnostic',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date('2024-01-01'),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaign])
				}))
			});

			await campaignStore.load();

			await campaignStore.setSystemProfile('draw-steel');

			const updateCall = mockDb.entities.update.mock.calls[0];
			expect(updateCall[1].updatedAt).toBeInstanceOf(Date);
		});
	});

	describe('getSystemId()', () => {
		it('should exist as a getter on campaign store', () => {
			expect(campaignStore.systemId).toBeDefined();
		});

		it('should return null when no campaign is loaded', () => {
			campaignStore._resetForTesting();
			expect(campaignStore.systemId).toBeNull();
		});

		it('should return draw-steel when campaign has no systemId (default)', async () => {
			const campaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'D&D 5e',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaign])
				}))
			});

			await campaignStore.load();

			expect(campaignStore.systemId).toBe('draw-steel');
		});

		it('should return the systemId from campaign metadata', async () => {
			const campaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'Draw Steel',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaign])
				}))
			});

			await campaignStore.load();

			expect(campaignStore.systemId).toBe('draw-steel');
		});
	});

	describe('Backwards Compatibility', () => {
		it('should handle campaigns created before system profiles were added', async () => {
			const oldCampaign: BaseEntity = {
				id: 'old-campaign',
				type: 'campaign',
				name: 'Old Campaign',
				description: 'Created before system profiles',
				tags: [],
				fields: {
					system: 'D&D 5e',
					setting: 'Forgotten Realms',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				metadata: {
					// No systemId field
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [oldCampaign])
				}))
			});

			await campaignStore.load();

			// Should default to draw-steel (this is a Draw Steel-focused tool)
			expect(campaignStore.systemId).toBe('draw-steel');

			const profile = campaignStore.getCurrentSystemProfile();
			expect(profile?.id).toBe('draw-steel');
		});

		it('should allow setting system profile on old campaign', async () => {
			const oldCampaign: BaseEntity = {
				id: 'old-campaign',
				type: 'campaign',
				name: 'Old Campaign',
				description: 'Created before system profiles',
				tags: [],
				fields: {
					system: 'D&D 5e',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [oldCampaign])
				}))
			});

			await campaignStore.load();

			mockDb.entities.update.mockResolvedValue(undefined);

			await campaignStore.setSystemProfile('draw-steel');

			expect(mockDb.entities.update).toHaveBeenCalled();
			const updateCall = mockDb.entities.update.mock.calls[0];
			expect(updateCall[1].metadata.systemId).toBe('draw-steel');
		});
	});

	describe('Type Safety', () => {
		it('should return SystemProfile type from getCurrentSystemProfile', async () => {
			const campaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test',
				tags: [],
				fields: {
					system: 'Draw Steel',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			mockDb.entities.where.mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaign])
				}))
			});

			await campaignStore.load();

			const profile = campaignStore.getCurrentSystemProfile();

			// Type checks (these verify TypeScript compilation)
			if (profile) {
				expect(typeof profile.id).toBe('string');
				expect(typeof profile.name).toBe('string');
				expect(typeof profile.entityTypeModifications).toBe('object');
				expect(typeof profile.terminology).toBe('object');
			}
		});
	});
});
