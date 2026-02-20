/**
 * Suggestion Action Service
 *
 * Executes actions suggested by AI suggestions and maintains a history
 * of executed actions for undo functionality.
 */

import type { AISuggestion } from '$lib/types';
import { entityRepository, suggestionRepository } from '$lib/db/repositories';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'ai-suggestion-action-history';

export interface ActionResult {
	success: boolean;
	message: string;
	affectedEntityIds: string[];
}

export interface ActionHistoryEntry {
	id: string;
	suggestionId: string;
	actionType: string;
	timestamp: Date;
	result: ActionResult;
	undone?: boolean;
	// Store data needed for undo
	undoData?: {
		linkId?: string;
		originalEntityState?: Record<string, unknown>;
		createdEntityId?: string;
		sourceId?: string;
		targetId?: string;
		relationship?: string;
	};
}

/**
 * Load action history from localStorage
 */
function loadHistory(): ActionHistoryEntry[] {
	if (typeof window === 'undefined') {
		return [];
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}

		const parsed = JSON.parse(stored) as ActionHistoryEntry[];
		// Convert timestamp strings back to Date objects
		const history = parsed.map((entry) => ({
			...entry,
			timestamp: new Date(entry.timestamp)
		}));

		return history;
	} catch (error) {
		return [];
	}
}

/**
 * Save action history to localStorage
 */
function saveHistory(history: ActionHistoryEntry[]): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
	} catch (error) {
		console.error('Failed to save action history:', error);
	}
}

/**
 * Add an entry to the action history
 */
function addHistoryEntry(entry: ActionHistoryEntry): void {
	const history = loadHistory();
	history.push(entry);
	saveHistory(history);
}

/**
 * Execute an action from an AI suggestion
 */
export async function executeAction(suggestion: AISuggestion): Promise<ActionResult> {
	const historyEntry: ActionHistoryEntry = {
		id: nanoid(),
		suggestionId: suggestion.id,
		actionType: suggestion.suggestedAction?.actionType || 'unknown',
		timestamp: new Date(),
		result: {
			success: false,
			message: '',
			affectedEntityIds: []
		}
	};

	try {
		// Validate suggestion has an action
		if (!suggestion.suggestedAction) {
			historyEntry.result = {
				success: false,
				message: 'No action specified in suggestion',
				affectedEntityIds: []
			};
			addHistoryEntry(historyEntry);
			return historyEntry.result;
		}

		const { actionType, actionData } = suggestion.suggestedAction;

		let result: ActionResult;

		switch (actionType) {
			case 'create-relationship':
				result = await executeCreateRelationship(actionData, historyEntry);
				break;

			case 'edit-entity':
				result = await executeEditEntity(actionData, historyEntry);
				break;

			case 'create-entity':
				result = await executeCreateEntity(actionData, historyEntry);
				break;

			case 'flag-for-review':
				result = await executeFlagForReview(actionData, historyEntry);
				break;

			default:
				result = {
					success: false,
					message: `Unknown action type: ${actionType}`,
					affectedEntityIds: []
				};
		}

		historyEntry.result = result;

		// Only mark suggestion as accepted if action succeeded
		if (result.success) {
			await suggestionRepository.accept(suggestion.id);
		}

		addHistoryEntry(historyEntry);
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		historyEntry.result = {
			success: false,
			message: `Failed to execute action: ${errorMessage}`,
			affectedEntityIds: []
		};
		addHistoryEntry(historyEntry);
		return historyEntry.result;
	}
}

/**
 * Execute create-relationship action
 */
