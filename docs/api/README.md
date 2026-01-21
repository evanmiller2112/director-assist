# API Documentation

Technical reference documentation for Director Assist's custom entity type system.

## Overview

This directory contains API documentation for the utilities and components that power Director Assist's custom entity types feature. These documents are intended for developers contributing to the project or advanced users who want to understand the implementation.

## Documentation Structure

### [Field Types API](./FIELD_TYPES.md)

Complete reference for field type utilities and components.

**Contents:**
- `FIELD_TYPE_METADATA` - Metadata for all 14 field types
- `normalizeFieldType()` - Field type alias normalization
- `evaluateComputedField()` - Formula evaluation for computed fields
- `FieldInput` component - Dynamic form input rendering
- `FieldRenderer` component - Read-only field display

**Use this when:**
- Adding support for new field types
- Understanding how field type aliases work
- Implementing computed field formulas
- Working with field input or display components

### [Entity Type Validation API](./ENTITY_TYPE_VALIDATION.md)

Validation utilities for custom entity types and field definitions.

**Contents:**
- `validateEntityTypeDefinition()` - Full entity type validation
- `validateFieldDefinition()` - Single field validation
- `validateTypeKeyUniqueness()` - Type key conflict detection
- `validateComputedFieldFormula()` - Formula syntax validation
- `detectCircularDependencies()` - Circular dependency detection

**Use this when:**
- Creating custom entity type forms
- Implementing validation logic
- Debugging validation errors
- Understanding validation rules and error messages

### Clone and Template Library (Issue #210)

Utilities for cloning entity types, managing field templates, and exporting/importing configurations.

**Contents:**
- `cloneEntityType()` - Deep clone entity types for creating new custom types
- Field template CRUD operations in campaign store
- `exportEntityType()` - Export entity types as JSON
- `exportFieldTemplate()` - Export field templates as JSON
- `validateImport()` - Validate and preview import data

**Use this when:**
- Implementing clone functionality in UI
- Creating field template management UI
- Building export/import workflows
- Sharing entity types between campaigns

## Quick Reference

### Field Types

Director Assist supports 14 field types:

| Type | Module | Description |
|------|--------|-------------|
| text | Basic | Single-line text input |
| textarea | Text | Multi-line text input |
| richtext | Text | Markdown editor |
| number | Basic | Numeric values |
| boolean | Basic | Checkbox |
| select | Selection | Dropdown menu |
| multi-select | Selection | Multiple selection |
| tags | Selection | Tag input |
| entity-ref | Reference | Single entity link |
| entity-refs | Reference | Multiple entity links |
| date | Special | Date picker |
| url | Special | URL input |
| image | Special | Image upload |
| computed | Advanced | Calculated field |

### Key Utilities

**Field Type Utilities** (`/src/lib/utils/fieldTypes.ts`)
```typescript
import { FIELD_TYPE_METADATA, normalizeFieldType, evaluateComputedField } from '$lib/utils/fieldTypes';
```

**Validation Utilities** (`/src/lib/utils/entityTypeValidation.ts`)
```typescript
import {
  validateEntityTypeDefinition,
  validateFieldDefinition,
  validateComputedFieldFormula,
  detectCircularDependencies
} from '$lib/utils/entityTypeValidation';
```

**Clone Utility** (`/src/lib/utils/cloneEntityType.ts`)
```typescript
import { cloneEntityType } from '$lib/utils/cloneEntityType';
```

**Export/Import Service** (`/src/lib/services/entityTypeExportService.ts`)
```typescript
import {
  exportEntityType,
  exportFieldTemplate,
  validateImport,
  EXPORT_VERSION
} from '$lib/services/entityTypeExportService';
```

**Campaign Store** (`/src/lib/stores/campaign.svelte.ts`)
```typescript
import { campaignStore } from '$lib/stores/campaign.svelte';

// Field template operations
campaignStore.addFieldTemplate(template);
campaignStore.updateFieldTemplate(id, updates);
campaignStore.deleteFieldTemplate(id);
const template = campaignStore.getFieldTemplate(id);
const allTemplates = campaignStore.fieldTemplates;
```

