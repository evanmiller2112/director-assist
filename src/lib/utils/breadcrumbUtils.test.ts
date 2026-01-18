/**
 * Tests for Breadcrumb Utility Functions
 *
 * Issue #79: Relationship Navigation Breadcrumbs
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until breadcrumbUtils.ts is properly implemented.
 *
 * These utilities manage the navigation breadcrumb trail when users navigate
 * through relationship chains, allowing them to see where they've been and
 * navigate back through the relationship hierarchy.
 *
 * Covers:
 * - Parsing breadcrumb path from URL parameters
 * - Serializing breadcrumb segments to URL format
 * - Truncating breadcrumb paths to max length
 * - Building navigation URLs with breadcrumb paths
 * - URL encoding/decoding of special characters
 * - Edge cases (null, empty arrays, max length boundaries)
 */

import { describe, it, expect } from 'vitest';
import {
	parseBreadcrumbPath,
	serializeBreadcrumbPath,
	truncatePath,
	buildNavigationUrl,
	type BreadcrumbSegment
} from './breadcrumbUtils';

describe('breadcrumbUtils - parseBreadcrumbPath', () => {
	describe('Valid path parsing', () => {
		it('should parse valid single segment path', () => {
			const result = parseBreadcrumbPath('abc123:allied_with:Gandalf:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			]);
		});

		it('should parse valid multi-segment path', () => {
			const result = parseBreadcrumbPath(
				'abc123:allied_with:Gandalf:npc,def456:resides_at:Rivendell:location'
			);

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				},
				{
					entityId: 'def456',
					relationship: 'resides_at',
					entityName: 'Rivendell',
					entityType: 'location'
				}
			]);
		});

		it('should parse path with URL-encoded characters in relationship name', () => {
			const result = parseBreadcrumbPath('abc123:friend%20of:Sam%20Gamgee:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'friend of',
					entityName: 'Sam Gamgee',
					entityType: 'npc'
				}
			]);
		});

		it('should parse path with URL-encoded characters in entity name', () => {
			const result = parseBreadcrumbPath('xyz789:member_of:The%20Fellowship:faction');

			expect(result).toEqual([
				{
					entityId: 'xyz789',
					relationship: 'member_of',
					entityName: 'The Fellowship',
					entityType: 'faction'
				}
			]);
		});

		it('should parse path with special characters in relationship', () => {
			const result = parseBreadcrumbPath('abc123:son%2Fdaughter_of:Elrond:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'son/daughter_of',
					entityName: 'Elrond',
					entityType: 'npc'
				}
			]);
		});

		it('should parse path with multiple URL-encoded segments', () => {
			const result = parseBreadcrumbPath(
				'id1:rel%201:Name%201:type1,id2:rel%202:Name%202:type2'
			);

			expect(result).toEqual([
				{
					entityId: 'id1',
					relationship: 'rel 1',
					entityName: 'Name 1',
					entityType: 'type1'
				},
				{
					entityId: 'id2',
					relationship: 'rel 2',
					entityName: 'Name 2',
					entityType: 'type2'
				}
			]);
		});

		it('should parse path with numeric entity ID', () => {
			const result = parseBreadcrumbPath('12345:knows:Alice:character');

			expect(result).toEqual([
				{
					entityId: '12345',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'character'
				}
			]);
		});

		it('should parse path with UUID entity ID', () => {
			const result = parseBreadcrumbPath(
				'550e8400-e29b-41d4-a716-446655440000:allied_with:Bob:npc'
			);

			expect(result).toEqual([
				{
					entityId: '550e8400-e29b-41d4-a716-446655440000',
					relationship: 'allied_with',
					entityName: 'Bob',
					entityType: 'npc'
				}
			]);
		});

		it('should preserve order of segments', () => {
			const result = parseBreadcrumbPath('id1:rel1:Name1:type1,id2:rel2:Name2:type2,id3:rel3:Name3:type3');

			expect(result).toHaveLength(3);
			expect(result[0].entityId).toBe('id1');
			expect(result[1].entityId).toBe('id2');
			expect(result[2].entityId).toBe('id3');
		});

		it('should handle entity names with apostrophes', () => {
			const result = parseBreadcrumbPath('abc123:knows:O%27Brien:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: "O'Brien",
					entityType: 'npc'
				}
			]);
		});

		it('should handle entity names with parentheses', () => {
			const result = parseBreadcrumbPath('abc123:knows:Bob%20%28the%20Great%29:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Bob (the Great)',
					entityType: 'npc'
				}
			]);
		});
	});

	describe('Empty and null handling', () => {
		it('should return empty array for null input', () => {
			const result = parseBreadcrumbPath(null);

			expect(result).toEqual([]);
		});

		it('should return empty array for undefined input', () => {
			const result = parseBreadcrumbPath(undefined as any);

			expect(result).toEqual([]);
		});

		it('should return empty array for empty string', () => {
			const result = parseBreadcrumbPath('');

			expect(result).toEqual([]);
		});

		it('should return empty array for whitespace-only string', () => {
			const result = parseBreadcrumbPath('   ');

			expect(result).toEqual([]);
		});
	});

	describe('Malformed input handling', () => {
		it('should handle segment with missing relationship', () => {
			// Malformed: only entityId and entityName
			const result = parseBreadcrumbPath('abc123::Gandalf:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: '',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			]);
		});

		it('should handle segment with missing entity name', () => {
			const result = parseBreadcrumbPath('abc123:allied_with::npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: '',
					entityType: 'npc'
				}
			]);
		});

		it('should handle segment with missing entity type', () => {
			const result = parseBreadcrumbPath('abc123:allied_with:Gandalf:');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: ''
				}
			]);
		});

		it('should handle segment with too few parts', () => {
			const result = parseBreadcrumbPath('abc123:allied_with');

			// Implementation decision: skip malformed segments or return partial data
			// This test documents the expected behavior
			expect(result).toEqual([]);
		});

		it('should handle segment with too many parts', () => {
			const result = parseBreadcrumbPath('abc123:allied_with:Gandalf:npc:extra:parts');

			// Should only use first 4 parts
			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			]);
		});

		it('should handle mixed valid and invalid segments', () => {
			const result = parseBreadcrumbPath('abc123:knows:Alice:npc,invalid,def456:likes:Bob:character');

			// Should skip invalid segment
			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'npc'
				},
				{
					entityId: 'def456',
					relationship: 'likes',
					entityName: 'Bob',
					entityType: 'character'
				}
			]);
		});

		it('should handle trailing comma', () => {
			const result = parseBreadcrumbPath('abc123:knows:Alice:npc,');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'npc'
				}
			]);
		});

		it('should handle leading comma', () => {
			const result = parseBreadcrumbPath(',abc123:knows:Alice:npc');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'npc'
				}
			]);
		});

		it('should handle multiple consecutive commas', () => {
			const result = parseBreadcrumbPath('abc123:knows:Alice:npc,,def456:likes:Bob:character');

			expect(result).toEqual([
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'npc'
				},
				{
					entityId: 'def456',
					relationship: 'likes',
					entityName: 'Bob',
					entityType: 'character'
				}
			]);
		});
	});
});

