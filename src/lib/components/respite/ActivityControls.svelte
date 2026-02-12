<script lang="ts">
	/**
	 * ActivityControls Component
	 *
	 * Form for adding/editing respite activities.
	 */

	import type { RespiteActivityType, RecordActivityInput } from '$lib/types/respite';
	import { getTemplatesByType, type ActivityTemplate } from '$lib/config/respiteTemplates';

	interface Props {
		onRecord?: (data: RecordActivityInput) => void;
	}

	let { onRecord }: Props = $props();

	const activityTypes: { value: RespiteActivityType; label: string }[] = [
		{ value: 'project', label: 'Project' },
		{ value: 'crafting', label: 'Crafting' },
		{ value: 'socializing', label: 'Socializing' },
		{ value: 'training', label: 'Training' },
		{ value: 'investigation', label: 'Investigation' },
		{ value: 'other', label: 'Other' }
	];

	let activityName = $state('');
	let activityDescription = $state('');
	let activityType = $state<RespiteActivityType>('project');
	let activityNotes = $state('');
	let nameError = $state('');

	// Template quick-select
	const currentTemplates = $derived(getTemplatesByType(activityType));

	function applyTemplate(template: ActivityTemplate) {
		activityName = template.name;
		activityDescription = template.description;
		activityType = template.type;
		nameError = '';
	}

	function validate(): boolean {
		if (!activityName.trim()) {
			nameError = 'Activity name is required';
			return false;
		}
		nameError = '';
		return true;
	}

	function handleRecord() {
		if (!validate()) return;

		onRecord?.({
			name: activityName.trim(),
			description: activityDescription.trim() || undefined,
			type: activityType,
			notes: activityNotes.trim() || undefined
		});

		// Reset form
		activityName = '';
		activityDescription = '';
		activityType = 'project';
		activityNotes = '';
	}

	$effect(() => {
		if (activityName) nameError = '';
	});
</script>

<div class="space-y-4">
	<!-- Activity Name -->
	<div>
		<label for="activity-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Activity Name <span class="text-red-600">*</span>
		</label>
		<input
			id="activity-name"
			type="text"
			bind:value={activityName}
			required
			aria-required="true"
			aria-invalid={!!nameError}
			placeholder="e.g., Research ancient texts"
			class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
		/>
		{#if nameError}
			<p class="mt-1 text-sm text-red-600">{nameError}</p>
		{/if}
	</div>

	<!-- Activity Type -->
	<div>
		<label for="activity-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Activity Type
		</label>
		<select
			id="activity-type"
			bind:value={activityType}
			class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
		>
			{#each activityTypes as type}
				<option value={type.value}>{type.label}</option>
			{/each}
		</select>
	</div>

	<!-- Template Quick-Select -->
	{#if currentTemplates.length > 0}
		<div>
			<label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quick Templates</label>
			<div class="flex flex-wrap gap-1">
				{#each currentTemplates as template}
					<button
						type="button"
						onclick={() => applyTemplate(template)}
						class="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						title={template.description}
					>
						{template.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Description -->
	<div>
		<label for="activity-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Description
		</label>
		<textarea
			id="activity-description"
			bind:value={activityDescription}
			rows="2"
			placeholder="Optional description"
			class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
		></textarea>
	</div>

	<!-- Notes -->
	<div>
		<label for="activity-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Notes
		</label>
		<textarea
			id="activity-notes"
			bind:value={activityNotes}
			rows="2"
			placeholder="Optional notes"
			class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
		></textarea>
	</div>

	<!-- Record Button -->
	<button
		type="button"
		onclick={handleRecord}
		class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
	>
		Add Activity
	</button>
</div>
