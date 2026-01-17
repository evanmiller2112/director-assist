<script lang="ts">
	/**
	 * LoadingSkeleton Component
	 * Issue #12: Add Loading States & Async Operation Feedback
	 *
	 * Provides skeleton loading states for lists, cards, and content areas.
	 * Used to show placeholder content while actual data is loading.
	 */

	interface Props {
		variant?:
			| 'text'
			| 'card'
			| 'circular'
			| 'rectangular'
			| 'entityCard'
			| 'tableRow'
			| 'entityDetail'
			| 'settingsPage'
			| 'campaignCard';
		width?: string | number;
		height?: string | number;
		count?: number;
		columns?: number;
		animate?: boolean;
		animation?: 'pulse' | 'shimmer';
		class?: string;
	}

	let {
		variant = 'text',
		width = 'w-full',
		height,
		count = 1,
		columns = 3,
		animate = true,
		animation = 'pulse',
		class: className = ''
	}: Props = $props();

	// Convert width/height to classes or styles
	function getDimensionClasses(dimension: string | number | undefined, defaultClass: string) {
		if (!dimension) return defaultClass;
		if (typeof dimension === 'number') return '';
		// If it's a Tailwind class, use it; otherwise it's a custom value
		if (dimension.startsWith('w-') || dimension.startsWith('h-')) return dimension;
		return '';
	}

	function getDimensionStyle(dimension: string | number | undefined) {
		if (!dimension) return '';
		if (typeof dimension === 'number') return `${dimension}px`;
		// If it's not a Tailwind class, use it as-is
		if (
			!dimension.startsWith('w-') &&
			!dimension.startsWith('h-') &&
			!dimension.includes(' ')
		) {
			return dimension;
		}
		return '';
	}

	// Compute dimensions reactively
	const widthClass = $derived(getDimensionClasses(width, 'w-full'));
	const heightClass = $derived(height ? getDimensionClasses(height, '') : '');
	const widthStyle = $derived(getDimensionStyle(width));
	const heightStyle = $derived(getDimensionStyle(height));

	// Compute animation classes reactively
	const animationClass = $derived.by(() => {
		return animate
			? animation === 'shimmer'
				? 'animate-shimmer'
				: 'animate-pulse'
			: '';
	});

	// Variant-specific classes and structure
	const variantClasses = {
		text: 'h-4 rounded',
		card: 'min-h-32 rounded-lg border border-gray-200 dark:border-gray-700',
		circular: 'rounded-full',
		rectangular: 'rounded-sm',
		entityCard: 'min-h-40 rounded-lg border border-gray-200 dark:border-gray-700',
		tableRow: 'h-12 rounded',
		entityDetail: 'min-h-64 rounded-lg',
		settingsPage: 'min-h-48 rounded-lg',
		campaignCard: 'min-h-32 rounded-lg border border-gray-200 dark:border-gray-700'
	};

	const baseClass = $derived(`bg-gray-200 dark:bg-gray-700 ${animationClass}`);
</script>

{#if variant === 'entityCard'}
	<!-- Entity Card Skeleton - more complex structure -->
	<div
		class={`space-y-${count > 1 ? '4' : '0'} ${className}`.trim()}
		role="status"
		aria-busy="true"
		aria-label="Loading content"
	>
		{#each Array(count) as _, i (i)}
			<div
				class={`${baseClass} ${variantClasses.entityCard} p-4 ${widthClass}`.trim()}
				style={`${widthStyle ? `width: ${widthStyle};` : ''}`}
			>
				<div class="space-y-3">
					<!-- Header -->
					<div class={`${baseClass} h-6 w-3/4 rounded`}></div>
					<!-- Content lines -->
					<div class={`${baseClass} h-4 w-full rounded`}></div>
					<div class={`${baseClass} h-4 w-5/6 rounded`}></div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'tableRow'}
	<!-- Table Row Skeleton -->
	<div
		class={`space-y-2 ${className}`.trim()}
		role="status"
		aria-busy="true"
		aria-label="Loading content"
	>
		{#each Array(count) as _, i (i)}
			<div class="flex gap-4">
				{#each Array(columns) as _, j (j)}
					<div class={`${baseClass} ${variantClasses.tableRow} flex-1 rounded`}></div>
				{/each}
			</div>
		{/each}
	</div>
{:else if variant === 'entityDetail'}
	<!-- Entity Detail Page Skeleton -->
	<div
		class={`space-y-6 ${className}`.trim()}
		role="status"
		aria-busy="true"
		aria-label="Loading content"
	>
		<!-- Header section -->
		<div class="space-y-3">
			<div class={`${baseClass} h-8 w-1/2 rounded`}></div>
			<div class={`${baseClass} h-4 w-3/4 rounded`}></div>
		</div>
		<!-- Content sections -->
		<div class={`${baseClass} ${variantClasses.entityDetail} rounded-lg`}></div>
		<div class={`${baseClass} h-32 rounded-lg`}></div>
	</div>
{:else if variant === 'settingsPage'}
	<!-- Settings Page Skeleton -->
	<div
		class={`space-y-6 ${className}`.trim()}
		role="status"
		aria-busy="true"
		aria-label="Loading content"
	>
		{#each Array(3) as _, i (i)}
			<div class="space-y-2">
				<div class={`${baseClass} h-5 w-32 rounded`}></div>
				<div class={`${baseClass} h-10 w-full rounded`}></div>
			</div>
		{/each}
	</div>
{:else if variant === 'campaignCard'}
	<!-- Campaign Card Skeleton -->
	<div
		role="status"
		aria-busy="true"
		aria-label="Loading content"
		class={`${baseClass} ${variantClasses.campaignCard} p-4 ${widthClass} ${className}`.trim()}
		style={`${widthStyle ? `width: ${widthStyle};` : ''}`}
	>
		<div class="space-y-3">
			<div class={`${baseClass} h-6 w-2/3 rounded`}></div>
			<div class={`${baseClass} h-4 w-full rounded`}></div>
			<div class={`${baseClass} h-4 w-4/5 rounded`}></div>
		</div>
	</div>
{:else if count > 1}
	<!-- Multiple simple skeletons -->
	<div
		class={`space-y-2 ${className}`.trim()}
		role="status"
		aria-busy="true"
		aria-label="Loading content"
	>
		{#each Array(count) as _, i (i)}
			<div
				class={`${baseClass} ${variantClasses[variant]} ${widthClass} ${heightClass}`.trim()}
				style={`${widthStyle ? `width: ${widthStyle};` : ''}${heightStyle ? ` height: ${heightStyle};` : ''}`}
			></div>
		{/each}
	</div>
{:else}
	<!-- Single skeleton -->
	<div
		role="status"
		aria-busy="true"
		aria-label="Loading content"
		class={`${baseClass} ${variantClasses[variant]} ${widthClass} ${heightClass} ${className}`.trim()}
		style={`${widthStyle ? `width: ${widthStyle};` : ''}${heightStyle ? ` height: ${heightStyle};` : ''}`}
	></div>
{/if}
