<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, notificationStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import type { FieldValue } from '$lib/types';
	import { validateEntity } from '$lib/utils';
	import { ArrowLeft, Save } from 'lucide-svelte';

	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
	const typeDefinition = $derived(
		entityType
			? getEntityTypeDefinition(
					entityType,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);

	// Form state
	let name = $state('');
	let description = $state('');
	let summary = $state('');
	let tags = $state('');
	let notes = $state('');
	let fields = $state<Record<string, FieldValue>>({});
	let isSaving = $state(false);
	let isInitialized = $state(false);
	let errors = $state<Record<string, string>>({});

	// Validation
	function validate(): boolean {
		const result = validateEntity(
			name,
			$state.snapshot(fields),
			typeDefinition?.fieldDefinitions ?? []
		);
		errors = result.errors;
		return result.valid;
	}

	function clearError(key: string) {
		if (errors[key]) {
			const newErrors = { ...errors };
			delete newErrors[key];
			errors = newErrors;
		}
	}

	// Initialize form with entity data
	$effect(() => {
		if (entity && !isInitialized) {
			name = entity.name;
			description = entity.description;
			summary = entity.summary ?? '';
			tags = entity.tags.join(', ');
			notes = entity.notes;
			fields = { ...entity.fields };
			isInitialized = true;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!entityId) return;
		if (!validate()) return;

		isSaving = true;

		try {
			await entitiesStore.update(entityId, {
				name: name.trim(),
				description: description.trim(),
				summary: summary.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				notes: notes.trim(),
				fields: $state.snapshot(fields),
				updatedAt: new Date()
			});

			goto(`/entities/${entityType}/${entityId}`);
		} catch (error) {
			console.error('Failed to update entity:', error);
			notificationStore.error('Failed to update entity. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function updateField(key: string, value: FieldValue) {
		fields = { ...fields, [key]: value };
		clearError(key);
	}
</script>

<svelte:head>
	<title>Edit {entity?.name ?? 'Entity'} - Director Assist</title>
</svelte:head>

{#if entity && isInitialized}
	<div class="max-w-2xl mx-auto">
		<!-- Back link -->
		<a
			href="/entities/{entityType}/{entityId}"
			class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to {entity.name}
		</a>

		<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
			Edit {typeDefinition?.label ?? 'Entity'}
		</h1>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Name -->
			<div>
				<label for="name" class="label">Name *</label>
				<input
					id="name"
					type="text"
					class="input {errors.name ? 'input-error' : ''}"
					bind:value={name}
					oninput={() => clearError('name')}
					placeholder="Enter a name..."
				/>
				{#if errors.name}
					<p class="error-message">{errors.name}</p>
				{/if}
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

			<!-- Summary -->
			<div>
				<label for="summary" class="label">Summary</label>
				<p class="text-sm text-slate-500 mb-1">
					This summary will be submitted as context when calling an AI agent. Can be auto-generated on the view page.
				</p>
				<textarea
					id="summary"
					class="input min-h-[60px]"
					bind:value={summary}
					placeholder="A brief summary of this entity for AI context..."
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
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							/>
						{:else if field.type === 'textarea' || field.type === 'richtext'}
							<textarea
								id={field.key}
								class="input min-h-[80px] {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							></textarea>
						{:else if field.type === 'number'}
							<input
								id={field.key}
								type="number"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as number) ?? ''}
								oninput={(e) =>
									updateField(field.key, parseFloat(e.currentTarget.value) || 0)}
							/>
						{:else if field.type === 'select'}
							<select
								id={field.key}
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								onchange={(e) => updateField(field.key, e.currentTarget.value)}
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
								class="input {errors[field.key] ? 'input-error' : ''}"
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
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder ?? 'e.g., Year 1042, Third Age'}
							/>
						{:else}
							<input
								id={field.key}
								type="text"
								class="input {errors[field.key] ? 'input-error' : ''}"
								value={(fields[field.key] as string) ?? ''}
								oninput={(e) => updateField(field.key, e.currentTarget.value)}
								placeholder={field.placeholder}
							/>
						{/if}

						{#if errors[field.key]}
							<p class="error-message">{errors[field.key]}</p>
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
				<button type="submit" class="btn btn-primary" disabled={isSaving}>
					<Save class="w-4 h-4" />
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>
				<a href="/entities/{entityType}/{entityId}" class="btn btn-secondary"> Cancel </a>
			</div>
		</form>
	</div>
{:else if !entity}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Entity not found</p>
		<a href="/entities/{entityType}" class="btn btn-secondary mt-4">
			<ArrowLeft class="w-4 h-4" />
			Back to list
		</a>
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Loading...</p>
	</div>
{/if}
