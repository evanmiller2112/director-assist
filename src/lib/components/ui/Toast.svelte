<script lang="ts">
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';

	const icons = {
		success: CheckCircle,
		error: AlertCircle,
		info: Info
	};

	const styles = {
		success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
		error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
		info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
	};

	const iconStyles = {
		success: 'text-green-500 dark:text-green-400',
		error: 'text-red-500 dark:text-red-400',
		info: 'text-blue-500 dark:text-blue-400'
	};
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
	{#each notificationStore.toasts as toast (toast.id)}
		{@const Icon = icons[toast.type]}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm max-w-md {styles[toast.type]}"
			transition:fly={{ y: 50, duration: 300 }}
		>
			<Icon class="w-5 h-5 flex-shrink-0 mt-0.5 {iconStyles[toast.type]}" />
			<p class="flex-1 text-sm font-medium">
				{toast.message}
			</p>
			<button
				onclick={() => notificationStore.dismiss(toast.id)}
				class="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
				aria-label="Close notification"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>
