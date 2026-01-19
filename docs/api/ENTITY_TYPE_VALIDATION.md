# Entity Type Validation API

This document describes the validation utilities for custom entity types and field definitions.

## Overview

The entity type validation system ensures data integrity when creating or modifying custom entity types. It validates entity type definitions, field definitions, and computed field formulas, catching errors before they cause runtime issues.

**Module**: `/src/lib/utils/entityTypeValidation.ts`

## Type Definitions

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface EntityTypeDefinition {
  type: EntityType;
  label: string;
  labelPlural: string;
  description?: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
  fieldDefinitions: FieldDefinition[];
  defaultRelationships: string[];
}

interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue?: FieldValue;
  options?: string[];
  entityTypes?: EntityType[];
  placeholder?: string;
  helpText?: string;
  section?: string;
  order: number;
  aiGenerate?: boolean;
  computedConfig?: ComputedFieldConfig;
}
```

## validateEntityTypeDefinition()

Validates a complete entity type definition, checking required fields, format rules, and field definitions.

### Signature

```typescript
function validateEntityTypeDefinition(
  typeDef: Partial<EntityTypeDefinition>,
  existingCustomTypes?: EntityTypeDefinition[]
): ValidationResult
```

### Parameters

- **typeDef** (`Partial<EntityTypeDefinition>`): Entity type definition to validate
- **existingCustomTypes** (`EntityTypeDefinition[]`): Existing custom types for uniqueness checking

### Returns

- **ValidationResult**: Object with `valid` boolean and `errors` array

### Validation Rules

#### Type Key
- Must be present and non-empty
- Cannot contain spaces
- Must be lowercase
- Must start with a letter
- Can only contain letters, numbers, hyphens, and underscores
- Must be unique (not conflict with built-in or custom types)

#### Required Fields
- `type`: Entity type key (validated above)
- `label`: Display name (cannot be empty)
- `labelPlural`: Plural display name (cannot be empty)
- `icon`: Icon identifier (cannot be empty)
- `color`: Color code (cannot be empty)

#### Field Definitions
- Must be an array
- Cannot have duplicate field keys
- Each field must pass `validateFieldDefinition()`
- Cannot have circular dependencies in computed fields

### Usage Example

```typescript
import { validateEntityTypeDefinition } from '$lib/utils/entityTypeValidation';

const typeDef = {
  type: 'quest',
  label: 'Quest',
  labelPlural: 'Quests',
  icon: 'scroll',
  color: '#4CAF50',
  fieldDefinitions: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'completed', 'failed'],
      required: true,
      order: 0
    }
  ]
};

const result = validateEntityTypeDefinition(typeDef, []);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Error Messages

#### Type Key Errors
- `"Entity type must have a type key"`
- `"Entity type key cannot be empty"`
- `"Entity type key cannot contain spaces"`
- `"Entity type key must be lowercase"`
- `"Entity type key must start with a letter"`
- `"Entity type key can only contain letters, numbers, hyphens, and underscores"`
- `"Entity type key conflicts with a built-in type"`
- `"Entity type key is already in use"`

#### Required Field Errors
- `"Entity type must have a label"`
- `"Entity type label cannot be empty"`
- `"Entity type must have a labelPlural"`
- `"Entity type labelPlural cannot be empty"`
- `"Entity type must have an icon"`
- `"Entity type icon cannot be empty"`
- `"Entity type must have a color"`
- `"Entity type color cannot be empty"`

#### Field Definition Errors
- `"Duplicate field key: <key>"`
- Field-specific errors from `validateFieldDefinition()`
- `"Circular dependency detected in computed fields: <path>"`

## validateFieldDefinition()

Validates a single field definition, checking required properties and type-specific requirements.

### Signature

```typescript
function validateFieldDefinition(
  field: Partial<FieldDefinition>
): ValidationResult
```

### Parameters

- **field** (`Partial<FieldDefinition>`): Field definition to validate

### Returns

- **ValidationResult**: Object with `valid` boolean and `errors` array

### Validation Rules

#### Field Key
- Must be present and non-empty
- Cannot contain spaces
- Must start with a letter
- Can only contain letters, numbers, and underscores
- Case-sensitive (allows both uppercase and lowercase)

#### Required Properties
- `key`: Field identifier (validated above)
- `label`: Display label (cannot be empty)
- `type`: Must be a valid `FieldType`

#### Type-Specific Validation

**Select Fields** (`select`)
- Must have `options` array
- Must have at least one option
- Options cannot be empty strings
- No duplicate options allowed

**Multi-Select Fields** (`multi-select`)
- Must have `options` array
- Must have at least one option

**Entity Reference Fields** (`entity-ref`, `entity-refs`)
- Must have `entityTypes` array
- Must have at least one entity type

