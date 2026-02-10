/**
 * Tests for MotivationPitfallPanel Component
 *
 * Issue #384: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component manages the NPC's motivations and pitfalls:
 * - Lists all motivations with known/unknown state
 * - Lists all pitfalls with known/unknown state
 * - Reveal buttons for unknown items
 * - Visual distinction for used motivations
 * - Icons for each motivation type
 * - Emits reveal events
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MotivationPitfallPanel from './MotivationPitfallPanel.svelte';
import type { NPCMotivation, NPCPitfall } from '$lib/types/negotiation';

describe('MotivationPitfallPanel Component - Basic Rendering (Issue #384)', () => {
	it('should render without crashing', () => {
		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display Motivations section header', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByRole('heading', { name: /motivations/i })).toBeInTheDocument();
	});

	it('should display Pitfalls section header', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByRole('heading', { name: /pitfalls/i })).toBeInTheDocument();
	});

	it('should show message when no motivations exist', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByText(/no.*motivations/i)).toBeInTheDocument();
	});

	it('should show message when no pitfalls exist', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByText(/no.*pitfalls/i)).toBeInTheDocument();
	});
});

describe('MotivationPitfallPanel Component - Motivations List', () => {
	it('should display known motivation', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
	});

	it('should display multiple known motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'charity', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
		expect(screen.getByText(/charity/i)).toBeInTheDocument();
		expect(screen.getByText(/power/i)).toBeInTheDocument();
	});

	it('should hide unknown motivation names', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.queryByText('justice')).not.toBeInTheDocument();
		expect(screen.getByText(/unknown|hidden|\?/i)).toBeInTheDocument();
	});

	it('should show reveal button for unknown motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument();
	});

	it('should not show reveal button for known motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		// Should not have reveal button associated with this specific motivation
		const revealButtons = screen.queryAllByRole('button', { name: /reveal/i });
		expect(revealButtons.length).toBe(0);
	});

	it('should mark used motivations visually', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		// Used motivations should be visually distinct (opacity, strikethrough, etc.)
		const motivationItem = container.querySelector('[data-testid="motivation-justice"]');
		expect(motivationItem?.className).toMatch(/opacity|line-through|used|disabled/i);
	});

	it('should distinguish used from unused motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: true },
			{ type: 'charity', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const usedItem = container.querySelector('[data-testid="motivation-justice"]');
		const unusedItem = container.querySelector('[data-testid="motivation-charity"]');

		expect(usedItem?.className).toMatch(/opacity|line-through|used/i);
		expect(unusedItem?.className).not.toMatch(/opacity-50|line-through/);
	});

	it('should display all 13 motivation types correctly', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'charity', isKnown: true, used: false },
			{ type: 'discovery', isKnown: true, used: false },
			{ type: 'faith', isKnown: true, used: false },
			{ type: 'freedom', isKnown: true, used: false },
			{ type: 'greed', isKnown: true, used: false },
			{ type: 'harmony', isKnown: true, used: false },
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'knowledge', isKnown: true, used: false },
			{ type: 'legacy', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false },
			{ type: 'protection', isKnown: true, used: false },
			{ type: 'revenge', isKnown: true, used: false },
			{ type: 'wealth', isKnown: true, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.getByText(/charity/i)).toBeInTheDocument();
		expect(screen.getByText(/discovery/i)).toBeInTheDocument();
		expect(screen.getByText(/faith/i)).toBeInTheDocument();
		expect(screen.getByText(/freedom/i)).toBeInTheDocument();
		expect(screen.getByText(/greed/i)).toBeInTheDocument();
		expect(screen.getByText(/harmony/i)).toBeInTheDocument();
		expect(screen.getByText(/justice/i)).toBeInTheDocument();
		expect(screen.getByText(/knowledge/i)).toBeInTheDocument();
		expect(screen.getByText(/legacy/i)).toBeInTheDocument();
		expect(screen.getByText(/power/i)).toBeInTheDocument();
		expect(screen.getByText(/protection/i)).toBeInTheDocument();
		expect(screen.getByText(/revenge/i)).toBeInTheDocument();
		expect(screen.getByText(/wealth/i)).toBeInTheDocument();
	});
});

describe('MotivationPitfallPanel Component - Pitfalls List', () => {
	it('should display known pitfall', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		expect(screen.getByText(/greed/i)).toBeInTheDocument();
	});

	it('should display multiple known pitfalls', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true },
			{ type: 'revenge', isKnown: true },
			{ type: 'power', isKnown: true }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		expect(screen.getByText(/greed/i)).toBeInTheDocument();
		expect(screen.getByText(/revenge/i)).toBeInTheDocument();
		expect(screen.getByText(/power/i)).toBeInTheDocument();
	});

	it('should hide unknown pitfall names', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		expect(screen.queryByText('greed')).not.toBeInTheDocument();
		expect(screen.getByText(/unknown|hidden|\?/i)).toBeInTheDocument();
	});

	it('should show reveal button for unknown pitfalls', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument();
	});

	it('should not show reveal button for known pitfalls', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		const revealButtons = screen.queryAllByRole('button', { name: /reveal/i });
		expect(revealButtons.length).toBe(0);
	});

	it('should style pitfalls with warning/danger colors', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		const pitfallItem = container.querySelector('[data-testid="pitfall-greed"]');
		expect(pitfallItem?.className).toMatch(/red|danger|warning|orange/i);
	});
});

describe('MotivationPitfallPanel Component - Icons', () => {
	it('should display icon for each motivation', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const icon = container.querySelector('svg, [data-icon]');
		expect(icon).toBeInTheDocument();
	});

	it('should display different icons for different motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const icons = container.querySelectorAll('svg, [data-icon]');
		expect(icons.length).toBeGreaterThanOrEqual(2);
	});

	it('should display icon for each pitfall', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		const icon = container.querySelector('svg, [data-icon]');
		expect(icon).toBeInTheDocument();
	});

	it('should use warning icon for pitfalls', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		// Pitfalls should have alert/warning icons
		const warningIcon = container.querySelector('svg[class*="alert"], svg[class*="warning"]');
		expect(warningIcon).toBeInTheDocument();
	});

	it('should hide icon content for unknown items', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		// Unknown items might show a generic question mark icon
		const questionIcon = container.querySelector('[data-icon="unknown"], [data-icon="question"]');
		expect(questionIcon).toBeInTheDocument();
	});
});

describe('MotivationPitfallPanel Component - Reveal Functionality', () => {
	it('should emit revealMotivation event when reveal button clicked', async () => {
		const onRevealMotivation = vi.fn();
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: [],
				onRevealMotivation
			}
		});

		const revealButton = screen.getByRole('button', { name: /reveal/i });
		await fireEvent.click(revealButton);

		expect(onRevealMotivation).toHaveBeenCalledWith('justice');
	});

	it('should emit revealPitfall event when reveal button clicked', async () => {
		const onRevealPitfall = vi.fn();
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls,
				onRevealPitfall
			}
		});

		const revealButton = screen.getByRole('button', { name: /reveal/i });
		await fireEvent.click(revealButton);

		expect(onRevealPitfall).toHaveBeenCalledWith('greed');
	});

	it('should reveal correct motivation when multiple unknowns exist', async () => {
		const onRevealMotivation = vi.fn();
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false },
			{ type: 'power', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: [],
				onRevealMotivation
			}
		});

		const revealButtons = screen.getAllByRole('button', { name: /reveal/i });
		await fireEvent.click(revealButtons[0]);

		expect(onRevealMotivation).toHaveBeenCalledWith('justice');
	});

	it('should reveal correct pitfall when multiple unknowns exist', async () => {
		const onRevealPitfall = vi.fn();
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: false },
			{ type: 'revenge', isKnown: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls,
				onRevealPitfall
			}
		});

		const revealButtons = screen.getAllByRole('button', { name: /reveal/i });
		await fireEvent.click(revealButtons[1]);

		expect(onRevealPitfall).toHaveBeenCalledWith('revenge');
	});

	it('should disable reveal button after clicking', async () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const revealButton = screen.getByRole('button', { name: /reveal/i });
		await fireEvent.click(revealButton);

		// Button should be disabled or loading after click
		expect(revealButton).toBeDisabled();
	});
});

describe('MotivationPitfallPanel Component - Mixed States', () => {
	it('should display mix of known and unknown motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'power', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
		expect(screen.getByText(/unknown|hidden/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument();
	});

	it('should display mix of used and unused motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: true },
			{ type: 'charity', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const usedItem = container.querySelector('[data-testid="motivation-justice"]');
		const unusedItem = container.querySelector('[data-testid="motivation-charity"]');

		expect(usedItem?.className).toMatch(/opacity|line-through|used/i);
		expect(unusedItem?.className).not.toMatch(/opacity-50|line-through/);
	});

	it('should handle motivations and pitfalls together', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls
			}
		});

		expect(screen.getByText(/justice/i)).toBeInTheDocument();
		expect(screen.getByText(/greed/i)).toBeInTheDocument();
	});

	it('should count motivations and pitfalls correctly', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false }
		];
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls
			}
		});

		// Could show counts like "Motivations (2)" and "Pitfalls (1)"
		expect(screen.getByText(/motivations.*\(2\)|2.*motivations/i)).toBeInTheDocument();
		expect(screen.getByText(/pitfalls.*\(1\)|1.*pitfall/i)).toBeInTheDocument();
	});
});

describe('MotivationPitfallPanel Component - Layout', () => {
	it('should separate motivations and pitfalls sections', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls
			}
		});

		const motivationsSection = container.querySelector('[data-testid="motivations-section"]');
		const pitfallsSection = container.querySelector('[data-testid="pitfalls-section"]');

		expect(motivationsSection).toBeInTheDocument();
		expect(pitfallsSection).toBeInTheDocument();
	});

	it('should display motivations section first', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls
			}
		});

		const text = container.textContent || '';
		const motivationsIndex = text.indexOf('Motivations');
		const pitfallsIndex = text.indexOf('Pitfalls');

		expect(motivationsIndex).toBeGreaterThan(-1);
		expect(pitfallsIndex).toBeGreaterThan(-1);
		expect(motivationsIndex).toBeLessThan(pitfallsIndex);
	});

	it('should use list elements for motivations', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const list = container.querySelector('ul, ol');
		expect(list).toBeInTheDocument();

		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBeGreaterThanOrEqual(2);
	});

	it('should use list elements for pitfalls', () => {
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true },
			{ type: 'revenge', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls
			}
		});

		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBeGreaterThanOrEqual(2);
	});
});

describe('MotivationPitfallPanel Component - Accessibility', () => {
	it('should have semantic section elements', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false }
		];
		const pitfalls: NPCPitfall[] = [
			{ type: 'greed', isKnown: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls
			}
		});

		const sections = container.querySelectorAll('section');
		expect(sections.length).toBeGreaterThanOrEqual(2);
	});

	it('should have accessible headings', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		const motivationsHeading = screen.getByRole('heading', { name: /motivations/i });
		const pitfallsHeading = screen.getByRole('heading', { name: /pitfalls/i });

		expect(motivationsHeading).toBeInTheDocument();
		expect(pitfallsHeading).toBeInTheDocument();
	});

	it('should have accessible reveal buttons', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const revealButton = screen.getByRole('button', { name: /reveal/i });
		expect(revealButton).toHaveAccessibleName();
	});

	it('should indicate used state to screen readers', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const usedItem = container.querySelector('[data-testid="motivation-justice"]');
		expect(usedItem).toHaveAttribute('aria-label');
		expect(usedItem?.getAttribute('aria-label')).toMatch(/used/i);
	});

	it('should use list semantics correctly', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: false },
			{ type: 'power', isKnown: true, used: false }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const list = container.querySelector('[role="list"]');
		expect(list).toBeInTheDocument();
	});
});

describe('MotivationPitfallPanel Component - Edge Cases', () => {
	it('should handle empty motivations array', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByText(/no.*motivations/i)).toBeInTheDocument();
	});

	it('should handle empty pitfalls array', () => {
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: []
			}
		});

		expect(screen.getByText(/no.*pitfalls/i)).toBeInTheDocument();
	});

	it('should handle large number of motivations', () => {
		const motivations: NPCMotivation[] = Array.from({ length: 13 }, (_, i) => ({
			type: ['charity', 'discovery', 'faith', 'freedom', 'greed', 'harmony',
				'justice', 'knowledge', 'legacy', 'power', 'protection', 'revenge',
				'wealth'][i] as any,
			isKnown: true,
			used: false
		}));

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(13);
	});

	it('should handle all motivations being used', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: true, used: true },
			{ type: 'power', isKnown: true, used: true }
		];

		const { container } = render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const justiceItem = container.querySelector('[data-testid="motivation-justice"]');
		const powerItem = container.querySelector('[data-testid="motivation-power"]');

		expect(justiceItem?.className).toMatch(/opacity|line-through|used/i);
		expect(powerItem?.className).toMatch(/opacity|line-through|used/i);
	});

	it('should handle all motivations being unknown', () => {
		const motivations: NPCMotivation[] = [
			{ type: 'justice', isKnown: false, used: false },
			{ type: 'power', isKnown: false, used: false }
		];

		render(MotivationPitfallPanel, {
			props: {
				motivations,
				pitfalls: []
			}
		});

		const revealButtons = screen.getAllByRole('button', { name: /reveal/i });
		expect(revealButtons.length).toBe(2);
	});
});
