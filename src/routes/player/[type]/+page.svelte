<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';

    const entityType = $derived($page.params.type ?? '');
    const typeDef = $derived(getEntityTypeDefinition(entityType));
    const entities = $derived(playerDataStore.getByType(entityType));
    const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));
</script>

<svelte:head>
    <title>{typeDef?.labelPlural ?? 'Entities'} - {playerDataStore.campaignName || 'Player View'}</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
            <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                {typeDef?.labelPlural ?? 'Entities'}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
                {entities.length} {entities.length === 1 ? 'entry' : 'entries'}
            </p>
        </div>
    </div>

    {#if entities.length === 0}
        <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400">
                No {typeDef?.labelPlural?.toLowerCase() ?? 'entities'} available.
            </p>
        </div>
    {:else}
        <div class="grid gap-3">
            {#each entities as entity}
                <a
                    href="/player/entity/{entity.id}"
                    class="entity-card"
                    data-type={entityType}
                >
                    <div class="font-medium text-slate-900 dark:text-white">{entity.name}</div>
                    {#if entity.summary}
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {entity.summary}
                        </p>
                    {:else if entity.description}
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {entity.description}
                        </p>
                    {/if}
                    {#if entity.tags.length > 0}
                        <div class="flex flex-wrap gap-1 mt-2">
                            {#each entity.tags.slice(0, 5) as tag}
                                <span class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                    {/if}
                </a>
            {/each}
        </div>
    {/if}
</div>
