/**
 * Tests for HpTracker Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker
 *
 * HpTracker provides controls for applying damage, healing, and setting temp HP
 * for a combatant with proper validation and visual feedback.
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import HpTracker from './HpTracker.svelte';
import { createMockHeroCombatant, createMockCreatureCombatant } from '../../../tests/utils/combatTestUtils';
import type { Combatant } from '$lib/types/combat';

describe('HpTracker Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const combatant = createMockHeroCombatant();

		const { container } = render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display current HP', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/25/)).toBeInTheDocument();
	});

	it('should display max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/40/)).toBeInTheDocument();
	});

	it('should display temp HP when present', () => {
		const combatant = createMockHeroCombatant({ tempHp: 8 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/temp.*8/i)).toBeInTheDocument();
	});
});

describe('HpTracker Component - Damage Controls', () => {
	it('should display damage input field', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByLabelText(/^damage$/i)).toBeInTheDocument();
	});

	it('should display Apply Damage button', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /apply.*damage/i })).toBeInTheDocument();
	});

	it('should allow entering damage value', async () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i) as HTMLInputElement;
		await fireEvent.input(damageInput, { target: { value: '10' } });

		expect(damageInput.value).toBe('10');
	});

	it('should call onApplyDamage when Apply Damage is clicked', async () => {
		const onApplyDamage = vi.fn();
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage,
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i);
		await fireEvent.input(damageInput, { target: { value: '15' } });

		const applyButton = screen.getByRole('button', { name: /apply.*damage/i });
		await fireEvent.click(applyButton);

		expect(onApplyDamage).toHaveBeenCalledWith(15);
	});

	it('should disable damage button when input is empty', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const applyButton = screen.getByRole('button', { name: /apply.*damage/i });
		expect(applyButton).toBeDisabled();
	});

	it('should disable damage button when value is 0', async () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i);
		await fireEvent.input(damageInput, { target: { value: '0' } });

		const applyButton = screen.getByRole('button', { name: /apply.*damage/i });
		expect(applyButton).toBeDisabled();
	});

	it('should reject negative damage values', async () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i) as HTMLInputElement;
		await fireEvent.input(damageInput, { target: { value: '-5' } });

		expect(damageInput).toHaveAttribute('min', '0');
		expect(damageInput.validity.valid).toBe(false);
	});

	it('should clear damage input after applying', async () => {
		const onApplyDamage = vi.fn().mockResolvedValue(undefined);
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage,
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i) as HTMLInputElement;
		await fireEvent.input(damageInput, { target: { value: '10' } });

		const applyButton = screen.getByRole('button', { name: /apply.*damage/i });
		await fireEvent.click(applyButton);

		await waitFor(() => {
			expect(damageInput.value).toBe('');
		});
	});
});

describe('HpTracker Component - Healing Controls', () => {
	it('should display healing input field', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByLabelText(/^healing$/i)).toBeInTheDocument();
	});

	it('should display Apply Healing button', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /apply.*heal/i })).toBeInTheDocument();
	});

	it('should allow entering healing value', async () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i) as HTMLInputElement;
		await fireEvent.input(healInput, { target: { value: '12' } });

		expect(healInput.value).toBe('12');
	});

	it('should call onApplyHealing when Apply Healing is clicked', async () => {
		const onApplyHealing = vi.fn();
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing,
				onSetTempHp: vi.fn()
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i);
		await fireEvent.input(healInput, { target: { value: '20' } });

		const applyButton = screen.getByRole('button', { name: /apply.*heal/i });
		await fireEvent.click(applyButton);

		expect(onApplyHealing).toHaveBeenCalledWith(20);
	});

	it('should disable healing button when input is empty', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const applyButton = screen.getByRole('button', { name: /apply.*heal/i });
		expect(applyButton).toBeDisabled();
	});

	it('should disable healing when combatant is at max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 40, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// When at max HP, the input doesn't render, just a message
		const healInput = screen.queryByLabelText(/^healing$/i);
		expect(healInput).not.toBeInTheDocument();
		// Instead, there should be a message saying at max HP
		expect(screen.getByText(/max.*hp/i)).toBeInTheDocument();
	});

	it('should show message when at max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 40, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/max.*hp/i)).toBeInTheDocument();
	});

	it('should clear healing input after applying', async () => {
		const onApplyHealing = vi.fn().mockResolvedValue(undefined);
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing,
				onSetTempHp: vi.fn()
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i) as HTMLInputElement;
		await fireEvent.input(healInput, { target: { value: '10' } });

		const applyButton = screen.getByRole('button', { name: /apply.*heal/i });
		await fireEvent.click(applyButton);

		await waitFor(() => {
			expect(healInput.value).toBe('');
		});
	});
});

describe('HpTracker Component - Temp HP Controls', () => {
	it('should display temp HP input field', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByLabelText(/^temp hp$/i)).toBeInTheDocument();
	});

	it('should display Set Temp HP button', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /set.*temp/i })).toBeInTheDocument();
	});

	it('should show current temp HP in input as placeholder', () => {
		const combatant = createMockHeroCombatant({ tempHp: 8 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const tempHpInput = screen.getByLabelText(/^temp hp$/i) as HTMLInputElement;
		expect(tempHpInput.placeholder).toContain('8');
	});

	it('should call onSetTempHp when Set button is clicked', async () => {
		const onSetTempHp = vi.fn();
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp
			}
		});

		const tempHpInput = screen.getByLabelText(/^temp hp$/i);
		await fireEvent.input(tempHpInput, { target: { value: '10' } });

		const setButton = screen.getByRole('button', { name: /set.*temp/i });
		await fireEvent.click(setButton);

		expect(onSetTempHp).toHaveBeenCalledWith(10);
	});

	it('should allow setting temp HP to 0 to remove it', async () => {
		const onSetTempHp = vi.fn();
		const combatant = createMockHeroCombatant({ tempHp: 8 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp
			}
		});

		const tempHpInput = screen.getByLabelText(/^temp hp$/i);
		await fireEvent.input(tempHpInput, { target: { value: '0' } });

		const setButton = screen.getByRole('button', { name: /set.*temp/i });
		await fireEvent.click(setButton);

		expect(onSetTempHp).toHaveBeenCalledWith(0);
	});

	it('should disable set button when input is empty', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const setButton = screen.getByRole('button', { name: /set.*temp/i });
		expect(setButton).toBeDisabled();
	});

	it('should clear temp HP input after setting', async () => {
		const onSetTempHp = vi.fn().mockResolvedValue(undefined);
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp
			}
		});

		const tempHpInput = screen.getByLabelText(/^temp hp$/i) as HTMLInputElement;
		await fireEvent.input(tempHpInput, { target: { value: '10' } });

		const setButton = screen.getByRole('button', { name: /set.*temp/i });
		await fireEvent.click(setButton);

		await waitFor(() => {
			expect(tempHpInput.value).toBe('');
		});
	});
});

describe('HpTracker Component - Quick Action Buttons', () => {
	it('should display quick damage buttons', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn(),
				showQuickActions: true
			}
		});

		expect(screen.getByRole('button', { name: /-5/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /-10/i })).toBeInTheDocument();
	});

	it('should display quick healing buttons', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn(),
				showQuickActions: true
			}
		});

		expect(screen.getByRole('button', { name: /\+5/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /\+10/i })).toBeInTheDocument();
	});

	it('should call onApplyDamage with preset value when quick button clicked', async () => {
		const onApplyDamage = vi.fn();
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage,
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn(),
				showQuickActions: true
			}
		});

		const quickButton = screen.getByRole('button', { name: /-5/i });
		await fireEvent.click(quickButton);

		expect(onApplyDamage).toHaveBeenCalledWith(5);
	});

	it('should call onApplyHealing with preset value when quick button clicked', async () => {
		const onApplyHealing = vi.fn();
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing,
				onSetTempHp: vi.fn(),
				showQuickActions: true
			}
		});

		const quickButton = screen.getByRole('button', { name: /\+10/i });
		await fireEvent.click(quickButton);

		expect(onApplyHealing).toHaveBeenCalledWith(10);
	});
});

describe('HpTracker Component - Visual Feedback', () => {
	it('should show HP bar with percentage', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toHaveStyle({ width: '50%' });
	});

	it('should color HP bar based on health level', () => {
		const combatant = createMockHeroCombatant({ hp: 10, maxHp: 40 }); // 25% health

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toHaveClass(/critical|danger|red/i);
	});

	it('should show bloodied indicator when HP <= 50%', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/bloodied/i)).toBeInTheDocument();
	});

	it('should show defeated indicator when HP = 0', () => {
		const combatant = createMockHeroCombatant({ hp: 0, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/defeated|unconscious/i)).toBeInTheDocument();
	});
});

describe('HpTracker Component - Accessibility', () => {
	it('should have proper labels for all inputs', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByLabelText(/^damage$/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/^healing$/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/^temp hp$/i)).toHaveAccessibleName();
	});

	it('should announce HP changes to screen readers', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const hpDisplay = screen.getByTestId('hp-display');
		expect(hpDisplay).toHaveAttribute('aria-live', 'polite');
	});

	it('should provide clear button descriptions', () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageButton = screen.getByRole('button', { name: /apply.*damage/i });
		expect(damageButton).toHaveAccessibleDescription();
	});
});

describe('HpTracker Component - Edge Cases', () => {
	it('should handle max value validation', async () => {
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i) as HTMLInputElement;
		await fireEvent.input(damageInput, { target: { value: '9999' } });

		// Should accept but warn or cap at max
		expect(damageInput.value).toBe('9999');
	});

	it('should handle decimal values', async () => {
		const combatant = createMockHeroCombatant();

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const damageInput = screen.getByLabelText(/^damage$/i) as HTMLInputElement;
		await fireEvent.input(damageInput, { target: { value: '5.5' } });

		// Should only accept integers
		expect(damageInput).toHaveAttribute('step', '1');
	});

	it('should handle combatant with 0 max HP', () => {
		const combatant = createMockHeroCombatant({ hp: 0, maxHp: 0 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Should render without error
		expect(screen.getByTestId('hp-display')).toBeInTheDocument();
	});

	it('should prevent healing above max HP preview', async () => {
		const combatant = createMockHeroCombatant({ hp: 35, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn(),
				showPreview: true
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i);
		await fireEvent.input(healInput, { target: { value: '20' } });

		// Should show that it will cap at 40
		expect(screen.getByText(/will be 40/i)).toBeInTheDocument();
	});
});

describe('HpTracker Component - Optional Max HP (Issue #233)', () => {
	it('should display only current HP when maxHp is undefined', () => {
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Should show "30" not "30/40" format
		expect(screen.getByText(/^30$/)).toBeInTheDocument();
		expect(screen.queryByText(/\//)).not.toBeInTheDocument();
	});

	it('should display HP with slash format when maxHp is defined', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Should show "25/40" format
		expect(screen.getByText(/25.*\/.*40/)).toBeInTheDocument();
	});

	it('should not show "At max HP" message when maxHp is undefined', () => {
		const combatant = createMockHeroCombatant({ hp: 50, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Should allow healing even at high HP
		const healInput = screen.getByLabelText(/^healing$/i);
		expect(healInput).toBeInTheDocument();
		expect(screen.queryByText(/max.*hp/i)).not.toBeInTheDocument();
	});

	it('should show healing controls when maxHp is undefined', () => {
		const combatant = createMockHeroCombatant({ hp: 100, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Healing should always be available when no max
		expect(screen.getByLabelText(/^healing$/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /apply.*heal/i })).toBeInTheDocument();
	});

	it('should not show bloodied indicator when maxHp is undefined', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Cannot calculate bloodied without maxHp
		expect(screen.queryByText(/bloodied/i)).not.toBeInTheDocument();
	});

	it('should not show HP percentage bar when maxHp is undefined', () => {
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// HP bar requires maxHp to calculate percentage
		const hpBar = screen.queryByTestId('hp-bar');
		expect(hpBar).not.toBeInTheDocument();
	});

	it('should show HP bar when maxHp is defined', () => {
		const combatant = createMockHeroCombatant({ hp: 25, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		const hpBar = screen.getByTestId('hp-bar');
		expect(hpBar).toBeInTheDocument();
	});

	it('should show bloodied indicator when maxHp is defined and HP <= 50%', () => {
		const combatant = createMockHeroCombatant({ hp: 20, maxHp: 40 });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		expect(screen.getByText(/bloodied/i)).toBeInTheDocument();
	});

	it('should allow healing input with any value when maxHp is undefined', async () => {
		const onApplyHealing = vi.fn();
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing,
				onSetTempHp: vi.fn()
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i);
		await fireEvent.input(healInput, { target: { value: '100' } });

		const applyButton = screen.getByRole('button', { name: /apply.*heal/i });
		await fireEvent.click(applyButton);

		// Should accept and call with large healing amount
		expect(onApplyHealing).toHaveBeenCalledWith(100);
	});

	it('should not show "will cap" preview when maxHp is undefined', async () => {
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: undefined });

		render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn(),
				showPreview: true
			}
		});

		const healInput = screen.getByLabelText(/^healing$/i);
		await fireEvent.input(healInput, { target: { value: '50' } });

		// Should NOT show cap message since there's no max
		expect(screen.queryByText(/will be/i)).not.toBeInTheDocument();
	});

	it('should handle transition from undefined to defined maxHp', () => {
		const combatant = createMockHeroCombatant({ hp: 30, maxHp: undefined });

		const { rerender } = render(HpTracker, {
			props: {
				combatant,
				onApplyDamage: vi.fn(),
				onApplyHealing: vi.fn(),
				onSetTempHp: vi.fn()
			}
		});

		// Initially no max HP display
		expect(screen.queryByText(/\//)).not.toBeInTheDocument();

		// Update combatant with maxHp
		const updatedCombatant = createMockHeroCombatant({ hp: 30, maxHp: 40 });
		rerender({
			combatant: updatedCombatant,
			onApplyDamage: vi.fn(),
			onApplyHealing: vi.fn(),
			onSetTempHp: vi.fn()
		});

		// Now should show max HP
		expect(screen.getByText(/30.*\/.*40/)).toBeInTheDocument();
	});
});
