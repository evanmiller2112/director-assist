# Field Types API

This document describes the field type utilities that power Director Assist's custom entity system.

## Overview

The field types system provides comprehensive support for 14 different field types, from simple text inputs to complex computed fields. These utilities handle field type normalization, metadata management, and formula evaluation for computed fields.

**Module**: `/src/lib/utils/fieldTypes.ts`

## Field Types

Director Assist supports 14 field types divided into categories:

### Basic Types
- **text**: Single-line text input
- **number**: Numeric values (integers or decimals)
- **boolean**: True/false checkbox

### Text Types
- **textarea**: Multi-line text input
- **richtext**: Markdown-enabled rich text editor

### Selection Types
- **select**: Single selection from dropdown
- **multi-select**: Multiple selection from list
- **tags**: Tag input for creating multiple tags

### Reference Types
- **entity-ref**: Reference to a single entity
- **entity-refs**: References to multiple entities

### Special Types
- **date**: Date picker
- **url**: URL input with validation
- **image**: Image upload and display

### Advanced Types
- **computed**: Calculated field based on formula

## Type Definitions

```typescript
type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'tags'
  | 'entity-ref'
  | 'entity-refs'
  | 'date'
  | 'url'
  | 'image'
  | 'computed';

interface ComputedFieldConfig {
  formula: string;              // Formula with {fieldName} placeholders
  dependencies: string[];       // Field keys this formula depends on
  outputType: 'text' | 'number' | 'boolean'; // Result type
}
```

## FIELD_TYPE_METADATA

Comprehensive metadata for all field types, providing human-readable information for UI and documentation.

**Type**: `Record<FieldType, { label: string; category: string; description: string }>`

### Structure

Each field type has three metadata properties:

- **label**: Human-readable display name
- **category**: Category for grouping in UI
- **description**: Detailed explanation of the field's purpose

### Categories

- **Basic**: Fundamental field types (text, number, boolean)
- **Text**: Text-based fields (textarea, richtext)
- **Selection**: Choice-based fields (select, multi-select, tags)
- **Reference**: Entity linking fields (entity-ref, entity-refs)
- **Special**: Specialized fields (date, url, image)
- **Advanced**: Complex fields (computed)

### Usage Example

```typescript
import { FIELD_TYPE_METADATA } from '$lib/utils/fieldTypes';

// Get metadata for a field type
const textMeta = FIELD_TYPE_METADATA.text;
console.log(textMeta.label);       // "Text"
console.log(textMeta.category);    // "Basic"
console.log(textMeta.description); // "Single line text input..."

// List all field types in a category
const basicFields = Object.entries(FIELD_TYPE_METADATA)
  .filter(([_, meta]) => meta.category === 'Basic')
  .map(([type, _]) => type);
// ['text', 'number', 'boolean']
```

### Complete Metadata Reference

| Type | Label | Category | Description |
|------|-------|----------|-------------|
| text | Text | Basic | Single line text input for short text values |
| textarea | Text Area | Text | Multi-line text input for longer text values |
| richtext | Rich Text | Text | Markdown-enabled rich text editor for formatted content |
| number | Number | Basic | Numeric input for integer or decimal values |
| boolean | Boolean | Basic | Checkbox for true/false values |
| select | Select | Selection | Dropdown menu for selecting a single option from a list |
| multi-select | Multi-Select | Selection | Multiple selection from a list of options |
| tags | Tags | Selection | Tag input for creating and selecting multiple tags |
| entity-ref | Entity Reference | Reference | Reference to a single entity in the database |
| entity-refs | Entity References | Reference | References to multiple entities in the database |
| date | Date | Special | Date picker for selecting dates |
| url | URL | Special | URL input with validation and link preview |
| image | Image | Special | Image upload and display |
| computed | Computed | Advanced | Calculated field based on formula and other field values |

## normalizeFieldType()

Converts field type aliases to their canonical types for backward compatibility and flexibility.

### Signature

```typescript
function normalizeFieldType(type: string): FieldType
```

### Parameters

- **type** (`string`): The field type to normalize (may be an alias)

### Returns

- **FieldType**: The canonical field type

### Supported Aliases

| Alias | Normalized To |
|-------|---------------|
| `short-text` | `text` |
| `long-text` | `textarea` |