**Computed Fields** (`computed`)
- Must have `computedConfig` object
- `computedConfig.formula` cannot be empty
- `computedConfig.dependencies` must be an array
- `computedConfig.outputType` must be specified

### Usage Example

```typescript
import { validateFieldDefinition } from '$lib/utils/entityTypeValidation';

const field = {
  key: 'difficulty',
  label: 'Difficulty',
  type: 'select',
  options: ['easy', 'medium', 'hard'],
  required: false,
  order: 0
};

const result = validateFieldDefinition(field);

if (!result.valid) {
  console.error('Field validation errors:', result.errors);
}
```

### Error Messages

#### Field Key Errors
- `"Field must have a key"`
- `"Field key cannot be empty"`
- `"Field key cannot contain spaces"`
- `"Field key must start with a letter"`
- `"Field key can only contain letters, numbers, and underscores"`

#### Required Property Errors
- `"Field must have a label"`
- `"Field label cannot be empty"`
- `"Field must have a type"`
- `"Field has invalid type: <type>"`

#### Type-Specific Errors

**Select/Multi-Select**
- `"Select field \"<key>\" must have options"`
- `"Select field \"<key>\" must have at least one option"`
- `"Select field \"<key>\" has empty option"`
- `"Select field \"<key>\" has duplicate option: <option>"`
- `"Multi-select field \"<key>\" must have options"`
- `"Multi-select field \"<key>\" must have at least one option"`

**Entity References**
- `"Entity reference field \"<key>\" must have entityTypes"`
- `"Entity reference field \"<key>\" must have at least one entity type"`

**Computed Fields**
- `"Computed field \"<key>\" must have computedConfig"`
- `"Computed field \"<key>\" must have formula"`
- `"Computed field \"<key>\" formula cannot be empty"`
- `"Computed field \"<key>\" must have dependencies array"`
- `"Computed field \"<key>\" must have outputType"`

## validateTypeKeyUniqueness()

Validates that a type key doesn't conflict with built-in or existing custom types.

### Signature

```typescript
function validateTypeKeyUniqueness(
  typeKey: string,
  customTypes?: EntityTypeDefinition[]
): ValidationResult
```

### Parameters

- **typeKey** (`string`): Type key to check
- **customTypes** (`EntityTypeDefinition[]`): Existing custom types

### Returns

- **ValidationResult**: Object with `valid` boolean and `errors` array

### Validation Rules

- Type key must not match any built-in entity type (case-sensitive)
- Type key must not match any existing custom type (case-sensitive)

### Built-In Types

The following type keys are reserved:
- `character`
- `npc`
- `location`
- `faction`
- `item`
- `encounter`
- `session`
- `deity`
- `timeline_event`
- `world_rule`
- `player_profile`
- `campaign`

### Usage Example

```typescript
import { validateTypeKeyUniqueness } from '$lib/utils/entityTypeValidation';

const existingTypes = [
  { type: 'quest', /* ...other properties */ },
  { type: 'magic_spell', /* ...other properties */ }
];

// Check new type key
const result = validateTypeKeyUniqueness('treasure', existingTypes);

if (result.valid) {
  console.log('Type key is available');
} else {
  console.error('Type key conflicts:', result.errors);
}
```

### Error Messages

- `"Type key \"<key>\" conflicts with a built-in type"`
- `"Type key \"<key>\" is already in use"`

## validateComputedFieldFormula()

Validates computed field formula syntax, dependencies, and placeholder references.

### Signature

```typescript
function validateComputedFieldFormula(
  formula: string,
  dependencies: string[],
  allFieldKeys: string[]
): ValidationResult
```

### Parameters

- **formula** (`string`): Formula with `{fieldName}` placeholders
- **dependencies** (`string[]`): Declared field dependencies
- **allFieldKeys** (`string[]`): All available field keys in the entity type

### Returns

- **ValidationResult**: Object with `valid` boolean and `errors` array

### Validation Rules

#### Syntax Validation
- All placeholders must use valid `{fieldName}` syntax
- No unclosed placeholders (matching `{` and `}`)
- Placeholders cannot contain spaces or invalid characters
- Balanced parentheses in formula

#### Dependency Validation
- All placeholders must reference existing fields (in `allFieldKeys`)
- All declared dependencies must be used in the formula
- All fields used in the formula must be in declared dependencies

### Usage Example

```typescript
import { validateComputedFieldFormula } from '$lib/utils/entityTypeValidation';

const formula = "{level} * {hitDie}";
const dependencies = ['level', 'hitDie'];
const allFieldKeys = ['name', 'level', 'hitDie', 'hp'];

const result = validateComputedFieldFormula(formula, dependencies, allFieldKeys);

if (!result.valid) {
  console.error('Formula validation errors:', result.errors);
}
```

