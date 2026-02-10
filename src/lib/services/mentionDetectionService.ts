/**
 * Mention Detection Service
 *
 * Pure utility functions for detecting and resolving "@" mentions in chat input.
 * Supports autocomplete, entity matching, and context entity extraction.
 *
 * GitHub Issue #199: Core Mention Detection Utility
 */

import type { EntityId } from '$lib/types';

// Name particles that can appear between capitalized words in multi-word names
const NAME_PARTICLES = new Set([
	'the', 'of', 'von', 'de', 'la', 'le', 'van', 'den', 'der', 'el', 'al', 'ibn', 'bin', 'di', 'du', 'da'
]);

function isWordChar(char: string): boolean {
	return /[\w\u00C0-\u024F\u1E00-\u1EFF]/.test(char) || char === "'" || char === '-';
}

function isUpperCaseLetter(char: string): boolean {
	return char !== char.toLowerCase() && char === char.toUpperCase();
}

/**
 * Result of detecting a mention trigger at cursor position
 */
export interface MentionTriggerResult {
	active: boolean;
	searchText: string;
	mentionStart: number;
}

/**
 * A mention token extracted from text
 */
export interface MentionToken {
	name: string;
	startIndex: number;
	endIndex: number;
}

/**
 * Minimal entity information for mention matching
 */
export interface EntityStub {
	id: EntityId;
	name: string;
	type: string;
}

/**
 * Resolved mention with entity information and match score
 */
export interface ResolvedMention {
	entityId: EntityId;
	entityName: string;
	entityType: string;
	matchScore: number;
}

/**
 * Detect if "@" was typed at cursor position and extract partial text after it
 *
 * @param text - The input text
 * @param cursorPosition - Current cursor position
 * @returns MentionTriggerResult or null if no active mention
 */
export function detectMentionTrigger(
	text: string,
	cursorPosition: number
): MentionTriggerResult | null {
	// Return null for empty text or cursor at position 0
	if (!text || cursorPosition === 0) {
		return null;
	}

	// Find all "@" positions in the text
	const atPositions: number[] = [];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '@') {
			// Check if this is part of an email (preceded by non-whitespace character)
			// Valid mention triggers:
			// - At start of text (i=0)
			// - Preceded by whitespace
			// - Preceded by another "@" (consecutive mentions)
			if (i > 0 && text[i - 1] !== ' ' && text[i - 1] !== '\t' && text[i - 1] !== '\n' && text[i - 1] !== '@') {
				continue; // Skip "@" in emails
			}
			atPositions.push(i);
		}
	}

	// Return null if no "@" found
	if (atPositions.length === 0) {
		return null;
	}

	// Find the "@" closest to and before cursor position
	let closestAtPos = -1;
	for (const pos of atPositions) {
		if (pos < cursorPosition && pos > closestAtPos) {
			closestAtPos = pos;
		}
	}

	// Return null if no "@" found before cursor
	if (closestAtPos === -1) {
		return null;
	}

	// Extract text between "@" and cursor
	const searchText = text.substring(closestAtPos + 1, cursorPosition);

	// Check if mention is "complete" (has a space followed by more text)
	// "@Gandalf is here" with cursor at end - the space after "Gandalf" means mention is complete
	const spaceIndex = searchText.indexOf(' ');
	if (spaceIndex !== -1) {
		// If there's text after the space, mention is complete
		const textAfterSpace = searchText.substring(spaceIndex + 1);
		if (textAfterSpace.length > 0) {
			return null;
		}
	}

	return {
		active: true,
		searchText,
		mentionStart: closestAtPos
	};
}

/**
 * Extract all @mention tokens from a complete message
 *
 * @param text - The message text
 * @returns Array of mention tokens
 */
