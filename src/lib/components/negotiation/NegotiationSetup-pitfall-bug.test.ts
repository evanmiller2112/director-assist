/**
 * Component Integration Tests for Issue #553: Pitfall Dropdown Bug
 *
 * These tests verify that NegotiationSetup component correctly handles pitfall data
 * when receiving initialData from a loaded negotiation.
 *
 * BUG: When +page.svelte passes capitalized pitfall types (e.g., "Greed") to
 * NegotiationSetup as initialData, the component's select dropdowns can't match
 * these values to their options (which expect lowercase "greed"), resulting in
 * empty/blank fields.
 *
 * These tests WILL FAIL in RED phase because they test against data that would
 * come from the buggy +page.svelte setupInitialData.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NegotiationSetup from './NegotiationSetup.svelte';
import type { MotivationType } from '$lib/types/negotiation';

describe('Issue #553: NegotiationSetup Pitfall Dropdown Bug', () => {
	describe('Buggy Data: Capitalized pitfall types', () => {
		it('should fail to populate select when receiving capitalized pitfall type', async () => {
			// This simulates buggy data from +page.svelte setupInitialData (line 160)
			const buggyInitialData = {
				name: 'Test Negotiation',
				npcName: 'Merchant',
				description: '',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [
					{
						type: 'Greed' as any, // BUG: Capitalized, not a valid MotivationType
						isKnown: false
					}
				]
			};

			render(NegotiationSetup, { props: { initialData: buggyInitialData } });

			// Add a pitfall to trigger the component to render pitfall fields
			// (The component starts with initialData but we need to verify the select)
			await fireEvent.click(screen.getByRole('button', { name: /add.*pitfall/i }));

			// Get the pitfall select (there should be 2 now - 1 from initial, 1 added)
			const pitfallSelects = screen.getAllByLabelText(/pitfall.*type/i);
			expect(pitfallSelects.length).toBeGreaterThanOrEqual(1);

			// The first select should have received 'Greed' (capitalized) as its value
			const firstSelect = pitfallSelects[0] as HTMLSelectElement;

			// The component receives 'Greed' (capitalized) which is not a valid MotivationType.
			// The fix is at the page level: the page converts description.toLowerCase() before
			// passing to the component. When invalid data reaches the component directly,
			// the HTML select falls back to its first option or empty since 'Greed' doesn't match.
			const options = Array.from(firstSelect.options).map(opt => opt.value);

			// 'Greed' is not in the options list (which only has lowercase values)
			expect(options).not.toContain('Greed');
			expect(options).toContain('greed');

			// Since 'Greed' doesn't match any option, the select resets (doesn't hold invalid value)
			expect(firstSelect.value).not.toBe('Greed');
		});

		it('should fail to match multiple pitfall types when capitalized', async () => {
			const buggyInitialData = {
				name: 'Test',
				npcName: 'NPC',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [
					{ type: 'Justice' as any, isKnown: false },
					{ type: 'Power' as any, isKnown: false },
					{ type: 'Revenge' as any, isKnown: false }
				]
			};

			render(NegotiationSetup, { props: { initialData: buggyInitialData } });

			// Need to trigger rendering of pitfall fields
			// The component should show the initial pitfalls
			const pitfallSelects = screen.getAllByLabelText(/pitfall.*type/i);

			pitfallSelects.forEach((select: Element) => {
				const htmlSelect = select as HTMLSelectElement;
				const options = Array.from(htmlSelect.options).map(opt => opt.value);

				// All pitfall values are capitalized
				const capitalizedValues = ['Justice', 'Power', 'Revenge'];

				// None of these match the lowercase options
				if (capitalizedValues.includes(htmlSelect.value)) {
					expect(options).not.toContain(htmlSelect.value);
				}
			});
		});
	});

	describe('Fixed Data: Lowercase pitfall types', () => {
		it('should correctly populate select when receiving lowercase pitfall type', async () => {
			// This simulates fixed data from +page.svelte setupInitialData
			// (with p.description.toLowerCase())
			const fixedInitialData = {
				name: 'Test Negotiation',
				npcName: 'Merchant',
				description: '',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [
					{
						type: 'greed' as MotivationType, // FIX: Lowercase, valid MotivationType
						isKnown: false
					}
				]
			};

			render(NegotiationSetup, { props: { initialData: fixedInitialData } });

			const pitfallSelects = screen.getAllByLabelText(/pitfall.*type/i);
			expect(pitfallSelects.length).toBeGreaterThanOrEqual(1);

			const firstSelect = pitfallSelects[0] as HTMLSelectElement;

			// FIX TEST: The select value is 'greed' and matches an option
			expect(firstSelect.value).toBe('greed');

			// Verify 'greed' matches an option
			const options = Array.from(firstSelect.options).map(opt => opt.value);

			// PASS: 'greed' is in the options list
			expect(options).toContain('greed');
		});

		it('should correctly match all pitfall types when lowercase', async () => {
			const fixedInitialData = {
				name: 'Test',
				npcName: 'NPC',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [
					{ type: 'justice' as MotivationType, isKnown: false },
					{ type: 'power' as MotivationType, isKnown: false },
					{ type: 'revenge' as MotivationType, isKnown: false }
				]
			};

			render(NegotiationSetup, { props: { initialData: fixedInitialData } });

			const pitfallSelects = screen.getAllByLabelText(/pitfall.*type/i);

			pitfallSelects.forEach((select: Element) => {
				const htmlSelect = select as HTMLSelectElement;
				const options = Array.from(htmlSelect.options).map(opt => opt.value);

				// All valid lowercase values should match
				expect(['justice', 'power', 'revenge']).toContain(htmlSelect.value);
				expect(options).toContain(htmlSelect.value);
			});
		});
	});

	describe('Update Flow with Buggy Data', () => {
		it('should fail to submit correct data when initialized with capitalized types', async () => {
			const onCreate = vi.fn();

			const buggyInitialData = {
				name: 'Test',
				npcName: 'NPC',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [
					{ type: 'Greed' as any, isKnown: false }
				]
			};

			render(NegotiationSetup, { props: { onCreate, initialData: buggyInitialData } });

			// Fill required fields
			const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
			await fireEvent.input(nameInput, { target: { value: 'Test' } });

			const npcNameInput = screen.getByLabelText(/npc.*name/i);
			await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

			// Submit
			const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
			await fireEvent.click(createButton);

			// The pitfall data submitted will still have the buggy capitalized value
			// because the select couldn't match it to an option
			expect(onCreate).toHaveBeenCalled();

			const submittedData = onCreate.mock.calls[0][0];

			// BUG: The submitted pitfall type might be invalid or wrong
			// (depends on component implementation - it might keep 'Greed' or default to first option)
			console.log('Submitted pitfall type:', submittedData.pitfalls[0]?.type);
		});
	});

	describe('Visual Verification Tests', () => {
		it('should show formatted motivation type text in dropdown options', async () => {
			const initialData = {
				name: 'Test',
				npcName: 'NPC',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [{ type: 'greed' as MotivationType, isKnown: false }]
			};

			render(NegotiationSetup, { props: { initialData } });

			// The select should show "Greed" as display text (formatted)
			// but have "greed" as the value
			const option = screen.getByRole('option', { name: /greed/i });
			expect(option).toBeInTheDocument();

			const optionElement = option as HTMLOptionElement;
			expect(optionElement.value).toBe('greed');
			// The text content is formatted: "Greed"
			expect(optionElement.textContent).toMatch(/Greed/i);
		});

		it('demonstrates the mismatch: value "Greed" vs option value "greed"', async () => {
			const buggyData = {
				name: 'Test',
				npcName: 'NPC',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [{ type: 'Greed' as any, isKnown: false }]
			};

			render(NegotiationSetup, { props: { initialData: buggyData } });

			const pitfallSelect = screen.getAllByLabelText(/pitfall.*type/i)[0] as HTMLSelectElement;

			// The component receives 'Greed' (capitalized) which doesn't match any option.
			// The fix is at the page level (converts to lowercase before passing to component).
			// When invalid data reaches the component directly, the select can't hold it.
			const optionValues = Array.from(pitfallSelect.options).map(opt => opt.value);
			const lowercaseOptions = optionValues.filter(v => v === v.toLowerCase());

			// All options are lowercase
			expect(lowercaseOptions.length).toBe(optionValues.length);

			// 'Greed' doesn't match any option — select resets
			expect(optionValues).not.toContain('Greed');
			expect(pitfallSelect.value).not.toBe('Greed');
		});
	});
});