describe('breadcrumbUtils - serializeBreadcrumbPath', () => {
	describe('Valid serialization', () => {
		it('should serialize single segment to URL format', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:allied_with:Gandalf:npc');
		});

		it('should serialize multiple segments to URL format', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				},
				{
					entityId: 'def456',
					relationship: 'resides_at',
					entityName: 'Rivendell',
					entityType: 'location'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:allied_with:Gandalf:npc,def456:resides_at:Rivendell:location');
		});

		it('should URL-encode spaces in relationship names', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'friend of',
					entityName: 'Sam',
					entityType: 'npc'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:friend%20of:Sam:npc');
		});

		it('should URL-encode spaces in entity names', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'member_of',
					entityName: 'The Fellowship',
					entityType: 'faction'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:member_of:The%20Fellowship:faction');
		});

		it('should URL-encode special characters', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'son/daughter_of',
					entityName: "O'Brien",
					entityType: 'npc'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:son%2Fdaughter_of:O%27Brien:npc');
		});

		it('should serialize segments with UUID IDs', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: '550e8400-e29b-41d4-a716-446655440000',
					relationship: 'knows',
					entityName: 'Alice',
					entityType: 'character'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('550e8400-e29b-41d4-a716-446655440000:knows:Alice:character');
		});

		it('should preserve segment order', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('id1:rel1:Name1:type1,id2:rel2:Name2:type2,id3:rel3:Name3:type3');
		});

		it('should handle parentheses in entity names', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'knows',
					entityName: 'Bob (the Great)',
					entityType: 'npc'
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe('abc123:knows:Bob%20%28the%20Great%29:npc');
		});
	});

	describe('Empty array handling', () => {
		it('should return empty string for empty array', () => {
			const result = serializeBreadcrumbPath([]);

			expect(result).toBe('');
		});

		it('should handle array with empty string values', () => {
			const segments: BreadcrumbSegment[] = [
				{
					entityId: '',
					relationship: '',
					entityName: '',
					entityType: ''
				}
			];

			const result = serializeBreadcrumbPath(segments);

			expect(result).toBe(':::');
		});
	});

	describe('Round-trip consistency', () => {
		it('should be reversible with parseBreadcrumbPath for single segment', () => {
			const original: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'allied_with',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			];

			const serialized = serializeBreadcrumbPath(original);
			const parsed = parseBreadcrumbPath(serialized);

			expect(parsed).toEqual(original);
		});

		it('should be reversible with parseBreadcrumbPath for multiple segments', () => {
			const original: BreadcrumbSegment[] = [
				{
					entityId: 'abc123',
					relationship: 'friend of',
					entityName: 'Sam Gamgee',
					entityType: 'npc'
				},
				{
					entityId: 'def456',
					relationship: 'resides_at',
					entityName: 'The Shire',
					entityType: 'location'
				}
			];

			const serialized = serializeBreadcrumbPath(original);
			const parsed = parseBreadcrumbPath(serialized);

			expect(parsed).toEqual(original);
		});

		it('should be reversible with special characters', () => {
			const original: BreadcrumbSegment[] = [
				{
					entityId: 'xyz789',
					relationship: 'son/daughter_of',
					entityName: "O'Brien (the Elder)",
					entityType: 'npc'
				}
			];

			const serialized = serializeBreadcrumbPath(original);
			const parsed = parseBreadcrumbPath(serialized);

			expect(parsed).toEqual(original);
		});
	});
});