### Valid Formulas

```typescript
// String concatenation
"{firstName} {lastName}"

// Arithmetic
"{level} * 10"
"({level} * 8) + ({constitution} * 2)"

// Comparison
"{hp} > 0"
"{level} >= 5"
```

### Invalid Formulas

```typescript
// Unclosed placeholder
"{firstName {lastName}"  // Missing closing brace

// Invalid placeholder syntax
"{ firstName }"          // Spaces not allowed

// Undefined field reference
"{unknownField}"         // Field doesn't exist

// Missing dependency
formula: "{a} + {b}"
dependencies: ['a']       // 'b' not declared

// Unused dependency
formula: "{a}"
dependencies: ['a', 'b']  // 'b' not used

// Unbalanced parentheses
"({level} * 2"           // Missing closing paren
```

### Error Messages

- `"Formula has unclosed placeholder"`
- `"Formula has invalid placeholder syntax"`
- `"Formula references undefined field: <field>"`
- `"Dependency \"<dep>\" is not used in formula"`
- `"Formula uses field \"<field>\" not in dependencies"`
- `"Formula has unbalanced parentheses"`

## detectCircularDependencies()

Detects circular dependencies in computed field formulas using depth-first search.

### Signature

```typescript
function detectCircularDependencies(
  fields: FieldDefinition[]
): { hasCircular: boolean; cyclePath?: string[] }
```

### Parameters

- **fields** (`FieldDefinition[]`): Array of field definitions

### Returns

- Object with:
  - **hasCircular** (`boolean`): Whether a circular dependency exists
  - **cyclePath** (`string[]`): Path of fields forming the cycle (if found)

### Algorithm

Uses depth-first search (DFS) with recursion tracking:

1. Build dependency graph from computed fields
2. Traverse each computed field using DFS
3. Track visited nodes and current recursion stack
4. Detect cycle when revisiting a node in the current stack
5. Return cycle path for debugging

### Usage Example

```typescript
import { detectCircularDependencies } from '$lib/utils/entityTypeValidation';

const fields = [
  {
    key: 'a',
    type: 'computed',
    computedConfig: {
      formula: '{b} + 1',
      dependencies: ['b']
    }
  },
  {
    key: 'b',
    type: 'computed',
    computedConfig: {
      formula: '{c} * 2',
      dependencies: ['c']
    }
  },
  {
    key: 'c',
    type: 'computed',
    computedConfig: {
      formula: '{a} - 1',  // Creates cycle: a -> b -> c -> a
      dependencies: ['a']
    }
  }
];

const result = detectCircularDependencies(fields);

if (result.hasCircular) {
  console.error('Circular dependency:', result.cyclePath);
  // Output: ['a', 'b', 'c', 'a']
}
```

### Valid Dependencies

```typescript
// Linear dependency chain (valid)
a -> b -> c

// Multiple dependencies (valid)
a -> b
a -> c
b -> d

// No dependencies (valid)
a (no deps)
b (no deps)
```

### Invalid Dependencies

```typescript
// Direct cycle
a -> b -> a

// Indirect cycle
a -> b -> c -> a

// Self-reference
a -> a

// Complex cycle
a -> b -> c
c -> d -> b  // Creates cycle: b -> c -> d -> b
```

## Validation Workflow

### Creating a Custom Entity Type

```typescript
import {
  validateEntityTypeDefinition,
  validateFieldDefinition,
  validateComputedFieldFormula,
  detectCircularDependencies
} from '$lib/utils/entityTypeValidation';

function createCustomEntityType(typeDef: EntityTypeDefinition) {
  // Step 1: Validate entity type definition
  const typeResult = validateEntityTypeDefinition(typeDef);

  if (!typeResult.valid) {
    throw new Error(`Invalid entity type: ${typeResult.errors.join(', ')}`);
  }

  // Step 2: Individual field validation (optional, done by validateEntityTypeDefinition)
  for (const field of typeDef.fieldDefinitions) {
    const fieldResult = validateFieldDefinition(field);
    if (!fieldResult.valid) {
      console.warn(`Field ${field.key} has issues:`, fieldResult.errors);
    }
  }

  // Step 3: Check for circular dependencies
  const circularResult = detectCircularDependencies(typeDef.fieldDefinitions);
  if (circularResult.hasCircular) {
    throw new Error(`Circular dependency: ${circularResult.cyclePath?.join(' -> ')}`);
  }

  // Step 4: Save entity type
  // ... save to database
}
```

### Validating Computed Field Formula

