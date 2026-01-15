<script lang="ts">
	import {
		User,
		Users,
		MapPin,
		Flag,
		Package,
		Swords,
		Calendar,
		Sun,
		Clock,
		BookOpen,
		UserCircle,
		Plus,
		Home
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import { entitiesStore } from '$lib/stores';

	// Map icon names to Lucide components
	const iconMap: Record<string, typeof User> = {
		user: User,
		users: Users,
		'map-pin': MapPin,
		flag: Flag,
		package: Package,
		swords: Swords,
		calendar: Calendar,
		sun: Sun,
		clock: Clock,
		book: BookOpen,
		'user-circle': UserCircle
	};

	function getIcon(iconName: string) {
		return iconMap[iconName] ?? User;
	}

	function getEntityCount(type: string): number {
		const byType = entitiesStore.entitiesByType;
		return byType[type]?.length ?? 0;
	}

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<aside class="dashboard-sidebar flex flex-col bg-surface-secondary dark:bg-surface-dark-secondary">
	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-4">
		<!-- Home -->
		<a
			href="/"
			class="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors
				{isActive('/') && $page.url.pathname === '/'
				? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
				: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
		>
			<Home class="w-5 h-5" />
			<span class="font-medium">Dashboard</span>
		</a>

		<div class="border-t border-slate-200 dark:border-slate-700 my-4"></div>

		<h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
			Entities
		</h2>

		<!-- Entity type links -->
		{#each BUILT_IN_ENTITY_TYPES as entityType}
			{@const Icon = getIcon(entityType.icon)}
			{@const count = getEntityCount(entityType.type)}
			{@const href = `/entities/${entityType.type}`}
			<a
				{href}
				class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors
					{isActive(href)
					? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
					: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
			>
				<Icon class="w-5 h-5" style="color: var(--color-{entityType.color}, currentColor)" />
				<span class="flex-1">{entityType.labelPlural}</span>
				{#if count > 0}
					<span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
						{count}
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Quick Add Button -->
	<div class="p-4 border-t border-slate-200 dark:border-slate-700">
		<button
			class="btn btn-primary w-full"
			onclick={() => {
				/* TODO: Open create entity modal */
			}}
		>
			<Plus class="w-4 h-4" />
			Add Entity
		</button>
	</div>
</aside>