describe('breadcrumbUtils - truncatePath', () => {
	describe('Basic truncation', () => {
		it('should keep all segments when count is under max', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
			];

			const result = truncatePath(segments, 5);

			expect(result).toEqual(segments);
			expect(result).toHaveLength(2);
		});

		it('should keep all segments when count equals max', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
			];

			const result = truncatePath(segments, 3);

			expect(result).toEqual(segments);
			expect(result).toHaveLength(3);
		});

		it('should truncate from start when count exceeds max', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
				{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
				{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' }
			];

			const result = truncatePath(segments, 3);

			// Should keep the MOST RECENT segments (last 3)
			expect(result).toEqual([
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
				{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
				{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' }
			]);
			expect(result).toHaveLength(3);
		});

		it('should keep most recent segment when max is 1', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
			];

			const result = truncatePath(segments, 1);

			expect(result).toEqual([
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
			]);
			expect(result).toHaveLength(1);
		});

		it('should truncate to exact max length', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
				{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
				{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' },
				{ entityId: 'id6', relationship: 'rel6', entityName: 'Name6', entityType: 'type6' },
				{ entityId: 'id7', relationship: 'rel7', entityName: 'Name7', entityType: 'type7' }
			];

			const result = truncatePath(segments, 6);

			expect(result).toHaveLength(6);
			expect(result[0].entityId).toBe('id2'); // First kept segment
			expect(result[5].entityId).toBe('id7'); // Last segment
		});
	});

	describe('Edge cases', () => {
		it('should return empty array for empty input', () => {
			const result = truncatePath([], 5);

			expect(result).toEqual([]);
		});

		it('should handle max length of 0', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' }
			];

			const result = truncatePath(segments, 0);

			expect(result).toEqual([]);
		});

		it('should handle negative max length as 0', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' }
			];

			const result = truncatePath(segments, -5);

			expect(result).toEqual([]);
		});

		it('should handle very large max length', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' }
			];

			const result = truncatePath(segments, 1000);

			expect(result).toEqual(segments);
		});

		it('should not mutate original array', () => {
			const segments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
			];
			const originalLength = segments.length;

			const result = truncatePath(segments, 1);

			expect(segments).toHaveLength(originalLength); // Original unchanged
			expect(result).toHaveLength(1); // Result is truncated
		});
	});
});

