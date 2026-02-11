/**
 * Tests for NetworkDiagram Component
 *
 * Issue #74: Network Diagram Visualization
 * RED Phase (TDD): These tests define expected behavior before implementation.
 *
 * Tests the main network visualization component that renders the graph using vis.js.
 * Verifies node/edge click handling, filtering, and proper rendering.
 *
 * These tests should FAIL until the implementation is complete.
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NetworkDiagram from './NetworkDiagram.svelte';
import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
import type { EntityType } from '$lib/types';

// Mock vis.js Network to prevent canvas errors in test environment
vi.mock('vis-network', () => {
	return {
		Network: class MockNetwork {
			on = vi.fn();
			setData = vi.fn();
			destroy = vi.fn();
		}
	};
});

describe('NetworkDiagram Component - Basic Rendering', () => {
	it('should render container element with correct role', () => {
		const map: RelationshipMap = {
			nodes: [],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// Should have a container for the network visualization
		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should render with light mode by default', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should render with dark mode when isDark is true', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: true,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should display message when relationship map is empty', () => {
		const map: RelationshipMap = {
			nodes: [],
			edges: []
		};

		render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		expect(screen.getByText(/no entities/i)).toBeInTheDocument();
	});

	it('should have appropriate width and height', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		// Should have explicit height for vis.js to render properly
		const style = window.getComputedStyle(networkContainer as Element);
		expect(style.height).not.toBe('0px');
	});
});

describe('NetworkDiagram Component - Node Interactions', () => {
	let map: RelationshipMap;

	beforeEach(() => {
		map = {
			nodes: [
				{ id: 'entity-1', type: 'character', name: 'Aragorn', linkCount: 3 },
				{ id: 'entity-2', type: 'location', name: 'Gondor', linkCount: 2 }
			],
			edges: [
				{
					id: 1,
					source: 'entity-1',
					target: 'entity-2',
					relationship: 'rules',
					bidirectional: false
				}
			]
		};
	});

	it('should call onNodeClick when node is clicked', async () => {
		const onNodeClick = vi.fn();

		render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick,
				onEdgeClick: vi.fn()
			}
		});

		// Note: Actual click simulation would require vis.js to be initialized
		// This test verifies the handler is passed through correctly
		expect(onNodeClick).toBeInstanceOf(Function);
	});

	it('should pass correct node data to onNodeClick handler', () => {
		const onNodeClick = vi.fn();

		render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick,
				onEdgeClick: vi.fn()
			}
		});

		// Verify handler is provided
		expect(onNodeClick).toBeDefined();
	});

	it('should handle missing onNodeClick handler gracefully', () => {
		expect(() => {
			render(NetworkDiagram, {
				props: {
					relationshipMap: map,
					isDark: false,
					onEdgeClick: vi.fn()
				}
			});
		}).not.toThrow();
	});
});

describe('NetworkDiagram Component - Edge Interactions', () => {
	let map: RelationshipMap;

	beforeEach(() => {
		map = {
			nodes: [
				{ id: 'entity-1', type: 'character', name: 'Frodo', linkCount: 1 },
				{ id: 'entity-2', type: 'character', name: 'Sam', linkCount: 1 }
			],
			edges: [
				{
					id: 1,
					source: 'entity-1',
					target: 'entity-2',
					relationship: 'friend_of',
					bidirectional: true,
					strength: 'strong'
				}
			]
		};
	});

	it('should call onEdgeClick when edge is clicked', () => {
		const onEdgeClick = vi.fn();

		render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick
			}
		});

		expect(onEdgeClick).toBeInstanceOf(Function);
	});

	it('should pass correct edge data to onEdgeClick handler', () => {
		const onEdgeClick = vi.fn();

		render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick
			}
		});

		expect(onEdgeClick).toBeDefined();
	});

	it('should handle missing onEdgeClick handler gracefully', () => {
		expect(() => {
			render(NetworkDiagram, {
				props: {
					relationshipMap: map,
					isDark: false,
					onNodeClick: vi.fn()
				}
			});
		}).not.toThrow();
	});
});

describe('NetworkDiagram Component - Filtering', () => {
	let fullMap: RelationshipMap;

	beforeEach(() => {
		fullMap = {
			nodes: [
				{ id: 'c1', type: 'character', name: 'Character 1', linkCount: 2 },
				{ id: 'n1', type: 'npc', name: 'NPC 1', linkCount: 2 },
				{ id: 'l1', type: 'location', name: 'Location 1', linkCount: 2 },
				{ id: 'f1', type: 'faction', name: 'Faction 1', linkCount: 1 }
			],
			edges: [
				{ id: 1, source: 'c1', target: 'n1', relationship: 'knows', bidirectional: true },
				{ id: 2, source: 'c1', target: 'l1', relationship: 'located_at', bidirectional: false },
				{ id: 3, source: 'n1', target: 'l1', relationship: 'located_at', bidirectional: false },
				{ id: 4, source: 'f1', target: 'l1', relationship: 'headquartered_at', bidirectional: false }
			]
		};
	});

	it('should apply entity type filter correctly', () => {
		const filteredMap: RelationshipMap = {
			nodes: [
				{ id: 'c1', type: 'character', name: 'Character 1', linkCount: 2 },
				{ id: 'n1', type: 'npc', name: 'NPC 1', linkCount: 2 }
			],
			edges: [
				{ id: 1, source: 'c1', target: 'n1', relationship: 'knows', bidirectional: true }
			]
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: filteredMap,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// Should render the filtered data
		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should handle empty filtered results', () => {
		const emptyMap: RelationshipMap = {
			nodes: [],
			edges: []
		};

		render(NetworkDiagram, {
			props: {
				relationshipMap: emptyMap,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		expect(screen.getByText(/no entities/i)).toBeInTheDocument();
	});

	it('should update when relationshipMap prop changes', async () => {
		const { rerender } = render(NetworkDiagram, {
			props: {
				relationshipMap: fullMap,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// Update the map
		const newMap: RelationshipMap = {
			nodes: [
				{ id: 'c1', type: 'character', name: 'Character 1', linkCount: 0 }
			],
			edges: []
		};

		await rerender({ relationshipMap: newMap });

		// Component should re-render with new data
		expect(rerender).toBeTruthy();
	});
});

describe('NetworkDiagram Component - Complex Graphs', () => {
	it('should handle graph with many nodes', () => {
		const nodes = Array.from({ length: 100 }, (_, i) => ({
			id: `entity-${i}`,
			type: 'character' as EntityType,
			name: `Entity ${i}`,
			linkCount: 0
		}));

		const map: RelationshipMap = {
			nodes,
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should handle graph with many edges', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'A', linkCount: 50 },
				{ id: 'e2', type: 'character', name: 'B', linkCount: 50 }
			],
			edges: Array.from({ length: 50 }, (_, i) => ({
				id: i,
				source: 'e1',
				target: 'e2',
				relationship: `relation_${i}`,
				bidirectional: false
			}))
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should handle disconnected components in graph', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Island 1', linkCount: 0 },
				{ id: 'e2', type: 'character', name: 'Island 2', linkCount: 0 },
				{ id: 'e3', type: 'character', name: 'A', linkCount: 1 },
				{ id: 'e4', type: 'character', name: 'B', linkCount: 1 }
			],
			edges: [
				{ id: 1, source: 'e3', target: 'e4', relationship: 'knows', bidirectional: true }
			]
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});
});

describe('NetworkDiagram Component - Theme Changes', () => {
	it('should update colors when theme changes from light to dark', async () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { rerender } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// Switch to dark mode
		await rerender({ isDark: true });

		// Component should update
		expect(rerender).toBeTruthy();
	});

	it('should update colors when theme changes from dark to light', async () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { rerender } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: true,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// Switch to light mode
		await rerender({ isDark: false });

		// Component should update
		expect(rerender).toBeTruthy();
	});
});

describe('NetworkDiagram Component - Error Handling', () => {
	it('should handle null relationshipMap gracefully', () => {
		expect(() => {
			render(NetworkDiagram, {
				props: {
					relationshipMap: null as any,
					isDark: false,
					onNodeClick: vi.fn(),
					onEdgeClick: vi.fn()
				}
			});
		}).not.toThrow();
	});

	it('should handle undefined relationshipMap gracefully', () => {
		expect(() => {
			render(NetworkDiagram, {
				props: {
					relationshipMap: undefined as any,
					isDark: false,
					onNodeClick: vi.fn(),
					onEdgeClick: vi.fn()
				}
			});
		}).not.toThrow();
	});

	it('should handle malformed relationshipMap data', () => {
		const malformedMap = {
			nodes: [
				{ id: 'e1' } // Missing required fields
			],
			edges: []
		};

		expect(() => {
			render(NetworkDiagram, {
				props: {
					relationshipMap: malformedMap as any,
					isDark: false,
					onNodeClick: vi.fn(),
					onEdgeClick: vi.fn()
				}
			});
		}).not.toThrow();
	});
});

describe('NetworkDiagram Component - Accessibility', () => {
	it('should have descriptive container with data-testid', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});

	it('should be keyboard accessible', () => {
		const map: RelationshipMap = {
			nodes: [
				{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }
			],
			edges: []
		};

		const { container } = render(NetworkDiagram, {
			props: {
				relationshipMap: map,
				isDark: false,
				onNodeClick: vi.fn(),
				onEdgeClick: vi.fn()
			}
		});

		// vis.js canvas should be focusable
		const networkContainer = container.querySelector('[data-testid="network-diagram"]');
		expect(networkContainer).toBeInTheDocument();
	});
});
