<script lang="ts">
	import { Users } from 'lucide-svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { entitiesStore } from '$lib/stores';
	import { TableVisualization, SeatAssignmentModal } from '$lib/components/entity';
	import type { TableMap, SeatAssignment } from '$lib/types/campaign';

	// State for table configuration
	let seatCount = $state(6);
	let tableShape = $state<'oval' | 'rectangular'>('oval');
	let dmPosition = $state<number | undefined>(0);

	// State for seat assignment modal
	let modalOpen = $state(false);
	let selectedSeatIndex = $state(0);

	// Get current campaign table map
	const tableMap = $derived(campaignStore.tableMap);

	// Get characters from entities store
	const characters = $derived(
		entitiesStore.entities.filter((e) => e.type === 'character')
	);

	// Initialize form from existing table map
	$effect(() => {
		if (tableMap) {
			seatCount = tableMap.seats;
			tableShape = tableMap.shape;
			dmPosition = tableMap.dmPosition;
		}
	});

	// Current assignment for the selected seat
	const currentAssignment = $derived.by(() => {
		if (!tableMap) return undefined;
		return tableMap.assignments.find((a) => a.seatIndex === selectedSeatIndex);
	});

	// Save table configuration
	async function saveTableConfiguration() {
		const newTableMap: TableMap = {
			seats: seatCount,
			shape: tableShape,
			dmPosition,
			assignments: tableMap?.assignments || []
		};
		await campaignStore.updateTableMap(newTableMap);
	}

	// Handle seat count change
	async function handleSeatCountChange() {
		await saveTableConfiguration();
	}

	// Handle shape change
	async function handleShapeChange() {
		await saveTableConfiguration();
	}

	// Handle DM position change
	async function handleDmPositionChange() {
		await saveTableConfiguration();
	}

	// Handle seat click - open assignment modal
	function handleSeatClick(seatIndex: number) {
		selectedSeatIndex = seatIndex;
		modalOpen = true;
	}

	// Handle save assignment
	async function handleSaveAssignment(characterId?: string) {
		if (!tableMap) {
			// Create initial table map if it doesn't exist
			const newTableMap: TableMap = {
				seats: seatCount,
				shape: tableShape,
				dmPosition,
				assignments: []
			};

			// Add assignment if character is selected
			if (characterId) {
				newTableMap.assignments = [
					{
						seatIndex: selectedSeatIndex,
						characterId
					}
				];
			}

			await campaignStore.updateTableMap(newTableMap);
		} else {
			// Update existing table map
			const updatedAssignments = tableMap.assignments.filter(
				(a) => a.seatIndex !== selectedSeatIndex
			);

			// Add new assignment if character is selected
			if (characterId) {
				updatedAssignments.push({
					seatIndex: selectedSeatIndex,
					characterId
				});
			}

			const updatedTableMap: TableMap = {
				...tableMap,
				assignments: updatedAssignments
			};

			await campaignStore.updateTableMap(updatedTableMap);
		}
	}

	// Handle close modal
	function handleCloseModal() {
		modalOpen = false;
	}

	// Handle clear all assignments
	async function handleClearAllAssignments() {
		if (tableMap) {
			const clearedTableMap: TableMap = {
				...tableMap,
				assignments: []
			};
			await campaignStore.updateTableMap(clearedTableMap);
		}
	}
</script>

<div class="table-page p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-3">
			<Users class="w-8 h-8 text-slate-700 dark:text-slate-300" />
			<h1 class="text-3xl font-bold text-slate-900 dark:text-white">Table Map</h1>
		</div>
	</div>

	<p class="text-slate-600 dark:text-slate-400 mb-6">
		Click seats to assign characters. The player name is pulled from each character's "Player Name" field.
	</p>

	<!-- Table Container with integrated config -->
	<div class="table-container bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
		<!-- Config Toolbar -->
		<div class="config-toolbar flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
			<!-- Seat Count -->
			<div class="flex items-center gap-2">
				<label for="seat-count" class="text-sm font-medium text-slate-600 dark:text-slate-400">Seats:</label>
				<select
					id="seat-count"
					class="input-sm"
					bind:value={seatCount}
					onchange={handleSeatCountChange}
				>
					{#each [4, 5, 6, 7, 8, 9, 10] as count}
						<option value={count}>{count}</option>
					{/each}
				</select>
			</div>

			<!-- Table Shape -->
			<div class="flex items-center gap-2">
				<label for="table-shape" class="text-sm font-medium text-slate-600 dark:text-slate-400">Shape:</label>
				<select
					id="table-shape"
					class="input-sm"
					bind:value={tableShape}
					onchange={handleShapeChange}
				>
					<option value="oval">Oval</option>
					<option value="rectangular">Rectangular</option>
				</select>
			</div>

			<!-- DM Position -->
			<div class="flex items-center gap-2">
				<label for="dm-position" class="text-sm font-medium text-slate-600 dark:text-slate-400">Director:</label>
				<select
					id="dm-position"
					class="input-sm"
					bind:value={dmPosition}
					onchange={handleDmPositionChange}
				>
					<option value={undefined}>None</option>
					{#each Array(seatCount) as _, index}
						<option value={index}>Seat {index + 1}</option>
					{/each}
				</select>
			</div>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Clear All Button -->
			{#if tableMap && tableMap.assignments.length > 0}
				<button class="btn-sm btn-secondary" onclick={handleClearAllAssignments}>
					Clear All
				</button>
			{/if}
		</div>

		<!-- Table Visualization -->
		{#if tableMap}
			<TableVisualization
				{tableMap}
				{characters}
				onSeatClick={handleSeatClick}
			/>
		{:else}
			<!-- Initial setup message -->
			<div class="text-center py-16 px-4">
				<Users class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
				<h2 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
					Getting started
				</h2>
				<p class="text-slate-500 dark:text-slate-400">
					Configure seats above and the table will appear
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- Seat Assignment Modal -->
<SeatAssignmentModal
	open={modalOpen}
	seatIndex={selectedSeatIndex}
	currentAssignment={currentAssignment}
	{characters}
	onSave={handleSaveAssignment}
	onClose={handleCloseModal}
/>

<style>
	.input-sm {
		padding: 0.375rem 0.625rem;
		border: 1px solid rgb(203, 213, 225);
		border-radius: 0.375rem;
		background: white;
		color: rgb(15, 23, 42);
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.input-sm:focus {
		outline: none;
		border-color: rgb(59, 130, 246);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .input-sm {
		background: rgb(51, 65, 85);
		border-color: rgb(71, 85, 105);
		color: rgb(248, 250, 252);
	}

	:global(.dark) .input-sm:focus {
		border-color: rgb(96, 165, 250);
		box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn-sm.btn-secondary {
		background: rgb(226, 232, 240);
		color: rgb(51, 65, 85);
	}

	.btn-sm.btn-secondary:hover {
		background: rgb(203, 213, 225);
	}

	:global(.dark) .btn-sm.btn-secondary {
		background: rgb(71, 85, 105);
		color: rgb(203, 213, 225);
	}

	:global(.dark) .btn-sm.btn-secondary:hover {
		background: rgb(100, 116, 139);
	}
</style>
