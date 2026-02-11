/**
 * Tests for NetworkEdgeDetails Component
 *
 * Issue #74: Network Diagram Visualization
 * RED Phase (TDD): These tests define expected behavior before implementation.
 *
 * Tests the edge details panel that displays information about a selected edge
 * (relationship) in the network diagram.
 *
 * These tests should FAIL until the implementation is complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NetworkEdgeDetails from './NetworkEdgeDetails.svelte';
import type { SelectedEdge } from '$lib/types/network';

describe('NetworkEdgeDetails Component - Basic Rendering', () => {
	it('should render details panel when edge is provided', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Frodo',
			targetName: 'Sam',
			relationship: 'friend_of',
			bidirectional: true,
			strength: 'strong'
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).toBeInTheDocument();
	});

	it('should not render when edge is null', () => {
		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge: null
			}
		});

		const panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).not.toBeInTheDocument();
	});

	it('should not render when edge is undefined', () => {
		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge: undefined
			}
		});

		const panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).not.toBeInTheDocument();
	});

	it('should display empty state message when no edge selected', () => {
		render(NetworkEdgeDetails, {
			props: {
				edge: null
			}
		});

		expect(screen.getByText(/select.*relationship|no relationship selected/i)).toBeInTheDocument();
	});
});

describe('NetworkEdgeDetails Component - Relationship Information', () => {
	it('should display relationship type', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Aragorn',
			targetName: 'Gondor',
			relationship: 'rules',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText(/rules/i)).toBeInTheDocument();
	});

	it('should display formatted relationship type', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Character',
			targetName: 'Faction',
			relationship: 'member_of',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// Should format "member_of" as "Member Of" or similar
		expect(screen.getByText(/member.*of/i)).toBeInTheDocument();
	});

	it('should display source entity name', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Gandalf',
			targetName: 'Saruman',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should display target entity name', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Frodo',
			targetName: 'Ring',
			relationship: 'owns',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText('Ring')).toBeInTheDocument();
	});

	it('should show relationship direction for unidirectional edge', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Hero',
			targetName: 'Villain',
			relationship: 'fights',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// Should show something like "Hero → Villain" or "Hero fights Villain"
		const text = screen.getByTestId('edge-details').textContent;
		expect(text).toContain('Hero');
		expect(text).toContain('Villain');
	});

	it('should show bidirectional indicator for bidirectional edge', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Alice',
			targetName: 'Bob',
			relationship: 'allied_with',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// Should show bidirectional indicator like "↔" or "mutual" or badge
		expect(screen.getByText(/bidirectional|mutual|both/i)).toBeInTheDocument();
	});

	it('should not show bidirectional indicator for unidirectional edge', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'leads',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.queryByText(/bidirectional|mutual/i)).not.toBeInTheDocument();
	});
});

describe('NetworkEdgeDetails Component - Strength Indicator', () => {
	it('should display strong strength indicator', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'allied',
			bidirectional: true,
			strength: 'strong'
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText(/strong/i)).toBeInTheDocument();
	});

	it('should display moderate strength indicator', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true,
			strength: 'moderate'
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText(/moderate/i)).toBeInTheDocument();
	});

	it('should display weak strength indicator', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'met_once',
			bidirectional: false,
			strength: 'weak'
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText(/weak/i)).toBeInTheDocument();
	});

	it('should handle edge without strength property', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// Should still render without crashing
		expect(screen.getByTestId('edge-details')).toBeInTheDocument();
	});

	it('should display strength badge with appropriate styling', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'allied',
			bidirectional: true,
			strength: 'strong'
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const strengthBadge = container.querySelector('[data-strength="strong"]');
		expect(strengthBadge).toBeInTheDocument();
	});
});

describe('NetworkEdgeDetails Component - Navigation Links', () => {
	it('should have link to source entity', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Source',
			targetName: 'Target',
			relationship: 'related_to',
			bidirectional: false
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const sourceLink = container.querySelector('a[href*="entity-1"]');
		expect(sourceLink).toBeInTheDocument();
	});

	it('should have link to target entity', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Source',
			targetName: 'Target',
			relationship: 'related_to',
			bidirectional: false
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const targetLink = container.querySelector('a[href*="entity-2"]');
		expect(targetLink).toBeInTheDocument();
	});

	it('should call onNavigateToSource when source link clicked', async () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Source',
			targetName: 'Target',
			relationship: 'related_to',
			bidirectional: false
		};

		const onNavigateToSource = vi.fn();

		render(NetworkEdgeDetails, {
			props: {
				edge,
				onNavigateToSource
			}
		});

		const sourceButton = screen.getByRole('button', { name: /source|view source/i });
		await fireEvent.click(sourceButton);

		expect(onNavigateToSource).toHaveBeenCalledWith('entity-1');
	});

	it('should call onNavigateToTarget when target link clicked', async () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Source',
			targetName: 'Target',
			relationship: 'related_to',
			bidirectional: false
		};

		const onNavigateToTarget = vi.fn();

		render(NetworkEdgeDetails, {
			props: {
				edge,
				onNavigateToTarget
			}
		});

		const targetButton = screen.getByRole('button', { name: /target|view target/i });
		await fireEvent.click(targetButton);

		expect(onNavigateToTarget).toHaveBeenCalledWith('entity-2');
	});
});

describe('NetworkEdgeDetails Component - Close Button', () => {
	it('should display close button', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});

	it('should call onClose when close button clicked', async () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		const onClose = vi.fn();

		render(NetworkEdgeDetails, {
			props: {
				edge,
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalled();
	});

	it('should handle missing onClose callback gracefully', async () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });

		expect(async () => {
			await fireEvent.click(closeButton);
		}).not.toThrow();
	});
});

describe('NetworkEdgeDetails Component - Edge Updates', () => {
	it('should update display when edge prop changes', async () => {
		const edge1: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'First Source',
			targetName: 'First Target',
			relationship: 'knows',
			bidirectional: true
		};

		const edge2: SelectedEdge = {
			id: 2,
			source: 'entity-3',
			target: 'entity-4',
			sourceName: 'Second Source',
			targetName: 'Second Target',
			relationship: 'allied_with',
			bidirectional: true
		};

		const { rerender } = render(NetworkEdgeDetails, {
			props: {
				edge: edge1
			}
		});

		expect(screen.getByText('First Source')).toBeInTheDocument();
		expect(screen.getByText(/knows/i)).toBeInTheDocument();

		await rerender({ edge: edge2 });

		expect(screen.getByText('Second Source')).toBeInTheDocument();
		expect(screen.getByText(/allied.*with/i)).toBeInTheDocument();
		expect(screen.queryByText('First Source')).not.toBeInTheDocument();
	});

	it('should hide panel when edge changes to null', async () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		const { rerender, container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		let panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).toBeInTheDocument();

		await rerender({ edge: null });

		panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).not.toBeInTheDocument();
	});
});

describe('NetworkEdgeDetails Component - Edge Cases', () => {
	it('should handle edge with very long relationship name', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'very_long_relationship_name_that_might_need_wrapping',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// The component formats relationship names, so look for the formatted version
		expect(screen.getByText(/very.*long.*relationship/i)).toBeInTheDocument();
	});

	it('should handle edge with very long entity names', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A'.repeat(100),
			targetName: 'B'.repeat(100),
			relationship: 'knows',
			bidirectional: true
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(container.textContent).toContain('A'.repeat(100));
		expect(container.textContent).toContain('B'.repeat(100));
	});

	it('should handle edge with special characters in relationship name', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'friend-of/ally & protector',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		expect(screen.getByText(/friend-of\/ally.*protector/i)).toBeInTheDocument();
	});

	it('should handle edge with special characters in entity names', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Entity <A> & "B"',
			targetName: 'Entity "C" & <D>',
			relationship: 'knows',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const panel = screen.getByTestId('edge-details');
		expect(panel).toBeInTheDocument();
	});

	it('should handle edge with empty relationship name', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: '',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const panel = screen.getByTestId('edge-details');
		expect(panel).toBeInTheDocument();
	});

	it('should handle edge where source and target are the same (self-reference)', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-1',
			sourceName: 'Narcissus',
			targetName: 'Narcissus',
			relationship: 'reflects_on',
			bidirectional: false
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const narcissusElements = screen.getAllByText('Narcissus');
		expect(narcissusElements.length).toBeGreaterThanOrEqual(2);
	});
});

describe('NetworkEdgeDetails Component - Accessibility', () => {
	it('should have proper heading for relationship', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const heading = screen.getByRole('heading', { name: /knows|relationship/i });
		expect(heading).toBeInTheDocument();
	});

	it('should have accessible labels for buttons', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});
	});

	it('should have accessible labels for links', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'Source Entity',
			targetName: 'Target Entity',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const links = screen.getAllByRole('link');
		links.forEach((link) => {
			expect(link).toHaveAccessibleName();
		});
	});

	it('should have proper semantic structure', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const panel = container.querySelector('[data-testid="edge-details"]');
		expect(panel).toBeInTheDocument();
		expect(panel?.tagName).toMatch(/DIV|ASIDE|SECTION/i);
	});

	it('should support keyboard navigation', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'knows',
			bidirectional: true
		};

		render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const interactiveElements = [
			...screen.getAllByRole('button'),
			...screen.getAllByRole('link')
		];

		interactiveElements.forEach((element) => {
			expect(element).toBeEnabled();
		});
	});
});

describe('NetworkEdgeDetails Component - Visual Indicators', () => {
	it('should display arrow icon for unidirectional relationship', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'leads',
			bidirectional: false
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		// Should have a directional indicator (arrow, icon, etc.)
		const directionIndicator = container.querySelector('[data-direction="unidirectional"]');
		expect(directionIndicator).toBeInTheDocument();
	});

	it('should display bidirectional arrow icon for bidirectional relationship', () => {
		const edge: SelectedEdge = {
			id: 1,
			source: 'entity-1',
			target: 'entity-2',
			sourceName: 'A',
			targetName: 'B',
			relationship: 'allied_with',
			bidirectional: true
		};

		const { container } = render(NetworkEdgeDetails, {
			props: {
				edge
			}
		});

		const directionIndicator = container.querySelector('[data-direction="bidirectional"]');
		expect(directionIndicator).toBeInTheDocument();
	});
});
