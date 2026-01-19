# Open Campaign Format (OCF) Specification

**Version**: 0.1.0 (Draft)
**Status**: Proposal
**Last Updated**: 2025-01-19

## Overview

The Open Campaign Format (OCF) is an open JSON schema for TTRPG campaign data. It provides a portable, tool-agnostic way to store and exchange campaign information including entities, relationships, conversations, and metadata.

### Goals

- **Portability**: Move campaigns between tools without data loss
- **Completeness**: Capture everything needed to reconstruct a campaign
- **Extensibility**: Support custom entity types and fields without breaking compatibility
- **Simplicity**: JSON-based, human-readable, easy to implement

### Non-Goals

- Real-time sync protocol (separate spec)
- Binary/compressed format (use gzip on JSON if needed)
- Game system rules (OCF stores data, not mechanics)

---

## File Structure

An OCF file is a single JSON document with the `.ocf.json` extension.

```json
{
  "ocf": "0.1.0",
  "exportedAt": "2025-01-19T12:00:00.000Z",
  "generator": {
    "name": "Director Assist",
    "version": "0.6.1",
    "url": "https://github.com/evanmiller2112/director-assist"
  },
  "campaign": { ... },
  "entities": [ ... ],
  "conversations": [ ... ],
  "messages": [ ... ]
}
```

---

## Schema Definition

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ocf` | string | Yes | OCF spec version (semver) |
| `exportedAt` | string (ISO 8601) | Yes | Export timestamp |
| `generator` | Generator | No | Tool that created this file |
| `campaign` | Campaign | Yes | Campaign metadata |
| `entities` | Entity[] | Yes | All campaign entities |
| `conversations` | Conversation[] | No | Chat conversation metadata |
| `messages` | Message[] | No | Chat messages |

### Generator

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Application name |
| `version` | string | No | Application version |
| `url` | string | No | Application URL |

### Campaign

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Campaign name |
| `description` | string | No | Campaign description |
| `system` | string | No | Game system (e.g., "Draw Steel", "D&D 5e") |
| `systemId` | string | No | Machine-readable system ID |
| `setting` | string | No | Campaign setting name |
| `createdAt` | string (ISO 8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO 8601) | Yes | Last update timestamp |
| `customEntityTypes` | EntityTypeDefinition[] | No | User-defined entity types |
| `entityTypeOverrides` | EntityTypeOverride[] | No | Customizations to built-in types |
| `settings` | CampaignSettings | No | Campaign-level settings |

### Entity

The core data unit. Entities represent characters, locations, factions, items, and any other campaign element.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `type` | string | Yes | Entity type (e.g., "npc", "location", "custom_type") |
| `name` | string | Yes | Display name |
| `description` | string | No | Rich text description (Markdown) |
| `summary` | string | No | Brief summary for quick reference |
| `tags` | string[] | No | Categorization tags |
| `imageUrl` | string | No | URL or data URI for entity image |
| `fields` | object | No | Dynamic field values (key-value pairs) |
| `links` | EntityLink[] | No | Relationships to other entities |
| `notes` | string | No | Private GM notes (Markdown) |
| `playerVisible` | boolean | No | Whether players can see this entity (default: true) |
| `createdAt` | string (ISO 8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO 8601) | Yes | Last update timestamp |
| `metadata` | object | No | Extensible metadata |

### EntityLink

Relationships between entities.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Link identifier |
| `targetId` | string | Yes | ID of the related entity |
| `targetType` | string | Yes | Type of the related entity |
| `relationship` | string | Yes | Relationship type (e.g., "member_of", "located_at") |
| `bidirectional` | boolean | No | Whether the link applies both ways (default: false) |
| `reverseRelationship` | string | No | Inverse relationship name (e.g., "patron_of" / "client_of") |
| `notes` | string | No | Notes about this relationship |
| `strength` | string | No | "strong", "moderate", or "weak" |
| `playerVisible` | boolean | No | Whether players can see this link (default: true) |
| `createdAt` | string (ISO 8601) | No | Creation timestamp |
| `updatedAt` | string (ISO 8601) | No | Last update timestamp |
| `metadata` | object | No | Extensible metadata (tags, tension, etc.) |

### EntityTypeDefinition

Defines a custom entity type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Type identifier |
| `label` | string | Yes | Singular display name |
| `labelPlural` | string | Yes | Plural display name |
| `description` | string | No | Type description |
| `icon` | string | No | Icon identifier |
| `color` | string | No | Display color (hex or CSS color) |
| `isBuiltIn` | boolean | No | Whether this is a built-in type |
| `fieldDefinitions` | FieldDefinition[] | No | Fields for this entity type |
| `defaultRelationships` | string[] | No | Common relationship types |

### FieldDefinition

Defines a field within an entity type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Field identifier |
| `label` | string | Yes | Display label |
| `type` | string | Yes | Field type (see below) |
| `required` | boolean | No | Whether field is required (default: false) |
| `defaultValue` | any | No | Default value |
| `options` | string[] | No | Options for select/multi-select |
| `placeholder` | string | No | Placeholder text |
| `helpText` | string | No | Help text for users |
| `section` | string | No | UI section grouping |
| `order` | number | No | Display order |

**Field Types**: `text`, `textarea`, `richtext`, `number`, `boolean`, `select`, `multi-select`, `tags`, `entity-ref`, `entity-refs`, `date`, `url`, `image`, `computed`

### EntityTypeOverride

Customizations applied to built-in entity types.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | The built-in type being customized |
| `hiddenFromSidebar` | boolean | No | Hide from navigation |
| `hiddenFields` | string[] | No | Fields to hide |
| `fieldOrder` | string[] | No | Custom field ordering |
| `additionalFields` | FieldDefinition[] | No | Extra fields to add |

### CampaignSettings

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customRelationships` | string[] | No | Custom relationship types |
| `enabledEntityTypes` | string[] | No | Entity types shown in UI |
| `theme` | string | No | "light", "dark", or "system" |

