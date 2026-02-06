<script lang="ts">
	import { Crown } from 'lucide-svelte';
	import type { BaseEntity } from '$lib/types';
	import type { TableMap } from '$lib/types/campaign';

	interface Props {
		tableMap: TableMap;
		characters: BaseEntity[];
		onSeatClick: (seatIndex: number) => void;
		readonly?: boolean;
	}

	let { tableMap, characters, onSeatClick, readonly = false }: Props = $props();

	// Get character for a seat
	function getCharacter(seatIndex: number): BaseEntity | undefined {
		const assignment = tableMap.assignments.find((a) => a.seatIndex === seatIndex);
		if (!assignment?.characterId) return undefined;
		return characters.find((c) => c.id === assignment.characterId);
	}

	// Get player name from character's playerName field
	function getPlayerName(seatIndex: number): string | null {
		const character = getCharacter(seatIndex);
		if (!character) return null;
		const playerName = character.fields?.playerName;
		return typeof playerName === 'string' ? playerName : null;
	}

	// Get character name for a seat
	function getCharacterName(seatIndex: number): string | null {
		const character = getCharacter(seatIndex);
		return character?.name ?? null;
	}

	// Check if a seat is the DM position
	function isDmSeat(seatIndex: number): boolean {
		return tableMap.dmPosition === seatIndex;
	}

	// Check if a seat has any assignment
	function hasAssignment(seatIndex: number): boolean {
		const assignment = tableMap.assignments.find((a) => a.seatIndex === seatIndex);
		return Boolean(assignment?.characterId);
	}

	// Calculate seat position with 1 seat at each short end (left/right), rest split on long sides (top/bottom)
	// The table is wider than tall, so left/right are short ends, top/bottom are long sides
	// Layout: seat 0 at left (DM), seats on top, seat at right, seats on bottom
	function getSeatPosition(seatIndex: number): string {
		const total = tableMap.seats;

		// Calculate how many seats go on each long side
		// 1 at left (DM), 1 at right, rest split between top and bottom
		const longSideSeats = total - 2; // Seats not at short ends
		const topCount = Math.ceil(longSideSeats / 2);
		const bottomCount = Math.floor(longSideSeats / 2);

		// Seat 0: Left center (DM position, short end)
		// Seats 1 to topCount: Top side (left to right)
		// Seat topCount + 1: Right center (short end)
		// Seats topCount + 2 to end: Bottom side (right to left)

		if (seatIndex === 0) {
			// Left center (DM)
			return `left: 5%; top: 50%; transform: translate(-50%, -50%);`;
		}

		const rightSeatIndex = topCount + 1;

		if (seatIndex === rightSeatIndex) {
			// Right center
			return `left: 95%; top: 50%; transform: translate(-50%, -50%);`;
		}

		if (seatIndex <= topCount) {
			// Top side - distribute evenly from left to right
			const posInSide = seatIndex - 1; // 0-indexed position on top side
			const spacing = 70 / (topCount + 1); // Leave margin at left and right
			const x = 15 + spacing * (posInSide + 1);
			return `left: ${x}%; top: 8%; transform: translate(-50%, -50%);`;
		}

		// Bottom side - distribute evenly from right to left
		const posInSide = seatIndex - rightSeatIndex - 1; // 0-indexed position on bottom side
		const spacing = 70 / (bottomCount + 1);
		const x = 85 - spacing * (posInSide + 1);
		return `left: ${x}%; top: 92%; transform: translate(-50%, -50%);`;
	}

	// Handle seat click
	function handleSeatClick(seatIndex: number) {
		if (!readonly) {
			onSeatClick(seatIndex);
		}
	}

	// Handle keyboard interaction
	function handleKeydown(event: KeyboardEvent, seatIndex: number) {
		if (!readonly && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			onSeatClick(seatIndex);
		}
	}
</script>

