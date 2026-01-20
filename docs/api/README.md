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

See the [type definitions file](../../src/lib/types/entities.ts) for complete type signatures.

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