```typescript
function addComputedField(
  entityType: EntityTypeDefinition,
  fieldDef: FieldDefinition
) {
  // Get all field keys
  const allFieldKeys = entityType.fieldDefinitions.map(f => f.key);

  // Validate formula
  if (fieldDef.type === 'computed' && fieldDef.computedConfig) {
    const result = validateComputedFieldFormula(
      fieldDef.computedConfig.formula,
      fieldDef.computedConfig.dependencies,
      allFieldKeys
    );

    if (!result.valid) {
      throw new Error(`Invalid formula: ${result.errors.join(', ')}`);
    }
  }

  // Add field to entity type
  entityType.fieldDefinitions.push(fieldDef);

  // Check for circular dependencies after adding
  const circularResult = detectCircularDependencies(entityType.fieldDefinitions);
  if (circularResult.hasCircular) {
    // Remove the field
    entityType.fieldDefinitions.pop();
    throw new Error(`Would create circular dependency: ${circularResult.cyclePath?.join(' -> ')}`);
  }
}
```

## Best Practices

### Use Validation Early

Validate as early as possible in the UI flow:

```typescript
// Good: Validate on form change
function handleFieldChange(fieldDef: FieldDefinition) {
  const result = validateFieldDefinition(fieldDef);
  if (!result.valid) {
    setErrors(result.errors);
  }
}

// Avoid: Only validate on submit
function handleSubmit() {
  const result = validateEntityTypeDefinition(entityType);
  // User finds errors only after completing the form
}
```

### Provide Clear Error Messages

Show validation errors to users immediately:

```typescript
const result = validateEntityTypeDefinition(typeDef);

if (!result.valid) {
  // Good: Show each error
  result.errors.forEach(error => {
    showNotification(error, 'error');
  });

  // Also good: Group similar errors
  const keyErrors = result.errors.filter(e => e.includes('key'));
  const fieldErrors = result.errors.filter(e => e.includes('field'));
  // Display in organized sections
}
```

### Test Edge Cases

Always test validation with edge cases:

```typescript
// Empty values
validateFieldDefinition({ key: '', label: '', type: 'text' });

// Special characters
validateEntityTypeDefinition({ type: 'my-type!', label: 'Test' });

// Circular dependencies
const circularFields = [
  { key: 'a', type: 'computed', computedConfig: { formula: '{b}', dependencies: ['b'] }},
  { key: 'b', type: 'computed', computedConfig: { formula: '{a}', dependencies: ['a'] }}
];
detectCircularDependencies(circularFields);
```

### Handle Validation Results Consistently

Use a consistent pattern for handling validation:

```typescript
function validateAndProcess(data: EntityTypeDefinition) {
  const result = validateEntityTypeDefinition(data);

  if (!result.valid) {
    return {
      success: false,
      errors: result.errors
    };
  }

  // Process valid data
  return {
    success: true,
    data: processedData
  };
}
```

## Error Recovery

### Fixing Common Errors

**Type Key Issues**
```typescript
// Error: "Entity type key must be lowercase"
type: 'MyQuest'  // Wrong
type: 'my-quest' // Fixed

// Error: "Entity type key cannot contain spaces"
type: 'magic spell'    // Wrong
type: 'magic-spell'    // Fixed
type: 'magic_spell'    // Also valid
```

**Field Key Issues**
```typescript
// Error: "Field key cannot contain spaces"
key: 'first name'  // Wrong
key: 'firstName'   // Fixed
key: 'first_name'  // Also valid

// Error: "Field key must start with a letter"
key: '1st_name'    // Wrong
key: 'firstName'   // Fixed
```

**Select Field Issues**
```typescript
// Error: "Select field must have at least one option"
{ type: 'select', options: [] }              // Wrong
{ type: 'select', options: ['option1'] }     // Fixed

// Error: "Select field has duplicate option"
{ type: 'select', options: ['yes', 'no', 'yes'] }  // Wrong
{ type: 'select', options: ['yes', 'no'] }         // Fixed
```

**Computed Field Issues**
```typescript
// Error: "Formula uses field not in dependencies"
{
  formula: '{a} + {b}',
  dependencies: ['a']        // Wrong - missing 'b'
}

{
  formula: '{a} + {b}',
  dependencies: ['a', 'b']   // Fixed
}

// Error: "Dependency not used in formula"
{
  formula: '{a}',
  dependencies: ['a', 'b']   // Wrong - 'b' not used
}

{
  formula: '{a}',
  dependencies: ['a']        // Fixed
}
```

## Related Documentation

- [Field Types API](./FIELD_TYPES.md) - Field type utilities
- [Custom Entity Types User Guide](../USER_GUIDE.md#custom-entity-types) - End-user documentation
- [Type Definitions](../../src/lib/types/entities.ts) - TypeScript type definitions