### Conversation

Chat conversation metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Conversation name |
| `createdAt` | string (ISO 8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO 8601) | Yes | Last update timestamp |

### Message

Individual chat message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `conversationId` | string | No | Parent conversation ID |
| `role` | string | Yes | "user" or "assistant" |
| `content` | string | Yes | Message content (Markdown) |
| `timestamp` | string (ISO 8601) | Yes | Message timestamp |
| `contextEntities` | string[] | No | Entity IDs used as context |
| `generationType` | string | No | Type of generation request |
| `generatedEntityId` | string | No | ID of entity created from this message |

---

## Built-in Entity Types

OCF defines these standard entity types. Implementations should recognize them:

| Type | Description |
|------|-------------|
| `character` | Player characters |
| `npc` | Non-player characters |
| `location` | Places in the world |
| `faction` | Organizations, groups, nations |
| `item` | Objects, artifacts, equipment |
| `encounter` | Combat or social encounters |
| `session` | Session notes and recaps |
| `deity` | Gods and divine beings |
| `timeline_event` | Historical or future events |
| `world_rule` | Setting rules and lore |
| `player_profile` | Real-world player info |

Custom types use any other string identifier.

---

## Example

```json
{
  "ocf": "0.1.0",
  "exportedAt": "2025-01-19T15:30:00.000Z",
  "generator": {
    "name": "Director Assist",
    "version": "0.6.1"
  },
  "campaign": {
    "id": "camp_abc123",
    "name": "The Sunken Kingdoms",
    "description": "A campaign of underwater exploration and ancient mysteries.",
    "system": "Draw Steel",
    "systemId": "draw-steel",
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2025-01-15T20:00:00.000Z",
    "customEntityTypes": [],
    "entityTypeOverrides": [],
    "settings": {
      "customRelationships": ["rival_of", "apprentice_of"],
      "enabledEntityTypes": ["character", "npc", "location", "faction", "encounter", "session"]
    }
  },
  "entities": [
    {
      "id": "ent_npc001",
      "type": "npc",
      "name": "Captain Mira Deepvale",
      "description": "A weathered sea captain with knowledge of the sunken kingdoms.",
      "tags": ["ally", "seafarer"],
      "fields": {
        "occupation": "Ship Captain",
        "ancestry": "Human"
      },
      "links": [
        {
          "targetId": "ent_loc001",
          "targetType": "location",
          "relationship": "operates_from",
          "bidirectional": false
        },
        {
          "targetId": "ent_fac001",
          "targetType": "faction",
          "relationship": "member_of",
          "bidirectional": true,
          "reverseRelationship": "has_member"
        }
      ],
      "notes": "Secretly searching for her lost brother in the depths.",
      "playerVisible": true,
      "createdAt": "2024-06-15T14:00:00.000Z",
      "updatedAt": "2025-01-10T09:30:00.000Z",
      "metadata": {}
    },
    {
      "id": "ent_loc001",
      "type": "location",
      "name": "Port Amaranth",
      "description": "A bustling port city built on ancient ruins.",
      "tags": ["city", "coastal", "starting-location"],
      "fields": {},
      "links": [],
      "notes": "",
      "playerVisible": true,
      "createdAt": "2024-06-01T10:30:00.000Z",
      "updatedAt": "2024-06-01T10:30:00.000Z",
      "metadata": {}
    },
    {
      "id": "ent_fac001",
      "type": "faction",
      "name": "The Tide Wardens",
      "description": "A guild of sailors and explorers who chart the sunken kingdoms.",
      "tags": ["guild", "explorers"],
      "fields": {},
      "links": [],
      "notes": "",
      "playerVisible": true,
      "createdAt": "2024-06-10T11:00:00.000Z",
      "updatedAt": "2024-06-10T11:00:00.000Z",
      "metadata": {}
    }
  ],
  "conversations": [
    {
      "id": "conv_001",
      "name": "Session 1 Prep",
      "createdAt": "2024-06-14T18:00:00.000Z",
      "updatedAt": "2024-06-14T19:30:00.000Z"
    }
  ],
  "messages": [
    {
      "id": "msg_001",
      "conversationId": "conv_001",
      "role": "user",
      "content": "Generate a hook to introduce Captain Mira to the party.",
      "timestamp": "2024-06-14T18:05:00.000Z",
      "contextEntities": ["ent_npc001", "ent_loc001"]
    },
    {
      "id": "msg_002",
      "conversationId": "conv_001",
      "role": "assistant",
      "content": "The party notices a commotion at the docks...",
      "timestamp": "2024-06-14T18:05:30.000Z"
    }
  ]
}
```

---

## Versioning

OCF follows [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to required fields or structure
- **Minor**: New optional fields or features (backward compatible)
- **Patch**: Clarifications or documentation fixes

Implementations should:
- Accept files with matching major version
- Ignore unknown fields (forward compatibility)
- Preserve unknown fields on round-trip if possible

---

## Implementation Notes

### For Exporters

1. Always include the `ocf` version field
2. Use ISO 8601 format for all timestamps
3. Include all entities, even if "deleted" (use metadata to flag)
4. Validate entity references exist in the export

### For Importers

1. Check `ocf` version for compatibility
2. Handle missing optional fields gracefully
3. Generate new IDs if importing into existing data (avoid collisions)
4. Preserve unknown fields in metadata when possible

---

## Future Considerations

- **JSON Schema**: Publish formal JSON Schema for validation
- **Compression**: Recommend gzip for large exports
- **Streaming**: Line-delimited JSON variant for large campaigns
- **Encryption**: Optional encryption spec for sensitive data
- **Attachments**: Handling embedded images and files

---

## Contributing

This specification is open for feedback. To propose changes:

1. Open an issue describing the change
2. Discuss with the community
3. Submit a PR with spec updates

The goal is a community-owned standard, not a single-vendor format.
