/**
 * Tests for NetworkNodeDetails Component
 *
 * Issue #74: Network Diagram Visualization
 * RED Phase (TDD): These tests define expected behavior before implementation.
 *
 * Tests the node details panel that displays information about a selected node
 * in the network diagram.
 *
 * These tests should FAIL until the implementation is complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NetworkNodeDetails from './NetworkNodeDetails.svelte';
import type { SelectedNode } from '$lib/types/network';

describe('NetworkNodeDetails Component - Basic Rendering', () => {
	it('should render details panel when node is provided', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Gandalf',
			type: 'character',
			linkCount: 5
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).toBeInTheDocument();
	});

	it('should not render when node is null', () => {
		const { container } = render(NetworkNodeDetails, {
			props: {
				node: null
			}
		});

		const panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).not.toBeInTheDocument();
	});

	it('should not render when node is undefined', () => {
		const { container } = render(NetworkNodeDetails, {
			props: {
				node: undefined
			}
		});

		const panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).not.toBeInTheDocument();
	});

	it('should display empty state message when no node selected', () => {
		render(NetworkNodeDetails, {
			props: {
				node: null
			}
		});

		expect(screen.getByText(/select a node|no node selected/i)).toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Node Information Display', () => {
	it('should display node name', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Aragorn',
			type: 'character',
			linkCount: 10
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText('Aragorn')).toBeInTheDocument();
	});

	it('should display node type', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Rivendell',
			type: 'location',
			linkCount: 8
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/location/i)).toBeInTheDocument();
	});

	it('should display formatted node type (readable label)', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Rule',
			type: 'world_rule',
			linkCount: 2
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		// Should format "world_rule" as "World Rule" or similar
		expect(screen.getByText(/world.*rule/i)).toBeInTheDocument();
	});

	it('should display connection count', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Frodo',
			type: 'character',
			linkCount: 7
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/7.*connection/i)).toBeInTheDocument();
	});

	it('should display singular connection text for 1 connection', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Lonely',
			type: 'character',
			linkCount: 1
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/1.*connection/i)).toBeInTheDocument();
		// Should not say "connections" (plural)
		expect(screen.queryByText(/connections/i)?.textContent).not.toMatch(/1.*connections/i);
	});

	it('should display plural connections text for multiple connections', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Popular',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/5.*connections/i)).toBeInTheDocument();
	});

	it('should display zero connections appropriately', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Isolated',
			type: 'location',
			linkCount: 0
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/0.*connection/i)).toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Entity Type Badge', () => {
	it('should display entity type badge with correct color for character', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Hero',
			type: 'character',
			linkCount: 5
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		// Should have a badge element with character styling
		const badge = container.querySelector('[data-entity-type="character"]');
		expect(badge).toBeInTheDocument();
	});

	it('should display entity type badge with correct color for location', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Castle',
			type: 'location',
			linkCount: 3
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const badge = container.querySelector('[data-entity-type="location"]');
		expect(badge).toBeInTheDocument();
	});

	it('should display entity type badge with correct color for faction', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Guild',
			type: 'faction',
			linkCount: 10
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const badge = container.querySelector('[data-entity-type="faction"]');
		expect(badge).toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Navigate Button', () => {
	it('should display navigate to entity button', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByRole('button', { name: /view|navigate|open/i })).toBeInTheDocument();
	});

	it('should navigate button have correct link', () => {
		const node: SelectedNode = {
			id: 'entity-123',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const link = container.querySelector('a[href*="entity-123"]');
		expect(link).toBeInTheDocument();
	});

	it('should call onNavigate when navigate button clicked', async () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		const onNavigate = vi.fn();

		render(NetworkNodeDetails, {
			props: {
				node,
				onNavigate
			}
		});

		const button = screen.getByRole('button', { name: /view|navigate|open/i });
		await fireEvent.click(button);

		expect(onNavigate).toHaveBeenCalledWith('entity-1');
	});

	it('should navigate button work without onNavigate callback', async () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const button = screen.getByRole('button', { name: /view|navigate|open/i });

		expect(async () => {
			await fireEvent.click(button);
		}).not.toThrow();
	});
});

describe('NetworkNodeDetails Component - Close Button', () => {
	it('should display close button', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});

	it('should call onClose when close button clicked', async () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		const onClose = vi.fn();

		render(NetworkNodeDetails, {
			props: {
				node,
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalled();
	});

	it('should handle missing onClose callback gracefully', async () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });

		expect(async () => {
			await fireEvent.click(closeButton);
		}).not.toThrow();
	});
});

describe('NetworkNodeDetails Component - Node Updates', () => {
	it('should update display when node prop changes', async () => {
		const node1: SelectedNode = {
			id: 'entity-1',
			name: 'First',
			type: 'character',
			linkCount: 3
		};

		const node2: SelectedNode = {
			id: 'entity-2',
			name: 'Second',
			type: 'location',
			linkCount: 7
		};

		const { rerender } = render(NetworkNodeDetails, {
			props: {
				node: node1
			}
		});

		expect(screen.getByText('First')).toBeInTheDocument();

		await rerender({ node: node2 });

		expect(screen.getByText('Second')).toBeInTheDocument();
		expect(screen.queryByText('First')).not.toBeInTheDocument();
	});

	it('should hide panel when node changes to null', async () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		const { rerender, container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		let panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).toBeInTheDocument();

		await rerender({ node: null });

		panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).not.toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Entity Types Coverage', () => {
	const entityTypes = [
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'session',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile',
		'campaign'
	];

	it.each(entityTypes)('should display %s entity type correctly', (type) => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test Entity',
			type: type as any,
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText('Test Entity')).toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Edge Cases', () => {
	it('should handle node with very long name', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'A'.repeat(200),
			type: 'character',
			linkCount: 5
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(container.textContent).toContain('A'.repeat(200));
	});

	it('should handle node with special characters in name', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test & Entity <with> "special" characters',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/Test.*Entity.*with.*special.*characters/)).toBeInTheDocument();
	});

	it('should handle node with empty name', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: '',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		// Should still render, perhaps with "Unnamed" or empty string
		const panel = screen.getByTestId('node-details');
		expect(panel).toBeInTheDocument();
	});

	it('should handle node with very high link count', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Super Connected',
			type: 'character',
			linkCount: 9999
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText(/9999.*connections/i)).toBeInTheDocument();
	});

	it('should handle node with negative link count (invalid data)', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: -1
		};

		expect(() => {
			render(NetworkNodeDetails, {
				props: {
					node
				}
			});
		}).not.toThrow();
	});

	it('should handle unknown entity type gracefully', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'unknown_type' as any,
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		expect(screen.getByText('Test')).toBeInTheDocument();
	});
});

describe('NetworkNodeDetails Component - Accessibility', () => {
	it('should have proper heading for node name', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test Entity',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const heading = screen.getByRole('heading', { name: /test entity/i });
		expect(heading).toBeInTheDocument();
	});

	it('should have accessible labels for buttons', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});
	});

	it('should have proper semantic structure', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		const { container } = render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const panel = container.querySelector('[data-testid="node-details"]');
		expect(panel).toBeInTheDocument();
		expect(panel?.tagName).toMatch(/DIV|ASIDE|SECTION/i);
	});

	it('should support keyboard navigation', () => {
		const node: SelectedNode = {
			id: 'entity-1',
			name: 'Test',
			type: 'character',
			linkCount: 5
		};

		render(NetworkNodeDetails, {
			props: {
				node
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toBeEnabled();
		});
	});
});
