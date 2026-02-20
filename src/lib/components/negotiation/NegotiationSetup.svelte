<script lang="ts">
	import { CANONICAL_MOTIVATION_TYPES } from '$lib/types/negotiation';
	import type { BaseEntity } from '$lib/types';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';

	interface MotivationInput {
		type: string;
		isKnown: boolean;
	}

	interface PitfallInput {
		type: string;
		isKnown: boolean;
	}

	interface CreateNegotiationInput {
		name: string;
		npcName: string;
		npcEntityId?: string;
		description?: string;
		interest: number;
		patience: number;
		impression: number;
		motivations: MotivationInput[];
		pitfalls: PitfallInput[];
	}

	interface Props {
		initialData?: Partial<CreateNegotiationInput>;
		onCreate?: (data: CreateNegotiationInput) => void;
		onCancel?: () => void;
		submitLabel?: string;
	}

	let { initialData, onCreate, onCancel, submitLabel = 'Create Negotiation' }: Props = $props();

	// Form state
	let name = $state(initialData?.name || '');
	let npcName = $state(initialData?.npcName || '');
	let npcEntityId = $state(initialData?.npcEntityId);
	let description = $state(initialData?.description || '');
	let interest = $state(initialData?.interest || 2);
	let patience = $state(initialData?.patience || 5);
	let impression = $state(initialData?.impression || 0);
	let motivations = $state<MotivationInput[]>(initialData?.motivations || []);
	let pitfalls = $state<PitfallInput[]>(initialData?.pitfalls || []);

	// NPC entity selector state
	let npcMode = $state<'entity' | 'manual'>('entity');
	let npcSearchQuery = $state('');

	// Validation errors
	let nameError = $state('');
	let npcNameError = $state('');
	let motivationError = $state('');
	let pitfallError = $state('');

	// Derived state for NPC entities (character or npc type)
	const npcEntities = $derived(
		entitiesStore.entities.filter((e) => e.type === 'npc' || e.type === 'character')
	);

	const filteredNpcEntities = $derived.by(() => {
		if (!npcSearchQuery.trim()) return npcEntities;
		const query = npcSearchQuery.toLowerCase();
		return npcEntities.filter((e) => e.name.toLowerCase().includes(query));
	});

	function formatMotivationType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function selectNpcEntity(entity: BaseEntity) {
		npcName = entity.name;
		npcEntityId = entity.id;
		npcSearchQuery = '';
	}

	function clearNpcEntitySelection() {
		npcName = '';
		npcEntityId = undefined;
		npcSearchQuery = '';
	}

	function setNpcMode(mode: 'entity' | 'manual') {
		npcMode = mode;
		if (mode === 'entity') {
			// Switching to entity mode: clear everything
			npcName = '';
			npcEntityId = undefined;
			npcSearchQuery = '';
		} else {
			// Switching to manual mode: preserve name but clear entityId
			npcEntityId = undefined;
			npcSearchQuery = '';
		}
	}

	function addMotivation() {
		motivations.push({ type: 'charity', isKnown: false });
		motivationError = '';
	}

	function removeMotivation(index: number) {
		motivations.splice(index, 1);
		motivationError = '';
	}

	function addPitfall() {
		pitfalls.push({ type: 'greed', isKnown: false });
		pitfallError = '';
	}

	function removePitfall(index: number) {
		pitfalls.splice(index, 1);
		pitfallError = '';
	}

	function checkDuplicateMotivations() {
		const types = motivations.map((m) => m.type);
		const duplicates = types.filter((type, index) => types.indexOf(type) !== index);
		if (duplicates.length > 0) {
			motivationError = 'Duplicate motivation types detected. Each motivation must be unique.';
			return true;
		}
		motivationError = '';
		return false;
	}

	function checkDuplicatePitfalls() {
		const types = pitfalls.map((p) => p.type);
		const duplicates = types.filter((type, index) => types.indexOf(type) !== index);
		if (duplicates.length > 0) {
			pitfallError = 'Duplicate pitfall types detected. Each pitfall must be unique.';
			return true;
		}
		pitfallError = '';
		return false;
	}

	function validate(): boolean {
		let isValid = true;

		if (!name.trim()) {
			nameError = 'Name is required';
			isValid = false;
		} else {
			nameError = '';
		}

		if (!npcName.trim()) {
			npcNameError = 'NPC name is required';
			isValid = false;
		} else {
			npcNameError = '';
		}

		if (checkDuplicateMotivations()) {
			isValid = false;
		}

		if (checkDuplicatePitfalls()) {
			isValid = false;
		}

		return isValid;
	}

	function handleSubmit() {
		if (!validate()) {
			return;
		}

		if (onCreate) {
			onCreate({
				name: name.trim(),
				npcName: npcName.trim(),
				npcEntityId: npcEntityId,
				description: description.trim() || undefined,
				interest,
				patience,
				impression,
				motivations,
				pitfalls
			});
		}
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}

	// Clear validation errors when fields change
	$effect(() => {
		if (name) nameError = '';
	});

	$effect(() => {
		if (npcName) npcNameError = '';
	});

	const canAddMoreMotivations = $derived(motivations.length < 12);
