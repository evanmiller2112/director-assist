<script lang="ts">
    import { Search, Sun, Moon, Monitor, Menu } from 'lucide-svelte';
    import { uiStore } from '$lib/stores';

    let {
        campaignName = '',
        onSearch = (query: string) => {},
    }: {
        campaignName?: string;
        onSearch?: (query: string) => void;
    } = $props();

    let searchQuery = $state('');
    let searchInput: HTMLInputElement | undefined = $state();

    export function focusSearch() {
        searchInput?.focus();
    }

    function handleSearchInput(e: Event) {
        const target = e.target as HTMLInputElement;
        searchQuery = target.value;
        onSearch(searchQuery);
    }

    function cycleTheme() {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(uiStore.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        uiStore.setTheme(nextTheme);
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

        <h1 class="text-xl font-bold text-slate-900 dark:text-white">
            {campaignName || 'Player View'}
        </h1>
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
