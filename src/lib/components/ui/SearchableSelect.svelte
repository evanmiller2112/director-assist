<!--
  @component SearchableSelect

  A searchable combo box component that supports filtering, custom values, and keyboard navigation.
  Replaces traditional select dropdowns with a more flexible text input + dropdown pattern.

  GitHub Issue #429: Replace select dropdowns with searchable combo box that supports custom values

  @prop {string} [id] - Optional ID for the input element
  @prop {string} value - Current selected value
  @prop {string[]} options - Built-in options to display
  @prop {string[]} [customOptions=[]] - User-added custom options
  @prop {string} [placeholder='Select or type...'] - Placeholder text
  @prop {boolean} [disabled=false] - Disabled state
  @prop {string} [error=''] - Error message to display
  @prop {Function} onchange - Callback when value changes
  @prop {Function} [onAddCustom] - Callback when custom value is added

  @example
  ```svelte
  <SearchableSelect
    id="character-class"
    value={characterClass}
    options={['fighter', 'rogue', 'wizard']}
    customOptions={customClasses}
    placeholder="Select class..."
    onchange={(val) => characterClass = val}
    onAddCustom={(val) => customClasses = [...customClasses, val]}
  />
  ```
-->
<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		id?: string;
		value: string;
		options: string[];
		customOptions?: string[];
		placeholder?: string;
		disabled?: boolean;
		error?: string;
		onchange: (value: string) => void;
		onAddCustom?: (value: string) => void;
	}

	let {
		id,
		value = $bindable(''),
		options,
		customOptions = [],
		placeholder = 'Select or type...',
		disabled = false,
		error = '',
		onchange,
		onAddCustom
	}: Props = $props();

	// State
	let isOpen = $state(false);
	let searchText = $state('');
	let highlightedIndex = $state(-1);
	let containerRef: HTMLDivElement | undefined = $state();
	let inputRef: HTMLInputElement | undefined = $state();

	// Generate unique IDs for accessibility
	const listboxId = `searchable-select-listbox-${Math.random().toString(36).substring(2, 9)}`;

	// Format option labels: replace underscores with spaces
	function formatOptionLabel(option: string): string {
		return option.replace(/_/g, ' ');
	}

	// Get display value for input
	const displayValue = $derived(isOpen ? searchText : value);

	// Combine all options
	const allOptions = $derived([...options, ...customOptions]);

	// Filter options based on search text
	const filteredOptions = $derived(
		isOpen && searchText.trim()
			? allOptions.filter((opt) => opt.toLowerCase().includes(searchText.toLowerCase()))
			: allOptions
	);

	// Check if we should show "Add" option
	const showAddOption = $derived(
		isOpen &&
			onAddCustom &&
			searchText.trim() &&
			!allOptions.some((opt) => opt.toLowerCase() === searchText.toLowerCase())
	);

	// Get option ID for ARIA activedescendant
	function getOptionId(index: number): string {
		return `${listboxId}-option-${index}`;
	}

	// Get highlighted option ID
	const activeDescendant = $derived(
		highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined
	);

	// Open dropdown
	function openDropdown() {
		if (!disabled) {
			isOpen = true;
			searchText = '';
			highlightedIndex = -1;
		}
	}

	// Close dropdown
	function closeDropdown() {
		isOpen = false;
		searchText = '';
		highlightedIndex = -1;
	}

	// Handle input click
	function handleInputClick() {
		openDropdown();
	}

	// Handle input focus
	function handleInputFocus() {
		openDropdown();
	}

	// Handle input change
	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		searchText = target.value;
		highlightedIndex = -1; // Reset highlight when typing
	}

	// Handle option selection
	function selectOption(option: string) {
		value = option; // Update bindable value
		onchange(option);
		closeDropdown();
	}

	// Handle add custom option
	function addCustomOption() {
		if (onAddCustom && searchText.trim()) {
			const trimmedValue = searchText.trim();
			value = trimmedValue; // Update bindable value
			onAddCustom(trimmedValue);
			onchange(trimmedValue);
			closeDropdown();
		}
	}

	// Handle keyboard navigation
	function handleKeyDown(e: KeyboardEvent) {
		if (disabled) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					openDropdown();
				} else {
					const maxIndex = filteredOptions.length + (showAddOption ? 1 : 0) - 1;
					highlightedIndex = highlightedIndex < maxIndex ? highlightedIndex + 1 : 0;
				}
				break;

			case 'ArrowUp':
				e.preventDefault();
				if (!isOpen) {
					openDropdown();
				} else {
					const maxIndex = filteredOptions.length + (showAddOption ? 1 : 0) - 1;
					highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : maxIndex;
				}
				break;

			case 'Enter':
				e.preventDefault();
				if (isOpen) {
					if (highlightedIndex >= 0) {
						if (highlightedIndex < filteredOptions.length) {
							selectOption(filteredOptions[highlightedIndex]);
						} else if (showAddOption) {
							addCustomOption();
						}
					}
				}
				break;

			case 'Escape':
				e.preventDefault();
				closeDropdown();
				break;
		}
	}

	// Handle click outside
	function handleClickOutside(e: MouseEvent) {
		if (containerRef && !containerRef.contains(e.target as Node)) {
			closeDropdown();
		}
	}

	// Add/remove click outside listener
	$effect(() => {
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	});
</script>

