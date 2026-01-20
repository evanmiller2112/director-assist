# Computed Fields for Draw Steel Campaigns

Computed fields are dynamic, formula-driven fields that automatically calculate values based on other fields in your entities. They're perfect for tracking derived values in Draw Steel campaigns, reducing manual data entry and keeping your game data accurate.

## Quick Start

Create a computed field in three steps:

1. Navigate to **Settings → Entity Types**
2. Select your entity type (Character, NPC, etc.)
3. Add a new field with type **Computed**

Example - Track remaining HP automatically:

- **Field Name**: `remainingHP`
- **Formula**: `{maxHP} - {currentDamage}`
- **Output Type**: Number
- **Dependencies**: `maxHP`, `currentDamage`

Now `remainingHP` automatically updates whenever max HP or damage changes.

## Draw Steel Formula Examples

Director Assist includes 13 pre-built formulas tailored for Draw Steel campaigns. Use these examples as starting points or reference when creating your own computed fields.

### Health & Vitality

**Remaining HP**
```
Formula: {maxHP} - {currentDamage}
Output: Number
Use: Automatically calculate current hit points
```

**HP Percentage**
```
Formula: ({currentHP} / {maxHP}) * 100
Output: Number
Use: Show health as a percentage (useful for visual indicators)
```

**Is Bloodied**
```
Formula: {currentHP} <= ({maxHP} / 2)
Output: Boolean
Use: Track bloodied status (at or below half HP) - a critical condition in Draw Steel
```

**Is Winded**
```
Formula: {currentHP} <= 0
Output: Boolean
Use: Track winded status (at or below 0 HP) - when a hero is in serious danger
```

### Ability Scores

**Total Attributes**
```
Formula: {might} + {agility} + {reason} + {intuition} + {presence}
Output: Number
Use: Sum all five Draw Steel ability scores for quick reference
```

**Primary Attack Bonus**
```
Formula: {might} + {level}
Output: Number
Use: Calculate melee attack bonus from Might and character level
```

**Ranged Attack Bonus**
```
Formula: {agility} + {level}
Output: Number
Use: Calculate ranged attack bonus from Agility and character level
```

### Display & Identification

**Character Title**
```
Formula: {name} the {class}
Output: Text
Use: Format character name with class (e.g., "Aragorn the Ranger")
```

**Full Character Description**
```
Formula: Level {level} {ancestry} {class}
Output: Text
Use: Generate complete character summary (e.g., "Level 5 Human Conduit")
```

**NPC Identifier**
```
Formula: {name} | {threatLevel} {role}
Output: Text
Use: Create NPC label with threat and role (e.g., "Orc Captain | Boss Leader")
Note: Uses | to avoid operator conflicts with subtraction
```

### Combat

**Recovery Value**
```
Formula: {maxHP} / 3
Output: Number
Use: Calculate recovery value (one-third of max HP) for healing actions
```

**Is Veteran Tier**
```
Formula: {level} >= 5
Output: Boolean
Use: Check if character has reached Veteran tier (level 5+)
```

### Negotiation

**Negotiation Difficulty**
```
Formula: DC {negotiationDC}
Output: Text
Use: Format negotiation difficulty class for display (e.g., "DC 15")
```

## Formula Syntax Reference

### Field References

Reference other field values using curly braces:

```
{fieldName}
```

Field names must match exactly (case-sensitive). The field must exist in the entity type.

**Valid Examples:**
- `{maxHP}`
- `{level}`
- `{might}`
- `{currentDamage}`

**Invalid Examples:**
- `{max_hp}` (wrong name)
- `{Level}` (wrong case)
- `maxHP` (missing braces)

### Operators

**Arithmetic:**
- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Modulo (remainder)

**Comparison:**
- `>` Greater than
- `<` Less than
- `>=` Greater than or equal
- `<=` Less than or equal
- `==` Equal (loose comparison)
- `!=` Not equal (loose comparison)
- `===` Equal (strict comparison)
- `!==` Not equal (strict comparison)

**Logical:**
- `&&` AND
- `||` OR
- `!` NOT

**Grouping:**
- `( )` Parentheses for controlling order of operations

### Output Types

Computed fields can output three types:

**Number**
- Use for: Statistics, totals, calculations, percentages
- Returns: Numeric value (integer or decimal)
- Example: `{level} * 10` → `50`

**Text**
- Use for: Labels, descriptions, formatted strings
- Returns: String value
- Example: `Level {level} {class}` → `"Level 5 Conduit"`

**Boolean**
- Use for: Conditions, status checks, flags
- Returns: `true` or `false`
- Example: `{hp} <= 0` → `true`

### Text Formulas

For text output, combine field references with literal text:

```
{firstName} {lastName}
Level {level} {class}
DC {difficulty}
{name} | {role}
```

Text formulas don't require quotes around literal text. Field values are automatically converted to strings and concatenated.

**Tip:** Use `|` instead of `-` in text formulas to avoid confusion with the subtraction operator.

### Arithmetic Formulas

For number output, use mathematical expressions:

```
{a} + {b}
{maxHP} - {currentDamage}
({level} * 8) + ({constitution} * 2)
{maxHP} / 3
```

Use parentheses to control order of operations. Standard mathematical precedence applies (multiply/divide before add/subtract).

### Boolean Formulas

For boolean output, use comparison and logical operators:

```
{hp} > 0
{level} >= 5
{currentHP} <= ({maxHP} / 2)
{strength} > 3 && {level} >= 5
```

Boolean formulas return `true` or `false`, which can be displayed as checkboxes or used for conditional logic.

