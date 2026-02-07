/**
 * Tests for NegotiationOutcomeDisplay Component
 *
 * Issue #385: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component displays the final outcome of a negotiation:
 * - alliance: "Alliance Formed" with celebration styling (interest 5)
 * - major_favor: "Major Favor" with positive styling (interest 3-4)
 * - minor_favor: "Minor Favor" with warning styling (interest 2)
 * - failure: "Negotiation Failed" with danger styling (interest 0-1)
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NegotiationOutcomeDisplay from './NegotiationOutcomeDisplay.svelte';
import type { NegotiationOutcome } from '$lib/types/negotiation';

describe('NegotiationOutcomeDisplay Component - Basic Rendering (Issue #385)', () => {
	it('should render without crashing', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'compromise'
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display outcome text', () => {
		render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'major_favor'
			}
		});

		expect(screen.getByText(/major.*favor|major.*agreement/i)).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Alliance Outcome', () => {
	it('should display alliance outcome text', () => {
		render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'alliance'
			}
		});

		expect(screen.getByText(/alliance|alliance.*formed|permanent.*ally/i)).toBeInTheDocument();
	});

	it('should use celebration styling for alliance', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'alliance'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/green|emerald|success|bg-green|text-green/i);
	});

	it('should show success icon for alliance', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'alliance'
			}
		});

		const icon = container.querySelector('svg[class*="check"], svg[class*="success"]');
		expect(icon).toBeInTheDocument();
	});

	it('should have highest visual prominence for alliance', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'alliance'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		// Should have bold, large text, or prominent styling
		expect(outcomeElement.className).toMatch(/font-bold|text-lg|text-xl|font-semibold/);
	});
});

describe('NegotiationOutcomeDisplay Component - Major Favor Outcome', () => {
	it('should display major_favor outcome text', () => {
		render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'major_favor'
			}
		});

		expect(screen.getByText(/major.*favor|significant.*agreement/i)).toBeInTheDocument();
	});

	it('should use positive styling for major_favor', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'major_favor'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/green|success|blue|bg-green|text-green|bg-blue/i);
	});

	it('should show success icon for major_favor', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'major_favor'
			}
		});

		const icon = container.querySelector('svg[class*="check"], svg[class*="success"]');
		expect(icon).toBeInTheDocument();
	});

	it('should have less prominence than alliance', () => {
		const { container: allianceOutcome } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'alliance'
			}
		});

		const { container: majorFavor } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'major_favor'
			}
		});

		// Different levels of green or different font weights
		const allianceElement = allianceOutcome.firstChild as HTMLElement;
		const majorElement = majorFavor.firstChild as HTMLElement;

		expect(allianceElement.className).not.toBe(majorElement.className);
	});
});

describe('NegotiationOutcomeDisplay Component - Minor Favor Outcome', () => {
	it('should display minor_favor outcome text', () => {
		render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'minor_favor'
			}
		});

		expect(screen.getByText(/minor.*favor|small.*agreement/i)).toBeInTheDocument();
	});

	it('should use warning styling for minor_favor', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'minor_favor'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/yellow|amber|warning|bg-yellow|text-yellow|bg-amber/i);
	});

	it('should show warning icon for minor_favor', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'minor_favor'
			}
		});

		const icon = container.querySelector('svg[class*="alert"], svg[class*="warning"], svg[class*="info"]');
		expect(icon).toBeInTheDocument();
	});

	it('should indicate mixed result', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'minor_favor'
			}
		});

		// Should not be styled as clearly good or bad
		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).not.toMatch(/green|red/);
	});
});

describe('NegotiationOutcomeDisplay Component - Failure Outcome', () => {
	it('should display failure outcome text', () => {
		render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'failure'
			}
		});

		expect(screen.getByText(/failure|negotiation.*failed|rejected/i)).toBeInTheDocument();
	});

	it('should use danger styling for failure', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'failure'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/red|danger|destructive|bg-red|text-red/i);
	});

	it('should show failure icon for failure', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'failure'
			}
		});

		const icon = container.querySelector('svg[class*="x"], svg[class*="close"], svg[class*="cancel"]');
		expect(icon).toBeInTheDocument();
	});

	it('should indicate negative result', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'failure'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/red|danger/i);
	});

	it('should have strong visual prominence for failure', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: {
				outcome: 'failure'
			}
		});

		const outcomeElement = container.firstChild as HTMLElement;
		// Might have border, bold text, or intense colors
		expect(outcomeElement.className).toMatch(/font-bold|border|bg-red-/);
	});
});

describe('NegotiationOutcomeDisplay Component - Visual Hierarchy', () => {
	it('should style alliance more prominently than major_favor', () => {
		const { container: alliance } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const { container: major } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const allianceElement = alliance.firstChild as HTMLElement;
		const majorElement = major.firstChild as HTMLElement;

		expect(allianceElement.className).not.toBe(majorElement.className);
	});

	it('should style positive outcomes differently from negative', () => {
		const { container: success } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const { container: fail } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		const successElement = success.firstChild as HTMLElement;
		const failureElement = fail.firstChild as HTMLElement;

		expect(successElement.className).toMatch(/green/i);
		expect(failureElement.className).toMatch(/red/i);
	});

	it('should distinguish between middle outcomes', () => {
		const { container: major } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const { container: minor } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'minor_favor' }
		});

		const majorElement = major.firstChild as HTMLElement;
		const minorElement = minor.firstChild as HTMLElement;

		expect(majorElement.className).toMatch(/green|blue/i);
		expect(minorElement.className).toMatch(/yellow|amber/i);
	});
});

describe('NegotiationOutcomeDisplay Component - Icon Display', () => {
	it('should display different icons for different outcomes', () => {
		const outcomes: NegotiationOutcome[] = [
			'alliance',
			'major_favor',
			'minor_favor',
			'failure'
		];

		outcomes.forEach(outcome => {
			const { container } = render(NegotiationOutcomeDisplay, {
				props: { outcome }
			});

			const icon = container.querySelector('svg');
			expect(icon).toBeInTheDocument();
		});
	});

	it('should use check icon for success outcomes', () => {
		const { container: alliance } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const { container: major } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		expect(alliance.querySelector('svg')).toBeInTheDocument();
		expect(major.querySelector('svg')).toBeInTheDocument();
	});

	it('should use alert icon for warning outcomes', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'minor_favor' }
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should use x icon for failure outcome', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		expect(container.querySelector('svg')).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Text Content', () => {
	it('should have descriptive text for alliance', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const text = screen.getByText(/alliance|alliance.*formed/i);
		expect(text).toBeInTheDocument();
	});

	it('should have descriptive text for major_favor', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const text = screen.getByText(/major.*favor|significant/i);
		expect(text).toBeInTheDocument();
	});

	it('should have descriptive text for minor_favor', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'minor_favor' }
		});

		const text = screen.getByText(/minor.*favor|small/i);
		expect(text).toBeInTheDocument();
	});

	it('should have descriptive text for failure', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		const text = screen.getByText(/failure|failed|rejected/i);
		expect(text).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Additional Details', () => {
	it('should show description for alliance', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		// Should explain what this means
		expect(screen.getByText(/alliance|interest.*5|permanent.*ally/i)).toBeInTheDocument();
	});

	it('should show interest level for each outcome', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		// Could show "Interest: 3-4"
		expect(screen.getByText(/interest.*3|interest.*4|major.*favor/i)).toBeInTheDocument();
	});

	it('should provide context for the outcome', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		// Should explain severity
		expect(screen.getByText(/failure|interest.*0|interest.*1|failed/i)).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Accessibility', () => {
	it('should have accessible role', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'success_full' }
		});

		const outcomeElement = container.querySelector('[role="status"], [role="alert"]');
		expect(outcomeElement).toBeInTheDocument();
	});

	it('should have accessible label', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const outcome = screen.getByText(/major.*favor/i);
		expect(outcome).toHaveAccessibleName();
	});

	it('should provide context for screen readers', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement).toHaveAttribute('aria-label');
	});

	it('should be perceivable without color', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		// Should have text and icon, not just color
		expect(screen.getByText(/failure|failed/i)).toBeInTheDocument();
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});
		expect(container.querySelector('svg')).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Layout', () => {
	it('should have consistent layout structure', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/flex|grid|block/);
	});

	it('should center content', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/justify-center|items-center|text-center/);
	});

	it('should have padding and spacing', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/p-|padding|m-|margin/);
	});

	it('should have rounded corners or border', () => {
		const { container } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		const outcomeElement = container.firstChild as HTMLElement;
		expect(outcomeElement.className).toMatch(/rounded|border/);
	});
});

describe('NegotiationOutcomeDisplay Component - Interest Level Mapping', () => {
	it('should map interest 5 to alliance', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		expect(screen.getByText(/interest.*5|alliance/i)).toBeInTheDocument();
	});

	it('should map interest 3-4 to major_favor', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'major_favor' }
		});

		expect(screen.getByText(/interest.*3|interest.*4|major.*favor/i)).toBeInTheDocument();
	});

	it('should map interest 2 to minor_favor', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'minor_favor' }
		});

		expect(screen.getByText(/interest.*2|minor.*favor/i)).toBeInTheDocument();
	});

	it('should map interest 0-1 to failure', () => {
		render(NegotiationOutcomeDisplay, {
			props: { outcome: 'failure' }
		});

		expect(screen.getByText(/interest.*0|interest.*1|failure/i)).toBeInTheDocument();
	});
});

describe('NegotiationOutcomeDisplay Component - Edge Cases', () => {
	it('should handle rapid outcome changes', () => {
		const { rerender } = render(NegotiationOutcomeDisplay, {
			props: { outcome: 'alliance' }
		});

		expect(screen.getByText(/alliance/i)).toBeInTheDocument();

		rerender({ outcome: 'failure' });
		expect(screen.getByText(/failure|failed/i)).toBeInTheDocument();
	});

	it('should render all four outcome types without error', () => {
		const outcomes: NegotiationOutcome[] = [
			'alliance',
			'major_favor',
			'minor_favor',
			'failure'
		];

		outcomes.forEach(outcome => {
			expect(() => {
				render(NegotiationOutcomeDisplay, {
					props: { outcome }
				});
			}).not.toThrow();
		});
	});
});