<div bind:this={containerRef} class="relative w-full">
	<!-- Input wrapper -->
	<div class="relative">
		<input
			bind:this={inputRef}
			type="text"
			{id}
			value={displayValue}
			{placeholder}
			{disabled}
			role="combobox"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-autocomplete="list"
			aria-controls={listboxId}
			aria-activedescendant={activeDescendant}
			onclick={handleInputClick}
			onfocus={handleInputFocus}
			oninput={handleInputChange}
			onkeydown={handleKeyDown}
			class="w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white
				{error
				? 'border-red-500 focus:ring-red-500'
				: 'border-slate-300 dark:border-slate-600 focus:ring-slate-500'}
				focus:outline-none focus:ring-2 focus:ring-offset-0
				disabled:opacity-50 disabled:cursor-not-allowed
				transition-colors"
		/>

		<!-- Chevron icon -->
		<button
			type="button"
			tabindex="-1"
			{disabled}
			onclick={handleInputClick}
			class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<ChevronDown class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}" />
		</button>
	</div>

	<!-- Error message -->
	{#if error}
		<p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
	{/if}

	<!-- Dropdown -->
	{#if isOpen}
		<div
			id={listboxId}
			role="listbox"
			class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
		>
			{#if filteredOptions.length === 0 && !showAddOption}
				<div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No options found</div>
			{/if}

			{#each filteredOptions as option, index}
				{@const isCustom = customOptions.includes(option)}
				{@const isHighlighted = highlightedIndex === index}
				{@const formatted = formatOptionLabel(option)}
				<div
					id={getOptionId(index)}
					role="option"
					aria-selected={isHighlighted}
					onclick={() => selectOption(option)}
					onmouseenter={() => (highlightedIndex = index)}
					class="px-3 py-2 cursor-pointer text-sm transition-colors
						{isHighlighted
						? 'bg-slate-100 dark:bg-slate-700'
						: 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}"
				>
					<span class="text-slate-900 dark:text-white">{formatted}</span>
					{#if isCustom}
						<span class="ml-2 text-xs text-slate-500 dark:text-slate-400">(custom)</span>
					{/if}
				</div>
			{/each}

			{#if showAddOption}
				{@const addIndex = filteredOptions.length}
				{@const isHighlighted = highlightedIndex === addIndex}
				<div
					id={getOptionId(addIndex)}
					role="option"
					aria-selected={isHighlighted}
					onclick={addCustomOption}
					onmouseenter={() => (highlightedIndex = addIndex)}
					class="px-3 py-2 cursor-pointer text-sm border-t border-slate-200 dark:border-slate-700 transition-colors
						{isHighlighted
						? 'bg-slate-100 dark:bg-slate-700'
						: 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}"
				>
					<span class="text-slate-600 dark:text-slate-300">Add "{searchText.trim()}"</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
