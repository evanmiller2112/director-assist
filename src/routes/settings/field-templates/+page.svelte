<script lang="ts">
	import { Plus, Search, Edit, Trash2, Package } from 'lucide-svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import FieldTemplateFormModal from '$lib/components/settings/FieldTemplateFormModal.svelte';
	import FieldTemplateDeleteModal from '$lib/components/settings/FieldTemplateDeleteModal.svelte';
	import type { FieldTemplate } from '$lib/types';

	let searchQuery = $state('');
	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedTemplate: FieldTemplate | undefined = $state(undefined);
	let deleteLoading = $state(false);

	// Filter templates based on search
	const filteredTemplates = $derived(
		campaignStore.fieldTemplates.filter(
			(template) =>
				template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
		)
	);

	const hasTemplates = $derived(campaignStore.fieldTemplates.length > 0);

	function openCreateModal() {
		selectedTemplate = undefined;
		showCreateModal = true;
	}

	function openEditModal(template: FieldTemplate) {
		selectedTemplate = template;
		showEditModal = true;
	}

	function openDeleteModal(template: FieldTemplate) {
		selectedTemplate = template;
		showDeleteModal = true;
	}

	function handleCreate(template: FieldTemplate) {
		campaignStore.addFieldTemplate(template);
		showCreateModal = false;
	}

	function handleEdit(template: FieldTemplate) {
		campaignStore.updateFieldTemplate(template.id, template);
		showEditModal = false;
		selectedTemplate = undefined;
	}

	async function handleDelete() {
		if (!selectedTemplate) return;

		deleteLoading = true;
		try {
			campaignStore.deleteFieldTemplate(selectedTemplate.id);
			showDeleteModal = false;
			selectedTemplate = undefined;
		} finally {
			deleteLoading = false;
		}
	}

	function getCategoryLabel(category: string): string {
		return category === 'draw-steel' ? 'Draw Steel' : 'User';
	}
</script>

<svelte:head>
	<title>Field Templates - Director Assist</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white">
				Field Templates
			</h1>
			<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
				Manage reusable field configurations for custom entity types
			</p>
		</div>
		<button
			type="button"
			class="btn btn-primary"
			onclick={openCreateModal}
		>
			<Plus class="w-4 h-4 mr-2" />
			New Template
		</button>
	</div>

	<!-- Search and Filters -->
	{#if hasTemplates}
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
			<input
				type="text"
				class="input pl-10"
				placeholder="Search templates..."
				bind:value={searchQuery}
				aria-label="Search templates"
			/>
		</div>
	{/if}

	<!-- Content -->
	{#if !hasTemplates}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-6">
				<Package class="w-10 h-10 text-slate-400" />
			</div>
			<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
				No Field Templates Yet
			</h2>
			<p class="text-slate-600 dark:text-slate-400 max-w-md mb-6">
				Create your first field template to quickly reuse common field configurations across multiple entity types.
			</p>
			<button
				type="button"
				class="btn btn-primary"
				onclick={openCreateModal}
			>
				<Plus class="w-4 h-4 mr-2" />
				Create Template
			</button>
		</div>
	{:else if filteredTemplates.length === 0}
		<!-- No Results -->
		<div class="text-center py-12">
			<p class="text-slate-600 dark:text-slate-400">
				No templates found matching "{searchQuery}"
			</p>
		</div>
	{:else}
		<!-- Templates Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredTemplates as template}
				<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
					<!-- Header -->
					<div class="flex items-start justify-between mb-3">
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-slate-900 dark:text-white truncate mb-1">
								{template.name}
							</h3>
							{#if template.description}
								<p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
									{template.description}
								</p>
							{/if}
						</div>
					</div>

					<!-- Metadata -->
					<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
						<span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
							{getCategoryLabel(template.category)}
						</span>
						<span>
							{template.fieldDefinitions.length} {template.fieldDefinitions.length === 1 ? 'field' : 'fields'}
						</span>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="btn btn-secondary flex-1"
							onclick={() => openEditModal(template)}
							aria-label="Edit {template.name}"
						>
							<Edit class="w-4 h-4 mr-2" />
							Edit
						</button>
						<button
							type="button"
							class="btn bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
							onclick={() => openDeleteModal(template)}
							aria-label="Delete {template.name}"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modals -->
<FieldTemplateFormModal
	open={showCreateModal}
	onsubmit={handleCreate}
	oncancel={() => (showCreateModal = false)}
/>

<FieldTemplateFormModal
	open={showEditModal}
	template={selectedTemplate}
	onsubmit={handleEdit}
	oncancel={() => {
		showEditModal = false;
		selectedTemplate = undefined;
	}}
/>

{#if selectedTemplate}
	<FieldTemplateDeleteModal
		open={showDeleteModal}
		template={selectedTemplate}
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => {
			showDeleteModal = false;
			selectedTemplate = undefined;
		}}
	/>
{/if}
