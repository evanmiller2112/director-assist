/**
 * Session Summary Service (Issue #401)
 *
 * Generates narrative summaries from session trails by ordering narrative events
 * chronologically and constructing readable prose.
 */

import { db } from '$lib/db';
import type { BaseEntity } from '$lib/types';

/**
 * Get the ordered trail of narrative events for a session.
 *
 * Retrieves all narrative_event entities linked to a session, ordered chronologically.
 * Uses leads_to/follows relationships for ordering when available, falls back to
 * creation time ordering otherwise.
 *
 * @param sessionId - The session ID to retrieve events for
 * @returns Promise resolving to ordered array of narrative events (oldest first)
 * @throws Error if sessionId is null or undefined
 * @throws Error if database query fails
 */
export async function getTrailForSession(sessionId: string): Promise<BaseEntity[]> {
	// Validate sessionId
	if (sessionId === null || sessionId === undefined) {
		throw new Error('sessionId cannot be null or undefined');
	}

	// Handle empty string - return empty array
	if (sessionId === '') {
		return [];
	}

	// Query database for narrative events with matching session field
	const events = await db.entities
		.filter((entity) => {
			// Filter by type
			if (entity.type !== 'narrative_event') {
				return false;
			}

			// Filter by session field
			if (entity.fields?.session !== sessionId) {
				return false;
			}

			return true;
		})
		.toArray();

	// If no events, return empty array
	if (events.length === 0) {
		return [];
	}

	// Try to order by leads_to/follows relationships
	const ordered = orderByRelationships(events);

	// If relationship ordering worked, return it
	if (ordered.length === events.length) {
		return ordered;
	}

	// Fall back to creation time ordering (oldest first)
	return events.sort((a, b) => {
		const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
		const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
		return timeA - timeB;
	});
}

/**
 * Attempt to order events by leads_to/follows relationships.
 * Uses topological sort to find a valid ordering.
 *
 * @param events - Array of narrative events to order
 * @returns Ordered array of events, or partial array if cycles detected
 */
function orderByRelationships(events: BaseEntity[]): BaseEntity[] {
	// Build a map of event ID to event
	const eventMap = new Map<string, BaseEntity>();
	for (const event of events) {
		eventMap.set(event.id, event);
	}

	// Build adjacency list for leads_to relationships
	const outgoing = new Map<string, string[]>(); // event -> events it leads to
	const incoming = new Map<string, number>(); // event -> count of events that lead to it

	// Initialize maps
	for (const event of events) {
		outgoing.set(event.id, []);
		incoming.set(event.id, 0);
	}

	// Build graph from links
	for (const event of events) {
		for (const link of event.links) {
			if (link.relationship === 'leads_to' && eventMap.has(link.targetId)) {
				// Add edge from event to target
				outgoing.get(event.id)!.push(link.targetId);
				incoming.set(link.targetId, incoming.get(link.targetId)! + 1);
			}
		}
	}

	// Topological sort using Kahn's algorithm
	const result: BaseEntity[] = [];
	const queue: string[] = [];

	// Find all nodes with no incoming edges (starting points)
	for (const [eventId, count] of incoming.entries()) {
		if (count === 0) {
			queue.push(eventId);
		}
	}

	// Process queue
	while (queue.length > 0) {
		// Sort queue for deterministic ordering when multiple starting points
		queue.sort();

		const eventId = queue.shift()!;
		const event = eventMap.get(eventId);

		if (event) {
			result.push(event);

			// Reduce incoming count for all neighbors
			const neighbors = outgoing.get(eventId) || [];
			for (const neighborId of neighbors) {
				const count = incoming.get(neighborId)!;
				incoming.set(neighborId, count - 1);

				// If no more incoming edges, add to queue
				if (count - 1 === 0) {
					queue.push(neighborId);
				}
			}
		}
	}

	// If result doesn't contain all events, there's a cycle
	// Fall back to creation time ordering
	if (result.length !== events.length) {
		return events.sort((a, b) => {
			const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
			const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
			return timeA - timeB;
		});
	}

	return result;
}

/**
 * Generate a narrative summary from a session's trail of events.
 *
 * Constructs human-readable prose from ordered narrative events,
 * including event names, types, and outcomes with narrative transitions.
 *
 * @param sessionId - The session ID to generate a summary for
 * @returns Promise resolving to formatted narrative text
 * @throws Error if sessionId is null or undefined
 * @throws Error if database query fails
 */
export async function generateSummary(sessionId: string): Promise<string> {
	// Validate sessionId
	if (sessionId === null || sessionId === undefined) {
		throw new Error('sessionId cannot be null or undefined');
	}

	// Get ordered events
	const events = await getTrailForSession(sessionId);

	// Handle empty trail
	if (events.length === 0) {
		return 'No events recorded for this session.';
	}

	// Build narrative summary
	const paragraphs: string[] = [];

	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		const isFirst = i === 0;
		const isLast = i === events.length - 1;

		// Build event paragraph
		let paragraph = '';

		// Add transition
		if (isFirst) {
			paragraph += 'The session began with ';
		} else if (isLast) {
			paragraph += 'The session concluded with ';
		} else {
			// Vary transitions for middle events
			const transitions = [
				'Following this, ',
				'Then, ',
				'Next, ',
				'After that, ',
				'Subsequently, '
			];
			paragraph += transitions[i % transitions.length];
		}

		// Add event type descriptor
		const eventType = event.fields?.eventType as string;
		if (eventType === 'combat') {
			paragraph += 'a combat encounter: ';
		} else if (eventType === 'montage') {
			paragraph += 'a montage: ';
		} else if (eventType === 'scene') {
			paragraph += 'a scene: ';
		} else {
			paragraph += 'an event: ';
		}

		// Add event name
		paragraph += event.name;

		// Add outcome if present
		const outcome = event.fields?.outcome as string | undefined;
		if (outcome) {
			// Format outcome based on type
			if (typeof outcome === 'string') {
				// Convert snake_case to readable text
				const readableOutcome = outcome
					.replace(/_/g, ' ')
					.replace(/\b\w/g, (char) => char.toUpperCase());

				paragraph += `. Outcome: ${readableOutcome}`;
			}
		}

		paragraph += '.';

		paragraphs.push(paragraph);
	}

	// Join paragraphs into narrative
	return paragraphs.join(' ');
}
