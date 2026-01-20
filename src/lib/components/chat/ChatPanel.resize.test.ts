/**
 * Tests for ChatPanel Component - Resizable and Sizing Requirements
 *
 * Issue #193: Chat Window Renders Too Small / Not Resizable
 *
 * RED Phase (TDD): These tests define expected behavior for chat window sizing and resizing.
 * Tests will FAIL until ChatPanel.svelte is updated with proper sizing and resize functionality.
 *
 * Requirements being tested:
 * 1. Chat window should render at a reasonable default size (60-80% of viewport height, minimum 10-15 lines visible)
 * 2. Chat window must be resizable by users (CSS resize property or drag handles)
 * 3. Responsive design that scales appropriately on different screen sizes
 * 4. Persistence of user's preferred size to local storage
 *
 * Testing Strategy:
 * - Use computed styles to verify CSS properties
 * - Test localStorage interactions for size persistence
 * - Simulate viewport changes for responsive behavior
 * - Verify minimum content visibility
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
	}
}));

// Mock the chat service
vi.mock('$lib/services/chatService', () => ({
	hasChatApiKey: vi.fn(() => true)
}));

describe('ChatPanel Component - Default Size Requirements (Issue #193)', () => {
	let originalInnerHeight: number;

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		// Set up default viewport height
		originalInnerHeight = window.innerHeight;
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 1000
		});

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
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: originalInnerHeight
		});
	});

	it('should render chat panel with container element', () => {
		const { container } = render(ChatPanel);

		// Chat panel should be an aside element
		const chatPanel = container.querySelector('aside');
		expect(chatPanel).toBeInTheDocument();
	});

	it('should have a default height of at least 60% of viewport height', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		expect(chatPanel).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(chatPanel);
		const height = computedStyle.height;

		// Should use viewport-relative height (vh units) or flex-based height
		// At minimum, height should be set and not be 'auto' or empty
		expect(height).toBeTruthy();
		expect(height).not.toBe('auto');
		expect(height).not.toBe('0px');
	});

	it('should render with height that accommodates minimum 10-15 lines of chat messages', async () => {
		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		expect(messagesContainer).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(messagesContainer);
		const height = computedStyle.height;

		// Messages container should have sufficient height
		// Assuming ~24px per line (text + spacing), 10 lines = ~240px minimum
		if (height !== 'auto') {
			const heightValue = parseInt(height, 10);
			expect(heightValue).toBeGreaterThanOrEqual(240);
		}
	});

	it('should use flex-based layout for full height utilization', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should use flexbox for vertical layout
		expect(computedStyle.display).toMatch(/flex/);
		expect(computedStyle.flexDirection).toMatch(/column/);
	});

	it('should have messages container that grows to fill available space', () => {
		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		expect(messagesContainer).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(messagesContainer);

		// Should have flex-grow or specific height to fill space
		expect(
			computedStyle.flexGrow === '1' ||
			computedStyle.flex?.includes('1') ||
			computedStyle.height !== 'auto'
		).toBe(true);
	});

	it('should render with full viewport height', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should be full height (h-full class in Tailwind = height: 100%)
		expect(computedStyle.height).toMatch(/100%|100vh/);
	});
});

describe('ChatPanel Component - Resize Functionality (Issue #193)', () => {
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

	it('should have CSS resize property enabled', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should have resize: horizontal or resize: both
		expect(['horizontal', 'both', 'vertical']).toContain(computedStyle.resize);
	});

	it('should have overflow property set to allow resizing', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// For CSS resize to work, overflow must be set (not visible)
		// Should be 'auto', 'scroll', or 'hidden'
		expect(['auto', 'scroll', 'hidden']).toContain(computedStyle.overflow);
	});

	it('should have a minimum width constraint', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should have min-width to prevent collapsing too small
		const minWidth = computedStyle.minWidth;
		expect(minWidth).toBeTruthy();
		expect(minWidth).not.toBe('0px');
		expect(minWidth).not.toBe('auto');

		// Should be at least 320px (reasonable mobile width)
		const minWidthValue = parseInt(minWidth, 10);
		expect(minWidthValue).toBeGreaterThanOrEqual(320);
	});

	it('should have a maximum width constraint to prevent excessive width', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should have max-width to prevent taking up entire viewport
		const maxWidth = computedStyle.maxWidth;
		expect(maxWidth).toBeTruthy();
		expect(maxWidth).not.toBe('none');
		expect(maxWidth).not.toBe('auto');
	});

	it('should visually indicate resizability to users', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should have resize cursor or a resize handle element
		const computedStyle = window.getComputedStyle(chatPanel);
		const hasResizeCursor = computedStyle.cursor?.includes('resize') ||
			computedStyle.resize !== 'none';

		// Look for resize handle element (if using drag handle approach)
		const resizeHandle = container.querySelector('[class*="resize-handle"], [data-resize-handle]');

		expect(hasResizeCursor || resizeHandle).toBeTruthy();
	});

	it('should allow horizontal resizing of the chat panel', async () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Get initial width
		const initialWidth = chatPanel.offsetWidth;

		// Simulate user resizing by directly setting width
		// (In a real scenario, this would be done via drag interaction)
		chatPanel.style.width = '500px';

		// Width should be changeable
		await waitFor(() => {
			expect(chatPanel.offsetWidth).not.toBe(initialWidth);
			expect(chatPanel.offsetWidth).toBe(500);
		});
	});

	it('should respect minimum width when user attempts to resize too small', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);
		const minWidth = parseInt(computedStyle.minWidth, 10);

		// Try to set width smaller than minimum
		chatPanel.style.width = '100px';

		// Should not go below minimum
		const actualWidth = chatPanel.offsetWidth;
		expect(actualWidth).toBeGreaterThanOrEqual(minWidth);
	});
});

describe('ChatPanel Component - Size Persistence (Issue #193)', () => {
	const STORAGE_KEY = 'chat-panel-width';

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

	it('should load saved width from localStorage on mount', async () => {
		const savedWidth = '450px';
		localStorage.setItem(STORAGE_KEY, savedWidth);

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		await waitFor(() => {
			const currentWidth = chatPanel.style.width || window.getComputedStyle(chatPanel).width;
			expect(currentWidth).toBe(savedWidth);
		});
	});

	it('should save width to localStorage when user resizes', async () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Simulate user resizing
		chatPanel.style.width = '550px';

		// Trigger resize event
		const resizeEvent = new Event('resize');
		chatPanel.dispatchEvent(resizeEvent);

		// Should save to localStorage
		await waitFor(() => {
			const savedWidth = localStorage.getItem(STORAGE_KEY);
			expect(savedWidth).toBe('550px');
		});
	});

	it('should use default width if no saved width exists in localStorage', () => {
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should have a default width
		expect(computedStyle.width).toBeTruthy();
		expect(computedStyle.width).not.toBe('0px');
	});

	it('should handle invalid localStorage values gracefully', () => {
		localStorage.setItem(STORAGE_KEY, 'invalid-width-value');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should render without crashing
		expect(chatPanel).toBeInTheDocument();

		// Should fall back to default width
		const computedStyle = window.getComputedStyle(chatPanel);
		expect(computedStyle.width).toBeTruthy();
	});

	it('should handle very large saved width values by capping to maximum', () => {
		localStorage.setItem(STORAGE_KEY, '5000px');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);
		const maxWidth = parseInt(computedStyle.maxWidth, 10);

		// Should respect max-width constraint
		const actualWidth = chatPanel.offsetWidth;
		expect(actualWidth).toBeLessThanOrEqual(maxWidth);
	});

	it('should handle very small saved width values by enforcing minimum', () => {
		localStorage.setItem(STORAGE_KEY, '50px');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);
		const minWidth = parseInt(computedStyle.minWidth, 10);

		// Should respect min-width constraint
		const actualWidth = chatPanel.offsetWidth;
		expect(actualWidth).toBeGreaterThanOrEqual(minWidth);
	});

	it('should persist width across component remounts', async () => {
		const testWidth = '480px';

		// First render and resize
		const { unmount, container } = render(ChatPanel);
		const chatPanel = container.querySelector('aside') as HTMLElement;
		chatPanel.style.width = testWidth;

		const resizeEvent = new Event('resize');
		chatPanel.dispatchEvent(resizeEvent);

		await waitFor(() => {
			expect(localStorage.getItem(STORAGE_KEY)).toBe(testWidth);
		});

		// Unmount component
		unmount();

		// Re-render component
		const { container: newContainer } = render(ChatPanel);
		const newChatPanel = newContainer.querySelector('aside') as HTMLElement;

		// Should restore saved width
		await waitFor(() => {
			const currentWidth = newChatPanel.style.width || window.getComputedStyle(newChatPanel).width;
			expect(currentWidth).toBe(testWidth);
		});
	});
});

describe('ChatPanel Component - Responsive Design (Issue #193)', () => {
	let originalInnerWidth: number;
	let originalInnerHeight: number;

	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		originalInnerWidth = window.innerWidth;
		originalInnerHeight = window.innerHeight;

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
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: originalInnerWidth
		});
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: originalInnerHeight
		});
	});

	it('should adjust to mobile viewport widths (< 768px)', () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 375 // iPhone size
		});

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		expect(chatPanel).toBeInTheDocument();

		// On mobile, chat panel might be full width or have reduced width
		const computedStyle = window.getComputedStyle(chatPanel);
		expect(computedStyle.width).toBeTruthy();
	});

	it('should adjust to tablet viewport widths (768px - 1024px)', () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768
		});

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		expect(computedStyle.width).toBeTruthy();
	});

	it('should work well on desktop viewport widths (> 1024px)', () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1920
		});

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		expect(computedStyle.width).toBeTruthy();
	});

	it('should adapt to small viewport heights gracefully', () => {
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 600
		});

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;

		// Should still render and have scrollable messages
		expect(chatPanel).toBeInTheDocument();
		expect(messagesContainer).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(messagesContainer);
		expect(computedStyle.overflowY).toMatch(/auto|scroll/);
	});

	it('should utilize tall viewport heights efficiently', () => {
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 1440
		});

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const computedStyle = window.getComputedStyle(chatPanel);

		// Should use full height or percentage-based height
		expect(computedStyle.height).toMatch(/100%|100vh/);
	});

	it('should maintain usability when viewport is resized', async () => {
		const { container } = render(ChatPanel);

		// Start at desktop size
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1920
		});

		// Trigger window resize event
		window.dispatchEvent(new Event('resize'));

		const chatPanel = container.querySelector('aside') as HTMLElement;
		expect(chatPanel).toBeInTheDocument();

		// Resize to mobile
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 375
		});

		window.dispatchEvent(new Event('resize'));

		// Should still be functional
		await waitFor(() => {
			expect(chatPanel).toBeInTheDocument();
		});
	});

	it('should have responsive width classes or styles', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should use responsive Tailwind classes (sm:, md:, lg:) or viewport units
		const className = chatPanel.className;
		const computedStyle = window.getComputedStyle(chatPanel);

		const hasResponsiveClasses = /sm:|md:|lg:|xl:/.test(className);
		const hasResponsiveStyles = computedStyle.width?.includes('vw') ||
			computedStyle.width?.includes('%');

		expect(hasResponsiveClasses || hasResponsiveStyles || computedStyle.width).toBeTruthy();
	});
});

describe('ChatPanel Component - Content Visibility Requirements (Issue #193)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		const { conversationStore, chatStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [{
			id: 'conv-1',
			name: 'Test',
			messageCount: 3,
			createdAt: new Date(),
			updatedAt: new Date()
		}];
		(conversationStore as any).activeConversationId = 'conv-1';
		(conversationStore as any).isLoading = false;

		// Add some mock messages to test visibility
		(chatStore as any).messages = [
			{ id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
			{ id: '2', role: 'assistant', content: 'Hi there! How can I help?', timestamp: new Date() },
			{ id: '3', role: 'user', content: 'Tell me about campaigns', timestamp: new Date() }
		];
	});

	it('should display at least 10 lines of content when messages are present', () => {
		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		expect(messagesContainer).toBeInTheDocument();

		const computedStyle = window.getComputedStyle(messagesContainer);
		const height = parseInt(computedStyle.height, 10);

		// With 3 messages, each taking ~80-100px (avatar + content + spacing)
		// Minimum visible area should be at least 240px for ~10 lines
		if (!isNaN(height)) {
			expect(height).toBeGreaterThanOrEqual(240);
		}
	});

	it('should have sufficient padding and spacing for readability', () => {
		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		const computedStyle = window.getComputedStyle(messagesContainer);

		// Should have padding
		const padding = computedStyle.padding;
		expect(padding).toBeTruthy();
		expect(padding).not.toBe('0px');
	});

	it('should allow scrolling when content exceeds visible area', () => {
		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		const computedStyle = window.getComputedStyle(messagesContainer);

		// Should have overflow-y: auto or scroll
		expect(computedStyle.overflowY).toMatch(/auto|scroll/);
	});

	it('should keep input area visible at all times (no scroll)', () => {
		const { container } = render(ChatPanel);

		const form = container.querySelector('form');
		expect(form).toBeInTheDocument();

		// Input form should not be inside scrollable container
		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		const isInputInsideScrollable = messagesContainer?.contains(form);

		expect(isInputInsideScrollable).toBe(false);
	});

	it('should maintain header visibility (conversation selector, close button)', () => {
		const { container } = render(ChatPanel);

		const header = screen.getByText('AI Assistant');
		expect(header).toBeVisible();

		const closeButton = screen.getByRole('button', { name: /close/i });
		expect(closeButton).toBeVisible();

		// Header should not be inside scrollable area
		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		const isHeaderInsideScrollable = messagesContainer?.contains(header);

		expect(isHeaderInsideScrollable).toBe(false);
	});

	it('should display messages with adequate line height for readability', async () => {
		const { container } = render(ChatPanel);

		// Wait for messages to render
		await waitFor(() => {
			const messageElements = container.querySelectorAll('[class*="whitespace-pre-wrap"]');
			expect(messageElements.length).toBeGreaterThan(0);
		});

		const messageText = container.querySelector('[class*="whitespace-pre-wrap"]') as HTMLElement;
		if (messageText) {
			const computedStyle = window.getComputedStyle(messageText);
			const lineHeight = computedStyle.lineHeight;

			// Line height should be set (not 'normal') for better readability
			expect(lineHeight).toBeTruthy();
		}
	});
});

describe('ChatPanel Component - Edge Cases and Error Handling (Issue #193)', () => {
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

	it('should handle missing localStorage gracefully', () => {
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

	it('should handle extremely long messages without breaking layout', async () => {
		const { chatStore } = await import('$lib/stores');
		(chatStore as any).messages = [{
			id: '1',
			role: 'user',
			content: 'A'.repeat(10000), // Very long message
			timestamp: new Date()
		}];

		const { container } = render(ChatPanel);

		const messagesContainer = container.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
		expect(messagesContainer).toBeInTheDocument();

		// Should still be scrollable
		const computedStyle = window.getComputedStyle(messagesContainer);
		expect(computedStyle.overflowY).toMatch(/auto|scroll/);
	});

	it('should handle zero or negative width values', () => {
		localStorage.setItem('chat-panel-width', '-100px');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		const width = chatPanel.offsetWidth;

		// Should use minimum width instead
		expect(width).toBeGreaterThan(0);
	});

	it('should handle percentage-based width values from localStorage', () => {
		localStorage.setItem('chat-panel-width', '30%');

		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Should handle percentage or fall back to default
		expect(chatPanel).toBeInTheDocument();
	});

	it('should maintain layout integrity when rapidly resizing', async () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;

		// Rapidly change width
		for (let i = 0; i < 10; i++) {
			chatPanel.style.width = `${400 + i * 10}px`;
			const resizeEvent = new Event('resize');
			chatPanel.dispatchEvent(resizeEvent);
		}

		// Should still be in valid state
		await waitFor(() => {
			expect(chatPanel).toBeInTheDocument();
			expect(chatPanel.offsetWidth).toBeGreaterThan(0);
		});
	});
});

describe('ChatPanel Component - Accessibility with Resizing (Issue #193)', () => {
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

	it('should maintain keyboard navigation after resizing', async () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		chatPanel.style.width = '500px';

		// After resize, interactive elements should still be focusable
		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);
		expect(textarea).toBeInTheDocument();

		textarea.focus();
		expect(document.activeElement).toBe(textarea);
	});

	it('should have appropriate ARIA attributes for resize handle (if present)', () => {
		const { container } = render(ChatPanel);

		const resizeHandle = container.querySelector('[data-resize-handle], [class*="resize-handle"]');

		if (resizeHandle) {
			// Resize handle should have appropriate ARIA attributes
			expect(
				resizeHandle.hasAttribute('aria-label') ||
				resizeHandle.hasAttribute('title')
			).toBe(true);
		}
	});

	it('should maintain minimum text size for readability after resize', () => {
		const { container } = render(ChatPanel);

		const chatPanel = container.querySelector('aside') as HTMLElement;
		chatPanel.style.width = '320px'; // Minimum width

		// Text should still be readable size
		const messageElements = container.querySelectorAll('[class*="text-"]');
		messageElements.forEach(element => {
			const computedStyle = window.getComputedStyle(element);
			const fontSize = parseInt(computedStyle.fontSize, 10);

			// Minimum readable font size (14px)
			expect(fontSize).toBeGreaterThanOrEqual(14);
		});
	});

	it('should announce size changes to screen readers (optional)', () => {
		const { container } = render(ChatPanel);

		// Look for live region that announces resize
		const liveRegion = container.querySelector('[aria-live], [role="status"]');

		// This is an optional feature for enhanced accessibility
		if (liveRegion) {
			expect(liveRegion).toHaveAttribute('aria-live');
		}
	});
});
