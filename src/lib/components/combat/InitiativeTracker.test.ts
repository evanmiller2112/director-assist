/**
 * Tests for InitiativeTracker Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker
 *
 * InitiativeTracker displays the turn order list with current combatant highlighting.
 * It's the primary UI for tracking initiative during combat.
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import InitiativeTracker from './InitiativeTracker.svelte';
import { createActiveCombatSession, createMockHeroCombatant, createMockCreatureCombatant } from '../../../tests/utils/combatTestUtils';
import type { CombatSession, Combatant } from '$lib/types/combat';

describe('InitiativeTracker Component - Basic Rendering', () => {
	let mockCombat: CombatSession;

	beforeEach(() => {
		mockCombat = createActiveCombatSession(2, 2);
	});

	it('should render without crashing', () => {
		const { container } = render(InitiativeTracker, {
			props: {
				combat: mockCombat
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display all combatants in initiative order', () => {
		render(InitiativeTracker, {
			props: {
				combat: mockCombat
			}
		});

		mockCombat.combatants.forEach(combatant => {
			expect(screen.getByText(combatant.name)).toBeInTheDocument();
		});
	});

	it('should display combatants sorted by initiative (highest first)', () => {
		const combat = createActiveCombatSession();
		combat.combatants = [
			createMockHeroCombatant({ name: 'Fast Hero', initiative: 18 }),
			createMockCreatureCombatant({ name: 'Medium Creature', initiative: 12 }),
			createMockHeroCombatant({ name: 'Slow Hero', initiative: 8 })
		];

		render(InitiativeTracker, {
			props: { combat }
		});

		const names = screen.getAllByTestId(/combatant-name/i);
		expect(names[0]).toHaveTextContent('Fast Hero');
		expect(names[1]).toHaveTextContent('Medium Creature');
		expect(names[2]).toHaveTextContent('Slow Hero');
	});

	it('should display initiative values for each combatant', () => {
		render(InitiativeTracker, {
			props: {
				combat: mockCombat
			}
		});

		mockCombat.combatants.forEach(combatant => {
			expect(screen.getByText(combatant.initiative.toString())).toBeInTheDocument();
		});
	});

	it('should render an empty state when no combatants', () => {
		mockCombat.combatants = [];

		render(InitiativeTracker, {
			props: {
				combat: mockCombat
			}
		});

		expect(screen.getByText(/no combatants/i)).toBeInTheDocument();
	});
});

describe('InitiativeTracker Component - Current Turn Highlighting', () => {
	it('should highlight the current combatant', () => {
		const combat = createActiveCombatSession(2, 1);
		combat.currentTurn = 1;

		render(InitiativeTracker, {
			props: { combat }
		});

		const currentCombatant = combat.combatants[1];
		const combatantElement = screen.getByText(currentCombatant.name).closest('[data-testid="combatant-card"]');

		expect(combatantElement).toHaveClass(/current|active|highlighted/);
	});

	it('should not highlight other combatants', () => {
		const combat = createActiveCombatSession(3, 1);
		combat.currentTurn = 1;

		render(InitiativeTracker, {
			props: { combat }
		});

		const otherCombatants = combat.combatants.filter((_, i) => i !== 1);
		otherCombatants.forEach(combatant => {
			const element = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
			expect(element).not.toHaveClass(/current|active|highlighted/);
		});
	});

	it('should show current turn indicator icon', () => {
		const combat = createActiveCombatSession(2, 1);
		combat.currentTurn = 0;

		render(InitiativeTracker, {
			props: { combat }
		});

		const currentCombatantCard = screen.getByText(combat.combatants[0].name)
			.closest('[data-testid="combatant-card"]');

		expect(currentCombatantCard?.querySelector('[data-testid="current-turn-indicator"]')).toBeInTheDocument();
	});

	it('should update highlighting when currentTurn changes', () => {
		const combat = createActiveCombatSession(2, 1);
		combat.currentTurn = 0;

		const { rerender } = render(InitiativeTracker, {
			props: { combat }
		});

		// First combatant should be highlighted
		let firstCard = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]');
		expect(firstCard).toHaveClass(/current|active/);

		// Change turn
		combat.currentTurn = 1;
		rerender({ combat });

		// Second combatant should now be highlighted
		let secondCard = screen.getByText(combat.combatants[1].name).closest('[data-testid="combatant-card"]');
		expect(secondCard).toHaveClass(/current|active/);

		// First should no longer be highlighted
		firstCard = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]');
		expect(firstCard).not.toHaveClass(/current|active/);
	});
});

describe('InitiativeTracker Component - Combatant Display', () => {
	it('should display combatant HP', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];

		render(InitiativeTracker, {
			props: { combat }
		});

		// Check HP is displayed in the HP section with aria-label
		const hpSection = screen.getAllByLabelText(new RegExp(`${combatant.hp} out of ${combatant.maxHp} hit points`, 'i'))[0];
		expect(hpSection).toBeInTheDocument();
	});

	it('should display AC if provided', () => {
		const combat = createActiveCombatSession();
		combat.combatants[0].ac = 16;

		render(InitiativeTracker, {
			props: { combat }
		});

		// AC is displayed, use getAllByText since multiple combatants may have AC
		const acDisplays = screen.getAllByText(/AC.*16/i);
		expect(acDisplays.length).toBeGreaterThan(0);
	});

	it('should display temp HP if present', () => {
		const combat = createActiveCombatSession();
		combat.combatants[0].tempHp = 8;

		render(InitiativeTracker, {
			props: { combat }
		});

		expect(screen.getByText(/temp.*8/i)).toBeInTheDocument();
	});

	it('should show bloodied status when HP <= 50%', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];
		combatant.hp = Math.floor(combatant.maxHp! / 2);

		render(InitiativeTracker, {
			props: { combat }
		});

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/bloodied/i);
	});

	it('should show defeated status when HP = 0', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];
		combatant.hp = 0;

		render(InitiativeTracker, {
			props: { combat }
		});

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/defeated|unconscious/i);
	});
});

describe('InitiativeTracker Component - Combatant Types', () => {
	it('should display hero indicator for hero combatants', () => {
		const combat = createActiveCombatSession();
		const hero = combat.combatants.find(c => c.type === 'hero');

		render(InitiativeTracker, {
			props: { combat }
		});

		if (hero) {
			const card = screen.getByText(hero.name).closest('[data-testid="combatant-card"]');
			expect(card?.querySelector('[data-testid="hero-indicator"]')).toBeInTheDocument();
		}
	});

	it('should display threat level for creature combatants', () => {
		const combat = createActiveCombatSession();
		const creature = combat.combatants.find(c => c.type === 'creature');

		render(InitiativeTracker, {
			props: { combat }
		});

		if (creature) {
			// Use getAllByText since there may be multiple creatures
			const threatBadges = screen.getAllByTestId('threat-badge');
			expect(threatBadges.length).toBeGreaterThan(0);
		}
	});

	it('should display different styling for heroes vs creatures', () => {
		const combat = createActiveCombatSession(1, 1);

		render(InitiativeTracker, {
			props: { combat }
		});

		const hero = combat.combatants.find(c => c.type === 'hero');
		const creature = combat.combatants.find(c => c.type === 'creature');

		if (hero && creature) {
			const heroCard = screen.getByText(hero.name).closest('[data-testid="combatant-card"]');
			const creatureCard = screen.getByText(creature.name).closest('[data-testid="combatant-card"]');

			expect(heroCard?.className).not.toEqual(creatureCard?.className);
		}
	});
});

describe('InitiativeTracker Component - Conditions Display', () => {
	it('should display condition badges for combatants with conditions', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];
		combatant.conditions = [
			{ name: 'Stunned', source: 'Spell', duration: 1, description: 'Cannot act' },
			{ name: 'Bleeding', source: 'Weapon', duration: 2, description: 'Takes damage' }
		];

		render(InitiativeTracker, {
			props: { combat }
		});

		expect(screen.getByText('Stunned')).toBeInTheDocument();
		expect(screen.getByText('Bleeding')).toBeInTheDocument();
	});

	it('should show condition duration', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];
		combatant.conditions = [
			{ name: 'Poisoned', source: 'Trap', duration: 3 }
		];

		render(InitiativeTracker, {
			props: { combat }
		});

		// Check for the condition badge with duration in aria-label
		const conditionBadge = screen.getByRole('status', { name: /Poisoned.*3.*rounds?/i });
		expect(conditionBadge).toBeInTheDocument();
	});

	it('should not show conditions section when combatant has none', () => {
		const combat = createActiveCombatSession();
		const combatant = combat.combatants[0];
		combatant.conditions = [];

		render(InitiativeTracker, {
			props: { combat }
		});

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		expect(card?.querySelector('[data-testid="conditions-list"]')).not.toBeInTheDocument();
	});
});

describe('InitiativeTracker Component - Interactions', () => {
	it('should call onCombatantClick when a combatant is clicked', async () => {
		const onCombatantClick = vi.fn();
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: {
				combat,
				onCombatantClick
			}
		});

		const firstCombatant = screen.getByText(combat.combatants[0].name);
		await fireEvent.click(firstCombatant);

		expect(onCombatantClick).toHaveBeenCalledWith(combat.combatants[0]);
	});

	it('should not be clickable when onCombatantClick is not provided', () => {
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: { combat }
		});

		const card = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]');
		expect(card).not.toHaveClass(/clickable|pointer/);
	});

	it('should show hover state when combatant is clickable', async () => {
		const onCombatantClick = vi.fn();
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: {
				combat,
				onCombatantClick
			}
		});

		const card = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/clickable|pointer|hover/);
	});
});

describe('InitiativeTracker Component - Round Display', () => {
	it('should display current round number', () => {
		const combat = createActiveCombatSession();
		combat.currentRound = 3;

		render(InitiativeTracker, {
			props: { combat }
		});

		// Check for Round header that shows the round number
		const roundDisplay = screen.getByText('3');
		expect(roundDisplay).toBeInTheDocument();
		// Verify it's in a context showing "Round"
		expect(screen.getByText(/Round/i)).toBeInTheDocument();
	});

	it('should show round 0 during preparation', () => {
		const combat = createActiveCombatSession();
		combat.status = 'preparing';
		combat.currentRound = 0;

		render(InitiativeTracker, {
			props: { combat }
		});

		expect(screen.getByText(/preparing|setup/i)).toBeInTheDocument();
	});
});

describe('InitiativeTracker Component - Accessibility', () => {
	it('should have proper ARIA labels', () => {
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: { combat }
		});

		const tracker = screen.getByRole('list');
		expect(tracker).toHaveAttribute('aria-label', expect.stringMatching(/initiative|turn order/i));
	});

	it('should mark combatant cards as list items', () => {
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: { combat }
		});

		const listItems = screen.getAllByRole('listitem');
		expect(listItems).toHaveLength(combat.combatants.length);
	});

	it('should indicate current combatant to screen readers', () => {
		const combat = createActiveCombatSession();
		combat.currentTurn = 1;

		render(InitiativeTracker, {
			props: { combat }
		});

		const currentCard = screen.getByText(combat.combatants[1].name).closest('[role="listitem"]');
		expect(currentCard).toHaveAttribute('aria-current', 'true');
	});

	it('should provide meaningful alt text for combatant type icons', () => {
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: { combat }
		});

		// Check for hero indicator or creature indicator with role="img"
		const heroIndicators = screen.queryAllByRole('img', { name: /hero/i });
		const creatureIndicators = screen.queryAllByRole('img', { name: /creature|enemy/i });

		// At least one type should be present
		expect(heroIndicators.length + creatureIndicators.length).toBeGreaterThan(0);
	});
});

describe('InitiativeTracker Component - Keyboard Navigation', () => {
	it('should allow keyboard navigation between combatants when clickable', async () => {
		const onCombatantClick = vi.fn();
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: {
				combat,
				onCombatantClick
			}
		});

		const firstCard = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]');

		// Should be focusable
		expect(firstCard).toHaveAttribute('tabindex', '0');
	});

	it('should trigger click on Enter key', async () => {
		const onCombatantClick = vi.fn();
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: {
				combat,
				onCombatantClick
			}
		});

		const firstCard = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]') as HTMLElement;
		firstCard.focus();

		await fireEvent.keyDown(firstCard, { key: 'Enter' });

		expect(onCombatantClick).toHaveBeenCalledWith(combat.combatants[0]);
	});

	it('should trigger click on Space key', async () => {
		const onCombatantClick = vi.fn();
		const combat = createActiveCombatSession();

		render(InitiativeTracker, {
			props: {
				combat,
				onCombatantClick
			}
		});

		const firstCard = screen.getByText(combat.combatants[0].name).closest('[data-testid="combatant-card"]') as HTMLElement;
		firstCard.focus();

		await fireEvent.keyDown(firstCard, { key: ' ' });

		expect(onCombatantClick).toHaveBeenCalledWith(combat.combatants[0]);
	});
});

describe('InitiativeTracker Component - Responsive Design Markers', () => {
	it('should have mobile-optimized classes on small screens', () => {
		// This would typically use viewport testing
		const combat = createActiveCombatSession();

		const { container } = render(InitiativeTracker, {
			props: { combat }
		});

		// Should have responsive classes
		expect(container.querySelector('[class*="responsive"]')).toBeTruthy();
	});

	it('should show compact view on mobile devices', () => {
		const combat = createActiveCombatSession();

		const { container } = render(InitiativeTracker, {
			props: {
				combat,
				compact: true
			}
		});

		// Check that the tracker has compact class
		const tracker = container.querySelector('.initiative-tracker');
		expect(tracker).toHaveClass('compact');
	});
});

describe('InitiativeTracker Component - Edge Cases', () => {
	it('should handle combatants with same initiative', () => {
		const combat = createActiveCombatSession();
		combat.combatants[0].initiative = 15;
		combat.combatants[1].initiative = 15;

		render(InitiativeTracker, {
			props: { combat }
		});

		// Both should be displayed
		expect(screen.getByText(combat.combatants[0].name)).toBeInTheDocument();
		expect(screen.getByText(combat.combatants[1].name)).toBeInTheDocument();
	});

	it('should handle very long combatant names', () => {
		const combat = createActiveCombatSession();
		combat.combatants[0].name = 'This Is A Very Long Combatant Name That Should Wrap Or Truncate';

		render(InitiativeTracker, {
			props: { combat }
		});

		const nameElement = screen.getByText(/This Is A Very Long/);
		expect(nameElement).toBeInTheDocument();
	});

	it('should handle combatant with negative HP (edge case)', () => {
		const combat = createActiveCombatSession();
		const originalMaxHp = combat.combatants[0].maxHp;
		combat.combatants[0].hp = -5;

		render(InitiativeTracker, {
			props: { combat }
		});

		// Should display as 0 (clamped by Math.max(0, hp))
		// Check via aria-label which shows "0 out of X hit points"
		const hpSections = screen.getAllByLabelText(new RegExp(`0 out of ${originalMaxHp} hit points`, 'i'));
		expect(hpSections.length).toBeGreaterThan(0);
	});

	it('should handle combatant with HP over max (edge case)', () => {
		const combat = createActiveCombatSession();
		combat.combatants[0].hp = 50;
		combat.combatants[0].maxHp = 40;

		render(InitiativeTracker, {
			props: { combat }
		});

		// Should still display both values via aria-label
		const hpSections = screen.getAllByLabelText(/50 out of 40 hit points/i);
		expect(hpSections.length).toBeGreaterThan(0);
	});

	it('should handle many combatants without performance issues', () => {
		const combat = createActiveCombatSession(10, 15);

		const start = performance.now();
		render(InitiativeTracker, {
			props: { combat }
		});
		const end = performance.now();

		// Render should complete in reasonable time
		expect(end - start).toBeLessThan(100); // 100ms threshold
	});
});
