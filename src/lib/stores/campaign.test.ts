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

	/**
	 * Field Templates CRUD Tests (GitHub Issue #210)
	 *
	 * TDD RED Phase: These tests define the expected behavior for field template management
	 * in the campaign store. Tests will FAIL until implementation is complete.
	 *
	 * Field templates allow users to save reusable collections of field definitions
	 * that can be applied to custom entity types.
	 *
	 * Key Test Scenarios:
	 * 1. Add field template to campaign metadata
	 * 2. Update existing field template
	 * 3. Delete field template
	 * 4. Get field template by ID
	 * 5. Get all field templates (built-in + user templates)
	 * 6. Cannot modify built-in templates
	 * 7. Timestamps are managed correctly
	 * 8. Deep cloning prevents mutation
	 */
	describe('Field Templates CRUD (Issue #210)', () => {
		describe('addFieldTemplate()', () => {
			it('should exist as a method on campaign store', () => {
				expect(campaignStore.addFieldTemplate).toBeDefined();
				expect(typeof campaignStore.addFieldTemplate).toBe('function');
			});

			it('should add a field template to campaign metadata', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [], // New field
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

				const template = {
					id: 'template-1',
					name: 'Combat Stats',
					description: 'Standard combat statistics',
					category: 'draw-steel',
					fieldDefinitions: [
						{
							key: 'ac',
							label: 'AC',
							type: 'number' as const,
							required: false,
							order: 1
						},
						{
							key: 'hp',
							label: 'HP',
							type: 'number' as const,
							required: false,
							order: 2
						}
					],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await campaignStore.addFieldTemplate(template);

				expect(mockDb.entities.update).toHaveBeenCalled();
				const updateCall = mockDb.entities.update.mock.calls[0];
				expect(updateCall[1].metadata.fieldTemplates).toHaveLength(1);
				expect(updateCall[1].metadata.fieldTemplates[0].id).toBe('template-1');
			});

			it('should throw error if template ID already exists', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'Existing',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				const duplicateTemplate = {
					id: 'template-1',
					name: 'Duplicate',
					category: 'user',
					fieldDefinitions: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(campaignStore.addFieldTemplate(duplicateTemplate)).rejects.toThrow(
					'Field template "template-1" already exists'
				);
			});

			it('should update updatedAt timestamp on campaign', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date('2024-01-01'),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [],
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

				const template = {
					id: 'template-1',
					name: 'Test Template',
					category: 'user',
					fieldDefinitions: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await campaignStore.addFieldTemplate(template);

				const updateCall = mockDb.entities.update.mock.calls[0];
				expect(updateCall[1].updatedAt).toBeInstanceOf(Date);
				expect(updateCall[1].updatedAt.getTime()).toBeGreaterThan(
					new Date('2024-01-01').getTime()
				);
			});

			it('should throw error if no campaign is loaded', async () => {
				campaignStore._resetForTesting();

				const template = {
					id: 'template-1',
					name: 'Test',
					category: 'user',
					fieldDefinitions: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(campaignStore.addFieldTemplate(template)).rejects.toThrow();
			});
		});

		describe('updateFieldTemplate()', () => {
			it('should exist as a method on campaign store', () => {
				expect(campaignStore.updateFieldTemplate).toBeDefined();
				expect(typeof campaignStore.updateFieldTemplate).toBe('function');
			});

			it('should update an existing field template', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'Original Name',
								description: 'Original description',
								category: 'user',
								fieldDefinitions: [
									{
										key: 'field1',
										label: 'Field 1',
										type: 'text' as const,
										required: false,
										order: 1
									}
								],
								createdAt: new Date('2024-01-01'),
								updatedAt: new Date('2024-01-01')
							}
						],
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

				await campaignStore.updateFieldTemplate('template-1', {
					name: 'Updated Name',
					description: 'Updated description'
				});

				expect(mockDb.entities.update).toHaveBeenCalled();
				const updateCall = mockDb.entities.update.mock.calls[0];
				const updatedTemplate = updateCall[1].metadata.fieldTemplates[0];
				expect(updatedTemplate.name).toBe('Updated Name');
				expect(updatedTemplate.description).toBe('Updated description');
				expect(updatedTemplate.id).toBe('template-1'); // ID unchanged
			});

			it('should update updatedAt timestamp on template', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'Test',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date('2024-01-01'),
								updatedAt: new Date('2024-01-01')
							}
						],
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

				await campaignStore.updateFieldTemplate('template-1', {
					name: 'Updated Name'
				});

				const updateCall = mockDb.entities.update.mock.calls[0];
				const updatedTemplate = updateCall[1].metadata.fieldTemplates[0];
				expect(updatedTemplate.updatedAt).toBeInstanceOf(Date);
				expect(updatedTemplate.updatedAt.getTime()).toBeGreaterThan(
					new Date('2024-01-01').getTime()
				);
			});

			it('should throw error if template not found', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [],
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

				await expect(
					campaignStore.updateFieldTemplate('non-existent', { name: 'Updated' })
				).rejects.toThrow('Field template "non-existent" not found');
			});

			it('should allow updating fieldDefinitions', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'Test',
								category: 'user',
								fieldDefinitions: [
									{
										key: 'field1',
										label: 'Field 1',
										type: 'text' as const,
										required: false,
										order: 1
									}
								],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				const newFieldDefinitions = [
					{
						key: 'field1',
						label: 'Updated Field 1',
						type: 'text' as const,
						required: true,
						order: 1
					},
					{
						key: 'field2',
						label: 'Field 2',
						type: 'number' as const,
						required: false,
						order: 2
					}
				];

				await campaignStore.updateFieldTemplate('template-1', {
					fieldDefinitions: newFieldDefinitions
				});

				const updateCall = mockDb.entities.update.mock.calls[0];
				const updatedTemplate = updateCall[1].metadata.fieldTemplates[0];
				expect(updatedTemplate.fieldDefinitions).toHaveLength(2);
				expect(updatedTemplate.fieldDefinitions[0].label).toBe('Updated Field 1');
			});

			it('should throw error if no campaign is loaded', async () => {
				campaignStore._resetForTesting();

				await expect(
					campaignStore.updateFieldTemplate('template-1', { name: 'Updated' })
				).rejects.toThrow();
			});
		});

		describe('deleteFieldTemplate()', () => {
			it('should exist as a method on campaign store', () => {
				expect(campaignStore.deleteFieldTemplate).toBeDefined();
				expect(typeof campaignStore.deleteFieldTemplate).toBe('function');
			});

			it('should delete a field template', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'To Delete',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							},
							{
								id: 'template-2',
								name: 'To Keep',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				await campaignStore.deleteFieldTemplate('template-1');

				expect(mockDb.entities.update).toHaveBeenCalled();
				const updateCall = mockDb.entities.update.mock.calls[0];
				expect(updateCall[1].metadata.fieldTemplates).toHaveLength(1);
				expect(updateCall[1].metadata.fieldTemplates[0].id).toBe('template-2');
			});

			it('should throw error if template not found', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [],
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

				await expect(campaignStore.deleteFieldTemplate('non-existent')).rejects.toThrow(
					'Field template "non-existent" not found'
				);
			});

			it('should update updatedAt timestamp on campaign', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date('2024-01-01'),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'To Delete',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				await campaignStore.deleteFieldTemplate('template-1');

				const updateCall = mockDb.entities.update.mock.calls[0];
				expect(updateCall[1].updatedAt).toBeInstanceOf(Date);
			});

			it('should throw error if no campaign is loaded', async () => {
				campaignStore._resetForTesting();

				await expect(campaignStore.deleteFieldTemplate('template-1')).rejects.toThrow();
			});
		});

		describe('getFieldTemplate()', () => {
			it('should exist as a method on campaign store', () => {
				expect(campaignStore.getFieldTemplate).toBeDefined();
				expect(typeof campaignStore.getFieldTemplate).toBe('function');
			});

			it('should get a field template by ID', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'Test Template',
								description: 'A test template',
								category: 'user',
								fieldDefinitions: [
									{
										key: 'field1',
										label: 'Field 1',
										type: 'text' as const,
										required: false,
										order: 1
									}
								],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				const template = campaignStore.getFieldTemplate('template-1');

				expect(template).toBeDefined();
				expect(template?.id).toBe('template-1');
				expect(template?.name).toBe('Test Template');
				expect(template?.description).toBe('A test template');
				expect(template?.fieldDefinitions).toHaveLength(1);
			});

			it('should return undefined for non-existent template', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [],
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

				const template = campaignStore.getFieldTemplate('non-existent');

				expect(template).toBeUndefined();
			});

			it('should return undefined when no campaign is loaded', () => {
				campaignStore._resetForTesting();

				const template = campaignStore.getFieldTemplate('template-1');

				expect(template).toBeUndefined();
			});
		});

		describe('fieldTemplates getter', () => {
			it('should exist as a getter on campaign store', () => {
				expect(campaignStore.fieldTemplates).toBeDefined();
			});

			it('should return empty array when no campaign is loaded', () => {
				campaignStore._resetForTesting();

				expect(campaignStore.fieldTemplates).toEqual([]);
			});

			it('should return user field templates from campaign metadata', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [
							{
								id: 'template-1',
								name: 'User Template 1',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							},
							{
								id: 'template-2',
								name: 'User Template 2',
								category: 'user',
								fieldDefinitions: [],
								createdAt: new Date(),
								updatedAt: new Date()
							}
						],
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

				const templates = campaignStore.fieldTemplates;

				expect(templates).toHaveLength(2);
				expect(templates[0].id).toBe('template-1');
				expect(templates[1].id).toBe('template-2');
			});

			it('should return empty array when campaign has no fieldTemplates', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
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

				const templates = campaignStore.fieldTemplates;

				expect(templates).toEqual([]);
			});

			it('should handle campaigns created before fieldTemplates were added', async () => {
				const oldCampaign: BaseEntity = {
					id: 'old-campaign',
					type: 'campaign',
					name: 'Old Campaign',
					description: 'Created before field templates',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date('2023-01-01'),
					metadata: {
						// No fieldTemplates field
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

				const templates = campaignStore.fieldTemplates;

				expect(templates).toEqual([]);
			});
		});

		describe('Deep Cloning and Immutability', () => {
			it('should deep clone metadata when adding template', async () => {
				const campaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						fieldTemplates: [],
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

				const template = {
					id: 'template-1',
					name: 'Test',
					category: 'user',
					fieldDefinitions: [
						{
							key: 'field1',
							label: 'Field 1',
							type: 'text' as const,
							required: false,
							order: 1
						}
					],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await campaignStore.addFieldTemplate(template);

				// Verify update was called with cloned data (no Svelte 5 Proxy wrappers)
				expect(mockDb.entities.update).toHaveBeenCalled();
			});
		});
	});
});