**Components** (`/src/lib/components/entity/`)
```svelte
import FieldInput from '$lib/components/entity/FieldInput.svelte';
import FieldRenderer from '$lib/components/entity/FieldRenderer.svelte';
```

### Common Patterns

**Validating a Custom Entity Type**
```typescript
import { validateEntityTypeDefinition } from '$lib/utils/entityTypeValidation';

const result = validateEntityTypeDefinition(customType, existingTypes);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

**Evaluating a Computed Field**
```typescript
import { evaluateComputedField } from '$lib/utils/fieldTypes';

const value = evaluateComputedField(
  {
    formula: '{level} * 10',
    dependencies: ['level'],
    outputType: 'number'
  },
  { level: 5 }
);
// Returns: 50
```

**Normalizing Field Types**
```typescript
import { normalizeFieldType } from '$lib/utils/fieldTypes';

const type = normalizeFieldType('short-text'); // Returns: 'text'
```

**Cloning an Entity Type**
```typescript
import { cloneEntityType } from '$lib/utils/cloneEntityType';

const original = getEntityType('character');
const cloned = cloneEntityType(original);

// Cloned type has:
// - type: '' (empty, user must provide)
// - label: 'Character (Copy)'
// - labelPlural: 'Characters (Copy)'
// - isBuiltIn: false
// - Deep cloned fieldDefinitions and defaultRelationships
```

**Exporting an Entity Type**
```typescript
import { exportEntityType } from '$lib/services/entityTypeExportService';

const customType = campaignStore.getCustomEntityType('my-custom-type');
const exported = exportEntityType(customType, {
  author: 'Jane Doe',
  license: 'CC-BY-4.0',
  sourceUrl: 'https://example.com'
});

const json = JSON.stringify(exported, null, 2);
// Download or share the JSON
```

**Importing and Validating**
```typescript
import { validateImport } from '$lib/services/entityTypeExportService';

const jsonData = JSON.parse(fileContents);
const existingTypes = campaignStore.customEntityTypes.map(t => t.type);
const result = validateImport(jsonData, existingTypes);

if (result.valid) {
  console.log('Preview:', result.preview);
  // Show preview to user, then import
} else {
  console.error('Validation errors:', result.errors);
}
```

**Working with Field Templates**
```typescript
import { campaignStore } from '$lib/stores/campaign.svelte';

