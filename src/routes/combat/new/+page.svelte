<script lang="ts">
	import { goto } from '$app/navigation';
	import { Swords } from 'lucide-svelte';
	import { combatStore } from '$lib/stores';

	let name = $state('');
	let description = $state('');
	let isCreating = $state(false);
	let error = $state<string | null>(null);

	async function handleCreate() {
		if (!name.trim()) {
			error = 'Combat name is required';
			return;
		}

		isCreating = true;
		error = null;

		try {
			const combat = await combatStore.createCombat({
				name: name.trim(),
				description: description.trim() || undefined
			});

			// Navigate to the new combat
			goto(`/combat/${combat.id}`);
		} catch (err: any) {
			error = err.message || 'Failed to create combat';
			isCreating = false;
		}
	}

	function handleCancel() {
		goto('/combat');
	}
</script>

<div class="new-combat-page p-6 max-w-2xl mx-auto">
	<!-- Header -->
	<div class="flex items-center gap-3 mb-6">
		<Swords class="w-8 h-8 text-slate-700 dark:text-slate-300" />
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white">New Combat Session</h1>
	</div>

	<!-- Form -->
	<div class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
		>
			<div class="space-y-4">
				<!-- Name -->
				<div>
					<label for="combat-name" class="label">
						Combat Name <span class="text-red-500">*</span>
					</label>
					<input
						id="combat-name"
						type="text"
						class="input"
						bind:value={name}
						placeholder="e.g., Dragon Encounter, Bandit Ambush"
						required
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="combat-description" class="label">Description (optional)</label>
					<textarea
						id="combat-description"
						class="input"
						bind:value={description}
						placeholder="Brief description of the combat encounter..."
						rows="3"
					></textarea>
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-sm text-red-700 dark:text-red-300">{error}</p>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-3 pt-4">
					<button
						type="submit"
						class="btn btn-primary flex-1"
						disabled={isCreating || !name.trim()}
					>
						{isCreating ? 'Creating...' : 'Create Combat'}
					</button>
					<button
						type="button"
						class="btn btn-secondary"
						onclick={handleCancel}
						disabled={isCreating}
					>
						Cancel
					</button>
				</div>
			</div>
		</form>
	</div>

	<!-- Info Panel -->
	<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
		<h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h3>
		<ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
			<li>• Add heroes and creatures to the combat</li>
			<li>• Set initiative for all combatants</li>
			<li>• Start combat to begin tracking turns</li>
		</ul>
	</div>
</div>
