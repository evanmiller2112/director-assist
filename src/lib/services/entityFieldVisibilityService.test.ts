/**
 * Tests for Entity Field Visibility Service (TDD RED Phase)
 * GitHub Issue #438: Per-entity field visibility toggle checkboxes in entity editor
 *
 * Tests the helper service functions for managing per-entity field visibility
 * overrides. These functions support the FieldVisibilityToggle component which
 * provides a three-state cycling UI (inherit -> include -> exclude -> inherit).
 *
 * Functions under test:
 * - getFieldOverrideState: reads override from entity metadata
 * - cycleFieldOverrideState: computes next state in the toggle cycle
 * - setFieldOverride: immutably applies an override to entity metadata
 * - getResolvedFieldVisibility: combines override + category default into final state
 *
 * RED Phase: These tests SHOULD FAIL because the implementation does not exist yet.
 */
import { describe, it, expect } from 'vitest';
import {
	getFieldOverrideState,
	cycleFieldOverrideState,
	setFieldOverride,
	getResolvedFieldVisibility
} from './entityFieldVisibilityService';

// ---------------------------------------------------------------------------
// 1. getFieldOverrideState
// ---------------------------------------------------------------------------
describe('getFieldOverrideState', () => {
	it('returns undefined when no overrides exist in metadata', () => {
		const metadata: Record<string, unknown> = {};
		const result = getFieldOverrideState(metadata, 'occupation');
		expect(result).toBeUndefined();
	});

	it('returns undefined when overrides exist but field is not listed', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { alignment: true }
		};
		const result = getFieldOverrideState(metadata, 'occupation');
		expect(result).toBeUndefined();
	});

	it('returns true when field override is true', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const result = getFieldOverrideState(metadata, 'occupation');
		expect(result).toBe(true);
	});

	it('returns false when field override is false', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: false }
		};
		const result = getFieldOverrideState(metadata, 'occupation');
		expect(result).toBe(false);
	});

	it('returns undefined when metadata is empty object', () => {
		const metadata: Record<string, unknown> = {};
		const result = getFieldOverrideState(metadata, 'notes');
		expect(result).toBeUndefined();
	});

	it('returns undefined when playerExportFieldOverrides is an empty object', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: {}
		};
		const result = getFieldOverrideState(metadata, 'notes');
		expect(result).toBeUndefined();
	});

	it('returns correct value when multiple overrides exist', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: {
				occupation: true,
				secret_plan: false,
				alignment: true
			}
		};
		expect(getFieldOverrideState(metadata, 'occupation')).toBe(true);
		expect(getFieldOverrideState(metadata, 'secret_plan')).toBe(false);
		expect(getFieldOverrideState(metadata, 'alignment')).toBe(true);
		expect(getFieldOverrideState(metadata, 'nonexistent')).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// 2. cycleFieldOverrideState
