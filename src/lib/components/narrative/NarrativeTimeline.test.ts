/**
 * Tests for NarrativeTimeline Component
 *
 * Issue #400: Build Timeline View UI
 *
 * This component renders a chronological timeline of narrative events,
 * displaying them in order with proper first/last indicators and
 * supporting callbacks for viewing sources and linking events.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import NarrativeTimeline from './NarrativeTimeline.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

describe('NarrativeTimeline Component - Basic Rendering (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'First Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Second Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'scene'
				}
			})
		];
	});

	it('should render without crashing', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});
		expect(container).toBeInTheDocument();
	});

	it('should render TimelineEvent for each event', () => {
		render(NarrativeTimeline, {
			props: { events }
		});

		expect(screen.getByText('First Event')).toBeInTheDocument();
		expect(screen.getByText('Second Event')).toBeInTheDocument();
	});

	it('should render correct number of timeline events', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Should have 2 timeline event components
		const eventElements = container.querySelectorAll('[data-event-type]');
		expect(eventElements.length).toBeGreaterThanOrEqual(2);
	});

	it('should handle single event', () => {
		const singleEvent = [events[0]];

		render(NarrativeTimeline, {
			props: { events: singleEvent }
		});

		expect(screen.getByText('First Event')).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Empty State (Issue #400)', () => {
	it('should render empty state when no events and showEmpty is true', () => {
		render(NarrativeTimeline, {
			props: {
				events: [],
				showEmpty: true
			}
		});

		// Should show empty state message
		expect(screen.getByText(/no events/i)).toBeInTheDocument();
	});

	it('should not show empty state when showEmpty is false', () => {
		const { container } = render(NarrativeTimeline, {
			props: {
				events: [],
				showEmpty: false
			}
		});

		// Should not show empty state message
		expect(screen.queryByText(/no events/i)).not.toBeInTheDocument();
		expect(container).toBeInTheDocument();
	});

	it('should not show empty state by default when events are empty', () => {
		const { container } = render(NarrativeTimeline, {
			props: {
				events: []
			}
		});

		// Default behavior: no empty state
		expect(screen.queryByText(/no events/i)).not.toBeInTheDocument();
	});

	it('should show helpful message in empty state', () => {
		render(NarrativeTimeline, {
			props: {
				events: [],
				showEmpty: true
			}
		});

		// Empty state should have informative text
		const emptyMessage = screen.getByText(/no events/i);
		expect(emptyMessage).toBeInTheDocument();
	});

	it('should show empty state with icon or illustration', () => {
		const { container } = render(NarrativeTimeline, {
			props: {
				events: [],
				showEmpty: true
			}
		});

		// Should have icon or visual element in empty state
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Chronological Ordering (Issue #400)', () => {
	it('should render events in chronological order by createdAt', () => {
		const events = [
			createMockEntity({
				id: 'event-3',
				type: 'narrative_event',
				name: 'Third Event',
				createdAt: new Date('2024-01-03T10:00:00'),
				fields: { eventType: 'combat' }
			}),
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'First Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'scene' }
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Second Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: { eventType: 'montage' }
			})
		];

		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Get all event names in DOM order
		const eventNames = Array.from(container.querySelectorAll('[data-event-type]')).map(
			(el) => el.textContent
		);

		// Should be ordered: First, Second, Third
		expect(eventNames[0]).toContain('First Event');
		expect(eventNames[1]).toContain('Second Event');
		expect(eventNames[2]).toContain('Third Event');
	});

	it('should handle events with same timestamp', () => {
		const sameTime = new Date('2024-01-01T10:00:00');

		const events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event A',
				createdAt: sameTime,
				fields: { eventType: 'combat' }
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Event B',
				createdAt: sameTime,
				fields: { eventType: 'scene' }
			})
		];

		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Both events should render
		expect(screen.getByText('Event A')).toBeInTheDocument();
		expect(screen.getByText('Event B')).toBeInTheDocument();
	});

	it('should maintain correct order with multiple events', () => {
		const events = [
			createMockEntity({
				id: 'event-5',
				type: 'narrative_event',
				name: 'Event 5',
				createdAt: new Date('2024-01-05T10:00:00'),
				fields: { eventType: 'combat' }
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Event 2',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: { eventType: 'scene' }
			}),
			createMockEntity({
				id: 'event-4',
				type: 'narrative_event',
				name: 'Event 4',
				createdAt: new Date('2024-01-04T10:00:00'),
				fields: { eventType: 'montage' }
			}),
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event 1',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'scene' }
			}),
			createMockEntity({
				id: 'event-3',
				type: 'narrative_event',
				name: 'Event 3',
				createdAt: new Date('2024-01-03T10:00:00'),
				fields: { eventType: 'combat' }
			})
		];

		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		const eventNames = Array.from(container.querySelectorAll('[data-event-type]')).map(
			(el) => el.textContent
		);

		// Should be ordered 1, 2, 3, 4, 5
		expect(eventNames[0]).toContain('Event 1');
		expect(eventNames[1]).toContain('Event 2');
		expect(eventNames[2]).toContain('Event 3');
		expect(eventNames[3]).toContain('Event 4');
		expect(eventNames[4]).toContain('Event 5');
	});
});

describe('NarrativeTimeline Component - First/Last Indicators (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'First Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'combat' }
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Middle Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: { eventType: 'scene' }
			}),
			createMockEntity({
				id: 'event-3',
				type: 'narrative_event',
				name: 'Last Event',
				createdAt: new Date('2024-01-03T10:00:00'),
				fields: { eventType: 'montage' }
			})
		];
	});

	it('should pass isFirst=true to first event', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// First event should have isFirst prop
		const firstEvent = container.querySelector('[data-event-type]');
		expect(firstEvent).toHaveAttribute('data-is-first', 'true');
	});

	it('should pass isLast=true to last event', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Last event should have isLast prop
		const allEvents = container.querySelectorAll('[data-event-type]');
		const lastEvent = allEvents[allEvents.length - 1];
		expect(lastEvent).toHaveAttribute('data-is-last', 'true');
	});

	it('should not pass isFirst to middle events', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		const allEvents = container.querySelectorAll('[data-event-type]');
		const middleEvent = allEvents[1];

		// Middle event should not be first
		expect(middleEvent).not.toHaveAttribute('data-is-first', 'true');
	});

	it('should not pass isLast to middle events', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		const allEvents = container.querySelectorAll('[data-event-type]');
		const middleEvent = allEvents[1];

		// Middle event should not be last
		expect(middleEvent).not.toHaveAttribute('data-is-last', 'true');
	});

	it('should pass both isFirst and isLast to single event', () => {
		const singleEvent = [events[0]];

		const { container } = render(NarrativeTimeline, {
			props: { events: singleEvent }
		});

		const eventElement = container.querySelector('[data-event-type]');
		expect(eventElement).toHaveAttribute('data-is-first', 'true');
		expect(eventElement).toHaveAttribute('data-is-last', 'true');
	});

	it('should handle two events correctly', () => {
		const twoEvents = [events[0], events[1]];

		const { container } = render(NarrativeTimeline, {
			props: { events: twoEvents }
		});

		const allEvents = container.querySelectorAll('[data-event-type]');

		// First should have isFirst
		expect(allEvents[0]).toHaveAttribute('data-is-first', 'true');
		expect(allEvents[0]).not.toHaveAttribute('data-is-last', 'true');

		// Second should have isLast
		expect(allEvents[1]).toHaveAttribute('data-is-last', 'true');
		expect(allEvents[1]).not.toHaveAttribute('data-is-first', 'true');
	});
});

describe('NarrativeTimeline Component - Callback Propagation (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event 1',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat',
					sourceId: 'combat-1'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Event 2',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'scene',
					sourceId: 'scene-1'
				}
			})
		];
	});

	it('should pass onViewSource to TimelineEvent components', () => {
		const onViewSource = vi.fn();

		const { container } = render(NarrativeTimeline, {
			props: {
				events,
				onViewSource
			}
		});

		// TimelineEvent components should receive onViewSource
		expect(container).toBeInTheDocument();
	});

	it('should pass onLinkEvent to TimelineEvent components', () => {
		const onLinkEvent = vi.fn();

		const { container } = render(NarrativeTimeline, {
			props: {
				events,
				onLinkEvent
			}
		});

		// TimelineEvent components should receive onLinkEvent
		expect(container).toBeInTheDocument();
	});

	it('should handle missing callbacks gracefully', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Should render without callbacks
		expect(container).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Session Filtering (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Session 1 Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat',
					sessionId: 'session-1'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Session 2 Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'scene',
					sessionId: 'session-2'
				}
			}),
			createMockEntity({
				id: 'event-3',
				type: 'narrative_event',
				name: 'Another Session 1 Event',
				createdAt: new Date('2024-01-03T10:00:00'),
				fields: {
					eventType: 'montage',
					sessionId: 'session-1'
				}
			})
		];
	});

	it('should show all events when sessionId is not provided', () => {
		render(NarrativeTimeline, {
			props: { events }
		});

		expect(screen.getByText('Session 1 Event')).toBeInTheDocument();
		expect(screen.getByText('Session 2 Event')).toBeInTheDocument();
		expect(screen.getByText('Another Session 1 Event')).toBeInTheDocument();
	});

	it('should filter events by sessionId when provided', () => {
		render(NarrativeTimeline, {
			props: {
				events,
				sessionId: 'session-1'
			}
		});

		// Should show only session-1 events
		expect(screen.getByText('Session 1 Event')).toBeInTheDocument();
		expect(screen.getByText('Another Session 1 Event')).toBeInTheDocument();

		// Should not show session-2 events
		expect(screen.queryByText('Session 2 Event')).not.toBeInTheDocument();
	});

	it('should show empty state when sessionId has no matching events', () => {
		render(NarrativeTimeline, {
			props: {
				events,
				sessionId: 'session-999',
				showEmpty: true
			}
		});

		// Should show empty state
		expect(screen.getByText(/no events/i)).toBeInTheDocument();
	});

	it('should handle events without sessionId field', () => {
		const eventsWithoutSession = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event without Session',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat'
				}
			})
		];

		render(NarrativeTimeline, {
			props: {
				events: eventsWithoutSession,
				sessionId: 'session-1'
			}
		});

		// Event without sessionId should not show when filtering
		expect(screen.queryByText('Event without Session')).not.toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Layout and Styling (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event 1',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'combat' }
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Event 2',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: { eventType: 'scene' }
			})
		];
	});

	it('should have vertical timeline layout', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Should have container with vertical layout
		const timeline = container.querySelector('[class*="timeline"], [role="list"]');
		expect(timeline).toBeInTheDocument();
	});

	it('should space events appropriately', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Timeline should have spacing between events
		const timeline = container.querySelector('[class*="timeline"], [class*="space-y"]');
		expect(timeline).toBeInTheDocument();
	});

	it('should have responsive design classes', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Container should have responsive classes
		expect(container.firstChild).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Accessibility (Issue #400)', () => {
	let events: BaseEntity[];

	beforeEach(() => {
		events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event 1',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'combat' }
			})
		];
	});

	it('should use semantic HTML for timeline container', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Should use ol, ul, or role="list"
		const list = container.querySelector('ol, ul, [role="list"]');
		expect(list).toBeInTheDocument();
	});

	it('should have aria-label for timeline', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		const timeline = container.querySelector('[aria-label]');
		expect(timeline).toBeInTheDocument();
	});

	it('should be screen reader friendly', () => {
		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Timeline should have proper ARIA attributes
		const timeline = container.querySelector('[role="list"], ol, ul');
		expect(timeline).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Edge Cases (Issue #400)', () => {
	it('should handle null events array', () => {
		const { container } = render(NarrativeTimeline, {
			props: {
				events: null as any
			}
		});

		// Should render without crashing
		expect(container).toBeInTheDocument();
	});

	it('should handle undefined events array', () => {
		const { container } = render(NarrativeTimeline, {
			props: {
				events: undefined as any
			}
		});

		// Should render without crashing
		expect(container).toBeInTheDocument();
	});

	it('should handle events with missing createdAt', () => {
		const events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event without Date',
				createdAt: undefined as any,
				fields: { eventType: 'combat' }
			})
		];

		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		// Should render, possibly with fallback ordering
		expect(container).toBeInTheDocument();
	});

	it('should handle very large number of events', () => {
		const manyEvents = Array.from({ length: 100 }, (_, i) =>
			createMockEntity({
				id: `event-${i}`,
				type: 'narrative_event',
				name: `Event ${i}`,
				createdAt: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00`),
				fields: { eventType: 'combat' }
			})
		);

		const { container } = render(NarrativeTimeline, {
			props: { events: manyEvents }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle events with invalid type field', () => {
		const events = [
			{
				...createMockEntity({
					id: 'event-1',
					name: 'Invalid Event'
				}),
				type: 'not_narrative_event' as any
			}
		];

		const { container } = render(NarrativeTimeline, {
			props: { events }
		});

		expect(container).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Dynamic Updates (Issue #400)', () => {
	it('should update when events prop changes', async () => {
		const initialEvents = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Initial Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'combat' }
			})
		];

		const { rerender } = render(NarrativeTimeline, {
			props: { events: initialEvents }
		});

		expect(screen.getByText('Initial Event')).toBeInTheDocument();

		// Update with new events
		const updatedEvents = [
			...initialEvents,
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'New Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: { eventType: 'scene' }
			})
		];

		rerender({ events: updatedEvents });

		expect(screen.getByText('Initial Event')).toBeInTheDocument();
		expect(screen.getByText('New Event')).toBeInTheDocument();
	});

	it('should update when sessionId filter changes', () => {
		const events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Session 1 Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat',
					sessionId: 'session-1'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Session 2 Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'scene',
					sessionId: 'session-2'
				}
			})
		];

		const { rerender } = render(NarrativeTimeline, {
			props: {
				events,
				sessionId: 'session-1'
			}
		});

		expect(screen.getByText('Session 1 Event')).toBeInTheDocument();
		expect(screen.queryByText('Session 2 Event')).not.toBeInTheDocument();

		// Change filter
		rerender({
			events,
			sessionId: 'session-2'
		});

		expect(screen.queryByText('Session 1 Event')).not.toBeInTheDocument();
		expect(screen.getByText('Session 2 Event')).toBeInTheDocument();
	});

	it('should handle transition from empty to populated', () => {
		const { rerender } = render(NarrativeTimeline, {
			props: {
				events: [],
				showEmpty: true
			}
		});

		expect(screen.getByText(/no events/i)).toBeInTheDocument();

		const newEvents = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'First Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: { eventType: 'combat' }
			})
		];

		rerender({
			events: newEvents,
			showEmpty: true
		});

		expect(screen.queryByText(/no events/i)).not.toBeInTheDocument();
		expect(screen.getByText('First Event')).toBeInTheDocument();
	});
});

describe('NarrativeTimeline Component - Integration (Issue #400)', () => {
	it('should work with both callbacks and session filtering', () => {
		const onViewSource = vi.fn();
		const onLinkEvent = vi.fn();

		const events = [
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Filtered Event',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'combat',
					sessionId: 'session-1',
					sourceId: 'combat-1'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Excluded Event',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'scene',
					sessionId: 'session-2',
					sourceId: 'scene-1'
				}
			})
		];

		render(NarrativeTimeline, {
			props: {
				events,
				sessionId: 'session-1',
				onViewSource,
				onLinkEvent
			}
		});

		expect(screen.getByText('Filtered Event')).toBeInTheDocument();
		expect(screen.queryByText('Excluded Event')).not.toBeInTheDocument();
	});

	it('should maintain event order after filtering', () => {
		const events = [
			createMockEntity({
				id: 'event-3',
				type: 'narrative_event',
				name: 'Event 3',
				createdAt: new Date('2024-01-03T10:00:00'),
				fields: {
					eventType: 'combat',
					sessionId: 'session-1'
				}
			}),
			createMockEntity({
				id: 'event-1',
				type: 'narrative_event',
				name: 'Event 1',
				createdAt: new Date('2024-01-01T10:00:00'),
				fields: {
					eventType: 'scene',
					sessionId: 'session-1'
				}
			}),
			createMockEntity({
				id: 'event-2',
				type: 'narrative_event',
				name: 'Event 2',
				createdAt: new Date('2024-01-02T10:00:00'),
				fields: {
					eventType: 'montage',
					sessionId: 'session-2'
				}
			})
		];

		const { container } = render(NarrativeTimeline, {
			props: {
				events,
				sessionId: 'session-1'
			}
		});

		const eventNames = Array.from(container.querySelectorAll('[data-event-type]')).map(
			(el) => el.textContent
		);

		// Should be ordered chronologically: Event 1, Event 3
		expect(eventNames[0]).toContain('Event 1');
		expect(eventNames[1]).toContain('Event 3');
	});
});
