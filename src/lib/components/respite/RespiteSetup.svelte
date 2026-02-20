<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';
	import type { BaseEntity } from '$lib/types';

	interface HeroInput {
		name: string;
		heroId?: string;
		recoveries: { current: number; max: number };
		mode: 'entity' | 'manual'; // UI-only, stripped before submission
		searchQuery: string; // UI-only, stripped before submission
	}

	interface CreateRespiteSetupOutput {
		name: string;
		description?: string;
		heroes: Array<{
			name: string;
			heroId?: string;
			recoveries: { current: number; max: number };
		}>;
		victoryPointsAvailable: number;
	}

	interface Props {
		initialData?: Partial<CreateRespiteSetupOutput>;
		onCreate?: (data: CreateRespiteSetupOutput) => void;
		onCancel?: () => void;
	}

	let { initialData, onCreate, onCancel }: Props = $props();

	// Form state
	let name = $state(initialData?.name || '');
	let description = $state(initialData?.description || '');
	let heroes = $state<HeroInput[]>(
		initialData?.heroes?.map(h => ({
			...h,
			mode: 'entity' as const,
			searchQuery: ''
		})) || []
	);
	let victoryPointsAvailable = $state(initialData?.victoryPointsAvailable || 0);

	// Validation
	let nameError = $state('');

	// Derived state for character entities
	const characterEntities = $derived(
		entitiesStore.entities.filter((e) => e.type === 'character')
	);

	function addHero() {
		heroes.push({
			name: '',
			recoveries: { current: 0, max: 8 },
			mode: 'entity',
			searchQuery: ''
		});
	}

	function removeHero(index: number) {
		heroes.splice(index, 1);
	}

	function selectEntity(index: number, entity: BaseEntity) {
		heroes[index].name = entity.name;
		heroes[index].heroId = entity.id;
		heroes[index].searchQuery = '';
	}

	function clearEntitySelection(index: number) {
		heroes[index].name = '';
		heroes[index].heroId = undefined;
		heroes[index].searchQuery = '';
	}

	function setHeroMode(index: number, mode: 'entity' | 'manual') {
		const currentName = heroes[index].name;
		heroes[index].mode = mode;

		if (mode === 'entity') {
			// Switching to entity mode: clear everything
			heroes[index].name = '';
			heroes[index].heroId = undefined;
			heroes[index].searchQuery = '';
		} else {
			// Switching to manual mode: preserve name but clear heroId
			// This allows users to manually edit an entity name they selected
			heroes[index].heroId = undefined;
			heroes[index].searchQuery = '';
			// Keep the current name if there is one
		}
	}

	function getFilteredEntities(searchQuery: string) {
		if (!searchQuery.trim()) return characterEntities;
		const query = searchQuery.toLowerCase();
		return characterEntities.filter((e) => e.name.toLowerCase().includes(query));
	}

	function validate(): boolean {
		let isValid = true;
		if (!name.trim()) {
			nameError = 'Name is required';
			isValid = false;
		} else {
			nameError = '';
		}
		return isValid;
	}

	function handleSubmit() {
		if (!validate()) return;

		// Strip UI-only fields (mode, searchQuery) and filter out empty heroes
		const validHeroes = heroes
			.filter((h) => h.name.trim())
			.map(({ mode, searchQuery, ...hero }) => {
				// Remove heroId if it's undefined (manually entered heroes)
				const result: { name: string; recoveries: { current: number; max: number }; heroId?: string } = {
					name: hero.name,
					recoveries: hero.recoveries
				};
				if (hero.heroId) {
					result.heroId = hero.heroId;
				}
				return result;
			});

		if (onCreate) {
			onCreate({
				name: name.trim(),
				description: description.trim() || undefined,
				heroes: validHeroes,
				victoryPointsAvailable
			});
		}
	}

	function handleCancel() {
		if (onCancel) onCancel();
	}

	$effect(() => {
		if (name) nameError = '';
	});
</script>

