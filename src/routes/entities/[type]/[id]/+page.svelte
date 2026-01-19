<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, campaignStore, notificationStore } from '$lib/stores';
	import { getSystemAwareEntityType } from '$lib/utils/entityFormUtils';
	import { ArrowLeft, ArrowRight, Edit, Trash2, Link, Plus, X, ExternalLink, Check, X as XIcon, EyeOff } from 'lucide-svelte';
	import { EntitySummary, RelateCommand, RelationshipCard, EditRelationshipModal } from '$lib/components/entity';
	import { RelationshipBreadcrumbs } from '$lib/components/navigation';
	import { parseBreadcrumbPath, serializeBreadcrumbPath, type BreadcrumbSegment } from '$lib/utils/breadcrumbUtils';
	import type { BaseEntity } from '$lib/types';
	import { MarkdownViewer } from '$lib/components/markdown';

	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
	const typeDefinition = $derived(
		entityType
			? getSystemAwareEntityType(
					entityType,
					campaignStore.getCurrentSystemProfile(),
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);
	const linkedEntitiesWithRelationships = $derived(
		entity ? entitiesStore.getLinkedWithRelationships(entity.id) : []
	);
	const isCampaignPage = $derived(entityType === 'campaign');
	const canDeleteCampaign = $derived(
		!isCampaignPage || (isCampaignPage && campaignStore.allCampaigns.length > 1)
	);

	// Breadcrumb navigation state
	const navPathParam = $derived($page.url.searchParams.get('navPath'));
	const breadcrumbSegments = $derived(parseBreadcrumbPath(navPathParam));

	function handleRelationshipNavigate(targetEntity: BaseEntity, relationship: string) {
		if (!entity) return;

		// Build new segments array with current entity added
		const newSegments: BreadcrumbSegment[] = [
			...breadcrumbSegments,
			{
				entityId: entity.id,
				entityName: entity.name,
				entityType: entity.type,
				relationship
			}
		];

		// Truncate to max of 6 segments
		const truncatedSegments = newSegments.length > 6 ? newSegments.slice(-6) : newSegments;

		// Navigate to target with updated path
		const navPath = serializeBreadcrumbPath(truncatedSegments);
		goto(`/entities/${targetEntity.type}/${targetEntity.id}?navPath=${navPath}`);
	}

	function handleBreadcrumbNavigate(index: number) {
		const segment = breadcrumbSegments[index];
		if (!segment) return;

		// Navigate to that segment with path truncated to that point
		const newSegments = breadcrumbSegments.slice(0, index);
		if (newSegments.length > 0) {
			const navPath = serializeBreadcrumbPath(newSegments);
			goto(`/entities/${segment.entityType}/${segment.entityId}?navPath=${navPath}`);
		} else {
			goto(`/entities/${segment.entityType}/${segment.entityId}`);
		}
	}

	function handleClearBreadcrumbs() {
		if (!entity) return;
		goto(`/entities/${entity.type}/${entity.id}`);
	}

	// Helper to get entity by ID for template rendering
	function getEntityById(id: string) {
		return entitiesStore.getById(id);
	}

	let relateCommandOpen = $state(false);
	let editingLinkId = $state<string | null>(null);

	// Get the link being edited and the target entity
	const editingLink = $derived(
		editingLinkId && entity
			? entity.links.find(l => l.id === editingLinkId)
			: null
	);
	const editingTargetEntity = $derived(
		editingLink ? entitiesStore.getById(editingLink.targetId) : null
	);

	async function handleDelete() {
		if (!entity) return;

		// Check if this is the last campaign
		if (isCampaignPage && campaignStore.allCampaigns.length <= 1) {
			notificationStore.error('Cannot delete the last campaign');
			return;
		}

		if (confirm(`Are you sure you want to delete "${entity.name}"?`)) {
			try {
				await entitiesStore.delete(entity.id);
				goto(`/entities/${entityType}`);
			} catch (error) {
				console.error('Failed to delete entity:', error);
				notificationStore.error(error instanceof Error ? error.message : 'Failed to delete entity');
			}
		}
	}

	async function handleRemoveLink(linkId: string) {
		if (!entity) return;
		if (confirm('Remove this relationship?')) {
			// Find the link to get the targetId
			const link = entity.links.find(l => l.id === linkId);
			if (link) {
				await entitiesStore.removeLink(entity.id, link.targetId);
			}
		}
	}

	function handleEditLink(linkId: string) {
		editingLinkId = linkId;
	}

	function handleCloseEditModal() {
		editingLinkId = null;
	}

	async function handleSaveLink(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
	}) {
		if (!entity || !editingLinkId) return;

		await entitiesStore.updateLink(entity.id, editingLinkId, changes);
		notificationStore.success('Relationship updated successfully');
	}
