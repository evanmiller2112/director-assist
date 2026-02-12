<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import { ArrowLeft } from 'lucide-svelte';

    const entityId = $derived($page.params.id ?? '');
    const entity = $derived(playerDataStore.getEntityById(entityId));
    const typeDef = $derived(entity ? getEntityTypeDefinition(entity.type) : undefined);
    const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));
</script>

<svelte:head>
    <title>{entity?.name ?? 'Entity'} - {playerDataStore.campaignName || 'Player View'}</title>
</svelte:head>

{#if entity}
    <div class="max-w-4xl mx-auto">
        <a
            href="/player/{entity.type}"
            class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
        >
            <ArrowLeft class="w-4 h-4" />
            Back to {typeDef?.labelPlural ?? 'Entities'}
        </a>

        <!-- Entity Header -->
        <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                <Icon class="w-6 h-6" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
            </div>
            <div>
                <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
                    {entity.name}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {typeDef?.label ?? entity.type}
                </p>
            </div>
        </div>

        <!-- Tags -->
        {#if entity.tags.length > 0}
            <div class="flex flex-wrap gap-2 mb-6">
                {#each entity.tags as tag}
                    <span class="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-700 dark:text-slate-300">
                        {tag}
                    </span>
                {/each}
            </div>
        {/if}

        <!-- Description -->
        {#if entity.description}
            <div class="mb-8">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Description</h2>
                <div class="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {entity.description}
                </div>
            </div>
        {/if}

        <!-- Fields (placeholder for issue #443) -->
        {#if Object.keys(entity.fields).length > 0}
            <div class="mb-8">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Details</h2>
                <div class="grid gap-3">
                    {#each Object.entries(entity.fields) as [key, value]}
                        {#if value !== null && value !== undefined && value !== ''}
                            <div class="entity-card" data-type={entity.type}>
                                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </dt>
                                <dd class="text-slate-900 dark:text-white mt-1">
                                    {#if typeof value === 'boolean'}
                                        {value ? 'Yes' : 'No'}
                                    {:else if Array.isArray(value)}
                                        {value.join(', ')}
                                    {:else}
                                        {value}
                                    {/if}
                                </dd>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Relationships (placeholder for issue #443) -->
        {#if entity.links && entity.links.length > 0}
            <div class="mb-8">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Relationships</h2>
                <div class="grid gap-2">
                    {#each entity.links as link}
                        {@const linkTypeDef = getEntityTypeDefinition(link.targetType)}
                        {@const LinkIcon = getIconComponent(linkTypeDef?.icon ?? 'package')}
                        <a
                            href="/player/entity/{link.targetId}"
                            class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <LinkIcon class="w-5 h-5 flex-shrink-0" style="color: var(--color-{linkTypeDef?.color ?? 'slate'}, currentColor)" />
                            <div class="flex-1">
                                <span class="text-xs text-slate-500 dark:text-slate-400">{link.relationship}</span>
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400 mb-4">Entity not found.</p>
        <a href="/player" class="text-blue-600 dark:text-blue-400 hover:underline">
            Return to overview
        </a>
    </div>
{/if}
