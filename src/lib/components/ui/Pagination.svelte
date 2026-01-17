<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface PaginationProps {
		currentPage: number;
		totalItems: number;
		perPage: number;
		perPageOptions?: number[];
		onPageChange: (page: number) => void;
		onPerPageChange: (perPage: number) => void;
	}

	let {
		currentPage,
		totalItems,
		perPage,
		perPageOptions = [20, 50, 100],
		onPageChange,
		onPerPageChange
	}: PaginationProps = $props();

	// Normalize inputs to handle edge cases
	const normalizedPage = $derived(Math.max(1, currentPage || 1));
	const normalizedTotal = $derived(Math.max(0, totalItems || 0));
	const normalizedPerPage = $derived(Math.max(1, perPage || 20));

	// Calculate pagination values
	const totalPages = $derived(Math.ceil(normalizedTotal / normalizedPerPage));
	const startItem = $derived(normalizedTotal === 0 ? 0 : (normalizedPage - 1) * normalizedPerPage + 1);
	const endItem = $derived(Math.min(normalizedPage * normalizedPerPage, normalizedTotal));

	// Button states
	const canGoPrevious = $derived(normalizedPage > 1);
	const canGoNext = $derived(normalizedPage < totalPages);

	// Display text
	const itemsText = $derived.by(() => {
		if (normalizedTotal === 0) {
			return 'Showing 0 items';
		}
		if (normalizedTotal === 1) {
			return 'Showing 1-1 of 1 item';
		}
		return `Showing ${startItem}-${endItem} of ${normalizedTotal} items`;
	});

	function handlePrevious() {
		if (canGoPrevious) {
			onPageChange(normalizedPage - 1);
		}
	}

	function handleNext() {
		if (canGoNext) {
			onPageChange(normalizedPage + 1);
		}
	}

	function handlePerPageChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newPerPage = parseInt(target.value, 10);
		if (!isNaN(newPerPage) && newPerPage > 0) {
			onPerPageChange(newPerPage);
		}
	}
</script>

<nav class="flex items-center justify-between gap-4 mt-6" aria-label="Pagination">
	<div class="text-sm text-slate-600 dark:text-slate-400">
		{itemsText}
	</div>

	<div class="flex items-center gap-4">
		<!-- Per-page selector -->
		<div class="flex items-center gap-2">
			<label for="per-page-select" class="text-sm text-slate-600 dark:text-slate-400">
				Items per page:
			</label>
			<select
				id="per-page-select"
				class="input py-1 px-2 text-sm"
				value={normalizedPerPage}
				onchange={handlePerPageChange}
				aria-label="Items per page"
			>
				{#each perPageOptions as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>

		<!-- Navigation buttons -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-ghost p-2 {!canGoPrevious ? 'opacity-50' : ''}"
				disabled={!canGoPrevious}
				onclick={handlePrevious}
				aria-label="Previous page"
			>
				<ChevronLeft class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="btn btn-ghost p-2 {!canGoNext ? 'opacity-50' : ''}"
				disabled={!canGoNext}
				onclick={handleNext}
				aria-label="Next page"
			>
				<ChevronRight class="w-4 h-4" />
			</button>
		</div>
	</div>
</nav>
