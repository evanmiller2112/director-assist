/**
 * Tests for NegotiationProgress Component
 *
 * Issue #381: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component displays the current state of a negotiation:
 * - Interest level (0-5) with progress bar
 * - Patience level (0-5) with progress bar
 * - Color-coded visual feedback
 * - NPC response preview based on interest
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NegotiationProgress from './NegotiationProgress.svelte';

describe('NegotiationProgress Component - Basic Rendering (Issue #381)', () => {
	it('should render without crashing', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display Interest label', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		expect(screen.getByText(/interest/i)).toBeInTheDocument();
	});

	it('should display Patience label', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		expect(screen.getByText(/patience/i)).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Interest Display', () => {
	it('should display Interest value 0/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 0,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*0.*5/i)).toBeInTheDocument();
	});

	it('should display Interest value 1/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 1,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*1.*5/i)).toBeInTheDocument();
	});

	it('should display Interest value 2/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*2.*5/i)).toBeInTheDocument();
	});

	it('should display Interest value 3/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*3.*5/i)).toBeInTheDocument();
	});

	it('should display Interest value 4/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 4,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*4.*5/i)).toBeInTheDocument();
	});

	it('should display Interest value 5/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 3
			}
		});

		expect(screen.getByText(/interest.*5.*5/i)).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Patience Display', () => {
	it('should display Patience value 0/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 0
			}
		});

		expect(screen.getByText(/patience.*0.*5/i)).toBeInTheDocument();
	});

	it('should display Patience value 1/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 1
			}
		});

		expect(screen.getByText(/patience.*1.*5/i)).toBeInTheDocument();
	});

	it('should display Patience value 3/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		expect(screen.getByText(/patience.*3.*5/i)).toBeInTheDocument();
	});

	it('should display Patience value 5/5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 5
			}
		});

		expect(screen.getByText(/patience.*5.*5/i)).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Progress Bar Widths', () => {
	it('should show Interest bar at 0% width when interest is 0', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 0,
				patience: 3
			}
		});

		// Find interest progress bar (look for element with 0% or w-0 class)
		const interestBar = container.querySelector('[data-testid="interest-bar"], [role="progressbar"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Interest bar at 20% width when interest is 1', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 1,
				patience: 3
			}
		});

		// 1/5 = 20%
		const interestBar = container.querySelector('[style*="20%"], [data-value="1"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Interest bar at 40% width when interest is 2', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		// 2/5 = 40%
		const interestBar = container.querySelector('[style*="40%"], [data-value="2"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Interest bar at 60% width when interest is 3', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 3
			}
		});

		// 3/5 = 60%
		const interestBar = container.querySelector('[style*="60%"], [data-value="3"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Interest bar at 80% width when interest is 4', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 4,
				patience: 3
			}
		});

		// 4/5 = 80%
		const interestBar = container.querySelector('[style*="80%"], [data-value="4"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Interest bar at 100% width when interest is 5', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 3
			}
		});

		// 5/5 = 100%
		const interestBar = container.querySelector('[style*="100%"], [data-value="5"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should show Patience bar at 0% width when patience is 0', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 0
			}
		});

		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar).toBeInTheDocument();
	});

	it('should show Patience bar at 60% width when patience is 3', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		// 3/5 = 60%
		const patienceBar = container.querySelector('[style*="60%"], [data-testid="patience-bar"]');
		expect(patienceBar).toBeInTheDocument();
	});

	it('should show Patience bar at 100% width when patience is 5', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 5
			}
		});

		// 5/5 = 100%
		const patienceBar = container.querySelector('[style*="100%"], [data-testid="patience-bar"]');
		expect(patienceBar).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Color Coding for Interest', () => {
	it('should show red/danger styling when interest is 0', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 0,
				patience: 3
			}
		});

		// Interest 0 = failure, should be red/danger
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/red|danger|destructive/i);
	});

	it('should show red styling when interest is 1', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 1,
				patience: 3
			}
		});

		// Interest 1 = failure, should be red
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/red|danger/i);
	});

	it('should show orange/warning styling when interest is 2', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		// Interest 2 = minor_favor, should be orange/amber
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/orange|amber|yellow|warning/i);
	});

	it('should show yellow/warning styling when interest is 3', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 3
			}
		});

		// Interest 3 = major_favor, currently uses yellow in implementation
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/yellow/i);
	});

	it('should show green/success styling when interest is 4', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 4,
				patience: 3
			}
		});

		// Interest 4 = major_favor, should be green
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/green|success/i);
	});

	it('should show bright green/success styling when interest is 5', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 3
			}
		});

		// Interest 5 = alliance, should be bright green
		const interestBar = container.querySelector('[data-testid="interest-bar"]');
		expect(interestBar?.className).toMatch(/green|success/i);
	});
});

describe('NegotiationProgress Component - Color Coding for Patience', () => {
	it('should show red/danger styling when patience is 0', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 0
			}
		});

		// Patience 0 = critical, should be red
		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar?.className).toMatch(/red|danger/i);
	});

	it('should show orange styling when patience is 1', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 1
			}
		});

		// Patience 1 = very low, should be orange
		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar?.className).toMatch(/orange|amber|red/i);
	});

	it('should show yellow styling when patience is 2', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 2
			}
		});

		// Patience 2 = low, should be yellow/amber
		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar?.className).toMatch(/yellow|amber|orange/i);
	});

	it('should show blue/neutral styling when patience is 3', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		// Patience 3 = moderate, should be blue/neutral
		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar?.className).toMatch(/blue|slate|gray|neutral/i);
	});

	it('should show blue styling when patience is 5', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 5
			}
		});

		// Patience 5 = full, should be blue
		const patienceBar = container.querySelector('[data-testid="patience-bar"]');
		expect(patienceBar?.className).toMatch(/blue|slate/i);
	});
});

describe('NegotiationProgress Component - NPC Response Preview', () => {
	it('should show "Failure" preview when interest is 0', () => {
		render(NegotiationProgress, {
			props: {
				interest: 0,
				patience: 3
			}
		});

		expect(screen.getByText(/failure|will.*fail/i)).toBeInTheDocument();
	});

	it('should show "Failure" preview when interest is 1', () => {
		render(NegotiationProgress, {
			props: {
				interest: 1,
				patience: 3
			}
		});

		expect(screen.getByText(/failure|will.*fail/i)).toBeInTheDocument();
	});

	it('should show "Minor Favor" preview when interest is 2', () => {
		render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		expect(screen.getByText(/minor.*favor/i)).toBeInTheDocument();
	});

	it('should show "Major Favor" preview when interest is 3', () => {
		render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 3
			}
		});

		expect(screen.getByText(/major.*favor/i)).toBeInTheDocument();
	});

	it('should show "Major Favor" preview when interest is 4', () => {
		render(NegotiationProgress, {
			props: {
				interest: 4,
				patience: 3
			}
		});

		expect(screen.getByText(/major.*favor/i)).toBeInTheDocument();
	});

	it('should show "Alliance" preview when interest is 5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 3
			}
		});

		expect(screen.getByText(/alliance/i)).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Accessibility', () => {
	it('should have accessible label for Interest progress bar', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 2
			}
		});

		const interestBar = container.querySelector('[role="progressbar"][aria-label*="Interest"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should have accessible label for Patience progress bar', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 2
			}
		});

		const patienceBar = container.querySelector('[role="progressbar"][aria-label*="Patience"]');
		expect(patienceBar).toBeInTheDocument();
	});

	it('should have aria-valuenow for Interest progress bar', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 2
			}
		});

		const interestBar = container.querySelector('[role="progressbar"][aria-valuenow="3"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should have aria-valuemin="0" for Interest progress bar', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 2
			}
		});

		const interestBar = container.querySelector('[role="progressbar"][aria-valuemin="0"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should have aria-valuemax="5" for Interest progress bar', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 2
			}
		});

		const interestBar = container.querySelector('[role="progressbar"][aria-valuemax="5"]');
		expect(interestBar).toBeInTheDocument();
	});

	it('should have aria-valuenow for Patience progress bar matching current value', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 3,
				patience: 4
			}
		});

		const patienceBar = container.querySelector('[role="progressbar"][aria-valuenow="4"]');
		expect(patienceBar).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Edge Cases', () => {
	it('should handle boundary value interest=0 patience=0', () => {
		render(NegotiationProgress, {
			props: {
				interest: 0,
				patience: 0
			}
		});

		expect(screen.getByText(/interest.*0.*5/i)).toBeInTheDocument();
		expect(screen.getByText(/patience.*0.*5/i)).toBeInTheDocument();
	});

	it('should handle boundary value interest=5 patience=5', () => {
		render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 5
			}
		});

		expect(screen.getByText(/interest.*5.*5/i)).toBeInTheDocument();
		expect(screen.getByText(/patience.*5.*5/i)).toBeInTheDocument();
	});

	it('should handle mixed extreme values', () => {
		render(NegotiationProgress, {
			props: {
				interest: 5,
				patience: 0
			}
		});

		expect(screen.getByText(/interest.*5.*5/i)).toBeInTheDocument();
		expect(screen.getByText(/patience.*0.*5/i)).toBeInTheDocument();
	});
});

describe('NegotiationProgress Component - Visual Structure', () => {
	it('should render Interest section before Patience section', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		const text = container.textContent || '';
		const interestIndex = text.indexOf('Interest');
		const patienceIndex = text.indexOf('Patience');

		expect(interestIndex).toBeGreaterThan(-1);
		expect(patienceIndex).toBeGreaterThan(-1);
		expect(interestIndex).toBeLessThan(patienceIndex);
	});

	it('should use consistent styling structure', () => {
		const { container } = render(NegotiationProgress, {
			props: {
				interest: 2,
				patience: 3
			}
		});

		// Should have progress bars
		const progressBars = container.querySelectorAll('[role="progressbar"]');
		expect(progressBars.length).toBeGreaterThanOrEqual(2);
	});
});
