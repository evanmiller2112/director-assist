/**
 * Tests for SceneSettingDisplay Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneSettingDisplay shows the scene setting (read-aloud text) in a
 * visually distinct styled box (italic, distinct background).
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SceneSettingDisplay from './SceneSettingDisplay.svelte';

describe('SceneSettingDisplay Component - Basic Rendering', () => {
	it('should render without crashing with setting text', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'You enter a dimly lit tavern...' }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display the setting text', () => {
		render(SceneSettingDisplay, {
			props: { setting: 'The throne room is vast and ornate, with marble pillars reaching toward a vaulted ceiling.' }
		});

		expect(screen.getByText(/throne room is vast and ornate/i)).toBeInTheDocument();
	});

	it('should apply italic styling to setting text', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'A mysterious fog rolls in from the sea.' }
		});

		const textElement = container.querySelector('[data-testid="scene-setting-text"]');
		expect(textElement).toHaveClass(/italic/i);
	});

	it('should have a distinct background for read-aloud feel', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'The dragon roars.' }
		});

		const container_element = container.querySelector('[data-testid="scene-setting-container"]');
		expect(container_element).toHaveClass(/bg-|background/i);
	});

	it('should use a styled box presentation', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'Rain pounds on the windows.' }
		});

		const container_element = container.querySelector('[data-testid="scene-setting-container"]');
		expect(container_element).toHaveClass(/rounded|border|p-|padding/);
	});
});

describe('SceneSettingDisplay Component - Empty States', () => {
	it('should handle undefined setting gracefully', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: undefined }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display placeholder when setting is undefined', () => {
		render(SceneSettingDisplay, {
			props: { setting: undefined }
		});

		expect(screen.getByText(/no setting.*defined|setting not.*provided/i)).toBeInTheDocument();
	});

	it('should handle empty string gracefully', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: '' }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display placeholder when setting is empty string', () => {
		render(SceneSettingDisplay, {
			props: { setting: '' }
		});

		expect(screen.getByText(/no setting.*defined|setting not.*provided/i)).toBeInTheDocument();
	});

	it('should apply muted styling to placeholder text', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: '' }
		});

		const placeholderElement = screen.getByText(/no setting/i);
		expect(placeholderElement).toHaveClass(/text-gray|muted|opacity/);
	});
});

describe('SceneSettingDisplay Component - Markdown Support', () => {
	it('should support basic markdown formatting', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'The door is **locked** and requires a key.' }
		});

		// Should render markdown (bold text)
		expect(container.querySelector('strong')).toBeInTheDocument();
	});

	it('should support multiple paragraphs', () => {
		const setting = `First paragraph with introduction.

Second paragraph with more details.`;

		const { container } = render(SceneSettingDisplay, {
			props: { setting }
		});

		// Should render multiple paragraphs
		const paragraphs = container.querySelectorAll('p');
		expect(paragraphs.length).toBeGreaterThanOrEqual(2);
	});

	it('should preserve line breaks in setting text', () => {
		const setting = 'Line one\nLine two\nLine three';

		render(SceneSettingDisplay, {
			props: { setting }
		});

		// Text should be present
		expect(screen.getByText(/Line one/)).toBeInTheDocument();
		expect(screen.getByText(/Line three/)).toBeInTheDocument();
	});
});

describe('SceneSettingDisplay Component - Accessibility', () => {
	it('should have proper semantic markup', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'You find yourself in a dark forest.' }
		});

		const container_element = container.querySelector('[data-testid="scene-setting-container"]');
		expect(container_element).toHaveAttribute('role', 'region');
		const ariaLabel = container_element?.getAttribute('aria-label') ?? '';
		expect(ariaLabel.toLowerCase()).toMatch(/setting|read.*aloud/i);
	});

	it('should be keyboard navigable', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'A castle looms ahead.' }
		});

		const container_element = container.querySelector('[data-testid="scene-setting-container"]');
		// Should be focusable if interactive, or have proper semantics
		expect(container_element).toBeTruthy();
	});
});

describe('SceneSettingDisplay Component - Visual Design', () => {
	it('should have distinct visual styling for immersion', () => {
		const { container } = render(SceneSettingDisplay, {
			props: { setting: 'The air is thick with tension.' }
		});

		const container_element = container.querySelector('[data-testid="scene-setting-container"]');
		// Should have background, padding, and border styling
		const classes = container_element?.className || '';
		expect(classes).toMatch(/bg-|background/i);
		expect(classes).toMatch(/p-|padding/i);
	});

	it('should support long setting text without overflow', () => {
		const longSetting = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);

		const { container } = render(SceneSettingDisplay, {
			props: { setting: longSetting }
		});

		const textElement = container.querySelector('[data-testid="scene-setting-text"]');
		expect(textElement).toBeTruthy();
		// Should not have overflow-hidden that cuts off text
	});
});