All other types are returned unchanged.

### Usage Example

```typescript
import { normalizeFieldType } from '$lib/utils/fieldTypes';

// Normalize aliases
normalizeFieldType('short-text');  // Returns: 'text'
normalizeFieldType('long-text');   // Returns: 'textarea'

// Standard types pass through
normalizeFieldType('text');        // Returns: 'text'
normalizeFieldType('richtext');    // Returns: 'richtext'
normalizeFieldType('computed');    // Returns: 'computed'
```

### Why Use Aliases?

Aliases provide semantic clarity in field definitions. "short-text" and "long-text" are more descriptive than "text" and "textarea" when defining custom entity types, while still mapping to standard input controls.

## evaluateComputedField()

Evaluates a computed field formula by replacing field references with actual values and calculating the result.

### Signature

```typescript
function evaluateComputedField(
  config: ComputedFieldConfig,
  fields: Record<string, any>
): any
```

### Parameters

- **config** (`ComputedFieldConfig`): The computed field configuration
  - **formula** (`string`): Formula with `{fieldName}` placeholders
  - **dependencies** (`string[]`): Field keys used in the formula
  - **outputType** (`'text' | 'number' | 'boolean'`): Type of the result
- **fields** (`Record<string, any>`): Current field values

### Returns

- **any**: The computed result, converted to `outputType`
- **null**: If any dependency is missing or undefined

### Behavior

1. **Dependency Check**: Returns `null` if any dependency is missing or `null`/`undefined`
2. **Formula Type Detection**: Determines if formula is a string template or arithmetic/boolean expression
3. **String Template**: If no arithmetic operators, treats as simple string substitution
4. **Arithmetic Expression**: If operators found, evaluates as JavaScript expression
5. **Type Conversion**: Converts result to specified `outputType`
6. **Error Handling**: Throws error if formula evaluation fails

### Formula Syntax

#### String Templates

Formulas without arithmetic operators are treated as string templates:

```typescript
// Simple concatenation
formula: "{firstName} {lastName}"
// With literal text
formula: "Level {level} {class}"
// Pure text (if dependencies match)
formula: "Status: {status}"
```

#### Arithmetic Expressions

Formulas with operators (`+`, `-`, `*`, `/`, `>`, `<`, `>=`, `<=`, `==`, `!=`, `()`) are evaluated as expressions:

```typescript
// Simple arithmetic
formula: "{level} * 10"
// Complex calculation
formula: "({level} * 8) + ({constitution} * 2)"
// Comparisons (boolean result)
formula: "{hp} > 0"
formula: "{level} >= 5"
// Combined operations
formula: "({strength} + {dexterity}) / 2"
```

### Output Types

The `outputType` determines how the result is converted:

- **text**: Converts to string (default for string templates)
- **number**: Converts to number (parses numeric strings)
- **boolean**: Converts to boolean (truthy/falsy evaluation)

### Usage Examples

#### String Concatenation

```typescript
const config = {
  formula: "{firstName} {lastName}",
  dependencies: ['firstName', 'lastName'],
  outputType: 'text'
};

const fields = {
  firstName: 'Elena',
  lastName: 'Thornvale'
};

evaluateComputedField(config, fields);
// Returns: "Elena Thornvale"
```

#### Numeric Calculation

```typescript
const config = {
  formula: "{level} * 10",
  dependencies: ['level'],
  outputType: 'number'
};

const fields = { level: 5 };

evaluateComputedField(config, fields);
// Returns: 50
```

#### Complex Formula

```typescript
const config = {
  formula: "({level} * 8) + ({constitution} * 2)",
  dependencies: ['level', 'constitution'],
  outputType: 'number'
};

const fields = {
  level: 5,
  constitution: 14
};

evaluateComputedField(config, fields);
// Returns: 68 (5*8 + 14*2 = 40 + 28)
```

#### Boolean Expression

```typescript
const config = {
  formula: "{hp} > 0",
  dependencies: ['hp'],
  outputType: 'boolean'
};

const fields = { hp: 25 };

evaluateComputedField(config, fields);
// Returns: true
```

#### Missing Dependencies

