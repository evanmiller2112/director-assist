<script lang="ts">
	import type { EntityTypeDefinition } from '$lib/types';
	import EntityTypeTemplateGallery from './EntityTypeTemplateGallery.svelte';
	import CustomEntityTypeForm from './CustomEntityTypeForm.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	interface Props {
		onsubmit: (entityType: EntityTypeDefinition) => void;
		oncancel: () => void;
	}

	let { onsubmit, oncancel }: Props = $props();

	// State management
	let mode = $state<'gallery' | 'form'>('gallery');
	let selectedTemplate = $state<EntityTypeDefinition | undefined>(undefined);
	let formDirty = $state(false);
	let showConfirmDialog = $state(false);

	// Handle template selection from gallery
	function handleTemplateSelect(template: EntityTypeDefinition) {
		selectedTemplate = template;
		mode = 'form';
	}

	// Handle "Start from Scratch" selection
	function handleStartFromScratch() {
		selectedTemplate = undefined;
		mode = 'form';
	}

	// Handle form submission
	function handleFormSubmit(entityType: EntityTypeDefinition) {
		onsubmit(entityType);
	}

	// Handle "Change template" button click from form
	function handleChangeTemplate() {
		if (formDirty) {
			// Show confirmation dialog if form has unsaved changes
			showConfirmDialog = true;
		} else {
			// Directly return to gallery if form is clean
			returnToGallery();
		}
	}

	// Return to gallery view
	function returnToGallery() {
		mode = 'gallery';
		selectedTemplate = undefined;
		formDirty = false;
		showConfirmDialog = false;
	}

	// Handle dirty state changes from form
	function handleDirtyChange(dirty: boolean) {
		formDirty = dirty;
	}

	// Cancel confirmation and stay on form
	function handleCancelConfirmation() {
		showConfirmDialog = false;
	}

	// Confirm template change and return to gallery
	function handleConfirmTemplateChange() {
		returnToGallery();
	}
</script>

{#if mode === 'gallery'}
	<!-- Gallery View -->
	<div class="space-y-6">
		<EntityTypeTemplateGallery
			onSelectTemplate={handleTemplateSelect}
			onStartFromScratch={handleStartFromScratch}
		/>

		<!-- Cancel button for gallery -->
		<div class="flex justify-start pt-4 border-t border-slate-200 dark:border-slate-700">
			<button
				type="button"
				class="btn btn-secondary"
				onclick={oncancel}
				aria-label="Cancel and return"
			>
				<ArrowLeft class="w-4 h-4" />
				Cancel
			</button>
		</div>
	</div>
{:else}
	<!-- Form View -->
	<CustomEntityTypeForm
		initialValue={selectedTemplate}
		templateName={selectedTemplate?.label}
		onChangeTemplate={selectedTemplate ? handleChangeTemplate : undefined}
		onDirtyChange={handleDirtyChange}
		onsubmit={handleFormSubmit}
		oncancel={oncancel}
	/>
{/if}

<!-- Confirmation Dialog for Template Change -->
<ConfirmDialog
	open={showConfirmDialog}
	title="Change Template?"
	message="You have unsaved changes. Changing the template will discard your changes. Are you sure you want to continue?"
	confirmText="Change template"
	cancelText="Keep editing"
	variant="warning"
	onConfirm={handleConfirmTemplateChange}
	onCancel={handleCancelConfirmation}
/>
