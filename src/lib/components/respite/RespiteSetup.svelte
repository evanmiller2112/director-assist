<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';

	interface HeroInput {
		name: string;
		heroId?: string;
		recoveries: { current: number; max: number };
	}

	interface CreateRespiteSetupOutput {
		name: string;
		description?: string;
		heroes: HeroInput[];
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
	let heroes = $state<HeroInput[]>(initialData?.heroes || []);
	let victoryPointsAvailable = $state(initialData?.victoryPointsAvailable || 0);

	// Validation
	let nameError = $state('');

	function addHero() {
		heroes.push({ name: '', recoveries: { current: 0, max: 8 } });
	}

	function removeHero(index: number) {
		heroes.splice(index, 1);
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

		const validHeroes = heroes.filter((h) => h.name.trim());

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
					<div class="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
						<div class="flex-1 space-y-2">
							<input
								type="text"
								bind:value={hero.name}
								placeholder="Hero name"
								class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
							/>
							<div class="flex gap-3">
								<div class="flex items-center gap-2">
									<label for="hero-current-{index}" class="text-xs text-gray-600 dark:text-gray-400">Current</label>
									<input
										id="hero-current-{index}"
										type="number"
										min="0"
										bind:value={hero.recoveries.current}
										class="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
									/>
								</div>
								<div class="flex items-center gap-2">
									<label for="hero-max-{index}" class="text-xs text-gray-600 dark:text-gray-400">Max</label>
									<input
										id="hero-max-{index}"
										type="number"
										min="1"
										bind:value={hero.recoveries.max}
										class="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
									/>
								</div>
							</div>
						</div>
						<button
							type="button"
							onclick={() => removeHero(index)}
							class="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
							aria-label="Remove hero"
						>
							<Trash2 class="h-5 w-5" />
						</button>
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
