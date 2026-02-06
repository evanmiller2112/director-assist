<script lang="ts">
	import type { ComputedFieldConfig, FieldDefinition } from '$lib/types';
	import { DRAW_STEEL_EXAMPLES, type ComputedFieldExample } from '$lib/config/computedFieldExamples';

	interface Props {
		availableFields: FieldDefinition[];
		config: ComputedFieldConfig;
		onchange?: (config: ComputedFieldConfig) => void;
	}

	let { availableFields = [], config, onchange }: Props = $props();

	// Local state
	let formula = $state(config?.formula ?? '');
	let outputType = $state<'text' | 'number' | 'boolean'>(config?.outputType ?? 'text');
	let validationError = $state<string | null>(null);
	let previewResult = $state<string>('');
	let showExamples = $state(false);

	// Group examples by category
	const examplesByCategory = $derived(() => {
		const grouped = new Map<string, ComputedFieldExample[]>();
		for (const example of DRAW_STEEL_EXAMPLES) {
			const category = example.category;
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(example);
		}
		return grouped;
	});

	// Filter out computed fields from available fields
	const selectableFields = $derived(
		availableFields.filter((f) => f.type !== 'computed')
	);

	// Auto-detect dependencies from formula
	function detectDependencies(formulaStr: string): string[] {
		const matches = formulaStr.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
		if (!matches) return [];
		const deps = matches.map((m) => m.slice(1, -1));
		// Deduplicate
		return [...new Set(deps)];
	}

	// Validate formula syntax
	function validateFormula(formulaStr: string): string | null {
		if (!formulaStr.trim()) {
			return null; // Empty is okay
		}

		// Check for unmatched braces
		const openBraces = (formulaStr.match(/\{/g) || []).length;
		const closeBraces = (formulaStr.match(/\}/g) || []).length;
		if (openBraces !== closeBraces) {
			return 'Unmatched braces in formula';
		}

		// Check for invalid field references
		const deps = detectDependencies(formulaStr);
		const availableKeys = selectableFields.map((f) => f.key);
		const unknownFields = deps.filter((d) => !availableKeys.includes(d));
		if (unknownFields.length > 0) {
			return `Unknown field: ${unknownFields[0]}`;
		}

		// Try basic syntax validation
		const testFormula = formulaStr.replace(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, '1');
		try {
			// eslint-disable-next-line no-new-func
			new Function(`return ${testFormula}`);
		} catch (e) {
			return 'Invalid formula syntax';
		}

		return null;
	}

	// Compute preview result
	function computePreview(formulaStr: string): string {
		if (!formulaStr.trim()) {
			return 'Enter a formula to see preview';
		}

		const error = validateFormula(formulaStr);
		if (error) {
			return `Error: ${error}`;
		}

		// Replace field placeholders with example values
		let preview = formulaStr;
		const deps = detectDependencies(formulaStr);

		if (deps.length === 0) {
			// Static formula - try to evaluate
			try {
				// eslint-disable-next-line no-new-func
				const result = new Function(`return ${formulaStr}`)();
				return String(result);
			} catch (e) {
				return 'Error evaluating formula';
			}
		} else {
			// Show example with placeholder values
			const examples: string[] = [];
			deps.forEach((dep) => {
				const field = selectableFields.find((f) => f.key === dep);
				if (field) {
					const exampleValue = field.type === 'number' ? '10' : field.type === 'boolean' ? 'true' : '"example"';
					preview = preview.replace(new RegExp(`\\{${dep}\\}`, 'g'), exampleValue);
					examples.push(`${dep} = ${exampleValue}`);
				}
			});

			try {
				// eslint-disable-next-line no-new-func
				const result = new Function(`return ${preview}`)();
				return `${result} (with ${examples.join(', ')})`;
			} catch (e) {
				return 'Error evaluating formula';
			}
		}
	}

	// Handle formula change
	function handleFormulaChange(newFormula: string) {
		formula = newFormula;
		const error = validateFormula(formula);
		validationError = error;
		previewResult = computePreview(formula);

		// Always call onchange, even if there's an error (so parent can store the formula)
		const dependencies = detectDependencies(formula);
		onchange?.({
			formula,
			dependencies,
			outputType
		});
	}

	// Handle output type change
	function handleOutputTypeChange(newType: 'text' | 'number' | 'boolean') {
		outputType = newType;
		const dependencies = detectDependencies(formula);
		onchange?.({
			formula,
			dependencies,
			outputType
		});
	}

	// Insert field placeholder
	function insertField(fieldKey: string) {
		formula = formula ? `${formula} {${fieldKey}}` : `{${fieldKey}}`;
		handleFormulaChange(formula);
	}

	// Apply an example formula
	function applyExample(example: ComputedFieldExample) {
		formula = example.formula;
		outputType = example.outputType;
		handleFormulaChange(formula);
		handleOutputTypeChange(outputType);
		showExamples = false;
	}

	// Get color class for field type
	function getFieldTypeColor(type: string): string {
		switch (type) {
			case 'text':
			case 'textarea':
			case 'richtext':
				return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
			case 'number':
				return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
			case 'boolean':
				return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
			case 'select':
			case 'multi-select':
			case 'tags':
				return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
			case 'entity-ref':
			case 'entity-refs':
				return 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700';
			case 'date':
			case 'url':
			case 'image':
				return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
			default:
				return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
		}
	}

	// Get type badge for output type
	function getOutputTypeBadge(type: 'text' | 'number' | 'boolean'): string {
		switch (type) {
			case 'number':
				return '123';
			case 'boolean':
				return 'T/F';
			case 'text':
				return 'ABC';
		}
	}

	// Initialize preview
	$effect(() => {
		if (config?.formula) {
			formula = config.formula;
			outputType = config.outputType ?? 'text';
			validationError = validateFormula(formula);
			previewResult = computePreview(formula);
		}
	});
