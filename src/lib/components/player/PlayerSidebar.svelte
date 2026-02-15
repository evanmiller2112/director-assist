<script lang="ts">
    import { Home } from 'lucide-svelte';
    import { page } from '$app/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import type { PlayerEntity } from '$lib/types/playerExport';

    let {
        mobileOpen = false,
        entityTypes = [] as string[],
        entitiesByType = {} as Record<string, PlayerEntity[]>,
    }: {
        mobileOpen?: boolean;
        entityTypes?: string[];
        entitiesByType?: Record<string, PlayerEntity[]>;
    } = $props();

    function isActive(href: string): boolean {
        return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
    }

    function getEntityCount(type: string): number {
        return entitiesByType[type]?.length ?? 0;
    }
</script>

<aside class="dashboard-sidebar flex flex-col bg-surface-secondary dark:bg-surface-dark-secondary {mobileOpen ? 'mobile-open' : ''}">
    <nav class="flex-1 overflow-y-auto p-4">
        <!-- Home -->
        <a
            href="/player"
            class="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors
                {$page.url.pathname === '/player'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
        >
            <Home class="w-5 h-5" />
            <span class="font-medium">Overview</span>
        </a>

        <div class="border-t border-slate-200 dark:border-slate-700 my-4"></div>

        <h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
            Entities
        </h2>

        <!-- Entity type links -->
        {#each entityTypes as type}
            {@const typeDef = getEntityTypeDefinition(type)}
            {@const Icon = getIconComponent(typeDef?.icon ?? 'package')}
            {@const count = getEntityCount(type)}
            {@const href = `/player/${type}`}
            <a
                {href}
                class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors
                    {isActive(href)
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
            >
                <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
                <span class="flex-1">{typeDef?.labelPlural ?? type}</span>
                {#if count > 0}
                    <span class="text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                {/if}
            </a>
        {/each}

        {#if entityTypes.length === 0}
            <p class="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 italic">
                No entities available
            </p>
        {/if}
    </nav>
</aside>
