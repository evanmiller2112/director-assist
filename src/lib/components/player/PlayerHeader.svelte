<script lang="ts">
    import { Search, Sun, Moon, Monitor, Menu, RefreshCw } from 'lucide-svelte';
    import { uiStore, playerDataStore } from '$lib/stores';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let {
        campaignName = '',
        exportedAt,
        onSearch = (query: string) => {},
        onRefresh,
    }: {
        campaignName?: string;
        exportedAt?: Date | null;
        onSearch?: (query: string) => void;
        onRefresh?: () => Promise<void>;
    } = $props();

    let searchInput: HTMLInputElement | undefined = $state();

    // Read search query from URL
    const searchQuery = $derived($page.url.searchParams.get('q') ?? '');

    export function focusSearch() {
        searchInput?.focus();
    }

    function handleSearchInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const query = target.value;

        // Update URL with search query
        const url = new URL($page.url);
        if (query.trim()) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }

        // Navigate to home page with search query if not already there
        const targetPath = $page.url.pathname === '/player' ? '/player' : '/player';
        goto(`${targetPath}?${url.searchParams.toString()}`, {
            replaceState: true,
            keepFocus: true,
            noScroll: true
        });

        // Call the legacy callback for backward compatibility
        onSearch(query);
    }

    function cycleTheme() {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(uiStore.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        uiStore.setTheme(nextTheme);
    }

    async function handleRefresh() {
        if (onRefresh) {
            await onRefresh();
        }
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<header class="dashboard-header flex items-center justify-between px-4 bg-white dark:bg-surface-dark">
    <div class="flex items-center gap-4">
        <button
            class="btn btn-ghost p-2 lg:hidden"
            onclick={() => uiStore.toggleMobileSidebar()}
            aria-label="Toggle sidebar"
        >
            <Menu class="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">
                {campaignName || 'Player View'}
            </h1>
            {#if exportedAt}
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Last published: {formatDate(exportedAt)}
                </p>
            {/if}
        </div>
    </div>

    <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative hidden sm:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                bind:this={searchInput}
                type="text"
                placeholder="Search entities... (Ctrl+K)"
                value={searchQuery}
                oninput={handleSearchInput}
                class="input pl-9 w-64"
            />
        </div>

        <!-- Refresh button -->
        {#if onRefresh}
            <button
                class="btn btn-ghost p-2"
                onclick={handleRefresh}
                disabled={playerDataStore.isLoading}
                aria-label="Refresh campaign data"
                title="Refresh campaign data"
            >
                <RefreshCw class="w-5 h-5 text-slate-700 dark:text-slate-300 {playerDataStore.isLoading ? 'animate-spin' : ''}" />
            </button>
        {/if}

        <!-- Theme toggle -->
        <button
            class="btn btn-ghost p-2"
            onclick={cycleTheme}
            aria-label="Toggle theme ({uiStore.theme})"
            title="Theme: {uiStore.theme}"
        >
            {#if uiStore.theme === 'light'}
                <Sun class="w-5 h-5 text-slate-700 dark:text-slate-300" />
            {:else if uiStore.theme === 'dark'}
                <Moon class="w-5 h-5 text-slate-700 dark:text-slate-300" />
            {:else}
                <Monitor class="w-5 h-5 text-slate-700 dark:text-slate-300" />
            {/if}
        </button>
    </div>
</header>