<div class="space-y-6">
	<!-- Name -->
	<div>
		<label for="respite-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
			Respite Name <span class="text-red-600">*</span>
		</label>
		<input
			id="respite-name"
			type="text"
			bind:value={name}
			required
			aria-required="true"
			aria-invalid={!!nameError}
			placeholder="e.g., Rest at the Golden Inn"
			class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		/>
		{#if nameError}
			<p class="mt-1 text-sm text-red-600">{nameError}</p>
		{/if}
	</div>

	<!-- Description -->
	<div>
		<label for="respite-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
			Description
		</label>
		<textarea
			id="respite-description"
			bind:value={description}
			rows="3"
			placeholder="Optional description of the respite location and circumstances"
			class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		></textarea>
	</div>

	<!-- Victory Points -->
	<div>
		<label for="vp-available" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
			Victory Points Available
		</label>
		<input
			id="vp-available"
			type="number"
			min="0"
			bind:value={victoryPointsAvailable}
			class="mt-1 block w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		/>
		<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">VP earned that can be converted to XP during this respite</p>
	</div>

	<!-- Heroes -->
	<fieldset class="space-y-3">
		<legend class="text-lg font-semibold text-gray-900 dark:text-white">Heroes</legend>

		{#if heroes.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">No heroes added yet. Add heroes to track their recoveries.</p>
		{:else}
			<div class="space-y-3">
				{#each heroes as hero, index}
					<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
						<div class="space-y-3">
							<!-- Mode Toggle -->
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => setHeroMode(index, 'entity')}
									class={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
										hero.mode === 'entity'
											? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
											: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
									}`}
									aria-pressed={hero.mode === 'entity'}
								>
									From Entity
								</button>
								<button
									type="button"
									onclick={() => setHeroMode(index, 'manual')}
									class={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
										hero.mode === 'manual'
											? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
											: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
									}`}
									aria-pressed={hero.mode === 'manual'}
								>
									Manual
								</button>
							</div>

							<!-- Entity Mode -->
							{#if hero.mode === 'entity'}
								<!-- Entity Search and List -->
								<div class="space-y-2">
									{#if hero.heroId && hero.name}
										<!-- Selected Entity Display -->
										<div class="px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
											<div class="flex justify-between items-center">
												<div class="text-sm font-medium text-blue-900 dark:text-blue-100">
													<span class="text-xs text-blue-700 dark:text-blue-300">Selected:</span>
													<span>{hero.name}</span>
												</div>
												<button
													type="button"
													onclick={() => clearEntitySelection(index)}
													class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
													aria-label="Clear selection"
												>
													Clear Selection
												</button>
											</div>
										</div>
									{/if}

									<input
										type="text"
										bind:value={hero.searchQuery}
										placeholder="Search character entities..."
										aria-label="Search character entities"
										class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
									/>

									{#if characterEntities.length === 0}
										<p class="text-sm text-gray-500 dark:text-gray-400 py-2">No character entities exist. Create character entities or switch to Manual mode.</p>
									{:else}
										{@const filteredEntities = getFilteredEntities(hero.searchQuery)}
										{#if filteredEntities.length === 0}
											<p class="text-sm text-gray-500 dark:text-gray-400 py-2">No character entities found matching your search.</p>
										{:else}
											<div class="max-h-48 overflow-y-auto space-y-1">
												{#each filteredEntities as entity (entity.id)}
													<button
														type="button"
														onclick={() => selectEntity(index, entity)}
														class={`w-full text-left px-3 py-2 rounded-md border transition-colors text-sm ${
															hero.heroId === entity.id
																? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 selected active'
																: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
														}`}
													>
														{entity.name}
													</button>
												{/each}
											</div>
										{/if}
									{/if}
								</div>
							{:else}
								<!-- Manual Mode -->
								<input
									type="text"
									bind:value={hero.name}
									placeholder="Hero name"
									class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
								/>
							{/if}

							<!-- Recovery Fields (always visible) -->
							<div class="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
								<div class="flex items-center gap-2">
									<label for="hero-current-{index}" class="text-xs text-gray-600 dark:text-gray-400">Current</label>
									<input
										id="hero-current-{index}"
										type="number"
										min="0"
										bind:value={hero.recoveries.current}
										class="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
									/>
								</div>
								<div class="flex items-center gap-2">
									<label for="hero-max-{index}" class="text-xs text-gray-600 dark:text-gray-400">Max</label>
									<input
										id="hero-max-{index}"
										type="number"
										min="1"
										bind:value={hero.recoveries.max}
										class="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
									/>
								</div>
								<div class="ml-auto">
									<button
										type="button"
										onclick={() => removeHero(index)}
										class="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
										aria-label="Remove hero"
									>
										<Trash2 class="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<button
			type="button"
			onclick={addHero}
			class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
		>
			<Plus class="h-4 w-4" /> Add Hero
		</button>
	</fieldset>

	<!-- Actions -->
	<div class="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
		{#if onCancel}
			<button
				type="button"
				onclick={handleCancel}
				class="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
			>
				Cancel
			</button>
		{/if}
		<button
			type="button"
			onclick={handleSubmit}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			Create Respite
		</button>
	</div>
</div>