</script>

<svelte:head>
	<title>{entity?.name ?? 'Entity'} - Director Assist</title>
</svelte:head>

{#if entity}
	<div class="max-w-4xl mx-auto">
		<!-- Back link -->
		<a
			href="/entities/{entityType}"
			class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to {typeDefinition?.labelPlural ?? 'Entities'}
		</a>

		<!-- Breadcrumb navigation (only shown when navigating via relationships) -->
		{#if breadcrumbSegments.length > 0}
			<RelationshipBreadcrumbs
				segments={breadcrumbSegments}
				currentEntity={{ id: entity.id, name: entity.name, type: entity.type }}
				onNavigate={handleBreadcrumbNavigate}
				onClear={handleClearBreadcrumbs}
			/>
		{/if}

		<!-- Header -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<div class="flex items-center gap-2 mb-1">
					<h1 class="text-3xl font-bold text-slate-900 dark:text-white">
						{entity.name}
					</h1>
					{#if entity.playerVisible === false}
						<span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md text-sm font-medium">
							<EyeOff class="w-3 h-3" />
							DM Only
						</span>
					{/if}
				</div>
				<p class="text-slate-500 dark:text-slate-400">
					{typeDefinition?.label ?? entity.type}
				</p>
			</div>

			<div class="flex gap-2">
				<a href="/entities/{entityType}/{entity.id}/edit" class="btn btn-secondary">
					<Edit class="w-4 h-4" />
					Edit
				</a>
				<button
					class="btn btn-ghost text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleDelete}
					disabled={!canDeleteCampaign}
					title={!canDeleteCampaign ? 'Cannot delete the last campaign' : 'Delete'}
				>
					<Trash2 class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Tags -->
		{#if entity.tags.length > 0}
			<div class="flex flex-wrap gap-2 mb-6">
				{#each entity.tags as tag}
					<span class="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Description -->
		{#if entity.description}
			<div class="max-w-none mb-8">
				<p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{entity.description}</p>
			</div>
		{/if}

		<!-- AI Summary -->
		<div class="mb-8">
			<EntitySummary {entity} editable={true} />
		</div>

		<!-- Fields -->
		{#if Object.keys(entity.fields).length > 0}
			<div class="mb-8">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Details</h2>
				<div class="grid gap-4">
					{#each Object.entries(entity.fields) as [key, value]}
						{@const fieldDef = typeDefinition?.fieldDefinitions.find(
							(f) => f.key === key
						)}
						{#if value !== null && value !== undefined && (value !== '' || fieldDef?.type === 'boolean')}
							<div
								class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4"
								class:border-l-4={fieldDef?.section === 'hidden'}
								class:border-l-amber-500={fieldDef?.section === 'hidden'}
							>
								<div class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
									{fieldDef?.label ?? key}
									{#if fieldDef?.section === 'hidden'}
										<span class="text-amber-600 dark:text-amber-400 ml-2">
											(Secret)
										</span>
									{/if}
								</div>
								<div class="text-slate-900 dark:text-white whitespace-pre-wrap">
									{#if Array.isArray(value)}
										{#if fieldDef?.type === 'multi-select'}
											{value.map((v) => String(v).replace(/_/g, ' ')).join(', ')}
										{:else}
											{value.join(', ')}
										{/if}
									{:else if fieldDef?.type === 'boolean'}
										<div class="flex items-center gap-2">
											{#if value}
												<Check class="w-5 h-5 text-green-600 dark:text-green-400" />
												<span>Yes</span>
											{:else}
												<XIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
												<span>No</span>
											{/if}
										</div>
									{:else if fieldDef?.type === 'url' && typeof value === 'string'}
										<a
											href={value}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
										>
											{value}
											<ExternalLink class="w-4 h-4" />
										</a>
									{:else if fieldDef?.type === 'image' && typeof value === 'string'}
										<img
											src={value}
											alt={fieldDef?.label ?? key}
											class="max-w-full h-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700 mt-2"
										/>
									{:else if fieldDef?.type === 'entity-ref' && typeof value === 'string'}
										{@const referencedEntity = getEntityById(value)}
										{#if referencedEntity}
											{@const refTypeDef = getEntityTypeDefinition(
												referencedEntity.type,
												campaignStore.customEntityTypes,
												campaignStore.entityTypeOverrides
											)}
											<a
												href="/entities/{referencedEntity.type}/{referencedEntity.id}"
												class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
											>
												{referencedEntity.name}
												<span class="text-xs text-slate-500 dark:text-slate-400">
													({refTypeDef?.label ?? referencedEntity.type})
												</span>
											</a>
										{:else}
											<span class="text-slate-400 dark:text-slate-500">(Deleted)</span>
										{/if}
									{:else if fieldDef?.type === 'entity-refs' && Array.isArray(value)}
										{#if value.length > 0}
											<div class="flex flex-col gap-1">
												{#each value as entityId}
													{@const referencedEntity = getEntityById(entityId)}
													{#if referencedEntity}
														{@const refTypeDef = getEntityTypeDefinition(
															referencedEntity.type,
															campaignStore.customEntityTypes,
															campaignStore.entityTypeOverrides
														)}
														<a
															href="/entities/{referencedEntity.type}/{referencedEntity.id}"
															class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
														>
															{referencedEntity.name}
															<span class="text-xs text-slate-500 dark:text-slate-400">
																({refTypeDef?.label ?? referencedEntity.type})
															</span>
														</a>
													{:else}
														<span class="text-slate-400 dark:text-slate-500">(Deleted)</span>
													{/if}
												{/each}
											</div>
										{:else}
											<span class="text-slate-400 dark:text-slate-500">—</span>
										{/if}
									{:else if fieldDef?.type === 'richtext' && typeof value === 'string'}
										<MarkdownViewer content={value} />
									{:else}
										{value}
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Linked Entities -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<Link class="w-5 h-5" />
					Relationships
					{#if linkedEntitiesWithRelationships.length > 0}
						<span class="text-sm font-normal text-slate-500 dark:text-slate-400">
							({linkedEntitiesWithRelationships.length})
						</span>
					{/if}
				</h2>
				<div class="flex items-center gap-2">
					{#if linkedEntitiesWithRelationships.length > 0}
						<a
							href="/entities/{entityType}/{entity?.id}/relationships"
							class="btn btn-ghost text-sm"
						>
							Manage Relationships
							<ArrowRight class="w-4 h-4" />
						</a>
					{/if}
					<button onclick={() => (relateCommandOpen = true)} class="btn btn-secondary text-sm">
						<Plus class="w-4 h-4" />
						Link Entity
					</button>
				</div>
			</div>

			{#if linkedEntitiesWithRelationships.length > 0}
				<div class="grid gap-4">
					{#each linkedEntitiesWithRelationships as { entity: linkedEntity, link, isReverse }}
						<RelationshipCard
							{linkedEntity}
							{link}
							{isReverse}
							{typeDefinition}
							onRemove={handleRemoveLink}
							onEdit={handleEditLink}
							onNavigate={handleRelationshipNavigate}
						/>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
					<Link class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
					<p class="text-slate-500 dark:text-slate-400 mb-3">
						No relationships yet
					</p>
					<button onclick={() => (relateCommandOpen = true)} class="btn btn-secondary">
						<Plus class="w-4 h-4" />
						Link Entity
					</button>
				</div>
			{/if}
		</div>

		<!-- DM Notes -->
		{#if entity.notes}
			<div class="mb-8">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">DM Notes</h2>
				<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
					<p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{entity.notes}
					</p>
				</div>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="text-sm text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
			<p>Created: {new Date(entity.createdAt).toLocaleString()}</p>
			<p>Updated: {new Date(entity.updatedAt).toLocaleString()}</p>
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Entity not found</p>
		<a href="/entities/{entityType}" class="btn btn-secondary mt-4">
			<ArrowLeft class="w-4 h-4" />
			Back to list
		</a>
	</div>
{/if}

<!-- Relate Command Modal -->
{#if entity}
	<RelateCommand sourceEntity={entity} bind:open={relateCommandOpen} />
{/if}

<!-- Edit Relationship Modal -->
{#if entity && editingLink && editingTargetEntity}
	<EditRelationshipModal
		sourceEntity={entity}
		targetEntity={editingTargetEntity}
		link={editingLink}
		open={!!editingLinkId}
		onClose={handleCloseEditModal}
		onSave={handleSaveLink}
	/>
{/if}