## Best Practices

### Keep Formulas Simple

Simple formulas are easier to understand and debug. If a formula becomes complex, consider breaking it into multiple computed fields.

**Good:**
```
{maxHP} - {currentDamage}
```

**Too Complex:**
```
{baseHP} + ({level} * {hpPerLevel}) + ({constitution} * 2) - {temporaryDamage} - {permanentDamage}
```

### Use Descriptive Field Names

Field names should clearly indicate what they contain. This makes formulas more readable.

**Good:**
- `{maxHP}`
- `{currentDamage}`
- `{baseAttackBonus}`

**Poor:**
- `{hp1}`
- `{dmg}`
- `{val}`

### Name Computed Fields Clearly

The computed field's name should indicate it's calculated and what it represents.

**Good:**
- `remainingHP`
- `isBloodied`
- `totalAttributeScore`

**Poor:**
- `hp` (could be confused with stored HP field)
- `calc1` (unclear purpose)
- `x` (meaningless)

### Match Dependencies Exactly

List all fields referenced in your formula. If a dependency is missing, the computed field returns `null`.

**Formula:** `{might} + {level}`
**Dependencies:** `might`, `level` (both required)

### Choose Appropriate Output Types

Match the output type to how you'll use the value:

- **Number** for statistics you'll display, compare, or use in other formulas
- **Text** for labels, descriptions, or formatted display strings
- **Boolean** for status flags, conditions, or checkbox displays

### Test with Edge Cases

Consider what happens when:
- Field values are zero
- Division by zero could occur
- Values are negative
- Fields are empty or null

**Example:** For `{maxHP} / 3`, what if `maxHP` is 0? Consider adding validation or using a different approach.

### Document Complex Formulas

Add comments in the field description explaining what the formula does and why.

**Example:**
- **Field Name**: `effectiveArmorClass`
- **Description**: "Calculates AC including bonuses from armor, shield, and Agility modifier"

## Troubleshooting

### "Field returns null"

**Problem:** Computed field shows no value.

**Causes:**
- Missing dependencies (field doesn't exist in entity)
- Dependency value is `null` or `undefined`
- Field name spelled incorrectly in formula

**Solution:**
- Check field names match exactly (case-sensitive)
- Verify all referenced fields exist in the entity type
- Ensure dependency list includes all referenced fields

### "Formula error"

**Problem:** Error message when evaluating formula.

**Causes:**
- Syntax error (mismatched parentheses, invalid operator)
- Division by zero
- Invalid field reference

**Solution:**
- Check parentheses are balanced
- Verify operator syntax
- Test formula with simple values first
- Avoid division where denominator could be zero

### "Wrong output type"

**Problem:** Value displays incorrectly.

**Causes:**
- Output type doesn't match formula result
- Mixing text and numbers incorrectly

**Solution:**
- For text output, don't use arithmetic operators
- For number output, ensure formula produces numeric result
- For boolean output, use comparison operators

### "Field reference not working"

**Problem:** Formula shows `{fieldName}` literally instead of value.

**Causes:**
- Field name includes spaces or special characters
- Braces not properly formatted

**Solution:**
- Field names must be single words (no spaces)
- Use `{fieldName}` format exactly
- Check for extra spaces inside braces

### "Circular dependency"

**Problem:** Computed field references itself directly or indirectly.

**Example:** Field A uses Field B, Field B uses Field A.

**Solution:**
- Computed fields cannot reference other computed fields
- Restructure your formulas to avoid circular references
- Use base (non-computed) fields only

## Security Note

Computed field formulas are validated for security before evaluation. Only safe mathematical and logical operations are allowed. The following are blocked:

- Function calls
- Property access
- JavaScript keywords
- Code injection attempts
- Template literals
- Comments

This ensures formulas cannot execute arbitrary code or access sensitive data.

## Examples in Action

### Complete Character HP Tracking

Create these fields for comprehensive HP management:

1. **maxHP** (Number) - Base field, manually set
2. **currentDamage** (Number) - Base field, manually updated
3. **remainingHP** (Computed) - Formula: `{maxHP} - {currentDamage}`
4. **hpPercentage** (Computed) - Formula: `({remainingHP} / {maxHP}) * 100`
5. **isBloodied** (Computed) - Formula: `{remainingHP} <= ({maxHP} / 2)`
6. **isWinded** (Computed) - Formula: `{remainingHP} <= 0`

Update only `maxHP` and `currentDamage`. All other fields calculate automatically.

### NPC Quick Reference

Create an NPC identifier that combines multiple fields:

1. **name** (Text) - Base field: "Orc Captain"
2. **threatLevel** (Select) - Base field: "Boss"
3. **role** (Select) - Base field: "Leader"
4. **npcLabel** (Computed) - Formula: `{name} | {threatLevel} {role}`

Result: "Orc Captain | Boss Leader"

### Character Attack Bonuses

Calculate attack bonuses automatically from abilities and level:

1. **might** (Number) - Base field
2. **agility** (Number) - Base field
3. **level** (Number) - Base field
4. **meleeAttack** (Computed) - Formula: `{might} + {level}`
5. **rangedAttack** (Computed) - Formula: `{agility} + {level}`

Update ability scores and level. Attack bonuses update automatically.

## Learn More

- See `src/lib/config/computedFieldExamples.ts` for implementation details
- Review `src/lib/utils/fieldTypes.ts` for formula evaluation code
- Check the entity type settings UI to explore computed field configuration

Computed fields make your Draw Steel campaigns more dynamic and reduce manual bookkeeping. Use them to focus on storytelling instead of calculations.
