<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, notificationStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { generateEntity, hasGenerationApiKey } from '$lib/services';
	import { createEntity, type FieldValue } from '$lib/types';
	import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-svelte';

	const entityType = $derived($page.params.type ?? '');
	const typeDefinition = $derived(
		entityType
			? getEntityTypeDefinition(
					entityType,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);
	const canGenerate = $derived(hasGenerationApiKey());

	// Form state
	let name = $state('');
	let description = $state('');
	let summary = $state('');
	let tags = $state('');
	let notes = $state('');
	let fields = $state<Record<string, FieldValue>>({});
	let isSaving = $state(false);
	let isGenerating = $state(false);

	// Initialize default field values
	$effect(() => {
		if (typeDefinition) {
			const defaultFields: Record<string, FieldValue> = {};
			for (const field of typeDefinition.fieldDefinitions) {
				if (field.defaultValue !== undefined) {
					defaultFields[field.key] = field.defaultValue;
				}
			}
			fields = defaultFields;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim() || !entityType) return;

		isSaving = true;

		try {
			const newEntity = createEntity(entityType, name.trim(), {
				description: description.trim(),
				summary: summary.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim(),
				fields: $state.snapshot(fields)
			});

			const created = await entitiesStore.create(newEntity);
			goto(`/entities/${entityType}/${created.id}`);
		} catch (error) {
			console.error('Failed to create entity:', error);
			notificationStore.error('Failed to create entity. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function updateField(key: string, value: FieldValue) {
		fields = { ...fields, [key]: value };
	}

	async function handleGenerate() {
		if (!typeDefinition || isGenerating) return;

		isGenerating = true;

		try {
			// Build context from current form values
			const context = {
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				fields: $state.snapshot(fields)
			};

			// Get campaign context if available
			const campaign = campaignStore.campaign;
			const campaignContext = campaign
				? {
						name: campaign.name,
						setting: (campaign.fields?.setting as string) ?? '',
						system: (campaign.fields?.system as string) ?? ''
					}
				: undefined;

			const result = await generateEntity(typeDefinition, context, campaignContext);

			if (result.success && result.entity) {
				// Populate form with generated values
				name = result.entity.name;
				description = result.entity.description;
				summary = result.entity.summary;
				tags = result.entity.tags.join(', ');
				fields = { ...fields, ...result.entity.fields };

				notificationStore.success('Entity generated! Review and save when ready.');
			} else {
				notificationStore.error(result.error ?? 'Failed to generate entity');
			}
		} catch (error) {
			console.error('Failed to generate entity:', error);
			notificationStore.error('An unexpected error occurred');
		} finally {
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>New {typeDefinition?.label ?? 'Entity'} - Director Assist</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Back link -->
	<a
		href="/entities/{entityType}"
		class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
	>
		<ArrowLeft class="w-4 h-4" />
		Back to {typeDefinition?.labelPlural ?? 'Entities'}
	</a>

	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
		New {typeDefinition?.label ?? 'Entity'}
	</h1>

	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- Name -->
		<div>
			<label for="name" class="label">Name *</label>
			<input
				id="name"
				type="text"
				class="input"
				bind:value={name}
				required
				placeholder="Enter a name..."
			/>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="label">Description</label>
			<textarea
				id="description"
				class="input min-h-[100px]"
				bind:value={description}
				placeholder="Describe this {typeDefinition?.label?.toLowerCase() ?? 'entity'}..."
			></textarea>
		</div>

		<!-- Type-specific fields -->
		{#if typeDefinition}
			{#each typeDefinition.fieldDefinitions.filter((f) => f.section !== 'hidden') as field}
				<div>
					<label for={field.key} class="label">
						{field.label}
						{#if field.required}*{/if}
					</label>

					{#if field.helpText}
						<p class="text-sm text-slate-500 mb-1">{field.helpText}</p>
					{/if}

					{#if field.type === 'text'}
						<input
							id={field.key}
							type="text"
							class="input"
							value={(fields[field.key] as string) ?? ''}
							oninput={(e) => updateField(field.key, e.currentTarget.value)}
							placeholder={field.placeholder}
							required={field.required}
						/>
					{:else if field.type === 'textarea' || field.type === 'richtext'}
						<textarea
							id={field.key}
							class="input min-h-[80px]"
							value={(fields[field.key] as string) ?? ''}
							oninput={(e) => updateField(field.key, e.currentTarget.value)}
							placeholder={field.placeholder}
							required={field.required}
						></textarea>
					{:else if field.type === 'number'}
						<input
							id={field.key}
							type="number"
							class="input"
							value={(fields[field.key] as number) ?? ''}
							oninput={(e) =>
								updateField(field.key, parseFloat(e.currentTarget.value) || 0)}
							required={field.required}
						/>
					{:else if field.type === 'select'}
						<select
							id={field.key}
							class="input"
							value={(fields[field.key] as string) ?? ''}
							onchange={(e) => updateField(field.key, e.currentTarget.value)}
							required={field.required}
						>
							<option value="">Select...</option>
							{#each field.options ?? [] as option}
								<option value={option}>{option.replace(/_/g, ' ')}</option>
							{/each}
						</select>
					{:else if field.type === 'tags'}
						<input
							id={field.key}
							type="text"
							class="input"
							value={Array.isArray(fields[field.key])
								? (fields[field.key] as string[]).join(', ')
								: ''}
							oninput={(e) =>
								updateField(
									field.key,
									e.currentTarget.value
										.split(',')
										.map((t) => t.trim())
										.filter(Boolean)
								)}
							placeholder={field.placeholder ?? 'Comma-separated values'}
						/>
					{:else if field.type === 'date'}
						<input
							id={field.key}
							type="text"
							class="input"
							value={(fields[field.key] as string) ?? ''}
							oninput={(e) => updateField(field.key, e.currentTarget.value)}
							placeholder={field.placeholder ?? 'e.g., Year 1042, Third Age'}
						/>
					{:else}
						<input
							id={field.key}
							type="text"
							class="input"
							value={(fields[field.key] as string) ?? ''}
							oninput={(e) => updateField(field.key, e.currentTarget.value)}
							placeholder={field.placeholder}
						/>
					{/if}
				</div>
			{/each}

			<!-- Hidden/Secret fields -->
			{@const secretFields = typeDefinition.fieldDefinitions.filter(
				(f) => f.section === 'hidden'
			)}
			{#if secretFields.length > 0}
				<div class="border-t border-slate-200 dark:border-slate-700 pt-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
						Secrets (DM Only)
					</h2>
					{#each secretFields as field}
						<div class="mb-4">
							<label for={field.key} class="label">{field.label}</label>
							<textarea
								id={field.key}
								class="input min-h-[80px]"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							></textarea>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Tags -->
		<div>
			<label for="tags" class="label">Tags</label>
			<input
				id="tags"
				type="text"
				class="input"
				bind:value={tags}
				placeholder="Comma-separated tags..."
			/>
		</div>

		<!-- DM Notes -->
		<div>
			<label for="notes" class="label">DM Notes</label>
			<textarea
				id="notes"
				class="input min-h-[80px]"
				bind:value={notes}
				placeholder="Private notes only you can see..."
			></textarea>
		</div>

		<!-- Submit -->
		<div class="flex gap-3 pt-4">
			<button type="submit" class="btn btn-primary" disabled={isSaving || isGenerating || !name.trim()}>
				<Save class="w-4 h-4" />
				{isSaving ? 'Saving...' : 'Create'}
			</button>
			<button
				type="button"
				class="btn btn-secondary"
				onclick={handleGenerate}
				disabled={isGenerating || isSaving || !canGenerate}
				title={canGenerate ? 'Generate entity content using AI' : 'Configure API key in Settings'}
			>
				{#if isGenerating}
					<Loader2 class="w-4 h-4 animate-spin" />
					Generating...
				{:else}
					<Sparkles class="w-4 h-4" />
					Generate
				{/if}
			</button>
			<a href="/entities/{entityType}" class="btn btn-secondary"> Cancel </a>
		</div>
	</form>
</div>
