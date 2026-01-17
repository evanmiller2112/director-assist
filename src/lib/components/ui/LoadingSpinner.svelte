<script lang="ts">
	/**
	 * LoadingSpinner Component
	 * Issue #12: Add Loading States & Async Operation Feedback
	 *
	 * A reusable loading spinner for indicating async operations.
	 * Used across the application for entity CRUD, campaign loading, and settings operations.
	 */

	interface Props {
		size?: 'sm' | 'md' | 'lg' | number;
		color?: 'primary' | 'white' | 'gray';
		label?: string;
		center?: boolean;
		fullscreen?: boolean;
		class?: string;
	}

	let {
		size = 'md',
		color = 'primary',
		label,
		center = true,
		fullscreen = false,
		class: className = ''
	}: Props = $props();

	// Compute size classes reactively
	const sizeClass = $derived.by(() => {
		if (typeof size === 'string') {
			const sizeClasses = {
				sm: 'w-4 h-4 size-sm',
				md: 'w-8 h-8 size-md',
				lg: 'w-12 h-12 size-lg'
			};
			return sizeClasses[size];
		}
		return '';
	});

	const sizeStyle = $derived.by(() => {
		return typeof size === 'number' ? `width: ${size}px; height: ${size}px;` : '';
	});

	// Compute color class reactively
	const colorClass = $derived.by(() => {
		const colorClasses = {
			primary: 'text-blue-600 color-primary',
			white: 'text-white color-white',
			gray: 'text-gray-600 color-gray'
		};
		return colorClasses[color];
	});

	// Compute container classes reactively
	const containerClasses = $derived.by(() => {
		return fullscreen
			? 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50'
			: center
				? 'flex items-center justify-center'
				: '';
	});
</script>

<div class={`${containerClasses} ${className}`.trim()}>
	<div class="flex flex-col items-center gap-2">
		<!-- Spinner with ARIA attributes -->
		<div role="status" aria-live="polite">
			<!-- SVG Spinner -->
			<svg
				class={`animate-spin ${sizeClass} ${colorClass}`.trim()}
				style={sizeStyle}
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>

			<!-- Screen reader text (only if no visible label) -->
			{#if !label}
				<span class="sr-only">Loading</span>
			{/if}
		</div>

		<!-- Optional visible label -->
		{#if label}
			<p class="text-sm text-gray-600 dark:text-gray-400">{label}</p>
		{/if}
	</div>
</div>
