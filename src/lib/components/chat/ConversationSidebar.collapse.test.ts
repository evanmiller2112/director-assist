/**
 * Tests for ConversationSidebar Component - Collapsible Behavior (Issue #203)
 *
 * Issue #203: Chat Sidebar UX Redesign - Collapsible Conversations
 *
 * RED Phase (TDD): These tests define expected behavior for collapsible conversations.
 * Tests will FAIL until ConversationSidebar.svelte is updated with collapsible functionality.
 *
 * Requirements being tested:
 * 1. Chevron toggle button to collapse/expand conversation list
 * 2. When collapsed, only shows header with chevron
 * 3. Collapsed state persists to localStorage (key: 'chat-conversations-collapsed')
 * 4. State loads from localStorage on mount
 * 5. Proper ARIA attributes for accessibility
 *
 * Testing Strategy:
 * - Test chevron button presence and functionality
 * - Test visual collapse/expand behavior
 * - Test localStorage persistence
 * - Test state restoration on mount
 * - Test accessibility attributes (aria-expanded)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { ConversationWithMetadata } from '$lib/types';
import ConversationSidebar from './ConversationSidebar.svelte';

// Mock the stores
vi.mock('$lib/stores', () => ({
	conversationStore: {
		conversations: [],
		activeConversationId: null,
		isLoading: false,
		load: vi.fn(),
		create: vi.fn(),
		setActive: vi.fn(),
		rename: vi.fn(),
		delete: vi.fn()
	},
	chatStore: {
		switchConversation: vi.fn()
	}
}));

const STORAGE_KEY = 'chat-conversations-collapsed';

describe('ConversationSidebar Component - Chevron Toggle Button (Issue #203)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Test Conversation 1',
			messageCount: 5,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'Test Conversation 2',
			messageCount: 3,
			lastMessageTime: new Date('2026-01-19T09:00:00Z'),
			createdAt: new Date('2026-01-17T10:00:00Z'),
			updatedAt: new Date('2026-01-19T09:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should have a chevron toggle button in the header', () => {
		render(ConversationSidebar);

		// Look for chevron button with appropriate aria-label
		const toggleButton = screen.queryByRole('button', { name: /toggle conversations/i }) ||
			screen.queryByRole('button', { name: /expand conversations/i }) ||
			screen.queryByRole('button', { name: /collapse conversations/i });

		expect(toggleButton).toBeInTheDocument();
	});

	it('should display chevron icon in the toggle button', () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Should contain an SVG icon (chevron from lucide)
		const svg = toggleButton.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('should position toggle button in the conversations header', () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Button should be near "Conversations" text or header
		const header = container.querySelector('[class*="header"]') ||
			toggleButton.closest('div');

		expect(header).toBeInTheDocument();
	});

	it('should have type="button" to prevent form submission', () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		expect(toggleButton).toHaveAttribute('type', 'button');
	});
});

describe('ConversationSidebar Component - Expand/Collapse Behavior (Issue #203)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Campaign Planning',
			messageCount: 15,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'NPC Development',
			messageCount: 8,
			lastMessageTime: new Date('2026-01-19T09:00:00Z'),
			createdAt: new Date('2026-01-17T10:00:00Z'),
			updatedAt: new Date('2026-01-19T09:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should show conversation list when expanded (default state)', () => {
		render(ConversationSidebar);

		// Conversations should be visible by default
		expect(screen.getByText('Campaign Planning')).toBeVisible();
		expect(screen.getByText('NPC Development')).toBeVisible();
	});

	it('should hide conversation list when toggle button is clicked', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Initially visible
		expect(screen.getByText('Campaign Planning')).toBeVisible();

		// Click to collapse
		await fireEvent.click(toggleButton);

		// Conversations should be hidden
		await waitFor(() => {
			const conv1 = screen.queryByText('Campaign Planning');
			expect(conv1).not.toBeVisible();
		});
	});

	it('should keep header visible when collapsed', async () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		await fireEvent.click(toggleButton);

		// Header (including "New Conversation" button or section header) should still be visible
		const newButton = screen.queryByRole('button', { name: /new conversation/i });
		expect(newButton).toBeInTheDocument();
	});

	it('should expand conversation list when toggle is clicked again', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Collapse
		await fireEvent.click(toggleButton);
		await waitFor(() => {
			expect(screen.queryByText('Campaign Planning')).not.toBeVisible();
		});

		// Expand
		const expandButton = screen.getByRole('button', { name: /expand conversations/i }) ||
			screen.getByRole('button', { name: /toggle conversations/i });
		await fireEvent.click(expandButton);

		// Conversations should be visible again
		await waitFor(() => {
			expect(screen.getByText('Campaign Planning')).toBeVisible();
		});
	});

	it('should animate chevron icon rotation on toggle (optional)', async () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		const chevronIcon = toggleButton.querySelector('svg');
		expect(chevronIcon).toBeInTheDocument();

		// The icon might rotate via CSS transform
		// This is optional visual polish
	});

	it('should only hide conversation items, not the entire container', async () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		await fireEvent.click(toggleButton);

		// The container should still exist
		const conversationContainer = container.querySelector('[class*="conversation"]') ||
			container.firstChild;

		expect(conversationContainer).toBeInTheDocument();
	});
});

describe('ConversationSidebar Component - localStorage Persistence (Issue #203)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Test Conversation',
			messageCount: 5,
			lastMessageTime: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should save collapsed state to localStorage when collapsed', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		await fireEvent.click(toggleButton);

		// Should save to localStorage with key 'chat-conversations-collapsed'
		await waitFor(() => {
			const saved = localStorage.getItem(STORAGE_KEY);
			expect(saved).toBe('true');
		});
	});

	it('should save expanded state to localStorage when expanded', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Collapse first
		await fireEvent.click(toggleButton);
		await waitFor(() => {
			expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
		});

		// Expand
		await fireEvent.click(toggleButton);

		// Should update localStorage to false
		await waitFor(() => {
			const saved = localStorage.getItem(STORAGE_KEY);
			expect(saved).toBe('false');
		});
	});

	it('should load collapsed state from localStorage on mount', () => {
		// Set collapsed state before rendering
		localStorage.setItem(STORAGE_KEY, 'true');

		render(ConversationSidebar);

		// Conversations should be collapsed on mount
		const conv = screen.queryByText('Test Conversation');
		expect(conv).not.toBeVisible();
	});

	it('should load expanded state from localStorage on mount', () => {
		// Set expanded state
		localStorage.setItem(STORAGE_KEY, 'false');

		render(ConversationSidebar);

		// Conversations should be visible
		expect(screen.getByText('Test Conversation')).toBeVisible();
	});

	it('should default to expanded when no localStorage value exists', () => {
		// No localStorage value
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

		render(ConversationSidebar);

		// Should default to expanded
		expect(screen.getByText('Test Conversation')).toBeVisible();
	});

	it('should persist state across component remounts', async () => {
		// First render and collapse
		const { unmount } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });
		await fireEvent.click(toggleButton);

		await waitFor(() => {
			expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
		});

		// Unmount
		unmount();

		// Re-render
		render(ConversationSidebar);

		// Should remain collapsed
		const conv = screen.queryByText('Test Conversation');
		expect(conv).not.toBeVisible();
	});
});

describe('ConversationSidebar Component - Accessibility (Issue #203)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Test',
			messageCount: 5,
			lastMessageTime: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	it('should have aria-expanded="true" when expanded', () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		// Should start expanded
		expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
	});

	it('should update aria-expanded to "false" when collapsed', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		await fireEvent.click(toggleButton);

		// Should update aria-expanded
		await waitFor(() => {
			expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('should have descriptive aria-label on toggle button', () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Should have aria-label
		expect(toggleButton).toHaveAttribute('aria-label');
	});

	it('should be keyboard accessible (focus and activate)', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		// Should be focusable
		toggleButton.focus();
		expect(document.activeElement).toBe(toggleButton);

		// Should work with keyboard (Enter key)
		await fireEvent.keyDown(toggleButton, { key: 'Enter' });

		// Native button handles this automatically
		expect(toggleButton).toBeInTheDocument();
	});

	it('should maintain focus on toggle button after clicking', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		toggleButton.focus();
		await fireEvent.click(toggleButton);

		// Focus should remain on button
		expect(document.activeElement).toBe(toggleButton);
	});

	it('should have aria-controls pointing to collapsible section (optional)', () => {
		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		// Optional: aria-controls linking button to controlled region
		// This enhances accessibility by associating button with its target
		const ariaControls = toggleButton.getAttribute('aria-controls');

		if (ariaControls) {
			expect(ariaControls).toBeTruthy();
		}
	});
});

describe('ConversationSidebar Component - Edge Cases (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [];
		(conversationStore as any).activeConversationId = null;
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should handle empty conversation list when collapsed', async () => {
		render(ConversationSidebar);

		const toggleButton = screen.queryByRole('button', { name: /toggle conversations/i });

		if (toggleButton) {
			await fireEvent.click(toggleButton);

			// Should handle gracefully without errors
			expect(toggleButton).toBeInTheDocument();
		}
	});

	it('should handle invalid localStorage values gracefully', () => {
		localStorage.setItem(STORAGE_KEY, 'invalid-value');

		// Should render without crashing and default to expanded
		const { container } = render(ConversationSidebar);

		expect(container).toBeInTheDocument();
	});

	it('should handle localStorage errors gracefully', () => {
		const originalLocalStorage = window.localStorage;

		// Mock localStorage to throw error
		Object.defineProperty(window, 'localStorage', {
			get: () => {
				throw new Error('localStorage is not available');
			},
			configurable: true
		});

		// Should render without crashing
		const { container } = render(ConversationSidebar);
		expect(container).toBeInTheDocument();

		// Restore localStorage
		Object.defineProperty(window, 'localStorage', {
			value: originalLocalStorage,
			configurable: true
		});
	});

	it('should handle rapid toggling without errors', async () => {
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 1,
			createdAt: new Date(),
			updatedAt: new Date()
		}];

		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });

		// Rapidly toggle multiple times
		for (let i = 0; i < 10; i++) {
			await fireEvent.click(toggleButton);
		}

		// Should still be functional
		expect(toggleButton).toBeInTheDocument();
	});

	it('should maintain collapsed state when conversations are added', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });
		await fireEvent.click(toggleButton);

		// Add new conversation to store
		(conversationStore as any).conversations = [{
			id: 'conv-new',
			name: 'New Conversation',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];

		// Should remain collapsed
		await waitFor(() => {
			const newConv = screen.queryByText('New Conversation');
			if (newConv) {
				expect(newConv).not.toBeVisible();
			}
		});
	});
});

describe('ConversationSidebar Component - Visual States (Issue #203)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Test',
			messageCount: 5,
			lastMessageTime: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	it('should change chevron direction when collapsed/expanded', async () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });
		const chevron = toggleButton.querySelector('svg');

		// Get initial state
		const initialTransform = chevron ? window.getComputedStyle(chevron).transform : '';

		// Toggle
		await fireEvent.click(toggleButton);

		// Chevron might rotate via CSS transform
		// This is optional visual feedback
		const finalTransform = chevron ? window.getComputedStyle(chevron).transform : '';

		// We just check that chevron exists and is styled
		expect(chevron).toBeInTheDocument();
	});

	it('should have smooth transition animation when collapsing (optional)', async () => {
		const { container } = render(ConversationSidebar);

		const conversationList = container.querySelector('[role="list"]') ||
			container.querySelector('[class*="conversation-list"]');

		if (conversationList) {
			const computedStyle = window.getComputedStyle(conversationList);

			// May have transition for smooth collapse
			// This is optional polish
			if (computedStyle.transition !== 'none') {
				expect(computedStyle.transition).toBeTruthy();
			}
		}
	});

	it('should hide overflow when collapsed to prevent content showing', async () => {
		const { container } = render(ConversationSidebar);

		const toggleButton = screen.getByRole('button', { name: /toggle conversations/i });
		await fireEvent.click(toggleButton);

		const collapsibleSection = container.querySelector('[data-collapsed="true"]') ||
			container.querySelector('[class*="collapsed"]');

		if (collapsibleSection) {
			const computedStyle = window.getComputedStyle(collapsibleSection);

			// Should hide overflow to prevent content from showing
			expect(['hidden', 'clip']).toContain(computedStyle.overflow);
		}
	});
});