// Create template
const template: FieldTemplate = {
  id: 'combat-stats',
  name: 'Combat Stats',
  description: 'Standard combat statistics',
  category: 'draw-steel',
  fieldDefinitions: [
    { key: 'ac', label: 'AC', type: 'number', required: false, order: 1 },
    { key: 'hp', label: 'HP', type: 'number', required: false, order: 2 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

await campaignStore.addFieldTemplate(template);

// Retrieve template
const retrieved = campaignStore.getFieldTemplate('combat-stats');

// Update template
await campaignStore.updateFieldTemplate('combat-stats', {
  description: 'Updated description'
});

// Delete template
await campaignStore.deleteFieldTemplate('combat-stats');

// Get all templates
const allTemplates = campaignStore.fieldTemplates;
```

## Type Definitions

Core types are defined in `/src/lib/types/entities.ts`:

**Key Types:**
- `EntityType` - Entity type identifiers
- `FieldType` - Field type identifiers
- `FieldValue` - Field value types
- `FieldDefinition` - Field configuration
- `EntityTypeDefinition` - Entity type configuration
- `ComputedFieldConfig` - Computed field configuration
- `ValidationResult` - Validation result structure

**Clone and Template Types** (`/src/lib/types/campaign.ts` and `/src/lib/types/entityTypeExport.ts`):
- `FieldTemplate` - Field template definition
- `CampaignMetadata` - Campaign metadata including field templates
- `EntityTypeExport` - Export format for entity types and templates
- `ImportValidationResult` - Import validation result with preview

See the [type definitions files](../../src/lib/types/) for complete type signatures.

### FieldTemplate Interface

```typescript
interface FieldTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description?: string;          // Usage description
  category: string;              // Organization category (e.g., 'draw-steel', 'user')
  fieldDefinitions: FieldDefinition[];  // Field definitions in template
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

### EntityTypeExport Interface

```typescript
interface EntityTypeExport {
  version: '1.0.0';             // Export format version
  exportedAt: Date;             // Export timestamp
  generator: {
    name: 'Director Assist';    // Application name
    version: string;            // Application version
  };
  type: 'entity-type' | 'field-template';  // Export type
  data: EntityTypeDefinition | FieldTemplate;  // Exported data
  metadata: {
    author?: string;            // Creator attribution
    sourceUrl?: string;         // Original source
    license?: string;           // License (e.g., 'CC-BY-4.0', 'MIT')
    [key: string]: unknown;     // Additional custom metadata
  };
}
```

### ImportValidationResult Interface

```typescript
interface ImportValidationResult {
  valid: boolean;                // Whether import data is valid
  errors: string[];              // Critical errors preventing import
  warnings: string[];            // Non-critical warnings
  preview: {
    name: string;                // Name of entity type or template
    type: 'entity-type' | 'field-template';  // Type being imported
    fieldCount: number;          // Number of field definitions
    conflictsWithExisting: boolean;  // Whether conflicts detected
  };
}
```

## Related Documentation

### User Documentation
- [User Guide - Custom Entity Types](../USER_GUIDE.md#custom-entity-types) - End-user documentation
- [Architecture Documentation](../ARCHITECTURE.md) - Overall system architecture

### Developer Documentation
- [Combat System Documentation](../COMBAT_SYSTEM.md) - Combat tracking system for Draw Steel
- [Test Documentation](../../TEST_DOCUMENTATION.md) - Testing patterns and examples
- [Agent Workflow](../AGENT_WORKFLOW.md) - Development workflow

## Examples

### Creating a Custom Entity Type

```typescript
import { validateEntityTypeDefinition } from '$lib/utils/entityTypeValidation';

const questType: EntityTypeDefinition = {
  type: 'quest',
  label: 'Quest',
  labelPlural: 'Quests',
  icon: 'scroll-text',
  color: '#FF9800',
  isBuiltIn: false,
  fieldDefinitions: [
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      order: 0
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['not_started', 'in_progress', 'completed'],
      required: false,
      order: 1
    },
    {
      key: 'summary',
      label: 'Summary',
      type: 'computed',
      required: false,
      order: 2,
      computedConfig: {
        formula: '{title} - {status}',
        dependencies: ['title', 'status'],
        outputType: 'text'
      }
    }
  ],
  defaultRelationships: []
};

// Validate before saving
const result = validateEntityTypeDefinition(questType);

if (result.valid) {
  // Save to database
  await saveEntityType(questType);
} else {
  // Show errors
  console.error(result.errors);
}
```

### Using Field Components

```svelte
<script lang="ts">
  import FieldInput from '$lib/components/entity/FieldInput.svelte';
  import FieldRenderer from '$lib/components/entity/FieldRenderer.svelte';

  let fieldDef = {
    key: 'level',
    label: 'Level',
    type: 'number',
    required: true,
    order: 0
  };

  let value = $state(5);
</script>

<!-- Edit mode -->
<FieldInput
  field={fieldDef}
  bind:value
  onchange={(newValue) => value = newValue}
/>

<!-- Display mode -->
<FieldRenderer
  field={fieldDef}
  {value}
/>
```

## Contributing

When adding new features to the custom entity type system:

1. Update the appropriate utility module (`fieldTypes.ts` or `entityTypeValidation.ts`)
2. Add comprehensive tests (see [TEST_DOCUMENTATION.md](../../TEST_DOCUMENTATION.md))
3. Update API documentation in this directory
4. Update user-facing documentation in [USER_GUIDE.md](../USER_GUIDE.md)
5. Follow the [Agent Workflow](../AGENT_WORKFLOW.md) for contributions

## Support

For questions or issues:

1. Check the relevant API documentation file
2. Review the [User Guide](../USER_GUIDE.md) for end-user perspective
3. Examine test files for usage examples
4. Open an issue on GitHub with specific details

---

**Note**: This documentation reflects the implementation as of Issue #25 (User-Defined Custom Entity Types with Full Field Customization). Features and APIs may evolve in future releases.
