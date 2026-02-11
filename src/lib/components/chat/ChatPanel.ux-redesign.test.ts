/**
 * Tests for ChatPanel Component - UX Redesign (Issue #203)
 *
 * Issue #203: Chat Sidebar UX Redesign
 *
 * RED Phase (TDD): These tests define expected behavior for the UX redesign.
 * Tests will FAIL until ChatPanel.svelte is updated with the new UX features.
 *
 * Requirements being tested:
 * 1. Fixed width at 448px (no resizing)
 * 2. Collapsible Conversations section with localStorage persistence
 * 3. Collapsible Context section with localStorage persistence
 * 4. Minimize to floating button with localStorage persistence
 *
 * Testing Strategy:
 * - Test fixed width constraints (no resize functionality)
 * - Test collapsible section behavior and localStorage persistence
 * - Test minimize functionality and floating button integration
 * - Test localStorage state restoration on mount
 * - Verify accessibility attributes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ChatPanel from './ChatPanel.svelte';

// Mock the stores
vi.mock('$lib/stores', () => ({
	conversationStore: {
		conversations: [],
		activeConversationId: null,
		isLoading: false,
		load: vi.fn(),
		create: vi.fn()
	},
	chatStore: {
		messages: [],
		isLoading: false,
		error: null,
		streamingContent: '',
		contextEntityIds: [],
		includeLinkedEntities: true,
		generationType: 'custom',
		load: vi.fn(),
		sendMessage: vi.fn(),
		clearHistory: vi.fn(),
		switchConversation: vi.fn(),
		setIncludeLinkedEntities: vi.fn(),
		setGenerationType: vi.fn()
	},
	uiStore: {
		closeChatPanel: vi.fn()
	},
	entitiesStore: {
		entities: []
	},
	campaignStore: {
		customEntityTypes: [],
		entityTypeOverrides: []
	},
	debugStore: {
		isEnabled: false,
		enabled: false,
		logs: [],
		addLog: vi.fn(),
		clear: vi.fn(),
		enable: vi.fn(),
		disable: vi.fn(),
		load: vi.fn()
	}
}));

// Mock the chat service
vi.mock('$lib/services/chatService', () => ({
	hasChatApiKey: vi.fn(() => true)
}));

describe('ChatPanel Component - Fixed Width (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test Conversation',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should render chat panel with exactly 448px width', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		expect(chatPanel).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(chatPanel);
		const width = computedStyle.width;

		// Should be exactly 448px
		expect(width).toBe('448px');
	});

	it('should NOT have CSS resize property enabled', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should NOT have resize: horizontal, vertical, or both
		expect(computedStyle.resize).toBe('none');
	});

	it('should NOT have ResizeObserver setup (no resize detection)', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should not have data attributes related to resizing
		expect(chatPanel.hasAttribute('data-resizable')).toBe(false);
	});

	it('should NOT persist width to localStorage', async () => {
		const { container } = render(ChatPanel);

		// Wait a bit to ensure no localStorage writes happen
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should NOT save width to localStorage
		expect(localStorage.getItem('chat-panel-width')).toBeNull();
	});

	it('should have inline style with width: 448px', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should have inline style or CSS class that sets width to 448px
		const inlineWidth = chatPanel.style.width;
		const computedWidth = window.getComputedStyle(chatPanel).width;

		expect(inlineWidth === '448px' || computedWidth === '448px').toBe(true);
	});

	it('should maintain fixed width and not be user-resizable', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Try to manually set width (should not have effect due to fixed styling)
		const originalWidth = chatPanel.offsetWidth;
		chatPanel.style.width = '600px';

		// Due to CSS constraints, it should stay at 448px
		// (This test verifies the component doesn't allow dynamic width changes)
		expect(chatPanel.offsetWidth).toBe(originalWidth);
	});
});

describe('ChatPanel Component - Collapsible Conversations Section (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [
			{
				id: 'conv-1',
				name: 'Test Conversation 1',
				messageCount: 5,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 'conv-2',
				name: 'Test Conversation 2',
				messageCount: 3,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should have a chevron toggle button for conversations section', () => {
		render(ChatPanel);

		// The conversations toggle is in the ConversationSidebar component
		// Look for chevron button near "Conversations" header
		const chevronButton = screen.queryByRole('button', { name: /toggle conversations/i }) ||
			screen.queryByRole('button', { name: /expand conversations/i });

		expect(chevronButton).toBeInTheDocument();
	});

	it('should show conversation list when expanded (default state)', () => {
		render(ChatPanel);

		// Conversations should be visible by default
		expect(screen.getByText('Test Conversation 1')).toBeVisible();
		expect(screen.getByText('Test Conversation 2')).toBeVisible();
	});

	it('should hide conversation items when collapse button is clicked', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Initially conversations are visible
		expect(screen.getByText('Test Conversation 1')).toBeVisible();

		// Click to collapse
		await fireEvent.click(chevronButton);

		// Conversations should be hidden (or have display:none, height:0, etc.)
		await waitFor(() => {
			const conv1 = screen.queryByText('Test Conversation 1');
			expect(conv1).not.toBeVisible();
		});
	});

	it('should show header with chevron when collapsed', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		await fireEvent.click(chevronButton);

		// Header should still be visible even when collapsed
		await waitFor(() => {
			const headerText = screen.queryByText(/conversations/i);
			expect(headerText).toBeInTheDocument();
		});
	});

	it('should expand conversation list when chevron is clicked again', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Collapse
		await fireEvent.click(chevronButton);
		await waitFor(() => {
			expect(screen.queryByText('Test Conversation 1')).not.toBeVisible();
		});

		// Expand
		const expandButton = screen.getByRole('button', { name: /expand conversations/i }) ||
			screen.getByRole('button', { name: /toggle conversations/i });
		await fireEvent.click(expandButton);

		// Conversations should be visible again
		await waitFor(() => {
			expect(screen.getByText('Test Conversation 1')).toBeVisible();
		});
	});

	it('should save collapsed state to localStorage', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		await fireEvent.click(chevronButton);

		// Should save to localStorage with key 'chat-conversations-collapsed'
		await waitFor(() => {
			const saved = localStorage.getItem('chat-conversations-collapsed');
			expect(saved).toBe('true');
		});
	});

	it('should load collapsed state from localStorage on mount', () => {
		// Set collapsed state in localStorage before rendering
		localStorage.setItem('chat-conversations-collapsed', 'true');

		render(ChatPanel);

		// Conversations should be collapsed on mount
		const conv1 = screen.queryByText('Test Conversation 1');
		expect(conv1).not.toBeVisible();
	});

	it('should restore expanded state from localStorage', () => {
		// Set expanded state (or no key = expanded by default)
		localStorage.setItem('chat-conversations-collapsed', 'false');

		render(ChatPanel);

		// Conversations should be visible
		expect(screen.getByText('Test Conversation 1')).toBeVisible();
	});

	it('should default to expanded when no localStorage value exists', () => {
		// No localStorage value
		expect(localStorage.getItem('chat-conversations-collapsed')).toBeNull();

		render(ChatPanel);

		// Should default to expanded
		expect(screen.getByText('Test Conversation 1')).toBeVisible();
	});
});

describe('ChatPanel Component - Collapsible Context Section (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should have a chevron toggle button for context section', () => {
		render(ChatPanel);

		// Look for chevron button for context section
		const chevronButton = screen.queryByRole('button', { name: /toggle context/i }) ||
			screen.queryByRole('button', { name: /expand context/i }) ||
			screen.queryByRole('button', { name: /collapse context/i });

		expect(chevronButton).toBeInTheDocument();
	});

	it('should show context selectors when expanded (default state)', () => {
		render(ChatPanel);

		// Context-related elements should be visible
		// ContextSelector, GenerationTypeSelector, TypeFieldsSelector
		const contextText = screen.queryByText(/context/i);
		expect(contextText).toBeInTheDocument();
	});

	it('should hide context selectors when collapse button is clicked', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle context/i }) ||
			screen.getByRole('button', { name: /collapse context/i });

		// Click to collapse
		await fireEvent.click(chevronButton);

		// Context section content should be hidden
		// We need to verify the collapsible container is collapsed
		await waitFor(() => {
			// Check if context selectors are hidden
			// This might need to check specific data attributes or visibility
			const contextSection = screen.queryByTestId('context-section-content') ||
				document.querySelector('[data-section="context-content"]');

			// Section should be hidden or not visible
			if (contextSection) {
				expect(contextSection).not.toBeVisible();
			}
		});
	});

	it('should show header with chevron when context section is collapsed', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle context/i }) ||
			screen.getByRole('button', { name: /collapse context/i });

		await fireEvent.click(chevronButton);

		// Header should still be visible
		await waitFor(() => {
			const headerText = screen.queryByText(/context/i);
			expect(headerText).toBeInTheDocument();
		});
	});

	it('should expand context section when chevron is clicked again', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle context/i }) ||
			screen.getByRole('button', { name: /collapse context/i });

		// Collapse
		await fireEvent.click(chevronButton);

		// Expand
		const expandButton = screen.getByRole('button', { name: /expand context/i }) ||
			screen.getByRole('button', { name: /toggle context/i });
		await fireEvent.click(expandButton);

		// Context section should be visible again
		await waitFor(() => {
			const contextText = screen.queryByText(/context/i);
			expect(contextText).toBeVisible();
		});
	});

	it('should save collapsed state to localStorage with key "chat-context-collapsed"', async () => {
		render(ChatPanel);

		const chevronButton = screen.getByRole('button', { name: /toggle context/i }) ||
			screen.getByRole('button', { name: /collapse context/i });

		await fireEvent.click(chevronButton);

		// Should save to localStorage
		await waitFor(() => {
			const saved = localStorage.getItem('chat-context-collapsed');
			expect(saved).toBe('true');
		});
	});

	it('should load collapsed state from localStorage on mount', () => {
		// Set collapsed state before rendering
		localStorage.setItem('chat-context-collapsed', 'true');

		const { container } = render(ChatPanel);

		// Context section should be collapsed on mount
		const contextSection = container.querySelector('[data-section="context-content"]');
		if (contextSection) {
			expect(contextSection).not.toBeVisible();
		}
	});

	it('should restore expanded state from localStorage', () => {
		localStorage.setItem('chat-context-collapsed', 'false');

		render(ChatPanel);

		// Context should be visible
		const contextText = screen.queryByText(/context/i);
		expect(contextText).toBeVisible();
	});

	it('should default to expanded when no localStorage value exists', () => {
		expect(localStorage.getItem('chat-context-collapsed')).toBeNull();

		render(ChatPanel);

		// Should default to expanded
		const contextText = screen.queryByText(/context/i);
		expect(contextText).toBeVisible();
	});
});

describe('ChatPanel Component - Minimize Functionality (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should have a minimize button in the header', () => {
		render(ChatPanel);

		// Look for minimize button in header
		const minimizeButton = screen.queryByRole('button', { name: /minimize/i }) ||
			screen.queryByTitle(/minimize/i);

		expect(minimizeButton).toBeInTheDocument();
	});

	it('should hide chat panel when minimize button is clicked', async () => {
		const { container } = render(ChatPanel);

		const minimizeButton = screen.getByRole('button', { name: /minimize/i }) ||
			screen.getByTitle(/minimize/i);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		expect(chatPanel).toBeVisible();

		// Click minimize
		await fireEvent.click(minimizeButton);

		// Panel should be hidden
		await waitFor(() => {
			expect(chatPanel).not.toBeVisible();
		});
	});

	it('should save minimized state to localStorage', async () => {
		render(ChatPanel);

		const minimizeButton = screen.getByRole('button', { name: /minimize/i }) ||
			screen.getByTitle(/minimize/i);

		await fireEvent.click(minimizeButton);

		// Should save to localStorage with key 'chat-minimized'
		await waitFor(() => {
			const saved = localStorage.getItem('chat-minimized');
			expect(saved).toBe('true');
		});
	});

	it('should load minimized state from localStorage on mount', () => {
		// Set minimized state before rendering
		localStorage.setItem('chat-minimized', 'true');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside');

		// Panel should be hidden on mount
		expect(chatPanel).not.toBeVisible();
	});

	it('should render floating button when minimized', async () => {
		render(ChatPanel);

		const minimizeButton = screen.getByRole('button', { name: /minimize/i }) ||
			screen.getByTitle(/minimize/i);

		await fireEvent.click(minimizeButton);

		// Should show floating button
		await waitFor(() => {
			const floatingButton = screen.queryByRole('button', { name: /open chat/i }) ||
				screen.queryByLabelText(/open chat/i);
			expect(floatingButton).toBeInTheDocument();
		});
	});

	it('should restore chat panel when floating button is clicked', async () => {
		localStorage.setItem('chat-minimized', 'true');

		const { container } = render(ChatPanel);

		const floatingButton = screen.getByRole('button', { name: /open chat/i }) ||
			screen.getByLabelText(/open chat/i);

		// Click to expand
		await fireEvent.click(floatingButton);

		// Panel should be visible again
		await waitFor(() => {
			const chatPanel = container.querySelector('aside');
			expect(chatPanel).toBeVisible();
		});
	});

	it('should update localStorage when chat is restored', async () => {
		localStorage.setItem('chat-minimized', 'true');

		render(ChatPanel);

		const floatingButton = screen.getByRole('button', { name: /open chat/i }) ||
			screen.getByLabelText(/open chat/i);

		await fireEvent.click(floatingButton);

		// localStorage should be updated to false
		await waitFor(() => {
			const saved = localStorage.getItem('chat-minimized');
			expect(saved).toBe('false');
		});
	});

	it('should hide floating button when chat is expanded', async () => {
		localStorage.setItem('chat-minimized', 'true');

		render(ChatPanel);

		const floatingButton = screen.getByRole('button', { name: /open chat/i }) ||
			screen.getByLabelText(/open chat/i);

		await fireEvent.click(floatingButton);

		// Floating button should be hidden
		await waitFor(() => {
			const button = screen.queryByRole('button', { name: /open chat/i });
			expect(button).not.toBeInTheDocument();
		});
	});

	it('should default to expanded (not minimized) when no localStorage value exists', () => {
		expect(localStorage.getItem('chat-minimized')).toBeNull();

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside');
		expect(chatPanel).toBeVisible();
	});
});

describe('ChatPanel Component - Multiple Collapsible Sections Integration (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should independently collapse conversations and context sections', async () => {
		render(ChatPanel);

		const conversationsToggle = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });
		const contextToggle = screen.getByRole('button', { name: /toggle context/i }) ||
			screen.getByRole('button', { name: /collapse context/i });

		// Collapse conversations only
		await fireEvent.click(conversationsToggle);

		// Context should still be expanded
		const contextText = screen.queryByText(/context/i);
		expect(contextText).toBeVisible();

		// Now collapse context
		await fireEvent.click(contextToggle);

		// Both should be collapsed
		await waitFor(() => {
			expect(localStorage.getItem('chat-conversations-collapsed')).toBe('true');
			expect(localStorage.getItem('chat-context-collapsed')).toBe('true');
		});
	});

	it('should persist both section states independently to localStorage', async () => {
		render(ChatPanel);

		const conversationsToggle = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		await fireEvent.click(conversationsToggle);

		await waitFor(() => {
			expect(localStorage.getItem('chat-conversations-collapsed')).toBe('true');
			expect(localStorage.getItem('chat-context-collapsed')).toBeNull(); // Context not changed
		});
	});

	it('should restore both section states independently on mount', () => {
		localStorage.setItem('chat-conversations-collapsed', 'true');
		localStorage.setItem('chat-context-collapsed', 'false');

		render(ChatPanel);

		// Conversations should be collapsed
		const conv = screen.queryByText('Test');
		expect(conv).not.toBeVisible();

		// Context should be expanded
		const context = screen.queryByText(/context/i);
		expect(context).toBeVisible();
	});
});

describe('ChatPanel Component - Accessibility (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	it('should have aria-label on minimize button', () => {
		render(ChatPanel);

		const minimizeButton = screen.queryByRole('button', { name: /minimize/i });

		if (minimizeButton) {
			expect(minimizeButton).toHaveAttribute('aria-label');
		}
	});

	it('should have aria-label or title on chevron buttons', () => {
		render(ChatPanel);

		const toggleButtons = screen.queryAllByRole('button').filter(button =>
			button.getAttribute('aria-label')?.includes('toggle') ||
			button.getAttribute('title')?.includes('toggle')
		);

		expect(toggleButtons.length).toBeGreaterThan(0);
	});

	it('should use aria-expanded on collapsible section buttons', () => {
		render(ChatPanel);

		const conversationsToggle = screen.queryByRole('button', { name: /toggle conversations/i });

		if (conversationsToggle) {
			expect(conversationsToggle).toHaveAttribute('aria-expanded');
		}
	});

	it('should update aria-expanded when sections are toggled', async () => {
		render(ChatPanel);

		const conversationsToggle = screen.getByRole('button', { name: /toggle conversations/i });

		// Should start as expanded
		expect(conversationsToggle).toHaveAttribute('aria-expanded', 'true');

		// Collapse
		await fireEvent.click(conversationsToggle);

		// Should update to collapsed
		await waitFor(() => {
			expect(conversationsToggle).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('should maintain keyboard navigation with fixed width layout', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);
		textarea.focus();

		expect(document.activeElement).toBe(textarea);
	});
});

describe('ChatPanel Component - Error Handling and Edge Cases (Issue #203)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;
	});

	it('should handle invalid localStorage values for collapsed state', () => {
		localStorage.setItem('chat-conversations-collapsed', 'invalid-value');

		const { container } = render(ChatPanel);

		// Should default to expanded on invalid value
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
		const { container } = render(ChatPanel);
		const chatPanel = container.querySelector('aside');
		expect(chatPanel).toBeInTheDocument();

		// Restore localStorage
		Object.defineProperty(window, 'localStorage', {
			value: originalLocalStorage,
			configurable: true
		});
	});

	it('should handle rapid toggling of sections', async () => {
		render(ChatPanel);

		const conversationsToggle = screen.getByRole('button', { name: /toggle conversations/i }) ||
			screen.getByRole('button', { name: /collapse conversations/i });

		// Rapidly toggle multiple times
		for (let i = 0; i < 5; i++) {
			await fireEvent.click(conversationsToggle);
		}

		// Should still be in valid state
		const { container } = render(ChatPanel);
		expect(container.querySelector('aside')).toBeInTheDocument();
	});

	it('should maintain fixed width even when sections are collapsed', async () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const initialWidth = window.getComputedStyle(chatPanel).width;

		// Collapse both sections
		const conversationsToggle = screen.getByRole('button', { name: /toggle conversations/i });
		const contextToggle = screen.getByRole('button', { name: /toggle context/i });

		await fireEvent.click(conversationsToggle);
		await fireEvent.click(contextToggle);

		// Width should remain 448px
		const finalWidth = window.getComputedStyle(chatPanel).width;
		expect(finalWidth).toBe(initialWidth);
		expect(finalWidth).toBe('448px');
	});
});
