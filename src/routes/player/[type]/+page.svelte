<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import { PlayerEntityCard, PlayerBreadcrumbs } from '$lib/components/player';
    import { ArrowUpDown } from 'lucide-svelte';

    const entityType = $derived($page.params.type ?? '');
    const typeDef = $derived(getEntityTypeDefinition(entityType));
    const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));

    // Read search query from URL
    const searchQuery = $derived($page.url.searchParams.get('q') ?? '');

    // Sort state: 'alphabetical' or 'recent'
    let sortBy = $state<'alphabetical' | 'recent'>('alphabetical');

    // Get all entities of this type
    const allEntities = $derived(playerDataStore.getByType(entityType));

    // Filter by search query if present
    const filteredEntities = $derived.by(() => {
        if (!searchQuery.trim()) return allEntities;

        const lowerQuery = searchQuery.toLowerCase();
        return allEntities.filter((entity) => {
            return (
                entity.name.toLowerCase().includes(lowerQuery) ||
                entity.description.toLowerCase().includes(lowerQuery) ||
                entity.summary?.toLowerCase().includes(lowerQuery) ||
                entity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
            );
        });
    });

    // Sort entities based on current sort setting
    const entities = $derived.by(() => {
        const sorted = [...filteredEntities];
        if (sortBy === 'alphabetical') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            sorted.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            });
        }
        return sorted;
    });

    // Breadcrumb items
    const breadcrumbs = $derived([
        { label: 'Home', href: '/player' },
        { label: typeDef?.labelPlural ?? 'Entities' }
    ]);

    function toggleSort() {
        sortBy = sortBy === 'alphabetical' ? 'recent' : 'alphabetical';
    }
</script>

<svelte:head>
    <title>{typeDef?.labelPlural ?? 'Entities'} - {playerDataStore.campaignName || 'Player View'}</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <!-- Breadcrumbs -->
    <PlayerBreadcrumbs items={breadcrumbs} />

    <!-- Header with Sort Toggle -->
    <div class="flex items-start justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                    {typeDef?.labelPlural ?? 'Entities'}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    {entities.length} {entities.length === 1 ? 'entry' : 'entries'}
                    {#if searchQuery.trim()}
                        matching "{searchQuery}"
                    {/if}
                </p>
            </div>
        </div>

        <!-- Sort Toggle -->
        {#if entities.length > 1}
            <button
                onclick={toggleSort}
                class="btn btn-ghost flex items-center gap-2 text-sm"
                title="Toggle sort order"
            >
                <ArrowUpDown class="w-4 h-4" />
                {sortBy === 'alphabetical' ? 'A-Z' : 'Recent'}
            </button>
        {/if}
    </div>

    {#if entities.length === 0}
        <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400">
                {#if searchQuery.trim()}
                    No {typeDef?.labelPlural?.toLowerCase() ?? 'entities'} found matching "{searchQuery}".
                {:else}
                    No {typeDef?.labelPlural?.toLowerCase() ?? 'entities'} available.
                {/if}
            </p>
        </div>
    {:else}
        <div class="grid gap-3">
            {#each entities as entity}
                <PlayerEntityCard {entity} />
            {/each}
        </div>
    {/if}
</div>