</script>

<div class="space-y-6">
	<!-- Basic Information -->
	<div class="space-y-4">
		<!-- Name -->
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Negotiation Name <span class="text-red-600">*</span>
			</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				required
				aria-required="true"
				aria-invalid={!!nameError}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
			{#if nameError}
				<p class="mt-1 text-sm text-red-600">{nameError}</p>
			{/if}
		</div>

		<!-- NPC Name with Entity Selector -->
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				NPC Name <span class="text-red-600">*</span>
			</label>

			<!-- Mode Toggle -->
			<div class="flex gap-2 mb-3">
				<button
					type="button"
					onclick={() => setNpcMode('entity')}
					class={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
						npcMode === 'entity'
							? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
							: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
					}`}
					aria-pressed={npcMode === 'entity'}
				>
					From Entity
				</button>
				<button
					type="button"
					onclick={() => setNpcMode('manual')}
					class={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
						npcMode === 'manual'
							? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 active selected'
							: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
					}`}
					aria-pressed={npcMode === 'manual'}
				>
					Manual
				</button>
			</div>

			<!-- Entity Mode -->
			{#if npcMode === 'entity'}
				<div class="space-y-2">
					{#if npcEntityId && npcName}
						<!-- Selected Entity Display -->
						<div class="px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
							<div class="flex justify-between items-center">
								<div class="text-sm font-medium text-blue-900 dark:text-blue-100">
									<span class="text-xs text-blue-700 dark:text-blue-300">Selected:</span>
									<span>{npcName}</span>
								</div>
								<button
									type="button"
									onclick={clearNpcEntitySelection}
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
						bind:value={npcSearchQuery}
						placeholder="Search NPC/character entities..."
						aria-label="Search NPC entities"
						class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
					/>

					{#if npcEntities.length === 0}
						<p class="text-sm text-gray-500 dark:text-gray-400 py-2">No NPC or character entities exist. Create entities or switch to Manual mode.</p>
					{:else}
						{@const filteredList = filteredNpcEntities}
						{#if filteredList.length === 0}
							<p class="text-sm text-gray-500 dark:text-gray-400 py-2">No entities found matching your search.</p>
						{:else}
							<div class="max-h-48 overflow-y-auto space-y-1">
								{#each filteredList as entity (entity.id)}
									<button
										type="button"
										onclick={() => selectNpcEntity(entity)}
										class={`w-full text-left px-3 py-2 rounded-md border transition-colors text-sm ${
											npcEntityId === entity.id
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
					bind:value={npcName}
					placeholder="NPC name"
					aria-required="true"
					aria-invalid={!!npcNameError}
					class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
				/>
			{/if}

			{#if npcNameError}
				<p class="mt-1 text-sm text-red-600">{npcNameError}</p>
			{/if}
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Description
			</label>
			<textarea
				id="description"
				bind:value={description}
				rows="3"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			></textarea>
		</div>

		<!-- Starting Interest -->
		<div>
			<label for="interest" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Starting Interest
			</label>
			<select
				id="interest"
				bind:value={interest}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				<option value={1}>1</option>
				<option value={2}>2</option>
				<option value={3}>3</option>
				<option value={4}>4</option>
			</select>
			<p class="mt-1 text-xs text-gray-500">How interested the NPC is initially (1-4)</p>
		</div>

		<!-- Starting Patience -->
		<div>
			<label for="patience" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Starting Patience
			</label>
			<select
				id="patience"
				bind:value={patience}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				<option value={1}>1</option>
				<option value={2}>2</option>
				<option value={3}>3</option>
				<option value={4}>4</option>
				<option value={5}>5</option>
			</select>
			<p class="mt-1 text-xs text-gray-500">How patient the NPC is initially (1-5)</p>
		</div>

		<!-- Starting Impression -->
		<div>
			<label for="impression" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Starting Impression
			</label>
			<select
				id="impression"
				bind:value={impression}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				<option value={0}>0</option>
				<option value={1}>1</option>
				<option value={2}>2</option>
				<option value={3}>3</option>
				<option value={4}>4</option>
				<option value={5}>5</option>
			</select>
			<p class="mt-1 text-xs text-gray-500">How impressed the NPC is initially (0-5)</p>
		</div>
	</div>

	<!-- Motivations Section -->
	<fieldset class="space-y-3">
		<legend class="text-lg font-semibold text-gray-900 dark:text-gray-100">Motivations</legend>

		{#if motivations.length === 0}
			<p class="text-sm text-gray-500">No motivations added yet.</p>
		{:else}
			<div class="space-y-2">
				{#each motivations as motivation, index}
					<div
						data-testid="motivation-{index}"
						class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
					>
						<div class="flex-1 space-y-2">
							<label for="motivation-type-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Motivation Type
							</label>
							<input
								id="motivation-type-{index}"
								type="text"
								list="motivation-suggestions"
								bind:value={motivation.type}
								oninput={() => checkDuplicateMotivations()}
								class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
							<datalist id="motivation-suggestions">
								{#each CANONICAL_MOTIVATION_TYPES as type}
									<option value={type}>{formatMotivationType(type)}</option>
								{/each}
							</datalist>
						</div>

						<div class="flex items-center gap-2">
							<input
								id="motivation-known-{index}"
								type="checkbox"
								bind:checked={motivation.isKnown}
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label for="motivation-known-{index}" class="text-sm text-gray-700 dark:text-gray-300">
								Known to heroes
							</label>
						</div>

						<button
							type="button"
							onclick={() => removeMotivation(index)}
							class="rounded-md p-2 text-red-600 hover:bg-red-50"
							aria-label="Remove motivation"
						>
							<Trash2 class="h-5 w-5" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		{#if motivationError}
			<p class="text-sm text-red-600">{motivationError}</p>
		{/if}

		<button
			type="button"
			onclick={addMotivation}
			disabled={!canAddMoreMotivations}
			class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
		>
			<Plus class="h-4 w-4" /> Add Motivation
		</button>
	</fieldset>

	<!-- Pitfalls Section -->
	<fieldset class="space-y-3">
		<legend class="text-lg font-semibold text-gray-900 dark:text-gray-100">Pitfalls</legend>

		{#if pitfalls.length === 0}
			<p class="text-sm text-gray-500">No pitfalls added yet.</p>
		{:else}
			<div class="space-y-2">
				{#each pitfalls as pitfall, index}
					<div
						data-testid="pitfall-{index}"
						class="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
					>
						<div class="flex-1 space-y-2">
							<label for="pitfall-type-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Pitfall Type
							</label>
							<input
								id="pitfall-type-{index}"
								type="text"
								list="pitfall-suggestions"
								bind:value={pitfall.type}
								oninput={() => checkDuplicatePitfalls()}
								class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
							<datalist id="pitfall-suggestions">
								{#each CANONICAL_MOTIVATION_TYPES as type}
									<option value={type}>{formatMotivationType(type)}</option>
								{/each}
							</datalist>
						</div>

						<div class="flex items-center gap-2">
							<input
								id="pitfall-known-{index}"
								type="checkbox"
								bind:checked={pitfall.isKnown}
								class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
							/>
							<label for="pitfall-known-{index}" class="text-sm text-gray-700 dark:text-gray-300">
								Known to heroes
							</label>
						</div>

						<button
							type="button"
							onclick={() => removePitfall(index)}
							class="rounded-md p-2 text-red-600 hover:bg-red-100"
							aria-label="Remove pitfall"
						>
							<Trash2 class="h-5 w-5" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		{#if pitfallError}
			<p class="text-sm text-red-600">{pitfallError}</p>
		{/if}

		<button
			type="button"
			onclick={addPitfall}
			class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
		>
			<Plus class="h-4 w-4" /> Add Pitfall
		</button>
	</fieldset>

	<!-- Action Buttons -->
	<div class="flex justify-end gap-3 border-t pt-4">
		{#if onCancel}
			<button
				type="button"
				onclick={handleCancel}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
			>
				Cancel
			</button>
		{/if}
		<button
			type="button"
			onclick={handleSubmit}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			{submitLabel}
		</button>
	</div>
</div>