<div class="table-visualization-container" data-shape={tableMap.shape}>
	<!-- Table surface -->
	<div
		class="table-surface {tableMap.shape === 'oval' ? 'rounded-full' : 'rounded-lg'}"
		aria-label="Game table"
	>
		<div class="table-label">
			{tableMap.shape === 'oval' ? 'Oval' : 'Rectangular'} Table
		</div>
	</div>

	<!-- Seats -->
	{#each Array(tableMap.seats) as _, seatIndex}
		{@const isDm = isDmSeat(seatIndex)}
		{@const playerName = getPlayerName(seatIndex)}
		{@const characterName = getCharacterName(seatIndex)}
		{@const hasAnyAssignment = hasAssignment(seatIndex)}

		<button
			class="seat {isDm ? 'dm-seat' : ''} {hasAnyAssignment ? 'assigned' : 'empty'}"
			style={getSeatPosition(seatIndex)}
			aria-label="Seat {seatIndex}{isDm ? ' (DM)' : ''}"
			disabled={readonly}
			onclick={() => handleSeatClick(seatIndex)}
			onkeydown={(e) => handleKeydown(e, seatIndex)}
			type="button"
		>
			{#if isDm}
				<div class="dm-indicator" aria-label="Director position">
					<Crown size={16} />
					<span class="dm-label">Director</span>
				</div>
			{/if}

			{#if playerName || characterName}
				<div class="seat-content">
					{#if characterName}
						<div class="character-name">{characterName}</div>
					{/if}
					{#if playerName}
						<div class="player-name">{playerName}</div>
					{/if}
				</div>
			{:else if !isDm}
				<div class="seat-content empty-seat">
					<span class="empty-label">Empty</span>
				</div>
			{/if}
		</button>
	{/each}
</div>

<style>
	.table-visualization-container {
		position: relative;
		width: 100%;
		height: 600px;
		min-height: 500px;
		background: linear-gradient(
			135deg,
			rgb(241, 245, 249) 0%,
			rgb(226, 232, 240) 100%
		);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	:global(.dark) .table-visualization-container {
		background: linear-gradient(
			135deg,
			rgb(30, 41, 59) 0%,
			rgb(15, 23, 42) 100%
		);
	}

	.table-surface {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background: linear-gradient(
			135deg,
			rgb(139, 92, 46) 0%,
			rgb(101, 67, 33) 100%
		);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	[data-shape='oval'] .table-surface {
		width: 60%;
		height: 50%;
	}

	[data-shape='rectangular'] .table-surface {
		width: 50%;
		height: 40%;
	}

	.table-label {
		color: rgba(255, 255, 255, 0.3);
		font-size: 1.5rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		user-select: none;
	}

	.seat {
		position: absolute;
		width: 140px;
		min-height: 80px;
		padding: 0.75rem;
		background: white;
		border: 2px solid rgb(203, 213, 225);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
		justify-content: center;
	}

	:global(.dark) .seat {
		background: rgb(51, 65, 85);
		border-color: rgb(71, 85, 105);
	}

	.seat:hover:not(:disabled) {
		border-color: rgb(59, 130, 246);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		transform: translate(-50%, -50%) scale(1.05);
	}

	:global(.dark) .seat:hover:not(:disabled) {
		border-color: rgb(96, 165, 250);
		box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
	}

	.seat:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.seat.dm-seat {
		border-color: rgb(234, 179, 8);
		background: linear-gradient(
			135deg,
			rgb(254, 249, 195) 0%,
			white 100%
		);
	}

	:global(.dark) .seat.dm-seat {
		border-color: rgb(250, 204, 21);
		background: linear-gradient(
			135deg,
			rgb(71, 65, 30) 0%,
			rgb(51, 65, 85) 100%
		);
	}

	.seat.assigned {
		border-color: rgb(34, 197, 94);
	}

	:global(.dark) .seat.assigned {
		border-color: rgb(74, 222, 128);
	}

	.seat.dm-seat.assigned {
		border-color: rgb(234, 179, 8);
	}

	:global(.dark) .seat.dm-seat.assigned {
		border-color: rgb(250, 204, 21);
	}

	.dm-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: rgb(161, 98, 7);
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	:global(.dark) .dm-indicator {
		color: rgb(250, 204, 21);
	}

	.dm-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.seat-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		text-align: center;
		width: 100%;
	}

	.character-name {
		font-weight: 600;
		color: rgb(15, 23, 42);
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .character-name {
		color: rgb(248, 250, 252);
	}

	.player-name {
		font-size: 0.75rem;
		color: rgb(71, 85, 105);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .player-name {
		color: rgb(203, 213, 225);
	}

	.empty-seat {
		color: rgb(148, 163, 184);
		font-style: italic;
	}

	:global(.dark) .empty-seat {
		color: rgb(100, 116, 139);
	}

	.empty-label {
		font-size: 0.75rem;
	}
</style>