export function extractMentionTokens(text: string): MentionToken[] {
	if (!text) {
		return [];
	}

	const tokens: MentionToken[] = [];
	let lastMentionEnd = -1; // Track where the last mention ended

	// Find all "@" positions
	for (let i = 0; i < text.length; i++) {
		if (text[i] !== '@') {
			continue;
		}

		// Check if this "@" is part of an email address
		// Valid mention triggers:
		// - At start of text (i=0)
		// - Preceded by whitespace
		// - Preceded by a previous mention (i == lastMentionEnd)
		const precedingChar = i > 0 ? text[i - 1] : null;

		// If preceded by non-whitespace and we're not right after a previous mention, skip (likely email)
		if (i > 0 && i !== lastMentionEnd &&
			precedingChar !== ' ' && precedingChar !== '\t' && precedingChar !== '\n') {
			continue; // Skip "@" in emails
		}

		// Read the first word after "@"
		let endIndex = i + 1;
		while (endIndex < text.length && isWordChar(text[endIndex])) {
			endIndex++;
		}

		// Try to extend with additional capitalized words or name particles
		let scanPos = endIndex;
		while (scanPos < text.length) {
			// Must be followed by whitespace
			if (text[scanPos] !== ' ' && text[scanPos] !== '\t') break;

			// Skip whitespace to find next word
			let nextWordStart = scanPos;
			while (nextWordStart < text.length && (text[nextWordStart] === ' ' || text[nextWordStart] === '\t')) {
				nextWordStart++;
			}
			if (nextWordStart >= text.length) break;

			// Stop at "@" or punctuation
			if (text[nextWordStart] === '@' || /[.,!?;:]/.test(text[nextWordStart])) break;

			// Read the next word
			let nextWordEnd = nextWordStart;
			while (nextWordEnd < text.length && isWordChar(text[nextWordEnd])) {
				nextWordEnd++;
			}
			const nextWord = text.substring(nextWordStart, nextWordEnd);
			if (nextWord.length === 0) break;

			// If next word starts with uppercase, it's part of the name
			if (isUpperCaseLetter(nextWord[0])) {
				endIndex = nextWordEnd;
				scanPos = nextWordEnd;
				continue;
			}

			// If it's a name particle, check if followed by a capitalized word
			if (NAME_PARTICLES.has(nextWord.toLowerCase())) {
				let afterStart = nextWordEnd;
				while (afterStart < text.length && (text[afterStart] === ' ' || text[afterStart] === '\t')) {
					afterStart++;
				}
				if (afterStart < text.length && !/[.,!?;:@]/.test(text[afterStart])) {
					let afterEnd = afterStart;
					while (afterEnd < text.length && isWordChar(text[afterEnd])) {
						afterEnd++;
					}
					const afterWord = text.substring(afterStart, afterEnd);
					if (afterWord.length > 0 && isUpperCaseLetter(afterWord[0])) {
						endIndex = afterEnd;
						scanPos = afterEnd;
						continue;
					}
				}
			}

			// Not a name continuation
			break;
		}

		const name = text.substring(i + 1, endIndex);

		// Only add if there's a name (handle "@" at end with no name)
		if (name.length > 0) {
			tokens.push({
				name,
				startIndex: i,
				endIndex
			});

			// Update the last mention end position
			lastMentionEnd = endIndex;
		}
	}

	return tokens;
}

/**
 * Match mention tokens to entities
 *
 * @param tokens - Mention tokens extracted from text
 * @param entities - Available entities to match against
 * @returns Array of resolved mentions with entity IDs
 */
export function matchEntitiesToMentions(
	tokens: MentionToken[],
	entities: EntityStub[]
): ResolvedMention[] {
	if (tokens.length === 0 || entities.length === 0) {
		return [];
	}

	const matches: ResolvedMention[] = [];

	for (const token of tokens) {
		const tokenNameLower = token.name.toLowerCase();

		// Find all matching entities
		const entityMatches: Array<{ entity: EntityStub; score: number }> = [];

		for (const entity of entities) {
			const entityNameLower = entity.name.toLowerCase();

			// Exact match (case-insensitive)
			if (tokenNameLower === entityNameLower) {
				entityMatches.push({ entity, score: 100 });
			}
			// Partial match - entity name contains the mention
			else if (entityNameLower.includes(tokenNameLower)) {
				// Score based on how close to the start and length ratio
				const startIndex = entityNameLower.indexOf(tokenNameLower);
				const lengthRatio = token.name.length / entity.name.length;
				const score = 80 - startIndex * 2 + lengthRatio * 10;
				entityMatches.push({ entity, score });
			}
			// Partial match - mention contains the entity name
			else if (tokenNameLower.includes(entityNameLower)) {
				// Prefer exact matches, so score lower
				const score = 70;
				entityMatches.push({ entity, score });
			}
		}

		// Sort by score descending and add to matches
		entityMatches.sort((a, b) => b.score - a.score);

		// Return only the best match per token
		if (entityMatches.length > 0) {
			const best = entityMatches[0];
			matches.push({
				entityId: best.entity.id,
				entityName: best.entity.name,
				entityType: best.entity.type,
				matchScore: best.score
			});
		}
	}

	return matches;
}

/**
 * Fuzzy/partial match for autocomplete
 *
 * @param searchText - Partial text after "@"
 * @param entities - Available entities to match against
 * @returns Filtered and ranked entity matches
 */
export function resolvePartialMention(
	searchText: string,
	entities: EntityStub[]
): EntityStub[] {
	// Trim whitespace from search text
	const trimmedSearch = searchText.trim();

	// If search is empty, return all entities (with some ordering)
	if (!trimmedSearch) {
		return [...entities].sort((a, b) => a.name.localeCompare(b.name));
	}

	const searchLower = trimmedSearch.toLowerCase();

	// Find matching entities with scores
	const matches: Array<{ entity: EntityStub; score: number }> = [];

	for (const entity of entities) {
		const nameLower = entity.name.toLowerCase();

		// Prefix match (highest score)
		if (nameLower.startsWith(searchLower)) {
			// Shorter names rank higher for same prefix
			const score = 1000 - entity.name.length;
			matches.push({ entity, score });
		}
		// Substring match (lower score)
		else if (nameLower.includes(searchLower)) {
			// Score based on position of match (earlier is better)
			const position = nameLower.indexOf(searchLower);
			const score = 500 - position;
			matches.push({ entity, score });
		}
	}

	// Sort by score descending, then by name for consistency
	matches.sort((a, b) => {
		if (b.score !== a.score) {
			return b.score - a.score;
		}
		return a.entity.name.localeCompare(b.entity.name);
	});

	// Limit results to 50
	const limited = matches.slice(0, 50);

	return limited.map(m => m.entity);
}
