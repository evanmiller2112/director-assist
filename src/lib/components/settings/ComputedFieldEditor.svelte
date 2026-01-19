<script lang="ts">
	import type { ComputedFieldConfig, FieldDefinition } from '$lib/types';

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
		<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
			Use {'{fieldName}'} to reference other fields. Supports +, -, *, /, parentheses, and basic JavaScript operators.
		</p>
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
			<option value="text">Text</option>
			<option value="number">Number</option>
			<option value="boolean">Boolean</option>
		</select>
	</div>

	<!-- Available Fields -->
	<div>
		<label class="label">Available Fields</label>
		{#if selectableFields.length === 0}
			<p class="text-sm text-slate-500 dark:text-slate-400">
				No fields available. Add other fields first.
			</p>
		{:else}
			<div class="flex flex-wrap gap-2 mt-2">
				{#each selectableFields as field}
					<button
						type="button"
						class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600"
						onclick={() => insertField(field.key)}
						title="{field.label} ({field.type})"
					>
						<span class="font-medium">{field.key}</span>
						<span class="text-slate-500 dark:text-slate-400 ml-1">({field.label})</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Dependencies Display -->
	{#if formula && !validationError}
		{@const dependencies = detectDependencies(formula)}
		{#if dependencies.length > 0}
			<div>
				<label class="label text-sm">Dependencies</label>
				<div class="text-sm text-slate-600 dark:text-slate-400">
					{dependencies.join(', ')}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Preview -->
	<div>
		<label class="label">Preview</label>
		<div class="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
			{previewResult || 'Enter a formula to see preview'}
		</div>
	</div>
</div>
