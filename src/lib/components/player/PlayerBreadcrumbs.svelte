<script lang="ts">
	/**
	 * PlayerBreadcrumbs Component
	 * Issue #444: Player entity browser with search and type filtering
	 *
	 * Simple breadcrumb navigation for player view pages.
	 * Shows: Home > Characters > Aldric the Bold
	 */

	import { ChevronRight } from 'lucide-svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
	}

	let { items }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class="mb-4">
	<ol class="flex items-center gap-2 text-sm">
		{#each items as item, i}
			{#if i > 0}
				<li aria-hidden="true">
					<ChevronRight class="w-4 h-4 text-slate-400" />
				</li>
			{/if}
			<li>
				{#if item.href}
					<a
						href={item.href}
						class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						{item.label}
					</a>
				{:else}
					<span class="text-slate-900 dark:text-white font-medium">
						{item.label}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