// ---------------------------------------------------------------------------
describe('cycleFieldOverrideState', () => {
	it('cycles undefined -> true (inherit -> force include)', () => {
		const result = cycleFieldOverrideState(undefined);
		expect(result).toBe(true);
	});

	it('cycles true -> false (force include -> force exclude)', () => {
		const result = cycleFieldOverrideState(true);
		expect(result).toBe(false);
	});

	it('cycles false -> undefined (force exclude -> inherit)', () => {
		const result = cycleFieldOverrideState(false);
		expect(result).toBeUndefined();
	});

	it('completes a full cycle: undefined -> true -> false -> undefined', () => {
		let state: boolean | undefined = undefined;
		state = cycleFieldOverrideState(state);
		expect(state).toBe(true);
		state = cycleFieldOverrideState(state);
		expect(state).toBe(false);
		state = cycleFieldOverrideState(state);
		expect(state).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// 3. setFieldOverride
// ---------------------------------------------------------------------------
describe('setFieldOverride', () => {
	it('adds override to metadata with no existing overrides', () => {
		const metadata: Record<string, unknown> = {};
		const result = setFieldOverride(metadata, 'occupation', true);
		expect(result).toEqual({
			playerExportFieldOverrides: { occupation: true }
		});
	});

	it('adds override to metadata with existing overrides for other fields', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { alignment: true }
		};
		const result = setFieldOverride(metadata, 'occupation', false);
		expect(result).toEqual({
			playerExportFieldOverrides: { alignment: true, occupation: false }
		});
	});

	it('updates existing override', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const result = setFieldOverride(metadata, 'occupation', false);
		expect(result).toEqual({
			playerExportFieldOverrides: { occupation: false }
		});
	});

	it('removes override when value is undefined (cleans up)', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true, alignment: false }
		};
		const result = setFieldOverride(metadata, 'occupation', undefined);
		expect(result).toEqual({
			playerExportFieldOverrides: { alignment: false }
		});
	});

	it('removes entire playerExportFieldOverrides key if last override removed', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const result = setFieldOverride(metadata, 'occupation', undefined);
		expect(result).toEqual({});
		expect('playerExportFieldOverrides' in result).toBe(false);
	});

	it('does not mutate original metadata', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const originalMetadata = JSON.parse(JSON.stringify(metadata));
		setFieldOverride(metadata, 'occupation', false);
		expect(metadata).toEqual(originalMetadata);
	});

	it('does not mutate original overrides object', () => {
		const overrides = { occupation: true, alignment: false };
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: overrides
		};
		setFieldOverride(metadata, 'occupation', false);
		expect(overrides).toEqual({ occupation: true, alignment: false });
	});

	it('preserves other metadata keys', () => {
		const metadata: Record<string, unknown> = {
			someOtherKey: 'preserved-value',
			anotherKey: 42,
			playerExportFieldOverrides: { alignment: true }
		};
		const result = setFieldOverride(metadata, 'occupation', true);
		expect(result).toEqual({
			someOtherKey: 'preserved-value',
			anotherKey: 42,
			playerExportFieldOverrides: { alignment: true, occupation: true }
		});
	});

	it('preserves other metadata keys when removing last override', () => {
		const metadata: Record<string, unknown> = {
			someOtherKey: 'preserved-value',
			playerExportFieldOverrides: { occupation: true }
		};
		const result = setFieldOverride(metadata, 'occupation', undefined);
		expect(result).toEqual({
			someOtherKey: 'preserved-value'
		});
	});

	it('handles setting override to true on metadata without overrides key', () => {
		const metadata: Record<string, unknown> = {
			someOtherKey: 'value'
		};
		const result = setFieldOverride(metadata, 'notes', true);
		expect(result).toEqual({
			someOtherKey: 'value',
			playerExportFieldOverrides: { notes: true }
		});
	});

	it('handles removing override when no overrides key exists (no-op, returns clean copy)', () => {
		const metadata: Record<string, unknown> = {
			someOtherKey: 'value'
		};
		const result = setFieldOverride(metadata, 'notes', undefined);
		expect(result).toEqual({
			someOtherKey: 'value'
		});
	});
});

// ---------------------------------------------------------------------------
// 4. getResolvedFieldVisibility
// ---------------------------------------------------------------------------
describe('getResolvedFieldVisibility', () => {
	it('override true -> visible:true, isOverridden:true', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', false);
		expect(result).toEqual({ visible: true, isOverridden: true });
	});

	it('override false -> visible:false, isOverridden:true', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: false }
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', true);
		expect(result).toEqual({ visible: false, isOverridden: true });
	});

	it('no override + categoryDefault true -> visible:true, isOverridden:false', () => {
		const metadata: Record<string, unknown> = {};
		const result = getResolvedFieldVisibility(metadata, 'occupation', true);
		expect(result).toEqual({ visible: true, isOverridden: false });
	});

	it('no override + categoryDefault false -> visible:false, isOverridden:false', () => {
		const metadata: Record<string, unknown> = {};
		const result = getResolvedFieldVisibility(metadata, 'occupation', false);
		expect(result).toEqual({ visible: false, isOverridden: false });
	});

	it('override true with categoryDefault true -> visible:true, isOverridden:true', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: true }
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', true);
		expect(result).toEqual({ visible: true, isOverridden: true });
	});

	it('override false with categoryDefault false -> visible:false, isOverridden:true', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { occupation: false }
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', false);
		expect(result).toEqual({ visible: false, isOverridden: true });
	});

	it('empty overrides object treated as no override', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: {}
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', true);
		expect(result).toEqual({ visible: true, isOverridden: false });
	});

	it('override for different field does not affect queried field', () => {
		const metadata: Record<string, unknown> = {
			playerExportFieldOverrides: { alignment: true }
		};
		const result = getResolvedFieldVisibility(metadata, 'occupation', false);
		expect(result).toEqual({ visible: false, isOverridden: false });
	});
});