</script>

<div class="space-y-4">
	<!-- Formula Input -->
	<div>
		<label for="formula" class="label">Formula</label>
		<textarea
			id="formula"
			class="input min-h-[100px] font-mono text-sm"
			value={formula}
			oninput={(e) => handleFormulaChange(e.currentTarget.value)}
			placeholder="e.g., {'{field1}'} + {'{field2}'} * 2"
		></textarea>
		<div class="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
			<p>
				Use <code class="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{'{fieldName}'}</code> to reference other fields.
			</p>
			<div class="flex flex-wrap gap-x-4 gap-y-1">
				<span><strong>Operators:</strong> + - * / ( )</span>
				<span><strong>Comparison:</strong> &lt; &gt; &lt;= &gt;= == !=</span>
				<span><strong>Logic:</strong> && || !</span>
			</div>
		</div>
		{#if validationError}
			<p class="text-sm text-red-500 mt-1">{validationError}</p>
		{/if}
	</div>

	<!-- Output Type -->
	<div>
		<label for="output-type" class="label">Output Type</label>
		<select
			id="output-type"
			class="input"
			value={outputType}
			onchange={(e) => handleOutputTypeChange(e.currentTarget.value as 'text' | 'number' | 'boolean')}
		>
			<option value="text">Text (ABC) - String values</option>
			<option value="number">Number (123) - Numeric calculations</option>
			<option value="boolean">Boolean (T/F) - True/false conditions</option>
		</select>
		<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
			{#if outputType === 'number'}
				Returns numeric results (e.g., 42, 3.14, -10)
			{:else if outputType === 'boolean'}
				Returns true or false (e.g., HP &lt; 10, level &gt;= 5)
			{:else}
				Returns text strings (e.g., "Aragorn the Ranger")
			{/if}
		</p>
	</div>

	<!-- Examples Section -->
	<div class="border-t pt-4 border-slate-200 dark:border-slate-700">
		<button
			type="button"
			class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
			onclick={() => showExamples = !showExamples}
		>
			<svg class="w-4 h-4 transition-transform {showExamples ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span>Draw Steel Examples ({DRAW_STEEL_EXAMPLES.length} formulas)</span>
		</button>

		{#if showExamples}
			<div class="mt-3 space-y-4">
				{#each [...examplesByCategory().entries()] as [category, examples]}
					<div>
						<h4 class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
							{category}
						</h4>
						<div class="space-y-2">
							{#each examples as example}
								<button
									type="button"
									class="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-colors"
									onclick={() => applyExample(example)}
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="font-medium text-sm text-slate-900 dark:text-slate-100">
													{example.name}
												</span>
												<span class="px-1.5 py-0.5 text-xs font-mono rounded {
													example.outputType === 'number' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
													example.outputType === 'boolean' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
													'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
												}">
													{getOutputTypeBadge(example.outputType)}
												</span>
											</div>
											<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
												{example.description}
											</p>
											<code class="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block">
												{example.formula}
											</code>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Available Fields -->
	<div>
		<span class="label">Available Fields</span>
		{#if selectableFields.length === 0}
			<p class="text-sm text-slate-500 dark:text-slate-400">
				No fields available. Add other fields first.
			</p>
		{:else}
			<div class="flex flex-wrap gap-2 mt-2">
				{#each selectableFields as field}
					<button
						type="button"
						class="px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity border {getFieldTypeColor(field.type)}"
						onclick={() => insertField(field.key)}
						title="{field.label} ({field.type})"
					>
						<span class="font-medium">{field.key}</span>
						<span class="opacity-75 ml-1">({field.type})</span>
					</button>
				{/each}
			</div>
			<p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
				Click a field to insert it into your formula. Color indicates field type.
			</p>
		{/if}
	</div>

	<!-- Dependencies Display -->
	{#if formula && !validationError}
		{@const dependencies = detectDependencies(formula)}
		{#if dependencies.length > 0}
			<div>
				<span class="label text-sm">Dependencies</span>
				<div class="text-sm text-slate-600 dark:text-slate-400">
					{dependencies.join(', ')}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Preview -->
	<div>
		<span class="label">Preview</span>
		<div class="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
			{previewResult || 'Enter a formula to see preview'}
		</div>
	</div>
</div>
