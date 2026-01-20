/**
 * Tests for CombatantCard Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker
 *
 * CombatantCard displays individual combatant information including HP, AC,
 * conditions, and type-specific data (hero resource or threat level).
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CombatantCard from './CombatantCard.svelte';
import {
	createMockHeroCombatant,
	createMockCreatureCombatant,
	createMockCondition
} from '../../../tests/utils/combatTestUtils';
import type { Combatant, HeroCombatant, CreatureCombatant } from '$lib/types/combat';

describe('CombatantCard Component - Basic Rendering', () => {
	it('should render without crashing with hero combatant', () => {
		const hero = createMockHeroCombatant();

		const { container } = render(CombatantCard, {
			props: { combatant: hero }
		});

		expect(container).toBeInTheDocument();
	});

	it('should render without crashing with creature combatant', () => {
		const creature = createMockCreatureCombatant();

		const { container } = render(CombatantCard, {
			props: { combatant: creature }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display combatant name', () => {
		const combatant = createMockHeroCombatant({ name: 'Aragorn' });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText('Aragorn')).toBeInTheDocument();
	});

	it('should display initiative value', () => {
		const combatant = createMockHeroCombatant({ initiative: 18 });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText('18')).toBeInTheDocument();
	});
});

describe('CombatantCard Component - HP Display', () => {
	it('should display current and max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText(/25.*\/.*40/)).toBeInTheDocument();
	});

	it('should display HP bar visual indicator', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toBeInTheDocument();

		// Bar should show 62.5% width (25/40)
		expect(hpBar).toHaveStyle({ width: '62.5%' });
	});

	it('should show temp HP if present', () => {
		const combatant = createMockHeroCombatant({
			hp: 30,
			maxHp: 40,
			tempHp: 8
		});

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText(/temp.*8/i)).toBeInTheDocument();
	});

	it('should not display temp HP section when tempHp is 0', () => {
		const combatant = createMockHeroCombatant({ tempHp: 0 });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.queryByText(/temp/i)).not.toBeInTheDocument();
	});

	it('should apply bloodied styling when HP <= 50%', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		const { container } = render(CombatantCard, {
			props: { combatant }
		});

		const card = container.querySelector('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/bloodied/i);
	});

	it('should apply defeated styling when HP = 0', () => {
		const combatant = createMockHeroCombatant({ hp: 0, maxHp: 40 });

		const { container } = render(CombatantCard, {
			props: { combatant }
		});

		const card = container.querySelector('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/defeated|unconscious/i);
	});

	it('should show healthy styling when HP > 50%', () => {
		const combatant = createMockHeroCombatant({ hp: 35, maxHp: 40 });

		const { container } = render(CombatantCard, {
			props: { combatant }
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toHaveClass(/healthy|green/i);
	});

	it('should use yellow/warning color for HP bar when bloodied', () => {
		const combatant = createMockHeroCombatant({ hp: 15, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toHaveClass(/bloodied|warning|yellow/i);
	});

	it('should use red color for HP bar when critically low', () => {
		const combatant = createMockHeroCombatant({ hp: 5, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toHaveClass(/critical|danger|red/i);
	});
});

describe('CombatantCard Component - AC Display', () => {
	it('should display AC when provided', () => {
		const combatant = createMockHeroCombatant({ ac: 18 });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText(/AC.*18/i)).toBeInTheDocument();
	});

	it('should not display AC section when AC is undefined', () => {
		const combatant = createMockHeroCombatant({ ac: undefined });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.queryByText(/AC/i)).not.toBeInTheDocument();
	});
});

describe('CombatantCard Component - Hero-Specific Display', () => {
	it('should display hero indicator/badge', () => {
		const hero = createMockHeroCombatant();

		render(CombatantCard, {
			props: { combatant: hero }
		});

		expect(screen.getByTestId('hero-indicator')).toBeInTheDocument();
	});

	it('should display heroic resource name and values', () => {
		const hero = createMockHeroCombatant({
			heroicResource: {
				name: 'Victories',
				current: 2,
				max: 3
			}
		});

		render(CombatantCard, {
			props: { combatant: hero }
		});

		expect(screen.getByText('Victories')).toBeInTheDocument();
		expect(screen.getByText(/2.*\/.*3/)).toBeInTheDocument();
	});

	it('should show different heroic resources correctly', () => {
		const hero = createMockHeroCombatant({
			heroicResource: {
				name: 'Focus',
				current: 5,
				max: 10
			}
		});

		render(CombatantCard, {
			props: { combatant: hero }
		});

		expect(screen.getByText('Focus')).toBeInTheDocument();
		expect(screen.getByText(/5.*\/.*10/)).toBeInTheDocument();
	});
});

describe('CombatantCard Component - Creature-Specific Display', () => {
	it('should display threat level badge', () => {
		const creature = createMockCreatureCombatant({ threat: 2 });

		render(CombatantCard, {
			props: { combatant: creature }
		});

		expect(screen.getByTestId('threat-badge')).toBeInTheDocument();
		expect(screen.getByText(/threat.*2/i)).toBeInTheDocument();
	});

	it('should display threat level 1 (minion/standard)', () => {
		const creature = createMockCreatureCombatant({ threat: 1 });

		render(CombatantCard, {
			props: { combatant: creature }
		});

		const badge = screen.getByTestId('threat-badge');
		expect(badge).toHaveTextContent(/1|minion|standard/i);
	});

	it('should display threat level 2 (elite)', () => {
		const creature = createMockCreatureCombatant({ threat: 2 });

		render(CombatantCard, {
			props: { combatant: creature }
		});

		const badge = screen.getByTestId('threat-badge');
		expect(badge).toHaveTextContent(/2|elite/i);
	});

	it('should display threat level 3 (boss)', () => {
		const creature = createMockCreatureCombatant({ threat: 3 });

		render(CombatantCard, {
			props: { combatant: creature }
		});

		const badge = screen.getByTestId('threat-badge');
		expect(badge).toHaveTextContent(/3|boss|solo/i);
	});

	it('should apply different styling based on threat level', () => {
		const minion = createMockCreatureCombatant({ threat: 1 });
		const boss = createMockCreatureCombatant({ threat: 3 });

		const { container: minionContainer } = render(CombatantCard, {
			props: { combatant: minion }
		});

		const { container: bossContainer } = render(CombatantCard, {
			props: { combatant: boss }
		});

		const minionBadge = minionContainer.querySelector('[data-testid="threat-badge"]');
		const bossBadge = bossContainer.querySelector('[data-testid="threat-badge"]');

		expect(minionBadge?.className).not.toEqual(bossBadge?.className);
	});
});

describe('CombatantCard Component - Conditions Display', () => {
	it('should display all conditions', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Stunned', duration: 1 }),
				createMockCondition({ name: 'Bleeding', duration: 2 }),
				createMockCondition({ name: 'Slowed', duration: 3 })
			]
		});

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText('Stunned')).toBeInTheDocument();
		expect(screen.getByText('Bleeding')).toBeInTheDocument();
		expect(screen.getByText('Slowed')).toBeInTheDocument();
	});

	it('should show condition duration values', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Poisoned', duration: 5 })
			]
		});

		render(CombatantCard, {
			props: { combatant }
		});

		// Check for the condition badge with duration in aria-label
		const conditionBadge = screen.getByRole('status', { name: /Poisoned.*5.*rounds?/i });
		expect(conditionBadge).toBeInTheDocument();
	});

	it('should show "Until end of combat" for duration 0', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Blessed', duration: 0 })
			]
		});

		render(CombatantCard, {
			props: { combatant }
		});

		// Check for the condition badge with "Until end of combat" in aria-label
		const conditionBadge = screen.getByRole('status', { name: /Blessed.*until end.*combat/i });
		expect(conditionBadge).toBeInTheDocument();
	});

	it('should show "Permanent" for duration -1', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Cursed', duration: -1 })
			]
		});

		render(CombatantCard, {
			props: { combatant }
		});

		// Check for the condition badge with "Permanent" in aria-label
		const conditionBadge = screen.getByRole('status', { name: /Cursed.*permanent/i });
		expect(conditionBadge).toBeInTheDocument();
	});

	it('should not show conditions section when no conditions', () => {
		const combatant = createMockHeroCombatant({ conditions: [] });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.queryByTestId('conditions-list')).not.toBeInTheDocument();
	});

	it('should show condition tooltip with description on hover', async () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({
					name: 'Stunned',
					description: 'Cannot take actions',
					duration: 1
				})
			]
		});

		render(CombatantCard, {
			props: { combatant }
		});

		const conditionBadge = screen.getByRole('status', { name: /Stunned/i });
		await fireEvent.mouseEnter(conditionBadge);

		// The tooltip should appear with role="tooltip"
		const tooltip = screen.getByRole('tooltip');
		expect(tooltip).toHaveTextContent(/Cannot take actions/);
	});
});

describe('CombatantCard Component - Current Turn State', () => {
	it('should highlight when isCurrent is true', () => {
		const combatant = createMockHeroCombatant();

		const { container } = render(CombatantCard, {
			props: {
				combatant,
				isCurrent: true
			}
		});

		const card = container.querySelector('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/current|active/i);
	});

	it('should not highlight when isCurrent is false', () => {
		const combatant = createMockHeroCombatant();

		const { container } = render(CombatantCard, {
			props: {
				combatant,
				isCurrent: false
			}
		});

		const card = container.querySelector('[data-testid="combatant-card"]');
		expect(card).not.toHaveClass(/current|active/i);
	});

	it('should show current turn indicator when isCurrent', () => {
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				isCurrent: true
			}
		});

		expect(screen.getByTestId('current-turn-indicator')).toBeInTheDocument();
	});
});

describe('CombatantCard Component - Interactions', () => {
	it('should call onClick when card is clicked', async () => {
		const onClick = vi.fn();
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				onClick
			}
		});

		const card = screen.getByTestId('combatant-card');
		await fireEvent.click(card);

		expect(onClick).toHaveBeenCalledWith(combatant);
	});

	it('should be clickable when onClick is provided', () => {
		const onClick = vi.fn();
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				onClick
			}
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).toHaveClass(/clickable|pointer/i);
	});

	it('should not be clickable when onClick is not provided', () => {
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: { combatant }
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).not.toHaveClass(/clickable|pointer/i);
	});

	it('should handle keyboard Enter to trigger click', async () => {
		const onClick = vi.fn();
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				onClick
			}
		});

		const card = screen.getByTestId('combatant-card') as HTMLElement;
		card.focus();
		await fireEvent.keyDown(card, { key: 'Enter' });

		expect(onClick).toHaveBeenCalledWith(combatant);
	});
});

describe('CombatantCard Component - Compact Mode', () => {
	it('should render in compact mode', () => {
		const combatant = createMockHeroCombatant();

		const { container } = render(CombatantCard, {
			props: {
				combatant,
				compact: true
			}
		});

		const card = container.querySelector('[data-testid="combatant-card"]');
		expect(card).toHaveClass(/compact/i);
	});

	it('should hide some details in compact mode', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(CombatantCard, {
			props: {
				combatant,
				compact: true
			}
		});

		// In compact mode, might only show count of conditions
		const conditionsSection = screen.queryByTestId('conditions-list');
		expect(conditionsSection).toHaveClass(/compact/i);
	});
});

describe('CombatantCard Component - Accessibility', () => {
	it('should have proper ARIA role', () => {
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: { combatant }
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).toHaveAttribute('role', 'article');
	});

	it('should have aria-label with combatant name', () => {
		const combatant = createMockHeroCombatant({ name: 'Gandalf' });

		render(CombatantCard, {
			props: { combatant }
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).toHaveAttribute('aria-label', expect.stringContaining('Gandalf'));
	});

	it('should indicate current state to screen readers', () => {
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				isCurrent: true
			}
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).toHaveAttribute('aria-current', 'true');
	});

	it('should be keyboard focusable when clickable', () => {
		const onClick = vi.fn();
		const combatant = createMockHeroCombatant();

		render(CombatantCard, {
			props: {
				combatant,
				onClick
			}
		});

		const card = screen.getByTestId('combatant-card');
		expect(card).toHaveAttribute('tabindex', '0');
	});

	it('should announce HP status to screen readers', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		const hpSection = screen.getByTestId('hp-section');
		expect(hpSection).toHaveAttribute('aria-label', expect.stringMatching(/25.*40.*hit points/i));
	});
});

describe('CombatantCard Component - Edge Cases', () => {
	it('should handle very long combatant names', () => {
		const combatant = createMockHeroCombatant({
			name: 'This Is A Very Long Combatant Name That Should Be Truncated Or Wrapped Appropriately'
		});

		render(CombatantCard, {
			props: { combatant }
		});

		const nameElement = screen.getByText(/This Is A Very Long/);
		expect(nameElement).toHaveClass(/truncate|ellipsis/i);
	});

	it('should handle 0 max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 0, maxHp: 0 });

		render(CombatantCard, {
			props: { combatant }
		});

		expect(screen.getByText(/0.*0/)).toBeInTheDocument();
	});

	it('should handle negative HP', () => {
		const combatant = createMockHeroCombatant({ hp: -10, maxHp: 40 });

		render(CombatantCard, {
			props: { combatant }
		});

		// Should display as 0 or handle gracefully
		expect(screen.getByText(/0.*40/)).toBeInTheDocument();
	});

	it('should handle many conditions', () => {
		const conditions = Array.from({ length: 10 }, (_, i) =>
			createMockCondition({ name: `Condition ${i + 1}`, duration: i + 1 })
		);
		const combatant = createMockHeroCombatant({ conditions });

		render(CombatantCard, {
			props: { combatant }
		});

		// Should render all or show overflow indicator
		const conditionsList = screen.getByTestId('conditions-list');
		expect(conditionsList).toBeInTheDocument();
	});

	it('should handle invalid threat level gracefully', () => {
		const creature = createMockCreatureCombatant({ threat: 99 as any });

		render(CombatantCard, {
			props: { combatant: creature }
		});

		// Should still render without crashing
		expect(screen.getByTestId('threat-badge')).toBeInTheDocument();
	});
});
