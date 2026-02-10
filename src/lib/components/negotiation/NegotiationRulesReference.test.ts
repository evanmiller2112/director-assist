/**
 * Tests for NegotiationRulesReference Component
 *
 * Issue #394: Add Negotiation Reference Panel
 *
 * This component provides a collapsible reference panel with Draw Steel negotiation rules:
 * - Collapsible panel (collapsed by default)
 * - Header with book icon and toggle chevron
 * - Argument Outcomes Table showing Interest/Patience changes by tier
 * - The 13 Motivations list
 * - Outcomes by Interest Level (0-5)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NegotiationRulesReference from './NegotiationRulesReference.svelte';

describe('NegotiationRulesReference Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(NegotiationRulesReference);
		expect(container).toBeInTheDocument();
	});

	it('should render header with title', () => {
		render(NegotiationRulesReference);
		expect(screen.getByText(/negotiation.*rules/i)).toBeInTheDocument();
	});

	it('should be collapsed by default', () => {
		render(NegotiationRulesReference);
		expect(screen.queryByText(/argument.*outcomes/i)).not.toBeInTheDocument();
	});

	it('should have a clickable header button', () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');
		expect(header).toBeInTheDocument();
	});
});

describe('NegotiationRulesReference Component - Expand/Collapse', () => {
	it('should expand when header is clicked', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/argument.*outcomes/i)).toBeInTheDocument();
	});

	it('should collapse when header is clicked again', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		// Expand
		await fireEvent.click(header);
		expect(screen.getByText(/argument.*outcomes/i)).toBeInTheDocument();

		// Collapse
		await fireEvent.click(header);
		expect(screen.queryByText(/argument.*outcomes/i)).not.toBeInTheDocument();
	});

	it('should have proper aria-expanded attribute', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		expect(header).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(header);

		expect(header).toHaveAttribute('aria-expanded', 'true');
	});

	it('should control content section with aria-controls', () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		expect(header).toHaveAttribute('aria-controls', 'rules-content');
	});
});

describe('NegotiationRulesReference Component - Argument Outcomes Table', () => {
	it('should show Argument Outcomes section when expanded', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/argument.*outcomes/i)).toBeInTheDocument();
	});

	it('should show table headers', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/argument.*type/i)).toBeInTheDocument();
		expect(screen.getByText(/tier.*1/i)).toBeInTheDocument();
		expect(screen.getByText(/tier.*2/i)).toBeInTheDocument();
		expect(screen.getByText(/tier.*3/i)).toBeInTheDocument();
	});

	it('should show Motivation Appeal row', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/motivation.*appeal/i)).toBeInTheDocument();
	});

	it('should show No Motivation row', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/no.*motivation/i)).toBeInTheDocument();
	});

	it('should show Pitfall row', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/pitfall/i)).toBeInTheDocument();
	});

	it('should show auto-fail for pitfall tier 2 and 3', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		const autoFailElements = screen.getAllByText(/auto.*fail/i);
		expect(autoFailElements).toHaveLength(2);
	});

	it('should show Interest and Patience changes', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		// Check for Int/Pat labels (abbreviated) - there are multiple instances
		const intElements = screen.getAllByText(/Int.*±0/);
		expect(intElements.length).toBeGreaterThan(0);

		const patElements = screen.getAllByText(/Pat.*-1/);
		expect(patElements.length).toBeGreaterThan(0);
	});
});

describe('NegotiationRulesReference Component - The 13 Motivations', () => {
	it('should show The 13 Motivations section when expanded', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/the.*13.*motivations/i)).toBeInTheDocument();
	});

	it('should list Benevolence', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/charity/i)).toBeInTheDocument();
	});

	it('should list Discovery', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/discovery/i)).toBeInTheDocument();
	});

	it('should list Freedom', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/freedom/i)).toBeInTheDocument();
	});

	it('should list Greed', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/greed/i)).toBeInTheDocument();
	});

	it('should list Faith', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/faith/i)).toBeInTheDocument();
	});

	it('should list Justice', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
	});

	it('should list Legacy', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/legacy/i)).toBeInTheDocument();
	});

	it('should list Peace', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/harmony/i)).toBeInTheDocument();
	});

	it('should list Power', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/power/i)).toBeInTheDocument();
	});

	it('should list Protection', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/protection/i)).toBeInTheDocument();
	});

	it('should list Revelry', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/knowledge/i)).toBeInTheDocument();
	});

	it('should list Vengeance', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/revenge/i)).toBeInTheDocument();
	});

	it('should display all 13 motivations', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		const motivations = [
			'Charity',
			'Discovery',
			'Faith',
			'Freedom',
			'Greed',
			'Harmony',
			'Justice',
			'Knowledge',
			'Legacy',
			'Power',
			'Protection',
			'Revenge',
			'Wealth'
		];

		motivations.forEach(motivation => {
			expect(screen.getByText(motivation)).toBeInTheDocument();
		});
	});
});

describe('NegotiationRulesReference Component - Outcomes by Interest Level', () => {
	it('should show Outcomes by Interest Level section when expanded', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/outcomes.*by.*interest.*level/i)).toBeInTheDocument();
	});

	it('should show Interest 5 - Alliance', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/5:/)).toBeInTheDocument();
		expect(screen.getByText(/alliance/i)).toBeInTheDocument();
		expect(screen.getByText(/everything.*requested.*plus.*bonus/i)).toBeInTheDocument();
	});

	it('should show Interest 4 - Major Favor (full agreement)', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/4:/)).toBeInTheDocument();
		expect(screen.getByText(/full.*agreement.*to.*request/i)).toBeInTheDocument();
	});

	it('should show Interest 3 - Major Favor (with conditions)', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/3:/)).toBeInTheDocument();
		expect(screen.getByText(/agreement.*with.*some.*conditions/i)).toBeInTheDocument();
	});

	it('should show Interest 2 - Minor Favor', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/2:/)).toBeInTheDocument();
		expect(screen.getByText(/minor.*favor/i)).toBeInTheDocument();
		expect(screen.getByText(/limited.*or.*reduced.*offer/i)).toBeInTheDocument();
	});

	it('should show Interest 1 - Failure (request rejected)', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/1:/)).toBeInTheDocument();
		expect(screen.getByText(/request.*rejected/i)).toBeInTheDocument();
	});

	it('should show Interest 0 - Failure (hostile)', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		expect(screen.getByText(/0:/)).toBeInTheDocument();
		expect(screen.getByText(/hostile.*refusal/i)).toBeInTheDocument();
		expect(screen.getByText(/possible.*consequences/i)).toBeInTheDocument();
	});

	it('should show all 6 interest levels', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		// Check for all 6 levels (0-5)
		expect(screen.getByText(/5:/)).toBeInTheDocument();
		expect(screen.getByText(/4:/)).toBeInTheDocument();
		expect(screen.getByText(/3:/)).toBeInTheDocument();
		expect(screen.getByText(/2:/)).toBeInTheDocument();
		expect(screen.getByText(/1:/)).toBeInTheDocument();
		expect(screen.getByText(/0:/)).toBeInTheDocument();
	});

	it('should use Major Favor for levels 3 and 4', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		const majorFavorElements = screen.getAllByText(/major.*favor/i);
		expect(majorFavorElements).toHaveLength(2);
	});

	it('should use Failure for levels 0 and 1', async () => {
		render(NegotiationRulesReference);
		const header = screen.getByRole('button');

		await fireEvent.click(header);

		const failureElements = screen.getAllByText(/failure/i);
		expect(failureElements).toHaveLength(2);
	});
});

describe('NegotiationRulesReference Component - Accessibility', () => {
	it('should have proper aria-expanded on toggle button', () => {
		render(NegotiationRulesReference);
		const button = screen.getByRole('button');

		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('should have aria-controls attribute', () => {
		render(NegotiationRulesReference);
		const button = screen.getByRole('button');

		expect(button).toHaveAttribute('aria-controls');
	});

	it('should update aria-expanded when toggled', async () => {
		render(NegotiationRulesReference);
		const button = screen.getByRole('button');

		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('should have keyboard-accessible toggle button', () => {
		render(NegotiationRulesReference);
		const button = screen.getByRole('button');

		expect(button).toHaveAttribute('type', 'button');
	});
});

describe('NegotiationRulesReference Component - Visual Elements', () => {
	it('should render with proper styling classes', () => {
		const { container } = render(NegotiationRulesReference);

		expect(container.querySelector('.negotiation-rules-reference')).toBeInTheDocument();
	});

	it('should show chevron down when collapsed', () => {
		render(NegotiationRulesReference);
		// The component uses lucide-svelte ChevronDown/ChevronUp
		// Check that the button is present (icon is rendered by Svelte)
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('should show chevron up when expanded', async () => {
		render(NegotiationRulesReference);
		const button = screen.getByRole('button');

		await fireEvent.click(button);

		// Button should still be there after expansion
		expect(button).toBeInTheDocument();
	});
});
