<script lang="ts">
	import { campaignStore, notificationStore, uiStore } from '$lib/stores';
	import { db } from '$lib/db';
	import { entityRepository, campaignRepository, chatRepository } from '$lib/db/repositories';
	import type { CampaignBackup, ModelInfo } from '$lib/types';
	import {
		fetchModels,
		getSelectedModel,
		setSelectedModel,
		clearModelsCache,
		getFallbackModels
	} from '$lib/services';
	import { Download, Upload, Save, Moon, Sun, Monitor, Trash2, Key, RefreshCw } from 'lucide-svelte';

	// Form state
	let campaignName = $state(campaignStore.campaign?.name ?? '');
	let campaignDescription = $state(campaignStore.campaign?.description ?? '');
	let campaignSystem = $state(campaignStore.campaign?.system ?? '');
	let campaignSetting = $state(campaignStore.campaign?.setting ?? '');
	let apiKey = $state('');
	let isSaving = $state(false);

	// Model selection state
	let models = $state<ModelInfo[]>([]);
	let selectedModel = $state('');
	let isLoadingModels = $state(false);
	let modelError = $state<string | null>(null);

	// Update form when campaign loads
	$effect(() => {
		if (campaignStore.campaign) {
			campaignName = campaignStore.campaign.name;
			campaignDescription = campaignStore.campaign.description;
			campaignSystem = campaignStore.campaign.system;
			campaignSetting = campaignStore.campaign.setting;
		}
	});

	// Load API key and models from storage
	$effect(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('dm-assist-api-key');
			if (stored) {
				apiKey = stored;
				loadModels(stored);
			}
			selectedModel = getSelectedModel();
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

	async function saveCampaign() {
		isSaving = true;
		try {
			await campaignStore.update({
				name: campaignName,
				description: campaignDescription,
				system: campaignSystem,
				setting: campaignSetting
			});
		} finally {
			isSaving = false;
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
		try {
			const campaign = await campaignRepository.getCurrentSync();
			const entities = await db.entities.toArray();
			const chatHistory = await db.chatMessages.toArray();

			if (!campaign) {
				notificationStore.error('No campaign to export');
				return;
			}

			const backup: CampaignBackup = {
				version: '1.0.0',
				exportedAt: new Date(),
				campaign,
				entities,
				chatHistory
			};

			const json = JSON.stringify(backup, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `${campaign.name.replace(/\s+/g, '-').toLowerCase()}-backup-${new Date().toISOString().split('T')[0]}.json`;
			a.click();

			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
			notificationStore.error('Failed to export backup');
		}
	}

	async function importBackup() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const backup = JSON.parse(text) as CampaignBackup;

				// Validate backup structure
				if (!backup.version || !backup.campaign || !backup.entities) {
					throw new Error('Invalid backup file format');
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
					[db.campaign, db.entities, db.chatMessages],
					async () => {
						await db.campaign.clear();
						await db.entities.clear();
						await db.chatMessages.clear();

						await db.campaign.add(backup.campaign);
						await db.entities.bulkAdd(backup.entities);
						if (backup.chatHistory) {
							await db.chatMessages.bulkAdd(backup.chatHistory);
						}
					}
				);

				// Reload stores
				await campaignStore.load();

				notificationStore.success('Backup imported successfully!');
				window.location.reload();
			} catch (error) {
				console.error('Import failed:', error);
				notificationStore.error('Failed to import backup. Please check the file format.');
			}
		};

		input.click();
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

			window.location.reload();
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

	<!-- Campaign Settings -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Campaign</h2>
		<div class="space-y-4">
			<div>
				<label for="name" class="label">Campaign Name</label>
				<input id="name" type="text" class="input" bind:value={campaignName} />
			</div>

			<div>
				<label for="description" class="label">Description</label>
				<textarea
					id="description"
					class="input min-h-[80px]"
					bind:value={campaignDescription}
				></textarea>
			</div>

			<div>
				<label for="system" class="label">Game System</label>
				<input
					id="system"
					type="text"
					class="input"
					bind:value={campaignSystem}
					placeholder="e.g., D&D 5e, Pathfinder, Draw Steel"
				/>
			</div>

			<div>
				<label for="setting" class="label">Setting</label>
				<input
					id="setting"
					type="text"
					class="input"
					bind:value={campaignSetting}
					placeholder="e.g., Forgotten Realms, Homebrew World"
				/>
			</div>

			<button class="btn btn-primary" onclick={saveCampaign} disabled={isSaving}>
				<Save class="w-4 h-4" />
				{isSaving ? 'Saving...' : 'Save Campaign'}
			</button>
		</div>
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

	<!-- AI Settings -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">AI Assistant</h2>
		<div class="space-y-4">
			<div>
				<label for="apiKey" class="label">Anthropic API Key</label>
				<p class="text-sm text-slate-500 mb-2">
					Enter your API key to enable AI features. Get one from
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
					Your API key is stored locally in your browser and never sent to our servers.
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
		</div>
	</section>

	<!-- Backup & Restore -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Backup & Restore</h2>
		<p class="text-sm text-slate-500 mb-4">
			Export your campaign data to a JSON file for backup or to switch between campaigns.
		</p>
		<div class="flex gap-2">
			<button class="btn btn-secondary" onclick={exportBackup}>
				<Download class="w-4 h-4" />
				Export Backup
			</button>
			<button class="btn btn-secondary" onclick={importBackup}>
				<Upload class="w-4 h-4" />
				Import Backup
			</button>
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