describe('breadcrumbUtils - buildNavigationUrl', () => {
	describe('Basic URL building', () => {
		it('should build URL with empty current path', () => {
			const result = buildNavigationUrl(
				'npc',
				'abc123',
				[],
				'allied_with',
				{ id: 'current-id', name: 'Frodo', type: 'character' }
			);

			expect(result).toBe('/entities/npc/abc123?navPath=current-id:allied_with:Frodo:character');
		});

		it('should build URL appending to existing path', () => {
			const currentSegments: BreadcrumbSegment[] = [
				{
					entityId: 'entity1',
					relationship: 'knows',
					entityName: 'Gandalf',
					entityType: 'npc'
				}
			];

			const result = buildNavigationUrl(
				'location',
				'loc123',
				currentSegments,
				'resides_at',
				{ id: 'entity2', name: 'Frodo', type: 'character' }
			);

			expect(result).toBe(
				'/entities/location/loc123?navPath=entity1:knows:Gandalf:npc,entity2:resides_at:Frodo:character'
			);
		});

		it('should URL-encode special characters in relationship', () => {
			const result = buildNavigationUrl(
				'npc',
				'abc123',
				[],
				'friend of',
				{ id: 'current-id', name: 'Sam', type: 'npc' }
			);

			expect(result).toContain('friend%20of');
		});

		it('should URL-encode special characters in entity name', () => {
			const result = buildNavigationUrl(
				'faction',
				'fac123',
				[],
				'member_of',
				{ id: 'current-id', name: 'The Fellowship', type: 'character' }
			);

			expect(result).toContain('The%20Fellowship');
		});

		it('should build correct URL path format', () => {
			const result = buildNavigationUrl(
				'npc',
				'target-id',
				[],
				'knows',
				{ id: 'source-id', name: 'Alice', type: 'character' }
			);

			expect(result).toMatch(/^\/entities\/npc\/target-id\?navPath=/);
		});

		it('should handle multiple existing segments', () => {
			const currentSegments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
			];

			const result = buildNavigationUrl(
				'npc',
				'target-id',
				currentSegments,
				'rel3',
				{ id: 'id3', name: 'Name3', type: 'type3' }
			);

			expect(result).toContain('id1:rel1:Name1:type1,id2:rel2:Name2:type2,id3:rel3:Name3:type3');
		});
	});

	describe('Automatic truncation', () => {
		it('should truncate when adding would exceed max of 6', () => {
			const currentSegments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
				{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
				{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' },
				{ entityId: 'id6', relationship: 'rel6', entityName: 'Name6', entityType: 'type6' }
			];

			const result = buildNavigationUrl(
				'npc',
				'target-id',
				currentSegments,
				'rel7',
				{ id: 'id7', name: 'Name7', type: 'type7' }
			);

			// Should truncate to keep 6 most recent (id2 through id7)
			expect(result).not.toContain('id1');
			expect(result).toContain('id2');
			expect(result).toContain('id7');

			// Count segments in URL
			const pathParam = result.split('navPath=')[1];
			const segments = pathParam.split(',');
			expect(segments).toHaveLength(6);
		});

		it('should keep exactly 6 segments when at capacity', () => {
			const currentSegments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
				{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
				{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
				{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' }
			];

			const result = buildNavigationUrl(
				'npc',
				'target-id',
				currentSegments,
				'rel6',
				{ id: 'id6', name: 'Name6', type: 'type6' }
			);

			const pathParam = result.split('navPath=')[1];
			const segments = pathParam.split(',');
			expect(segments).toHaveLength(6);
		});

		it('should not truncate when under capacity', () => {
			const currentSegments: BreadcrumbSegment[] = [
				{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
				{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
			];

			const result = buildNavigationUrl(
				'npc',
				'target-id',
				currentSegments,
				'rel3',
				{ id: 'id3', name: 'Name3', type: 'type3' }
			);

			const pathParam = result.split('navPath=')[1];
			const segments = pathParam.split(',');
			expect(segments).toHaveLength(3);
			expect(result).toContain('id1'); // Should keep all segments
		});
	});

	describe('Entity type handling', () => {
		it('should handle different entity types in URL path', () => {
			const types = ['npc', 'location', 'faction', 'item', 'quest', 'character'];

			types.forEach((type) => {
				const result = buildNavigationUrl(
					type,
					'target-id',
					[],
					'rel',
					{ id: 'source-id', name: 'Source', type: 'character' }
				);

				expect(result).toContain(`/entities/${type}/target-id`);
			});
		});
	});

	describe('Special character handling', () => {
		it('should handle entity name with parentheses', () => {
			const result = buildNavigationUrl(
				'npc',
				'target-id',
				[],
				'knows',
				{ id: 'source-id', name: 'Bob (the Great)', type: 'npc' }
			);

			expect(result).toContain('Bob%20%28the%20Great%29');
		});

		it('should handle entity name with apostrophes', () => {
			const result = buildNavigationUrl(
				'npc',
				'target-id',
				[],
				'knows',
				{ id: 'source-id', name: "O'Brien", type: 'npc' }
			);

			expect(result).toContain('O%27Brien');
		});

		it('should handle relationship with slashes', () => {
			const result = buildNavigationUrl(
				'npc',
				'target-id',
				[],
				'son/daughter_of',
				{ id: 'source-id', name: 'Alice', type: 'character' }
			);

			expect(result).toContain('son%2Fdaughter_of');
		});
	});

	describe('Edge cases', () => {
		it('should handle empty entity name', () => {
			const result = buildNavigationUrl(
				'npc',
				'target-id',
				[],
				'knows',
				{ id: 'source-id', name: '', type: 'character' }
			);

			expect(result).toMatch(/navPath=source-id:knows::character$/);
		});

		it('should handle UUID entity IDs', () => {
			const result = buildNavigationUrl(
				'npc',
				'550e8400-e29b-41d4-a716-446655440000',
				[],
				'knows',
				{ id: 'abc-123-def-456', name: 'Alice', type: 'character' }
			);

			expect(result).toContain('550e8400-e29b-41d4-a716-446655440000');
			expect(result).toContain('abc-123-def-456');
		});

		it('should handle numeric IDs', () => {
			const result = buildNavigationUrl(
				'npc',
				'12345',
				[],
				'knows',
				{ id: '67890', name: 'Alice', type: 'character' }
			);

			expect(result).toContain('/entities/npc/12345');
			expect(result).toContain('67890:knows');
		});
	});
});
