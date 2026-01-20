# A2 Combat Round Tracker - Implementation Guide

## Quick Start: TDD GREEN Phase

This guide helps implement the combat components to pass the comprehensive test suite.

## Implementation Order

Follow this order for optimal dependency management:

1. **ConditionBadge** (leaf component, no dependencies)
2. **CombatantCard** (uses ConditionBadge)
3. **InitiativeTracker** (uses CombatantCard)
4. **HpTracker** (standalone)
5. **ConditionManager** (uses ConditionBadge)
6. **TurnControls** (standalone)

## Component Specifications

### 1. InitiativeTracker

**File:** `/src/lib/components/combat/InitiativeTracker.svelte`

**Props:**
```typescript
interface Props {
  combat: CombatSession;
  onCombatantClick?: (combatant: Combatant) => void;
  compact?: boolean;
}
```

**Key Features:**
- Display all combatants sorted by initiative (highest first)
- Highlight current combatant based on `combat.currentTurn`
- Show HP, AC, conditions for each combatant
- Display round number
- Empty state when no combatants
- Click handler for combatant selection
- ARIA role="list" with proper labels
- Keyboard navigation support

**Test File:** `InitiativeTracker.test.ts` (60 tests)

---

### 2. CombatantCard

**File:** `/src/lib/components/combat/CombatantCard.svelte`

**Props:**
```typescript
interface Props {
  combatant: Combatant;
  isCurrent?: boolean;
  onClick?: (combatant: Combatant) => void;
  compact?: boolean;
}
```

**Key Features:**
- Display name, initiative, HP bar
- Show AC if provided
- Show temp HP if present
- Display conditions with badges
- Hero indicator for heroes
- Threat level badge for creatures (1-3)
- Heroic resource display for heroes
- Bloodied state (HP <= 50%)
- Defeated state (HP = 0)
- Current turn highlighting
- HP bar color coding (green > 50%, yellow <= 50%, red <= 25%)
- ARIA role="article" with proper labels
- Keyboard support for clicks

**Test File:** `CombatantCard.test.ts` (55 tests)

---

### 3. TurnControls

**File:** `/src/lib/components/combat/TurnControls.svelte`

**Props:**
```typescript
interface Props {
  combat: CombatSession;
  onNextTurn: () => void | Promise<void>;
  onPreviousTurn: () => void | Promise<void>;
  onStartCombat?: () => void | Promise<void>;
  onPauseCombat?: () => void | Promise<void>;
  onResumeCombat?: () => void | Promise<void>;
  onEndCombat?: () => void | Promise<void>;
  loading?: boolean;
  showRoundAdvance?: boolean;
}
```

**Key Features:**
- Next/Previous turn buttons
- Display current round and turn
- Display current combatant name
- Start button (when status = 'preparing')
- Pause/Resume buttons (when status = 'active'/'paused')
- End Combat button
- Disable buttons based on state
- Keyboard shortcuts (ArrowLeft/ArrowRight)
- Loading state
- ARIA live regions for round announcements
- Button tooltips with reasons for disabled state

**Test File:** `TurnControls.test.ts` (50 tests)

---

### 4. HpTracker

**File:** `/src/lib/components/combat/HpTracker.svelte`

**Props:**
```typescript
interface Props {
  combatant: Combatant;
  onApplyDamage: (amount: number) => void | Promise<void>;
  onApplyHealing: (amount: number) => void | Promise<void>;
  onSetTempHp: (amount: number) => void | Promise<void>;
  showQuickActions?: boolean;
  showPreview?: boolean;
}
```

**Key Features:**
- Display current/max HP with visual bar
- Display temp HP
- Damage input with apply button
- Healing input with apply button (disabled at max HP)
- Temp HP input with set button
- Quick action buttons (-10, -5, +5, +10)
- Input validation (min: 0, no decimals)
- Auto-clear inputs after submission
- HP bar color coding
- Bloodied/Defeated indicators
- Disable healing at max HP with message
- Preview calculations (optional)
- ARIA live region for HP changes
- Proper labels and descriptions

**Test File:** `HpTracker.test.ts` (50 tests)

---

### 5. ConditionManager

**File:** `/src/lib/components/combat/ConditionManager.svelte`

**Props:**
```typescript
interface Props {
  combatant: Combatant;
  onAddCondition: (condition: AddConditionInput) => void | Promise<void>;
  onRemoveCondition: (conditionName: string) => void | Promise<void>;
  onUpdateDuration: (conditionName: string, newDuration: number) => void | Promise<void>;
  showPresets?: boolean;
  sortByDuration?: boolean;
}
```

**Key Features:**
- Display all conditions as list
- Show duration with proper formatting:
  - Positive number: "X rounds"
  - 0: "Until end of combat"
  - -1: "Permanent"
- Add condition form:
  - Name (required)
  - Duration (required)
  - Source (required)
  - Description (optional)
