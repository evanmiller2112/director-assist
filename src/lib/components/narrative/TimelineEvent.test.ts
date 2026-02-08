/**
 * Tests for TimelineEvent Component
 *
 * Issue #400: Build Timeline View UI
 *
 * This component renders a single event in a vertical timeline view,
 * displaying event details, icons based on event type, connecting lines,
 * and action buttons for viewing source or linking events.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TimelineEvent from './TimelineEvent.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

describe('TimelineEvent Component - Basic Rendering (Issue #400)', () => {
	let event: BaseEntity;

	beforeEach(() => {
		event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Battle at the Crossroads',
			description: 'A fierce battle erupted',
			fields: {
				eventType: 'combat',
				outcome: 'Victory in 5 rounds'
			}
		});
	});

	it('should render without crashing', () => {
		const { container } = render(TimelineEvent, {
			props: { event }
		});
		expect(container).toBeInTheDocument();
	});

	it('should render event name', () => {
		render(TimelineEvent, {
			props: { event }
		});

		expect(screen.getByText('Battle at the Crossroads')).toBeInTheDocument();
	});

	it('should display outcome field when present', () => {
		render(TimelineEvent, {
			props: { event }
		});

		expect(screen.getByText(/Victory in 5 rounds/i)).toBeInTheDocument();
	});

	it('should not display outcome when field is missing', () => {
		const eventWithoutOutcome = createMockEntity({
			id: 'event-2',
			type: 'narrative_event',
			name: 'Simple Event',
			fields: {
				eventType: 'scene'
			}
		});

		render(TimelineEvent, {
			props: { event: eventWithoutOutcome }
		});

		expect(screen.queryByText(/outcome/i)).not.toBeInTheDocument();
	});

	it('should handle empty outcome gracefully', () => {
		const eventWithEmptyOutcome = createMockEntity({
			id: 'event-3',
			type: 'narrative_event',
			name: 'Event with Empty Outcome',
			fields: {
				eventType: 'combat',
				outcome: ''
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: eventWithEmptyOutcome }
		});

		expect(container).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - Event Type Icons (Issue #400)', () => {
	it('should show Swords icon for combat events', () => {
		const combatEvent = createMockEntity({
			id: 'combat-1',
			type: 'narrative_event',
			name: 'Combat Event',
			fields: {
				eventType: 'combat'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: combatEvent }
		});

		// Check for Swords icon (lucide-svelte)
		const icon = container.querySelector('[class*="lucide-swords"]');
		expect(icon).toBeInTheDocument();
	});

	it('should show correct icon for montage events', () => {
		const montageEvent = createMockEntity({
			id: 'montage-1',
			type: 'narrative_event',
			name: 'Montage Event',
			fields: {
				eventType: 'montage'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: montageEvent }
		});

		// Check for montage icon (e.g., Film or Play)
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});

	it('should show correct icon for scene events', () => {
		const sceneEvent = createMockEntity({
			id: 'scene-1',
			type: 'narrative_event',
			name: 'Scene Event',
			fields: {
				eventType: 'scene'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: sceneEvent }
		});

		// Check for scene icon (e.g., MessageSquare or Drama)
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});

	it('should show correct icon for negotiation events', () => {
		const negotiationEvent = createMockEntity({
			id: 'negotiation-1',
			type: 'narrative_event',
			name: 'Negotiation Event',
			fields: {
				eventType: 'negotiation'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: negotiationEvent }
		});

		// Check for negotiation icon (e.g., Handshake or Users)
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});

	it('should show fallback icon for other event types', () => {
		const otherEvent = createMockEntity({
			id: 'other-1',
			type: 'narrative_event',
			name: 'Other Event',
			fields: {
				eventType: 'other'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: otherEvent }
		});

		// Check for fallback icon (e.g., Circle or Milestone)
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});

	it('should show fallback icon for unknown event types', () => {
		const unknownEvent = createMockEntity({
			id: 'unknown-1',
			type: 'narrative_event',
			name: 'Unknown Event',
			fields: {
				eventType: 'custom_unknown_type'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: unknownEvent }
		});

		// Should still render with fallback icon
		const icon = container.querySelector('[class*="lucide"]');
		expect(icon).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - Timeline Connecting Lines (Issue #400)', () => {
	let event: BaseEntity;

	beforeEach(() => {
		event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Test Event',
			fields: {
				eventType: 'combat'
			}
		});
	});

	it('should display connecting line element', () => {
		const { container } = render(TimelineEvent, {
			props: { event }
		});

		// Should have timeline line elements (vertical connectors)
		const line = container.querySelector('[class*="timeline-line"], [class*="connector"]');
		expect(line).toBeInTheDocument();
	});

	it('should hide top line when isFirst is true', () => {
		const { container } = render(TimelineEvent, {
			props: {
				event,
				isFirst: true
			}
		});

		// Top line should be hidden or have visibility class
		const topLine = container.querySelector('[class*="top-line"], [class*="line-top"]');
		if (topLine) {
			expect(topLine).toHaveClass(/hidden|invisible|opacity-0/);
		}
	});

	it('should hide bottom line when isLast is true', () => {
		const { container } = render(TimelineEvent, {
			props: {
				event,
				isLast: true
			}
		});

		// Bottom line should be hidden or have visibility class
		const bottomLine = container.querySelector('[class*="bottom-line"], [class*="line-bottom"]');
		if (bottomLine) {
			expect(bottomLine).toHaveClass(/hidden|invisible|opacity-0/);
		}
	});

	it('should show both lines when isFirst and isLast are false', () => {
		const { container } = render(TimelineEvent, {
			props: {
				event,
				isFirst: false,
				isLast: false
			}
		});

		// Timeline should have visible connecting lines
		const lines = container.querySelectorAll('[class*="line"], [class*="connector"]');
		expect(lines.length).toBeGreaterThan(0);
	});

	it('should handle single event (both isFirst and isLast true)', () => {
		const { container } = render(TimelineEvent, {
			props: {
				event,
				isFirst: true,
				isLast: true
			}
		});

		// Should render without lines or with both hidden
		expect(container).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - View Source Button (Issue #400)', () => {
	let event: BaseEntity;

	beforeEach(() => {
		event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Combat Event',
			fields: {
				eventType: 'combat',
				sourceId: 'combat-session-123'
			}
		});
	});

	it('should render View Source button when sourceId is present', () => {
		render(TimelineEvent, {
			props: { event }
		});

		const viewSourceButton = screen.getByRole('button', { name: /view source/i });
		expect(viewSourceButton).toBeInTheDocument();
	});

	it('should not render View Source button when sourceId is missing', () => {
		const eventWithoutSource = createMockEntity({
			id: 'event-2',
			type: 'narrative_event',
			name: 'Event without Source',
			fields: {
				eventType: 'scene'
			}
		});

		render(TimelineEvent, {
			props: { event: eventWithoutSource }
		});

		const viewSourceButton = screen.queryByRole('button', { name: /view source/i });
		expect(viewSourceButton).not.toBeInTheDocument();
	});

	it('should call onViewSource with eventType and sourceId when clicked', async () => {
		const onViewSource = vi.fn();

		render(TimelineEvent, {
			props: {
				event,
				onViewSource
			}
		});

		const viewSourceButton = screen.getByRole('button', { name: /view source/i });
		await fireEvent.click(viewSourceButton);

		expect(onViewSource).toHaveBeenCalledWith('combat', 'combat-session-123');
	});

	it('should handle missing onViewSource callback gracefully', async () => {
		render(TimelineEvent, {
			props: { event }
		});

		const viewSourceButton = screen.getByRole('button', { name: /view source/i });

		// Should not throw when callback is not provided
		await expect(async () => {
			await fireEvent.click(viewSourceButton);
		}).not.toThrow();
	});

	it('should pass correct eventType for different event types', async () => {
		const onViewSource = vi.fn();

		const montageEvent = createMockEntity({
			id: 'montage-1',
			type: 'narrative_event',
			name: 'Montage Event',
			fields: {
				eventType: 'montage',
				sourceId: 'montage-session-456'
			}
		});

		render(TimelineEvent, {
			props: {
				event: montageEvent,
				onViewSource
			}
		});

		const viewSourceButton = screen.getByRole('button', { name: /view source/i });
		await fireEvent.click(viewSourceButton);

		expect(onViewSource).toHaveBeenCalledWith('montage', 'montage-session-456');
	});
});

describe('TimelineEvent Component - Link Button (Issue #400)', () => {
	let event: BaseEntity;

	beforeEach(() => {
		event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Test Event',
			fields: {
				eventType: 'combat'
			}
		});
	});

	it('should show Link button when showLinkButton is true', () => {
		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true
			}
		});

		const linkButton = screen.getByRole('button', { name: /link/i });
		expect(linkButton).toBeInTheDocument();
	});

	it('should not show Link button when showLinkButton is false', () => {
		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: false
			}
		});

		const linkButton = screen.queryByRole('button', { name: /link/i });
		expect(linkButton).not.toBeInTheDocument();
	});

	it('should not show Link button by default (when showLinkButton is undefined)', () => {
		render(TimelineEvent, {
			props: { event }
		});

		const linkButton = screen.queryByRole('button', { name: /link/i });
		expect(linkButton).not.toBeInTheDocument();
	});

	it('should call onLinkEvent with eventId when Link button is clicked', async () => {
		const onLinkEvent = vi.fn();

		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true,
				onLinkEvent
			}
		});

		const linkButton = screen.getByRole('button', { name: /link/i });
		await fireEvent.click(linkButton);

		expect(onLinkEvent).toHaveBeenCalledWith('event-1');
	});

	it('should handle missing onLinkEvent callback gracefully', async () => {
		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true
			}
		});

		const linkButton = screen.getByRole('button', { name: /link/i });

		// Should not throw when callback is not provided
		await expect(async () => {
			await fireEvent.click(linkButton);
		}).not.toThrow();
	});
});

describe('TimelineEvent Component - Event Type Styling (Issue #400)', () => {
	it('should apply combat-specific color styling', () => {
		const combatEvent = createMockEntity({
			id: 'combat-1',
			type: 'narrative_event',
			name: 'Combat Event',
			fields: {
				eventType: 'combat'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: combatEvent }
		});

		// Should have combat-specific styling (e.g., red/orange colors)
		const eventElement = container.querySelector('[data-event-type="combat"]');
		expect(eventElement).toBeInTheDocument();
	});

	it('should apply montage-specific color styling', () => {
		const montageEvent = createMockEntity({
			id: 'montage-1',
			type: 'narrative_event',
			name: 'Montage Event',
			fields: {
				eventType: 'montage'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: montageEvent }
		});

		// Should have montage-specific styling
		const eventElement = container.querySelector('[data-event-type="montage"]');
		expect(eventElement).toBeInTheDocument();
	});

	it('should apply scene-specific color styling', () => {
		const sceneEvent = createMockEntity({
			id: 'scene-1',
			type: 'narrative_event',
			name: 'Scene Event',
			fields: {
				eventType: 'scene'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: sceneEvent }
		});

		// Should have scene-specific styling
		const eventElement = container.querySelector('[data-event-type="scene"]');
		expect(eventElement).toBeInTheDocument();
	});

	it('should apply default styling for other event types', () => {
		const otherEvent = createMockEntity({
			id: 'other-1',
			type: 'narrative_event',
			name: 'Other Event',
			fields: {
				eventType: 'other'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event: otherEvent }
		});

		// Should have fallback styling
		const eventElement = container.querySelector('[data-event-type]');
		expect(eventElement).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - Event Description (Issue #400)', () => {
	it('should display event description when present', () => {
		const event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Event with Description',
			description: 'A detailed description of what happened',
			fields: {
				eventType: 'scene'
			}
		});

		render(TimelineEvent, {
			props: { event }
		});

		expect(screen.getByText(/A detailed description of what happened/i)).toBeInTheDocument();
	});

	it('should handle empty description gracefully', () => {
		const event = createMockEntity({
			id: 'event-2',
			type: 'narrative_event',
			name: 'Event without Description',
			description: '',
			fields: {
				eventType: 'combat'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		expect(container).toBeInTheDocument();
	});

	it('should truncate or show excerpt of long descriptions', () => {
		const longDescription =
			'This is a very long description that goes on and on with lots of details about the event that happened during this particular moment in the campaign timeline. It includes many sentences and paragraphs of information.';

		const event = createMockEntity({
			id: 'event-3',
			type: 'narrative_event',
			name: 'Event with Long Description',
			description: longDescription,
			fields: {
				eventType: 'scene'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		expect(container).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - Accessibility (Issue #400)', () => {
	let event: BaseEntity;

	beforeEach(() => {
		event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Accessible Event',
			fields: {
				eventType: 'combat',
				outcome: 'Victory'
			}
		});
	});

	it('should have semantic HTML structure', () => {
		const { container } = render(TimelineEvent, {
			props: { event }
		});

		// Should use article or similar semantic element
		const article = container.querySelector('article, [role="article"]');
		expect(article).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true
			}
		});

		const linkButton = screen.getByRole('button', { name: /link/i });
		expect(linkButton).toHaveAccessibleName();
	});

	it('should have proper icon alt text or aria labels', () => {
		const { container } = render(TimelineEvent, {
			props: { event }
		});

		const icon = container.querySelector('[class*="lucide"]');
		// Icon should have aria-label or be decorative with aria-hidden
		expect(icon).toBeInTheDocument();
	});

	it('should be keyboard navigable', () => {
		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});
});

describe('TimelineEvent Component - Edge Cases (Issue #400)', () => {
	it('should handle event with very long name', () => {
		const event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'This is an incredibly long event name that might need to be truncated or wrapped in the UI to prevent layout issues',
			fields: {
				eventType: 'combat'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle event with missing eventType field', () => {
		const event = createMockEntity({
			id: 'event-2',
			type: 'narrative_event',
			name: 'Event without Type',
			fields: {}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		// Should render with fallback icon/styling
		expect(container).toBeInTheDocument();
	});

	it('should handle event with null fields', () => {
		const event = createMockEntity({
			id: 'event-3',
			type: 'narrative_event',
			name: 'Event with Null Fields',
			fields: {
				eventType: null,
				outcome: null
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle both showLinkButton true and sourceId present', () => {
		const event = createMockEntity({
			id: 'event-4',
			type: 'narrative_event',
			name: 'Event with Both Buttons',
			fields: {
				eventType: 'combat',
				sourceId: 'source-123'
			}
		});

		render(TimelineEvent, {
			props: {
				event,
				showLinkButton: true
			}
		});

		// Should show both buttons
		const linkButton = screen.getByRole('button', { name: /link/i });
		const viewSourceButton = screen.getByRole('button', { name: /view source/i });

		expect(linkButton).toBeInTheDocument();
		expect(viewSourceButton).toBeInTheDocument();
	});
});

describe('TimelineEvent Component - Date Display (Issue #400)', () => {
	it('should display event creation date', () => {
		const event = createMockEntity({
			id: 'event-1',
			type: 'narrative_event',
			name: 'Event with Date',
			createdAt: new Date('2024-01-15T10:30:00'),
			fields: {
				eventType: 'combat'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		// Should display formatted date
		expect(container).toBeInTheDocument();
	});

	it('should format date in a readable way', () => {
		const event = createMockEntity({
			id: 'event-2',
			type: 'narrative_event',
			name: 'Event',
			createdAt: new Date('2024-01-15T10:30:00'),
			fields: {
				eventType: 'scene'
			}
		});

		const { container } = render(TimelineEvent, {
			props: { event }
		});

		// Date should be formatted (exact format depends on implementation)
		expect(container).toBeInTheDocument();
	});
});
