<script lang="ts">
	import { onMount } from 'svelte';
	import { aiSettings, campaignStore, debugStore, notificationStore, uiStore } from '$lib/stores';
	import { db } from '$lib/db';
	import { entityRepository, chatRepository, appConfigRepository } from '$lib/db/repositories';
	import { convertOldCampaignToEntity } from '$lib/db/migrations/migrateCampaignToEntity';
	import type { CampaignBackup, ModelInfo } from '$lib/types';
	import {
		fetchModels,
		getSelectedModel,
		setSelectedModel,
		clearModelsCache,
		getFallbackModels,
		getRelationshipContextSettings,
		setRelationshipContextSettings,
		setLastExportedAt,
		setLastMilestoneReached,
		getLastExportedAt,
		getDaysSinceExport,
		refreshAllStores,
		resetAllStores,
		type RelationshipContextSettings,
		getLastPublishedAt,
		getDaysSincePublish,
		getPublishFreshness,
		type PublishFreshness
	} from '$lib/services';
	import { Download, Upload, Moon, Sun, Monitor, Trash2, Key, RefreshCw, Layers, ChevronRight, Users, Globe } from 'lucide-svelte';
	import PlayerExportModal from '$lib/components/settings/PlayerExportModal.svelte';
	import PublishPlayerDataModal from '$lib/components/settings/PublishPlayerDataModal.svelte';
	import ForgeSteelImportModal from '$lib/components/settings/ForgeSteelImportModal.svelte';
	import LoadingButton from '$lib/components/ui/LoadingButton.svelte';
	import { SystemSelector, CampaignLinkingSettings } from '$lib/components/settings';
	import PlayerExportFieldSettings from '$lib/components/settings/PlayerExportFieldSettings.svelte';
	import { getAllEntityTypes } from '$lib/config/entityTypes';
	import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
	import { page } from '$app/stores';

	// Form state
	let apiKey = $state('');
	let isExporting = $state(false);
	let isImporting = $state(false);
	let showPlayerExportModal = $state(false);
	let showPublishModal = $state(false);
	let showForgeSteelImportModal = $state(false);

	// Model selection state
	let models = $state<ModelInfo[]>([]);
	let selectedModel = $state('');
	let isLoadingModels = $state(false);
	let modelError = $state<string | null>(null);

	// Relationship context settings state
	let relationshipSettings = $state<RelationshipContextSettings>(getRelationshipContextSettings());

	// System profile state
	let currentSystemId = $state<string>('draw-steel');
	let isSavingSystem = $state(false);

	// Last export state
	let lastExportedAt = $state<Date | null>(null);
	let daysSinceExport = $state<number | null>(null);

	// Last publish state
	let lastPublishedAt = $state<Date | null>(null);
	let publishFreshness = $state<PublishFreshness>('never');
	let publishDaysSince = $state<number | null>(null);

	// Player export field config state
	let fieldConfig = $state<PlayerExportFieldConfig>({ fieldVisibility: {} });

	// Handle initialization and action parameters
	onMount(() => {
		debugStore.load();

		// Load API key and models from storage
		const stored = localStorage.getItem('dm-assist-api-key');
		if (stored) {
			apiKey = stored;
			loadModels(stored);
		}
		selectedModel = getSelectedModel();

		// Load last export info
		const exportDate = getLastExportedAt();
		lastExportedAt = exportDate;
		daysSinceExport = getDaysSinceExport(exportDate);

		// Load last publish state
		lastPublishedAt = getLastPublishedAt();
		publishDaysSince = getDaysSincePublish(lastPublishedAt);
		publishFreshness = getPublishFreshness(publishDaysSince);

		// Load player export field config
		const config = campaignStore.playerExportFieldConfig;
		if (config) {
			fieldConfig = config;
		}

		// Handle action parameter (e.g., ?action=export)
		const actionParam = $page.url.searchParams.get('action');
		if (actionParam === 'export') {
			// Trigger export
			exportBackup();
		}
	});

	// Sync current system profile from campaign (only update if different)
	$effect(() => {
		const systemProfile = campaignStore.getCurrentSystemProfile();
		if (systemProfile && systemProfile.id !== currentSystemId) {
			currentSystemId = systemProfile.id;
		}
	});

	async function loadModels(key: string) {
		isLoadingModels = true;
		modelError = null;
		try {
			models = await fetchModels(key);
		} catch (error) {
			modelError = error instanceof Error ? error.message : 'Failed to load models';
			models = getFallbackModels();
		} finally {
			isLoadingModels = false;
		}
	}

	function handleModelChange() {
		setSelectedModel(selectedModel);
		notificationStore.success('Model preference saved!');
	}

	async function refreshModels() {
		clearModelsCache();
		const key = localStorage.getItem('dm-assist-api-key');
		if (key) {
			await loadModels(key);
			notificationStore.success('Models refreshed!');
		}
	}

	function saveRelationshipSettings() {
		setRelationshipContextSettings(relationshipSettings);
		notificationStore.success('Relationship context settings saved!');
	}

	async function handleSystemChange(systemId: string) {
		isSavingSystem = true;
		try {
			await campaignStore.setSystemProfile(systemId);
			notificationStore.success('Game system updated!');
		} catch (error) {
			console.error('Failed to update system:', error);
			notificationStore.error('Failed to update game system');
			// Revert on error
			const systemProfile = campaignStore.getCurrentSystemProfile();
			if (systemProfile) {
				currentSystemId = systemProfile.id;
			}
		} finally {
			isSavingSystem = false;
		}
	}

	function saveApiKey() {
		if (typeof window !== 'undefined') {
			if (apiKey) {
				localStorage.setItem('dm-assist-api-key', apiKey);
				clearModelsCache();
				loadModels(apiKey);
			} else {
				localStorage.removeItem('dm-assist-api-key');
				models = [];
			}
			notificationStore.success('API key saved!');
		}
	}

	async function exportBackup() {
		isExporting = true;
		try {
			// Get all entities including campaigns
			const entities = await db.entities.toArray();
			const chatHistory = await db.chatMessages.toArray();
			const activeCampaignId = await appConfigRepository.getActiveCampaignId();

			// Find active campaign for naming the backup
			const activeCampaign = entities.find(e => e.type === 'campaign' && e.id === activeCampaignId);

			if (!activeCampaign) {
				notificationStore.error('No campaign to export');
				return;
			}

			// Read selected model from localStorage
			const storedModel = localStorage.getItem('dm-assist-selected-model');
			const modelToExport = storedModel?.trim() || undefined;

			// Issue #310: Get combat and montage sessions
			const combatSessions = await db.combatSessions.toArray();
			const montageSessions = await db.montageSessions.toArray();
			// Issue #392: Get negotiation sessions
			const negotiationSessions = await db.negotiationSessions.toArray();

			const exportDate = new Date();
			const backup: CampaignBackup = {
				version: '2.0.0', // New format version
				exportedAt: exportDate,
				entities, // Campaign is now included in entities
				chatHistory,
				activeCampaignId: activeCampaignId ?? undefined,
				selectedModel: modelToExport,
				combatSessions,
				montageSessions,
				negotiationSessions
			};

			const json = JSON.stringify(backup, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `${activeCampaign.name.replace(/\s+/g, '-').toLowerCase()}-backup-${exportDate.toISOString().split('T')[0]}.json`;
			a.click();

			URL.revokeObjectURL(url);

			// Save export timestamp and update milestone
			setLastExportedAt(exportDate);

			// Calculate current entity count (exclude campaigns) and update milestone
			const entityCount = entities.filter(e => e.type !== 'campaign').length;

			// Define milestones
			const milestones = [5, 10, 25, 50];
			let milestone = 0;

			// Check fixed milestones
			for (const m of milestones) {
				if (entityCount >= m) {
					milestone = m;
				}
			}

			// Check 50-increment milestones after 50
			if (entityCount >= 100) {
				milestone = Math.floor(entityCount / 50) * 50;
			}

			setLastMilestoneReached(milestone);

			// Update local state
			lastExportedAt = exportDate;
			daysSinceExport = 0;

			notificationStore.success('Backup exported successfully!');
		} catch (error) {
			console.error('Export failed:', error);
			notificationStore.error('Failed to export backup');
		} finally {
			isExporting = false;
		}
	}

	async function importBackup() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			isImporting = true;
			try {
				const text = await file.text();
				const backup = JSON.parse(text) as CampaignBackup;

				// Validate backup structure - must have entities (new format) or campaign (old format)
				if (!backup.version || !backup.entities) {
					throw new Error('Invalid backup file format');
				}

				// Check if this is old format (has campaign object) or new format (campaign in entities)
				const isOldFormat = !!backup.campaign;
				const hasCampaignEntity = backup.entities.some(e => e.type === 'campaign');

				// Validate that we have campaign data in some form
				if (!isOldFormat && !hasCampaignEntity) {
					throw new Error('Backup must contain at least one campaign');
				}

				if (
					!confirm(
						'This will replace your current campaign data. Are you sure you want to continue?'
					)
				) {
					return;
				}

				// Import data
				await db.transaction(
					'rw',
					[db.campaign, db.entities, db.chatMessages, db.appConfig, db.combatSessions, db.montageSessions, db.negotiationSessions],
					async () => {
						await db.campaign.clear();
						await db.entities.clear();
						await db.chatMessages.clear();
						await db.appConfig.clear();
						await db.combatSessions.clear();
						await db.montageSessions.clear();
						await db.negotiationSessions.clear();

						// Handle old format: convert campaign to entity
						let entitiesToImport = [...backup.entities];
						let activeCampaignId = backup.activeCampaignId;

						if (isOldFormat && backup.campaign) {
							const campaignEntity = convertOldCampaignToEntity(backup.campaign);
							entitiesToImport.push(campaignEntity);
							activeCampaignId = campaignEntity.id;
						}

						await db.entities.bulkAdd(entitiesToImport);

						if (backup.chatHistory) {
							await db.chatMessages.bulkAdd(backup.chatHistory);
						}

						// Issue #310: Restore combat and montage sessions
						if (backup.combatSessions && backup.combatSessions.length > 0) {
							await db.combatSessions.bulkAdd(backup.combatSessions);
						}

						if (backup.montageSessions && backup.montageSessions.length > 0) {
							await db.montageSessions.bulkAdd(backup.montageSessions);
						}

						// Issue #392: Restore negotiation sessions
						if (backup.negotiationSessions && backup.negotiationSessions.length > 0) {
							await db.negotiationSessions.bulkAdd(backup.negotiationSessions);
						}

						// Set active campaign
						if (activeCampaignId) {
							await db.appConfig.put({ key: 'activeCampaignId', value: activeCampaignId });
						} else {
							// Use first campaign entity
							const firstCampaign = entitiesToImport.find(e => e.type === 'campaign');
							if (firstCampaign) {
								await db.appConfig.put({ key: 'activeCampaignId', value: firstCampaign.id });
							}
						}
					}
				);

				// Restore selected model from backup
				if (backup.selectedModel) {
					localStorage.setItem('dm-assist-selected-model', backup.selectedModel);
					selectedModel = backup.selectedModel;
				} else {
					localStorage.removeItem('dm-assist-selected-model');
				}

				// Reload stores
				await refreshAllStores();

				notificationStore.success('Backup imported successfully!');
			} catch (error) {
				console.error('Import failed:', error);
				notificationStore.error('Failed to import backup. Please check the file format.');
			} finally {
				isImporting = false;
			}
		};

		input.click();
	}

	function handlePublished(publishedAt: Date) {
		lastPublishedAt = publishedAt;
		publishDaysSince = getDaysSincePublish(lastPublishedAt);
		publishFreshness = getPublishFreshness(publishDaysSince);
	}

	// Get entity types for player export settings (exclude campaign)
	const entityTypesForExport = $derived(
		getAllEntityTypes(
			campaignStore.customEntityTypes,
			campaignStore.entityTypeOverrides
		).filter(typeDef => typeDef.type !== 'campaign')
	);

	async function handleFieldConfigChange(newConfig: PlayerExportFieldConfig) {
		fieldConfig = newConfig;
		await campaignStore.updatePlayerExportFieldConfig(newConfig);
	}

	async function clearAllData() {
		if (
			!confirm(
				'This will permanently delete ALL campaign data. This cannot be undone. Are you sure?'
			)
		) {
			return;
		}

		if (!confirm('Really delete everything? Export a backup first if unsure.')) {
			return;
		}

		try {
			await db.transaction(
				'rw',
				[db.campaign, db.entities, db.chatMessages, db.suggestions],
				async () => {
					await db.campaign.clear();
					await db.entities.clear();
					await db.chatMessages.clear();
					await db.suggestions.clear();
				}
			);

			// Reset stores and reload from empty database
			await resetAllStores();
			await campaignStore.load(); // This will create a default campaign
		} catch (error) {
			console.error('Failed to clear data:', error);
			notificationStore.error('Failed to clear data');
		}
	}