- Condition presets (Stunned, Slowed, Bleeding, etc.)
- Remove button for each condition
- Confirmation for permanent conditions
- Duration increment/decrement buttons
- Direct duration editing
- Hide duration controls for permanent (-1)
- Sort by duration (shortest first)
- Highlight conditions expiring soon (duration = 1)
- Tooltips showing full description
- ARIA role="list" with live regions
- Empty state message

**Test File:** `ConditionManager.test.ts` (45 tests)

---

## Common Patterns

### 1. HP Bar Calculation
```typescript
$: hpPercentage = Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100));
$: isBloodied = combatant.hp <= combatant.maxHp / 2;
$: isDefeated = combatant.hp <= 0;
$: barColor = isDefeated ? 'bg-gray-500' :
               combatant.hp <= combatant.maxHp * 0.25 ? 'bg-red-500' :
               isBloodied ? 'bg-yellow-500' : 'bg-green-500';
```

### 2. Type Guards
```typescript
import { isHeroCombatant, isCreatureCombatant } from '$lib/types/combat';

{#if isHeroCombatant(combatant)}
  <div>Resource: {combatant.heroicResource.name}</div>
{:else if isCreatureCombatant(combatant)}
  <div>Threat: {combatant.threat}</div>
{/if}
```

### 3. Keyboard Navigation
```typescript
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick?.(combatant);
  }
}
```

### 4. Input Validation
```typescript
<input
  type="number"
  min="0"
  step="1"
  bind:value={damageAmount}
  aria-label="Damage amount"
/>

<button
  disabled={!damageAmount || damageAmount <= 0}
  onclick={() => onApplyDamage(damageAmount)}
>
  Apply Damage
</button>
```

### 5. Conditional CSS Classes
```typescript
class="{isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
       {isBloodied ? 'border-yellow-500' : ''}
       {isDefeated ? 'opacity-50' : ''}"
```

## Draw Steel Specifics

### Initiative Display (2d10)
```typescript
<div>
  Initiative: {combatant.initiative}
  <span class="text-xs">({combatant.initiativeRoll[0]} + {combatant.initiativeRoll[1]})</span>
</div>
```

### Threat Level Badge
```typescript
const threatLabels = {
  1: 'Standard',
  2: 'Elite',
  3: 'Boss'
};

const threatColors = {
  1: 'bg-gray-500',
  2: 'bg-orange-500',
  3: 'bg-red-500'
};

<span class="{threatColors[combatant.threat]} text-white px-2 py-1 rounded">
  Threat {combatant.threat} - {threatLabels[combatant.threat]}
</span>
```

### Condition Duration
```typescript
function formatDuration(duration: number): string {
  if (duration === -1) return 'Permanent';
  if (duration === 0) return 'Until end of combat';
  return `${duration} round${duration !== 1 ? 's' : ''}`;
}
```

## Testing Your Implementation

### Run Tests for Single Component
```bash
npm run test InitiativeTracker
```

### Watch Mode (auto-rerun on save)
```bash
npm run test:watch CombatantCard
```

### Check Coverage
```bash
npm run test:coverage
```

## Accessibility Checklist

For each component, ensure:

- [ ] Proper ARIA roles (list, listitem, article, button, etc.)
- [ ] ARIA labels for all interactive elements
- [ ] ARIA live regions for dynamic content
- [ ] ARIA current for current turn indicator
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Focus management
- [ ] Screen reader announcements
- [ ] Sufficient color contrast
- [ ] No reliance on color alone
- [ ] Meaningful alt text for icons

## Styling Guidelines

Use Tailwind CSS classes consistently:

**Colors:**
- Heroes: `blue-500`, `blue-100`
- Creatures: `red-500`, `red-100`
- Current turn: `ring-2 ring-blue-500`
- Bloodied: `yellow-500`
- Defeated: `gray-500`

**Spacing:**
- Cards: `p-4 gap-2`
- Buttons: `px-4 py-2`
- Badges: `px-2 py-1`

**Typography:**
- Names: `font-semibold text-lg`
- Stats: `text-sm`
- Conditions: `text-xs`

## Common Issues

### Issue: Tests fail with "Cannot find module"
**Solution:** Ensure `.svelte` file exists and is in the correct location

### Issue: Props not recognized
**Solution:** Define props using Svelte 5 runes syntax:
```typescript
let { combatant, onClick }: Props = $props();
```

### Issue: Reactivity not working
**Solution:** Use Svelte 5 runes:
```typescript
$: hpPercentage = $derived((combatant.hp / combatant.maxHp) * 100);
```

### Issue: Tests timeout
**Solution:** Ensure async operations are properly awaited:
```typescript
await fireEvent.click(button);
await waitFor(() => expect(...).toBeInTheDocument());
```

## Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/runes)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Draw Steel Rules](https://www.mcdmproductions.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Need Help?

Refer to:
1. Test files - They specify exact behavior expected
2. `TEST_SUITE_SUMMARY.md` - Overview of all tests
3. Existing components in `src/lib/components/` for patterns
4. Type definitions in `src/lib/types/combat.ts`

---

Happy coding! Make those tests go GREEN! 🟢
