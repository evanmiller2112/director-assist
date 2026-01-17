<script lang="ts">
	/**
	 * LoadingButton Component
	 * Issue #12: Add Loading States & Async Operation Feedback
	 *
	 * A button that shows loading state during async operations.
	 * Used throughout the app for save, submit, and action buttons.
	 */

	import type { Snippet } from 'svelte';

	interface Props {
		loading?: boolean;
		disabled?: boolean;
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		fullWidth?: boolean;
		loadingText?: string;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet | string;
		leftIcon?: Snippet | boolean;
		rightIcon?: Snippet | boolean;
	}

	let {
		loading = false,
		disabled = false,
		variant = 'primary',
		size = 'md',
		type = 'button',
		fullWidth = false,
		loadingText,
		onclick,
		class: className = '',
		children,
		leftIcon,
		rightIcon
	}: Props = $props();

	// Variant classes
	const variantClasses = {
		primary: 'btn-primary bg-blue-600 hover:bg-blue-700 text-white border-transparent',
		secondary: 'btn-secondary bg-gray-600 hover:bg-gray-700 text-white border-transparent',
		danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
		ghost: 'btn-ghost bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent',
		outline: 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
	};

	// Size classes
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
	};

	// Spinner size mapping
	const spinnerSizes = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	const isDisabled = $derived(disabled || loading);

	function handleClick(e: MouseEvent) {
		if (!isDisabled && onclick) {
			onclick(e);
		}
	}
</script>

<button
	{type}
	disabled={isDisabled}
	aria-busy={loading}
	aria-disabled={isDisabled}
	class={`
		inline-flex items-center justify-center gap-2
		font-medium rounded-lg border
		transition-colors duration-200
		disabled:opacity-50 disabled:cursor-not-allowed
		focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
		${variantClasses[variant]}
		${sizeClasses[size]}
		${fullWidth ? 'w-full' : ''}
		${className}
	`.trim()}
	onclick={handleClick}
>
	<!-- Loading Spinner -->
	{#if loading}
		<div role="status" aria-live="polite">
			<svg
				class={`animate-spin ${spinnerSizes[size]}`}
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
			<span class="sr-only">Loading</span>
		</div>
	{/if}

	<!-- Left Icon (hidden when loading) -->
	{#if !loading && leftIcon && typeof leftIcon !== 'boolean'}
		<span data-icon="left" class:hidden={loading}>
			{@render leftIcon()}
		</span>
	{:else if !loading && leftIcon === true}
		<span data-icon="left" class:hidden={loading}></span>
	{/if}

	<!-- Button Text -->
	<span class:sr-only={loading && !loadingText}>
		{#if loading && loadingText}
			{loadingText}
		{:else if children}
			{#if typeof children === 'string'}
				{children}
			{:else}
				{@render children()}
			{/if}
		{/if}
	</span>

	<!-- Right Icon (hidden when loading) -->
	{#if !loading && rightIcon && typeof rightIcon !== 'boolean'}
		<span data-icon="right" class:hidden={loading}>
			{@render rightIcon()}
		</span>
	{:else if !loading && rightIcon === true}
		<span data-icon="right" class:hidden={loading}></span>
	{/if}
</button>
