/**
 * Tests for ArgumentCard Component
 *
 * Issue #383: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component displays a single argument in the negotiation history:
 * - Argument type with icon
 * - Tier with color coding
 * - Interest/patience deltas (+1, -1, 0)
 * - Player name if provided
 * - Notes if provided
 * - Motivation type if applicable
 * - Timestamp display
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ArgumentCard from './ArgumentCard.svelte';
import type { NegotiationArgument } from '$lib/types/negotiation';

describe('ArgumentCard Component - Basic Rendering (Issue #383)', () => {
	const basicArgument: NegotiationArgument = {
		id: '1',
		type: 'motivation',
		motivationType: 'justice',
		tier: 1,
		description: 'Test argument',
		interestChange: 1,
		patienceChange: 0,
		createdAt: new Date('2024-01-15T10:30:00')
	};

	it('should render without crashing', () => {
		const { container } = render(ArgumentCard, {
			props: {
				argument: basicArgument
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display argument type', () => {
		render(ArgumentCard, {
			props: {
				argument: basicArgument
			}
		});

		expect(screen.getByText(/motivation/i)).toBeInTheDocument();
	});

	it('should display tier', () => {
		render(ArgumentCard, {
			props: {
				argument: basicArgument
			}
		});

		expect(screen.getByText(/tier.*1|^1$/i)).toBeInTheDocument();
	});
});

describe('ArgumentCard Component - Argument Type Display', () => {
	it('should display motivation type icon', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		// Should have an icon (svg or icon element)
		const icon = container.querySelector('svg, [data-icon]');
		expect(icon).toBeInTheDocument();
	});

	it('should display no_motivation type', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 2,
			interestChange: 1,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/no.*motivation/i)).toBeInTheDocument();
	});

	it('should display pitfall type', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'pitfall',
		description: 'Test argument',
			motivationType: 'greed',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/pitfall/i)).toBeInTheDocument();
	});

	it('should show different icon for pitfall', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'pitfall',
		description: 'Test argument',
			motivationType: 'greed',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		// Pitfall should have a warning/alert icon
		const icon = container.querySelector('svg[class*="alert"], svg[class*="warning"], svg[class*="x"]');
		expect(icon).toBeInTheDocument();
	});
});

describe('ArgumentCard Component - Tier Display', () => {
	it('should display tier 1', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/tier.*1|^1$/i)).toBeInTheDocument();
	});

	it('should display tier 2', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 2,
			interestChange: 2,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/tier.*2|^2$/i)).toBeInTheDocument();
	});

	it('should display tier 3', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 3,
			interestChange: 2,
			patienceChange: 1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/tier.*3|^3$/i)).toBeInTheDocument();
	});

	it('should color code tier 1 as basic', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const tierBadge = container.querySelector('[data-testid="tier-badge"]');
		expect(tierBadge?.className).toMatch(/gray|slate|neutral/i);
	});

	it('should color code tier 2 as intermediate', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'motivation',
		description: 'Test argument',
			tier: 2,
			interestChange: 2,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const tierBadge = container.querySelector('[data-testid="tier-badge"]');
		expect(tierBadge?.className).toMatch(/blue|sky|cyan/i);
	});

	it('should color code tier 3 as advanced', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'motivation',
		description: 'Test argument',
			tier: 3,
			interestChange: 2,
			patienceChange: 1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const tierBadge = container.querySelector('[data-testid="tier-badge"]');
		expect(tierBadge?.className).toMatch(/purple|violet|indigo/i);
	});
});

describe('ArgumentCard Component - Interest Delta Display', () => {
	it('should display positive interest delta +1', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/\+1.*interest/i)).toBeInTheDocument();
	});

	it('should display positive interest delta +2', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'motivation',
		description: 'Test argument',
			tier: 2,
			interestChange: 2,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/\+2.*interest/i)).toBeInTheDocument();
	});

	it('should display negative interest delta -1', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'pitfall',
		description: 'Test argument',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/-1.*interest/i)).toBeInTheDocument();
	});

	it('should display zero interest delta', () => {
		const argument: NegotiationArgument = {
			id: '4',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 0,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/0.*interest|\+0.*interest/i)).toBeInTheDocument();
	});

	it('should style positive interest delta as green', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const interestDelta = container.querySelector('[data-testid="interest-delta"]');
		expect(interestDelta?.className).toMatch(/green|success/i);
	});

	it('should style negative interest delta as red', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'pitfall',
		description: 'Test argument',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const interestDelta = container.querySelector('[data-testid="interest-delta"]');
		expect(interestDelta?.className).toMatch(/red|danger|destructive/i);
	});
});

describe('ArgumentCard Component - Patience Delta Display', () => {
	it('should display positive patience delta +1', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 3,
			interestChange: 2,
			patienceChange: 1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/\+1.*patience/i)).toBeInTheDocument();
	});

	it('should display negative patience delta -1', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 0,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/-1.*patience/i)).toBeInTheDocument();
	});

	it('should display zero patience delta', () => {
		const argument: NegotiationArgument = {
			id: '3',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/0.*patience|\+0.*patience/i)).toBeInTheDocument();
	});

	it('should style positive patience delta as green', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 3,
			interestChange: 2,
			patienceChange: 1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const patienceDelta = container.querySelector('[data-testid="patience-delta"]');
		expect(patienceDelta?.className).toMatch(/green|success/i);
	});

	it('should style negative patience delta as red', () => {
		const argument: NegotiationArgument = {
			id: '2',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 0,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const patienceDelta = container.querySelector('[data-testid="patience-delta"]');
		expect(patienceDelta?.className).toMatch(/red|danger|destructive/i);
	});
});

describe('ArgumentCard Component - Player Name Display', () => {
	it('should display player name when provided', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			playerName: 'Aragorn',
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/aragorn/i)).toBeInTheDocument();
	});

	it('should not show player section when player name not provided', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const playerSection = container.querySelector('[data-testid="player-name"]');
		expect(playerSection).not.toBeInTheDocument();
	});

	it('should display long player names', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			playerName: 'Sir Reginald von Bartholomew III',
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/sir reginald von bartholomew iii/i)).toBeInTheDocument();
	});
});

describe('ArgumentCard Component - Notes Display', () => {
	it('should display notes when provided', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			notes: 'Excellent argument about protecting the innocent',
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/excellent argument about protecting the innocent/i)).toBeInTheDocument();
	});

	it('should not show notes section when notes not provided', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const notesSection = container.querySelector('[data-testid="notes"]');
		expect(notesSection).not.toBeInTheDocument();
	});

	it('should display multi-line notes', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			notes: 'First line\nSecond line\nThird line',
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/first line/i)).toBeInTheDocument();
	});

	it('should preserve whitespace in notes', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			notes: 'First line\nSecond line',
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const notesElement = container.querySelector('[data-testid="notes"]');
		expect(notesElement?.className).toMatch(/whitespace-pre|pre-wrap|pre-line/);
	});
});

describe('ArgumentCard Component - Motivation Type Display', () => {
	it('should display motivation type for motivation arguments', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
	});

	it('should display motivation type for pitfall arguments', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'pitfall',
		description: 'Test argument',
			motivationType: 'greed',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/greed/i)).toBeInTheDocument();
	});

	it('should not display motivation type for no_motivation arguments', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 0,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		// Should not have motivation type badges for all 12 types
		expect(screen.queryByText(/benevolence/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/justice/i)).not.toBeInTheDocument();
	});

	it('should capitalize motivation type', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'higher_authority',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/higher.*authority/i)).toBeInTheDocument();
	});
});

describe('ArgumentCard Component - Timestamp Display', () => {
	it('should display timestamp', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date('2024-01-15T10:30:00')
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		// Should display some form of timestamp
		const timestamp = container.querySelector('[data-testid="timestamp"], time');
		expect(timestamp).toBeInTheDocument();
	});

	it('should format timestamp as relative time', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date(Date.now() - 60000) // 1 minute ago
		};

		render(ArgumentCard, {
			props: { argument }
		});

		// Could show "1 minute ago" or similar
		expect(screen.getByText(/ago|minute|second/i)).toBeInTheDocument();
	});

	it('should have machine-readable datetime attribute', () => {
		const testDate = new Date('2024-01-15T10:30:00');
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: testDate
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const timeElement = container.querySelector('time');
		expect(timeElement).toHaveAttribute('datetime');
	});
});

describe('ArgumentCard Component - Visual Styling', () => {
	it('should have card-like appearance', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const card = container.firstChild as HTMLElement;
		expect(card.className).toMatch(/border|shadow|rounded|bg-/);
	});

	it('should use different styling for pitfall arguments', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'pitfall',
		description: 'Test argument',
			tier: 1,
			interestChange: -1,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const card = container.firstChild as HTMLElement;
		expect(card.className).toMatch(/red|danger|warning|border-red/);
	});

	it('should use different styling for motivation arguments', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const card = container.firstChild as HTMLElement;
		expect(card.className).toMatch(/green|success|blue|border-green|border-blue/);
	});
});

describe('ArgumentCard Component - Accessibility', () => {
	it('should have semantic article element', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const article = container.querySelector('article');
		expect(article).toBeInTheDocument();
	});

	it('should have accessible label describing the argument', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 2,
			interestChange: 2,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const article = container.querySelector('article');
		expect(article).toHaveAttribute('aria-label');
	});

	it('should use time element for timestamp', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		const timeElement = container.querySelector('time');
		expect(timeElement).toBeInTheDocument();
	});
});

describe('ArgumentCard Component - Edge Cases', () => {
	it('should handle argument with all optional fields', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			motivationType: 'justice',
			tier: 3,
			interestChange: 2,
			patienceChange: 1,
			playerName: 'Gandalf',
			notes: 'Wisdom prevails',
			createdAt: new Date()
		};

		render(ArgumentCard, {
			props: { argument }
		});

		expect(screen.getByText(/gandalf/i)).toBeInTheDocument();
		expect(screen.getByText(/wisdom prevails/i)).toBeInTheDocument();
	});

	it('should handle argument with minimal fields', () => {
		const argument: NegotiationArgument = {
			id: '1',
			type: 'no_motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 0,
			patienceChange: -1,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		expect(container.firstChild).toBeInTheDocument();
	});

	it('should handle very long notes gracefully', () => {
		const longNotes = 'This is a very long note '.repeat(50);
		const argument: NegotiationArgument = {
			id: '1',
			type: 'motivation',
		description: 'Test argument',
			tier: 1,
			interestChange: 1,
			patienceChange: 0,
			notes: longNotes,
			createdAt: new Date()
		};

		const { container } = render(ArgumentCard, {
			props: { argument }
		});

		expect(container.firstChild).toBeInTheDocument();
	});
});