```typescript
const config = {
  formula: "{strength} + {dexterity}",
  dependencies: ['strength', 'dexterity'],
  outputType: 'number'
};

const fields = { strength: 10 }; // dexterity missing

evaluateComputedField(config, fields);
// Returns: null
```

### Edge Cases

**Empty Formula**
```typescript
evaluateComputedField({ formula: '', dependencies: [], outputType: 'text' }, {});
// Returns: ""
```

**No Dependencies**
```typescript
evaluateComputedField({ formula: "Static Text", dependencies: [], outputType: 'text' }, {});
// Returns: "Static Text"
```

**String Values in Arithmetic**
```typescript
const config = {
  formula: "{prefix} + {suffix}",
  dependencies: ['prefix', 'suffix'],
  outputType: 'text'
};

const fields = { prefix: 'Hello', suffix: 'World' };

evaluateComputedField(config, fields);
// Returns: "HelloWorld" (string concatenation in eval)
```

### Security Notes

This function uses `eval()` for arithmetic expression evaluation. This is safe because:

1. Formulas are created by trusted users (campaign directors) in their local environment
2. All data stays in the browser (no server-side execution)
3. Field values are properly escaped (strings are quoted, others converted to safe types)

Do not use this function with untrusted formula inputs in a server environment.

## Components

### FieldInput

Dynamic form input component that renders the appropriate control for any field type.

**Location**: `/src/lib/components/entity/FieldInput.svelte`

**Props**:
- `field` (`FieldDefinition`): Field definition including type, options, and validation
- `value` (`FieldValue`): Current field value (bindable)
- `onchange` (`(value: FieldValue) => void`): Value change handler
- `disabled` (`boolean`): Disable input
- `error` (`string`): Validation error message
- `allFields` (`Record<string, any>`): All fields for computed field evaluation

**Features**:
- Type-specific input rendering
- Validation and error display
- AI generation integration
- Computed field auto-calculation
- Accessibility support (ARIA labels, error descriptions)

### FieldRenderer

Read-only display component that formats field values for viewing.

**Location**: `/src/lib/components/entity/FieldRenderer.svelte`

**Props**:
- `field` (`FieldDefinition`): Field definition
- `value` (`FieldValue`): Value to display
- `allFields` (`Record<string, any>`): All fields for computed field evaluation
- `compact` (`boolean`): Compact display mode

**Features**:
- Type-specific formatting
- Rich text rendering
- Entity reference links
- Computed field evaluation
- Empty state handling

## Best Practices

### Defining Field Types

Use specific field types for better UX:

```typescript
// Good: Specific types
{ key: 'email', type: 'text' }  // Could validate as email
{ key: 'bio', type: 'textarea' }
{ key: 'notes', type: 'richtext' }

// Avoid: Generic types everywhere
{ key: 'everything', type: 'textarea' }
```

### Computed Fields

Keep formulas simple and focused:

```typescript
// Good: Simple, clear formula
{
  key: 'fullName',
  type: 'computed',
  computedConfig: {
    formula: "{firstName} {lastName}",
    dependencies: ['firstName', 'lastName'],
    outputType: 'text'
  }
}

// Avoid: Complex nested logic
{
  formula: "({a} > 10 ? {b} : {c}) + ({d} * 2)", // Too complex
  // Consider breaking into multiple computed fields instead
}
```

### Field Metadata

Always provide helpful metadata:

```typescript
{
  key: 'hp',
  label: 'Hit Points',
  type: 'number',
  helpText: 'Current hit points (0 = unconscious)',
  placeholder: '25',
  required: false
}
```

### Dependency Management

Computed fields must list all dependencies:

```typescript
// Correct: All fields in formula are in dependencies
{
  formula: "{level} * {hitDie}",
  dependencies: ['level', 'hitDie']  // Both listed
}

// Error: Missing dependency
{
  formula: "{level} * {hitDie}",
  dependencies: ['level']  // hitDie missing - validation will fail
}
```

## Related Documentation

- [Entity Type Validation API](./ENTITY_TYPE_VALIDATION.md) - Validation utilities
- [Custom Entity Types User Guide](../USER_GUIDE.md#custom-entity-types) - End-user documentation
- [Type Definitions](../../src/lib/types/entities.ts) - TypeScript type definitions
