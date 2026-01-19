<script lang="ts">
	/**
	 * Manual Test Page for FieldInput and FieldRenderer Components
	 * Phase 4: Entity Form Field Rendering (Issue #25)
	 *
	 * This page provides a visual test of all field types in both input and display modes.
	 */

	import FieldInput from '$lib/components/entity/FieldInput.svelte';
	import FieldRenderer from '$lib/components/entity/FieldRenderer.svelte';
	import type { FieldDefinition } from '$lib/types';

	let formValues = $state<Record<string, any>>({
		text_field: 'Sample text',
		textarea_field: 'Line 1\nLine 2\nLine 3',
		richtext_field: '# Heading\n\nSome **bold** text and *italic* text.',
		number_field: 42,
		boolean_field: true,
		date_field: '2024-01-15',
		select_field: 'option2',
		multiselect_field: ['option1', 'option3'],
		tags_field: ['tag1', 'tag2', 'tag3'],
		url_field: 'https://example.com',
		computed_field: null
	});

	const testFields: FieldDefinition[] = [
		{
			key: 'text_field',
			label: 'Text Field',
			type: 'text',
			required: true,
			placeholder: 'Enter text...',
			helpText: 'This is a text field',
			order: 1
		},
		{
			key: 'textarea_field',
			label: 'Text Area Field',
			type: 'textarea',
			required: false,
			placeholder: 'Enter long text...',
			order: 2
		},
		{
			key: 'richtext_field',
			label: 'Rich Text Field',
			type: 'richtext',
			required: false,
			order: 3
		},
		{
			key: 'number_field',
			label: 'Number Field',
			type: 'number',
			required: false,
			placeholder: '0',
			order: 4
		},
		{
			key: 'boolean_field',
			label: 'Boolean Field',
			type: 'boolean',
			required: false,
			order: 5
		},
		{
			key: 'date_field',
			label: 'Date Field',
			type: 'date',
			required: false,
			order: 6
		},
		{
			key: 'select_field',
			label: 'Select Field',
			type: 'select',
			required: false,
			options: ['option1', 'option2', 'option3', 'long_option_name'],
			order: 7
		},
		{
			key: 'multiselect_field',
			label: 'Multi-Select Field',
			type: 'multi-select',
			required: false,
			options: ['option1', 'option2', 'option3'],
			order: 8
		},
		{
			key: 'tags_field',
			label: 'Tags Field',
			type: 'tags',
			required: false,
			placeholder: 'Enter comma-separated tags',
			order: 9
		},
		{
			key: 'url_field',
			label: 'URL Field',
			type: 'url',
			required: false,
			placeholder: 'https://example.com',
			order: 10
		},
		{
			key: 'computed_field',
			label: 'Computed Field (Number × 2)',
			type: 'computed',
			required: false,
			order: 11,
			computedConfig: {
				formula: '{number_field} * 2',
				dependencies: ['number_field'],
				outputType: 'number'
			}
		}
	];

	function handleFieldChange(key: string, value: any) {
		formValues[key] = value;
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="text-3xl font-bold mb-8">Field Components Test Page</h1>

	<div class="grid grid-cols-2 gap-8">
		<!-- Left Column: FieldInput Components -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Input Mode (Editable)</h2>
			<div class="space-y-6">
				{#each testFields as field}
					<div class="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900">
						<FieldInput
							{field}
							bind:value={formValues[field.key]}
							onchange={(val) => handleFieldChange(field.key, val)}
							allFields={formValues}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right Column: FieldRenderer Components -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Display Mode (Read-Only)</h2>
			<div class="space-y-6">
				{#each testFields as field}
					<div class="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900">
						<FieldRenderer {field} value={formValues[field.key]} allFields={formValues} />
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Debug: Show current form values -->
	<div class="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
		<h3 class="text-lg font-bold mb-2">Current Form Values (Debug)</h3>
		<pre class="text-xs overflow-auto">{JSON.stringify(formValues, null, 2)}</pre>
	</div>
</div>