</script>

<svelte:head>
	<title>Settings - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>

	<!-- Campaign Management -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Campaign</h2>
		<p class="text-slate-600 dark:text-slate-400 mb-4">
			Campaigns are now managed as entities. You can create, edit, and switch between campaigns.
		</p>
		<a href="/entities/campaign" class="btn btn-secondary inline-flex items-center gap-2">
			<Layers class="w-4 h-4" />
			Manage Campaigns
			<ChevronRight class="w-4 h-4" />
		</a>
	</section>

	<!-- Game System -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Game System</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
			Select the game system for your campaign. This determines which fields appear on entity forms (e.g., Draw Steel adds ancestry, class, and kit fields to characters).
		</p>
		<SystemSelector
			bind:value={currentSystemId}
			onchange={handleSystemChange}
			disabled={isSavingSystem || !campaignStore.campaign}
			showDescription={true}
		/>
		{#if !campaignStore.campaign}
			<p class="text-sm text-amber-600 dark:text-amber-400 mt-2">
				Create or select a campaign to change the game system.
			</p>
		{/if}
	</section>

	<!-- Campaign Linking -->
	<section class="mb-8">
		<CampaignLinkingSettings />
	</section>

	<!-- Theme -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Appearance</h2>
		<div class="flex gap-2">
			<button
				class="btn {uiStore.theme === 'light' ? 'btn-primary' : 'btn-secondary'}"
				onclick={() => uiStore.setTheme('light')}
			>
				<Sun class="w-4 h-4" />
				Light
			</button>
			<button
				class="btn {uiStore.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}"
				onclick={() => uiStore.setTheme('dark')}
			>
				<Moon class="w-4 h-4" />
				Dark
			</button>
			<button
				class="btn {uiStore.theme === 'system' ? 'btn-primary' : 'btn-secondary'}"
				onclick={() => uiStore.setTheme('system')}
			>
				<Monitor class="w-4 h-4" />
				System
			</button>
		</div>
	</section>

	<!-- Entity Types -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Entity Types</h2>
		<p class="text-sm text-slate-500 mb-4">
			Create custom entity types to organize your campaign content beyond the built-in types.
		</p>
		<a
			href="/settings/custom-entities"
			class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
		>
			<div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
				<Layers class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			</div>
			<div class="flex-1">
				<h3 class="font-medium text-slate-900 dark:text-white">Custom Entity Types</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400">
					{campaignStore.customEntityTypes.length} custom type{campaignStore.customEntityTypes.length !== 1 ? 's' : ''} defined
				</p>
			</div>
			<ChevronRight class="w-5 h-5 text-slate-400" />
		</a>
	</section>

	<!-- AI Settings -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">AI Assistant</h2>
		<div class="space-y-4">
			<!-- AI Mode Selection -->
			<div class="space-y-3">
				<div class="label">AI Mode</div>
				<div class="space-y-2">
					<!-- Off Option -->
					<label class="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-2 {aiSettings.aiMode === 'off' ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'}">
						<input
							type="radio"
							name="aiMode"
							value="off"
							checked={aiSettings.aiMode === 'off'}
							onchange={() => aiSettings.setMode('off')}
							class="mt-1 w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500"
						/>
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">Off</div>
							<div class="text-sm text-slate-500 dark:text-slate-400">AI features disabled</div>
						</div>
					</label>

					<!-- Suggestions Option -->
					<label class="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-2 {aiSettings.aiMode === 'suggestions' ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'}">
						<input
							type="radio"
							name="aiMode"
							value="suggestions"
							checked={aiSettings.aiMode === 'suggestions'}
							onchange={() => aiSettings.setMode('suggestions')}
							class="mt-1 w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500"
						/>
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">Suggestions Only</div>
							<div class="text-sm text-slate-500 dark:text-slate-400">AI suggests content, you choose what to accept</div>
						</div>
					</label>

					<!-- Full Auto Option -->
					<label class="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-2 {aiSettings.aiMode === 'full' ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'}">
						<input
							type="radio"
							name="aiMode"
							value="full"
							checked={aiSettings.aiMode === 'full'}
							onchange={() => aiSettings.setMode('full')}
							class="mt-1 w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500"
						/>
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">Full Auto</div>
							<div class="text-sm text-slate-500 dark:text-slate-400">AI automatically generates content for new entities</div>
						</div>
					</label>
				</div>
			</div>

			{#if aiSettings.isEnabled}
			<div>
				<label for="apiKey" class="label">API Key</label>
				<p class="text-sm text-slate-500 mb-2">
					Enter your Anthropic key to enable AI features. Get one from
					<a
						href="https://console.anthropic.com/"
						target="_blank"
						rel="noopener"
						class="text-blue-600 hover:underline">console.anthropic.com</a
					>
				</p>
				<div class="flex gap-2">
					<input
						id="apiKey"
						type="password"
						class="input flex-1"
						bind:value={apiKey}
						placeholder="sk-ant-..."
					/>
					<button class="btn btn-secondary" onclick={saveApiKey}>
						<Key class="w-4 h-4" />
						Save
					</button>
				</div>
				<p class="text-xs text-slate-500 mt-2">
					Your key is stored locally in your browser and never sent to our servers.
				</p>
			</div>

			<!-- Model Selection -->
			{#if apiKey}
				<div>
					<label for="model" class="label">Claude Model</label>
					<p class="text-sm text-slate-500 mb-2">
						Select which Claude model to use for AI features. More capable models cost more per request.
					</p>
					<div class="flex gap-2">
						<select
							id="model"
							class="input flex-1"
							bind:value={selectedModel}
							disabled={isLoadingModels}
							onchange={handleModelChange}
						>
							{#if isLoadingModels}
								<option value="">Loading models...</option>
							{:else if models.length === 0}
								<option value="">No models available</option>
							{:else}
								{#each models as model}
									<option value={model.id}>{model.display_name}</option>
								{/each}
							{/if}
						</select>
						<button
							class="btn btn-secondary"
							onclick={refreshModels}
							disabled={isLoadingModels}
							title="Refresh available models"
						>
							<RefreshCw class="w-4 h-4 {isLoadingModels ? 'animate-spin' : ''}" />
						</button>
					</div>
					{#if modelError}
						<p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
							Could not load models from API. Using default options.
						</p>
					{/if}
				</div>
			{/if}
			{/if}
		</div>
	</section>

	<!-- Relationship Context Settings -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Relationship Context</h2>
		<p class="text-sm text-slate-500 mb-4">
			Configure how related entities are included in AI generation context. These settings help balance context richness with API token usage.
		</p>
		<div class="space-y-4">
			<!-- Enable/Disable -->
			<div class="flex items-center gap-2">
				<input
					id="relationship-enabled"
					type="checkbox"
					class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
					bind:checked={relationshipSettings.enabled}
				/>
				<label for="relationship-enabled" class="text-sm font-medium text-slate-700 dark:text-slate-300">
					Include related entities in generation context
				</label>
			</div>

			<!-- Max Related Entities -->
			<div>
				<label for="max-related-entities" class="label">Maximum Related Entities</label>
				<p class="text-sm text-slate-500 mb-2">
					Limit how many related entities to include (1-50). Higher values provide more context but use more tokens.
				</p>
				<input
					id="max-related-entities"
					type="number"
					class="input"
					bind:value={relationshipSettings.maxRelatedEntities}
					min="1"
					max="50"
				/>
			</div>

			<!-- Max Characters -->
			<div>
				<label for="max-characters" class="label">Maximum Characters per Entity</label>
				<p class="text-sm text-slate-500 mb-2">
					Truncate entity content to this length (1000-10000). Prevents very large entities from consuming too much context.
				</p>
				<input
					id="max-characters"
					type="number"
					class="input"
					bind:value={relationshipSettings.maxCharacters}
					min="1000"
					max="10000"
					step="500"
				/>
			</div>

			<!-- Context Budget Allocation -->
			<div>
				<label for="context-budget" class="label">
					Context Budget for Relationships: {relationshipSettings.contextBudgetAllocation}%
				</label>
				<p class="text-sm text-slate-500 mb-2">
					Percentage of total context budget to allocate for related entities (0-100). The rest goes to primary context.
				</p>
				<input
					id="context-budget"
					type="range"
					class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
					bind:value={relationshipSettings.contextBudgetAllocation}
					min="0"
					max="100"
				/>
				<div class="flex justify-between text-xs text-slate-500 mt-1">
					<span>0% (Minimal)</span>
					<span>50% (Balanced)</span>
					<span>100% (Maximum)</span>
				</div>
			</div>

			<!-- Auto Generate Summaries -->
			<div class="flex items-center gap-2">
				<input
					id="auto-generate-summaries"
					type="checkbox"
					class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
					bind:checked={relationshipSettings.autoGenerateSummaries}
				/>
				<label for="auto-generate-summaries" class="text-sm font-medium text-slate-700 dark:text-slate-300">
					Automatically generate entity summaries (requires API key and tokens)
				</label>
			</div>

			<!-- Save Button -->
			<button class="btn btn-primary" onclick={saveRelationshipSettings}>
				Save Relationship Settings
			</button>
		</div>
	</section>

	<!-- Backup & Restore -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Backup & Restore</h2>
		<p class="text-sm text-slate-500 mb-4">
			Export your campaign data to a JSON file for backup or to switch between campaigns.
		</p>

		<!-- Last export indicator -->
		{#if lastExportedAt}
			<div class="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
				<p class="text-sm">
					<span class="text-slate-600 dark:text-slate-400">Last export:</span>
					{#if daysSinceExport === 0}
						<span class="text-green-600 dark:text-green-400 font-medium">Today</span>
					{:else if daysSinceExport === 1}
						<span class="text-green-600 dark:text-green-400 font-medium">1 day ago</span>
					{:else if daysSinceExport !== null && daysSinceExport < 7}
						<span class="text-green-600 dark:text-green-400 font-medium">{daysSinceExport} days ago</span>
					{:else if daysSinceExport !== null && daysSinceExport < 14}
						<span class="text-yellow-600 dark:text-yellow-400 font-medium">{daysSinceExport} days ago</span>
					{:else if daysSinceExport !== null}
						<span class="text-red-600 dark:text-red-400 font-medium">{daysSinceExport} days ago</span>
					{/if}
				</p>
			</div>
		{:else}
			<div class="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
				<p class="text-sm">
					<span class="text-slate-600 dark:text-slate-400">Last export:</span>
					<span class="text-slate-500 dark:text-slate-400 font-medium">Never</span>
				</p>
			</div>
		{/if}

		<div class="flex gap-2">
			<LoadingButton
				variant="secondary"
				loading={isExporting}
				disabled={isImporting}
				loadingText="Exporting..."
				onclick={exportBackup}
			>
				{#snippet leftIcon()}
					<Download class="w-4 h-4" />
				{/snippet}
				Export Backup
			</LoadingButton>
			<LoadingButton
				variant="secondary"
				loading={isImporting}
				disabled={isExporting}
				loadingText="Importing..."
				onclick={importBackup}
			>
				{#snippet leftIcon()}
					<Upload class="w-4 h-4" />
				{/snippet}
				Import Backup
			</LoadingButton>
		</div>
	</section>

	<!-- Player View -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Player View</h2>
		<p class="text-sm text-slate-500 mb-4">
			Publish player-safe campaign data for your player-facing instance, or export in various formats.
		</p>

		<!-- Last Published Indicator -->
		<div class="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
			<div class="flex items-center gap-2 text-sm">
				<span class="text-slate-600 dark:text-slate-400">Last published:</span>
				{#if publishFreshness === 'never'}
					<span class="text-slate-400 dark:text-slate-500">Never</span>
				{:else if publishFreshness === 'fresh'}
					<span class="inline-flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-green-500"></span>
						<span class="text-green-600 dark:text-green-400 font-medium">
							{publishDaysSince === 0 ? 'Today' : ''}
						</span>
					</span>
				{:else if publishFreshness === 'stale'}
					<span class="inline-flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-yellow-500"></span>
						<span class="text-yellow-600 dark:text-yellow-400 font-medium">
							{publishDaysSince} day{publishDaysSince === 1 ? '' : 's'} ago
						</span>
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-red-500"></span>
						<span class="text-red-600 dark:text-red-400 font-medium">
							{publishDaysSince} day{publishDaysSince === 1 ? '' : 's'} ago
						</span>
					</span>
				{/if}
			</div>
		</div>

		<!-- Field Visibility Settings -->
		<div class="mb-6">
			<h3 class="text-base font-medium text-slate-900 dark:text-white mb-2">
				Field Visibility Configuration
			</h3>
			<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
				Control which fields are visible in player exports and published data. Customize visibility for each entity type.
			</p>
			<PlayerExportFieldSettings
				entityTypes={entityTypesForExport}
				config={fieldConfig}
				onConfigChange={handleFieldConfigChange}
			/>
		</div>

		<!-- Buttons -->
		<div class="flex flex-wrap gap-3">
			<button
				class="btn btn-primary inline-flex items-center gap-2"
				onclick={() => showPublishModal = true}
			>
				<Globe class="w-4 h-4" />
				Publish to Player View
			</button>
			<button
				class="btn btn-secondary inline-flex items-center gap-2"
				onclick={() => showPlayerExportModal = true}
			>
				<Users class="w-4 h-4" />
				Export for Players
			</button>
		</div>
	</section>

	<!-- Forge Steel Import -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Import from Forge Steel</h2>
		<p class="text-sm text-slate-500 mb-4">
			Import character data from Forge Steel character builder. Accepts .json or .ds-hero files.
		</p>
		<button
			class="btn btn-secondary inline-flex items-center gap-2"
			onclick={() => showForgeSteelImportModal = true}
		>
			<Upload class="w-4 h-4" />
			Import Character
		</button>
	</section>

	<!-- Advanced -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Advanced</h2>
		<div class="space-y-4">
			<!-- Debug Console Toggle -->
			<div class="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
				<div class="flex-1">
					<label for="debugToggle" class="label mb-1 cursor-pointer">Enable Debug Console</label>
					<p class="text-sm text-slate-500 dark:text-slate-400">
						Show detailed information about AI requests and responses for troubleshooting.
					</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input
						id="debugToggle"
						type="checkbox"
						class="sr-only peer"
						checked={debugStore.enabled}
						onchange={() => debugStore.setEnabled(!debugStore.enabled)}
						role="switch"
						aria-label="Enable Debug Console"
					/>
					<div
						class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"
					></div>
				</label>
			</div>
		</div>
	</section>

	<!-- Danger Zone -->
	<section class="border-t border-red-200 dark:border-red-900 pt-8">
		<h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
		<p class="text-sm text-slate-500 mb-4">
			Permanently delete all campaign data. This cannot be undone.
		</p>
		<button class="btn bg-red-600 text-white hover:bg-red-700" onclick={clearAllData}>
			<Trash2 class="w-4 h-4" />
			Delete All Data
		</button>
	</section>
</div>

<!-- Player Export Modal -->
<PlayerExportModal bind:open={showPlayerExportModal} onclose={() => showPlayerExportModal = false} />

<!-- Publish Player Data Modal -->
<PublishPlayerDataModal bind:open={showPublishModal} onpublished={handlePublished} />

<!-- Forge Steel Import Modal -->
<ForgeSteelImportModal
	bind:open={showForgeSteelImportModal}
	onimport={() => showForgeSteelImportModal = false}
	oncancel={() => showForgeSteelImportModal = false}
/>