async function executeCreateRelationship(
	actionData: Record<string, unknown>,
	historyEntry: ActionHistoryEntry
): Promise<ActionResult> {
	// Validate required fields
	const sourceId = actionData.sourceId as string | undefined;
	const targetId = actionData.targetId as string | undefined;
	const relationship = actionData.relationship as string | undefined;

	if (!sourceId || !targetId || !relationship) {
		return {
			success: false,
			message: 'Invalid or missing required fields for relationship creation',
			affectedEntityIds: []
		};
	}

	const bidirectional = (actionData.bidirectional as boolean | undefined) ?? false;
	const notes = actionData.notes as string | undefined;
	const strength = actionData.strength as 'strong' | 'moderate' | 'weak' | undefined;

	// Build metadata from additional fields
	const metadata: Record<string, unknown> = {};
	const standardKeys = ['sourceId', 'targetId', 'relationship', 'bidirectional', 'notes'];
	const additionalKeys = Object.keys(actionData).filter(k => !standardKeys.includes(k));

	for (const key of additionalKeys) {
		metadata[key] = actionData[key];
	}

	try {
		// Call addLink with individual parameters (API returns void)
		await entityRepository.addLink(
			sourceId,
			targetId,
			relationship,
			bidirectional,
			notes,
			strength,
			Object.keys(metadata).length > 0 ? metadata : undefined
		);

		// Store undo data (sourceId, targetId, relationship for removal)
		historyEntry.undoData = {
			sourceId,
			targetId,
			relationship
		};

		return {
			success: true,
			message: 'Relationship created successfully',
			affectedEntityIds: [sourceId, targetId]
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Execute edit-entity action
 */
async function executeEditEntity(
	actionData: Record<string, unknown>,
	historyEntry: ActionHistoryEntry
): Promise<ActionResult> {
	const { entityId, updates } = actionData as any;

	if (!entityId || !updates) {
		return {
			success: false,
			message: 'Invalid or missing required fields for entity edit',
			affectedEntityIds: []
		};
	}

	try {
		// Get original entity state for undo
		const originalEntity = await entityRepository.getById(entityId);
		if (originalEntity) {
			historyEntry.undoData = {
				originalEntityState: {
					name: originalEntity.name,
					fields: originalEntity.fields
				}
			};
		}

		await entityRepository.update(entityId, updates);

		return {
			success: true,
			message: 'Entity updated successfully',
			affectedEntityIds: [entityId]
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Execute create-entity action
 */
async function executeCreateEntity(
	actionData: Record<string, unknown>,
	historyEntry: ActionHistoryEntry
): Promise<ActionResult> {
	const { type, name, fields, links } = actionData as any;

	if (!type || !name) {
		return {
			success: false,
			message: 'Invalid or missing required fields for entity creation',
			affectedEntityIds: []
		};
	}

	try {
		const newEntity = await entityRepository.create({
			type,
			name,
			description: fields?.description || '',
			tags: fields?.tags || [],
			fields: fields || {},
			links: links || [],
			notes: '',
			metadata: {}
		});

		// Store created entity ID for undo
		historyEntry.undoData = {
			createdEntityId: newEntity.id
		};

		return {
			success: true,
			message: 'Entity created successfully',
			affectedEntityIds: [newEntity.id]
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Execute flag-for-review action
 */
async function executeFlagForReview(
	actionData: Record<string, unknown>,
	historyEntry: ActionHistoryEntry
): Promise<ActionResult> {
	const { entityIds, reason, priority } = actionData as any;

	if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
		return {
			success: false,
			message: 'Invalid or missing entity IDs for review flagging',
			affectedEntityIds: []
		};
	}

	try {
		// Flag each entity for review by adding metadata
		for (const entityId of entityIds) {
			const entity = await entityRepository.getById(entityId);
			if (entity) {
				await entityRepository.update(entityId, {
					metadata: {
						...(entity.metadata || {}),
						flaggedForReview: true,
						reviewReason: reason,
						reviewPriority: priority
					}
				});
			}
		}

		return {
			success: true,
			message: 'Entities flagged for review successfully',
			affectedEntityIds: entityIds
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Get action history
 */
export async function getActionHistory(): Promise<ActionHistoryEntry[]> {
	return loadHistory();
}

/**
 * Undo a previously executed action
 */
export async function undoLastAction(historyEntryId: string): Promise<boolean> {
	const history = loadHistory();
	const entry = history.find((e) => e.id === historyEntryId);

	if (!entry) {
		return false;
	}

	// Can't undo if already undone
	if (entry.undone) {
		return false;
	}

	// Can't undo if action failed
	if (!entry.result.success) {
		return false;
	}

	try {
		switch (entry.actionType) {
			case 'create-relationship':
				if (entry.undoData?.sourceId && entry.undoData?.targetId) {
					// Remove the created link using (sourceId, targetId) format
					await entityRepository.removeLink(entry.undoData.sourceId, entry.undoData.targetId);
				}
				break;

			case 'edit-entity':
				if (entry.undoData?.originalEntityState && entry.result.affectedEntityIds[0]) {
					// Restore original entity state
					await entityRepository.update(
						entry.result.affectedEntityIds[0],
						entry.undoData.originalEntityState
					);
				}
				break;

			case 'create-entity':
				if (entry.undoData?.createdEntityId) {
					// Delete the created entity
					await entityRepository.delete(entry.undoData.createdEntityId);
				}
				break;

			case 'flag-for-review':
				// Remove review flags from entities
				for (const entityId of entry.result.affectedEntityIds) {
					const entity = await entityRepository.getById(entityId);
					if (entity && entity.metadata) {
						const metadata = { ...entity.metadata };
						delete metadata.flaggedForReview;
						delete metadata.reviewReason;
						delete metadata.reviewPriority;
						await entityRepository.update(entityId, { metadata });
					}
				}
				break;
		}

		// Revert suggestion status
		await suggestionRepository.update(entry.suggestionId, { status: 'pending' });

		// Mark as undone in history
		entry.undone = true;
		saveHistory(history);

		return true;
	} catch (error) {
		console.error('Failed to undo action:', error);
		return false;
	}
}

/**
 * Clear all action history
 */
export async function clearActionHistory(): Promise<void> {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY);
	}
}
