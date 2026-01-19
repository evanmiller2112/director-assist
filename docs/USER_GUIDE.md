# Director Assist User Guide

Welcome to Director Assist! This guide will help you get started managing your Draw Steel campaign with confidence.

## Table of Contents

1. [What is Director Assist?](#what-is-director-assist)
2. [Getting Started](#getting-started)
3. [Creating Entities](#creating-entities)
4. [Custom Entity Types](#custom-entity-types)
5. [Connecting Entities](#connecting-entities)
6. [Using Search](#using-search)
7. [Using Commands](#using-commands)
8. [Managing Campaigns](#managing-campaigns)
9. [Settings](#settings)
10. [AI Features](#ai-features)
11. [Backup & Restore](#backup--restore)
12. [Tips & Best Practices](#tips--best-practices)
13. [Troubleshooting](#troubleshooting)

## What is Director Assist?

Director Assist is a campaign management tool designed specifically for Directors running Draw Steel TTRPG campaigns. Think of it as your digital campaign notebook that helps you organize everything in one place.

**What makes it special:**

- Works completely in your browser - no account or login needed
- All your data stays private on your device
- Fast global search to find anything instantly
- Create relationships between NPCs, locations, factions, and more
- Optional AI-powered content generation with multiple provider options
- Works offline after the first load

**Who is it for?**

Directors who want to keep their campaign organized without juggling multiple documents, spreadsheets, or sticky notes. Whether you're running a sprawling epic or a tight-focused adventure, Director Assist helps you track what matters.

## Getting Started

### First-Time Setup

When you first open Director Assist, you'll create your campaign. This is the container for all your campaign data.

**Step 1: Create Your Campaign**

1. On the welcome screen, click "Create Campaign"
2. Enter a name for your campaign (e.g., "Shadows of Vasloria")
3. Select your game system:
   - Draw Steel (recommended for MCDM campaigns)
   - D&D 5e
   - System Agnostic (works for any system)
4. Add a setting description - a few sentences about your world
5. Click "Save Campaign"

**Step 2: Add Your API Key (Optional)**

If you want to use AI features to generate content:

1. Click the gear icon in the header to open Settings
2. Find the "AI Configuration" section
3. Select your preferred AI provider (Anthropic, OpenAI, Google, Mistral, or Ollama)
4. Paste your API key for that provider (or configure base URL for Ollama)
5. Select your preferred model (or leave the default)
6. Click "Save Settings"

Don't have an API key? You can still use Director Assist! The AI features are completely optional. Each provider offers their own API access - choose the one that works best for you.

**Step 3: Start Adding Entities**

You're ready to go! Click the "+" button in the sidebar or use the dashboard to create your first entity.

### Your First Entity

Let's create an NPC to get familiar with the interface.

1. Click "NPCs" in the sidebar
2. Click the "New NPC" button
3. Fill in the basic information:
   - **Name**: "Grimwald the Wise"
   - **Description**: "An elderly wizard who runs the town's apothecary. He knows more than he lets on."
   - **Tags**: Add a few tags like "quest-giver", "wizard", "helpful"
4. Scroll down to fill in custom fields:
   - **Role/Occupation**: "Apothecary Owner"
   - **Personality**: "Quirky and forgetful, but fiercely intelligent when it matters"
   - **Appearance**: "White beard, twinkling eyes, always wears his reading glasses on top of his head"
5. Click "Create NPC"

Congratulations! You've created your first entity. You'll see it listed on the NPCs page and can click it to view the details.

## Creating Entities

Director Assist includes 11 built-in entity types to help you organize your campaign. You can also create custom entity types with your own fields to track anything specific to your campaign.

### Entity Types

**Player Characters**
Track your players' characters with background, goals, and secrets. Include the player's name so you remember who plays whom.

**NPCs**
The heart of your campaign! NPCs have fields for role, personality, appearance, voice, greetings, motivation, secrets, status, and importance. Perfect for everyone from quest-givers to villains.

**Locations**
Cities, dungeons, taverns, or entire regions. Include atmosphere, notable features, inhabitants, and history to bring places to life.

**Factions**
Organizations, guilds, noble houses, or cults. Track their goals, resources, leadership, and territory to create dynamic political landscapes.

**Items**
Magic items, artifacts, or important mundane objects. Document properties, history, and current location.

**Encounters**
Plan combat, social, or exploration encounters. Include objective, difficulty, threats, rewards, and notes. For Draw Steel campaigns, track victory points, negotiation DC, challenge level, and tactical details.

**Sessions**
Keep session notes and prep for upcoming sessions. Track what happened, what's next, and any loose threads. For Draw Steel campaigns, track XP awarded, glory distribution, power roll outcomes, and negotiation results.

**Deities**
Gods, goddesses, or other divine entities. Note their domains, worshippers, symbols, and influence on the world.

**Timeline Events**
Important historical or future events. Record dates, participants, consequences, and related entities to build a living history.

**World Rules**
Document how magic works, social customs, natural laws, or anything else that makes your world unique.

**Player Profiles**
Track player preferences, boundaries, favorite moments, and what kind of content they enjoy. Helps you tailor the experience.

### Creating an Entity

The process is the same for all entity types:

1. Navigate to the entity type (click it in the sidebar)
2. Click the "New [Type]" button
3. Fill in the required fields (usually just name and description)
4. Add optional fields as needed
5. Add tags to help with searching and organization
6. Click "Create [Type]"

**Pro tip**: You don't need to fill in every field. Start with the basics and add details as they become relevant in play.

### Editing an Entity

To update an entity after creation:

1. Click on the entity to view its details
2. Click the "Edit" button
3. Update any fields you want to change
4. Click "Save Changes"

All changes are saved immediately to your browser's local storage.

### Deleting an Entity

To remove an entity:

1. View the entity's details page
2. Scroll to the bottom
3. Click the red "Delete" button
4. Confirm the deletion

**Warning**: Deleted entities cannot be recovered unless you have a backup. Any relationships to this entity will also be removed.

### Entity Fields

Each entity type has custom fields relevant to its purpose. Here are some common fields you'll encounter:

**Text Fields**
Single-line inputs for short information like role, occupation, or title.

**Text Areas**
Multi-line inputs for longer content like personality descriptions or notes.

**Rich Text Fields**
Full markdown editor with a formatting toolbar for creating rich formatted text. The editor offers three modes: edit-only, preview-only, or split view showing both side-by-side. Use the toolbar buttons to add bold, italic, headings, code blocks, links, and lists. Keyboard shortcuts available: Ctrl+B for bold, Ctrl+I for italic. Great for backgrounds, histories, or detailed descriptions that need formatting.

**Select Fields**
Dropdown menus for predefined choices like status (active, inactive, deceased) or importance (critical, major, minor).

**Tags**
Comma-separated keywords that help with searching and organization. Add as many as you like.

**Entity References**
Link to other entities directly from fields. For example, a location's "ruler" field might reference an NPC entity.

**Dates**
Freeform text for dates. Use whatever dating system your world uses (e.g., "Year 1042, Third Age" or "15th of Harvest Moon").

**URLs**
Add links to external resources like art, maps, or reference documents. The app will show an "Open Link" button.

**Images**
Upload character portraits, location maps, or item images. Files are stored in your browser.

### Hidden Fields (Secrets)

Some fields are marked as "hidden" - these are DM-only notes that represent secrets or information players shouldn't know. When you use AI generation, these fields are never sent to the AI to protect your secrets.

Examples of hidden fields:
- Character secrets
- NPC secrets
- Location secrets
- Faction hidden agendas

## Custom Entity Types

Beyond the 11 built-in entity types, you can create custom entity types tailored to your campaign's unique needs. Define your own fields, choose field types, and even create computed fields that calculate values automatically.

### Why Use Custom Entity Types?

**Campaign-Specific Tracking**
Track anything unique to your world:
- Spells with custom properties (components, casting time, effects)
- Vehicles with stats (speed, cargo capacity, crew)
- Organizations with member rosters and resources
- Contracts with terms, parties, and deadlines
- Prophecies with clues and fulfillment conditions

**Specialized Workflows**
Create types optimized for your GMing style:
- Trap templates with trigger, effect, and disable methods
- Rumor tables with truth levels and sources
- Random encounter templates with difficulty scaling
- Shop inventories with stock and pricing

**System-Specific Content**
Add support for game systems beyond Draw Steel:
- Custom classes or ancestries
- Homebrew monsters
- Magic items with system-specific properties
- Campaign-specific mechanics

### Creating a Custom Entity Type

**How to Create:**

1. Open Settings (gear icon or `/settings` command)
2. Scroll to "Custom Entity Types"
3. Click "Create Custom Entity Type"
4. Fill in the basic information:
   - **Type Key**: Unique identifier (lowercase, letters/numbers/hyphens/underscores)
   - **Label**: Singular display name (e.g., "Spell")
   - **Label Plural**: Plural display name (e.g., "Spells")
   - **Icon**: Lucide icon name (e.g., "wand-sparkles")
   - **Color**: Hex color code for UI theming (e.g., "#9C27B0")
   - **Description**: Brief explanation of this entity type
5. Add field definitions (see below)
6. Click "Save Custom Entity Type"

**Type Key Rules:**
- Must start with a letter
- Lowercase only
- Can contain letters, numbers, hyphens, and underscores
- Cannot contain spaces
- Cannot conflict with built-in types
- Examples: `spell`, `magic-item`, `npc-template`, `custom_faction`

### Adding Fields to Custom Types

Custom entity types can have any combination of 14 field types. Click "Add Field" to create a new field definition.

**Field Configuration:**

- **Key**: Unique field identifier (letters, numbers, underscores only)
- **Label**: Display name shown in forms
- **Type**: Field type (see below)
- **Required**: Whether the field must be filled
- **Order**: Display order in forms (lower numbers appear first)
- **Help Text**: Optional guidance shown below the field
- **Placeholder**: Example text shown in empty fields

**Available Field Types:**

| Type | Use Case | Example |
|------|----------|---------|
| **Text** | Short single-line input | Name, title, identifier |
| **Textarea** | Multi-line plain text | Notes, description, observations |
| **Rich Text** | Markdown-formatted content | Detailed backstory, formatted rules |
| **Number** | Numeric values | Level, damage, duration, cost |
| **Boolean** | True/false checkboxes | Is legendary, requires attunement |
| **Select** | Single choice from dropdown | Rarity (common/uncommon/rare) |
| **Multi-Select** | Multiple choices | Damage types, creature types |
| **Tags** | Freeform tag input | Keywords, categories, traits |
| **Entity Reference** | Link to one entity | Creator, owner, location |
| **Entity References** | Link to multiple entities | Party members, witnesses, allies |
| **Date** | Date values | Date discovered, expiration |
| **URL** | External links | Source, art reference, inspiration |
| **Image** | Image upload | Portrait, map, diagram |
| **Computed** | Calculated from formula | Total cost, derived stats |

**Type-Specific Options:**

**Select & Multi-Select**
- Add options (one per line or comma-separated)
- Options display with underscores replaced by spaces
- Example: `common, uncommon, rare, very_rare, legendary`

**Entity References**
- Choose which entity types can be referenced
- Example: For a "Creator" field, allow NPC and Character types

**Computed Fields**
- Define a formula using `{fieldKey}` placeholders
- Declare dependencies (fields used in the formula)
- Choose output type (text, number, or boolean)
- See Computed Fields section below for details

### Computed Fields

Computed fields automatically calculate values based on other fields. Perfect for derived stats, concatenations, or conditional logic.

**Formula Syntax:**

**String Templates**
Combine text and field values:
```
{firstName} {lastName}
Level {level} {className}
```

**Arithmetic**
Calculate numeric values:
```
{level} * 10
({baseHP} + {constitution}) * {level}
({strength} + {dexterity}) / 2
```

**Comparisons**
Create boolean conditions:
```
{hp} > 0
{level} >= 5
{rarity} == "legendary"
```

**Formula Examples:**

| Formula | Dependencies | Output | Result |
|---------|--------------|--------|--------|
| `{firstName} {lastName}` | firstName, lastName | text | "Elena Thornvale" |
| `{quantity} * {unitPrice}` | quantity, unitPrice | number | 150 |
| `{hp} > 0` | hp | boolean | true/false |
| `Level {level} {class}` | level, class | text | "Level 5 Rogue" |

**Creating a Computed Field:**

1. Click "Add Field" when editing a custom entity type
2. Set field type to "Computed"
3. Enter a formula using `{fieldName}` placeholders
4. Click "Add Dependency" for each field used in the formula
5. Select output type (text, number, or boolean)
6. Save the field

**Important Notes:**
- All fields used in the formula must be listed as dependencies
- Dependencies must reference existing field keys in the entity type
- Computed fields are read-only in entity forms
- Values update automatically when dependencies change
- Circular dependencies are not allowed (field A depends on B, B depends on A)

### Customizing Built-In Entity Types

You can customize built-in entity types (NPCs, Locations, etc.) without creating entirely new types.

**Customization Options:**

**Hide Fields**
Remove fields you don't use from forms:
- Hide "voice" field from NPCs if you don't track it
- Hide "atmosphere" from locations if unnecessary
- Simplifies forms and reduces clutter

**Reorder Fields**
Change the order fields appear in forms:
- Put most important fields at the top
- Group related fields together
- Match your prep workflow

**Add Custom Fields**
Extend built-in types with additional fields:
- Add "accent" field to NPCs
- Add "ruling_faction" entity reference to locations
- Add "threat_level" to encounters

**How to Customize:**

1. Open Settings
2. Scroll to "Entity Type Customization"
3. Select a built-in entity type
4. Configure customizations:
   - Toggle "Hidden Fields" for fields to hide
   - Drag fields in "Field Order" to reorder
   - Click "Add Custom Field" to add new fields
5. Save changes

All customizations are per-campaign, so different campaigns can have different configurations.

### Custom Type Examples

**Example 1: Spell Entity Type**

```
Type Key: spell
Label: Spell
Label Plural: Spells
Icon: wand-sparkles
Color: #9C27B0

Fields:
- name (text, required)
- description (richtext)
- level (number, required)
- school (select: abjuration, conjuration, divination, etc.)
- castingTime (text, e.g., "1 action", "1 minute")
- range (text, e.g., "60 feet", "Self")
- components (multi-select: verbal, somatic, material)
- materialComponents (textarea)
- duration (text, e.g., "Instantaneous", "1 hour")
- ritual (boolean)
- concentration (boolean)
- classes (multi-select: wizard, cleric, druid, etc.)
- damageType (select: fire, cold, lightning, etc.)
- source (text, e.g., "Player's Handbook")
- displayName (computed): "{name} (Level {level})" [dependencies: name, level, output: text]
```

**Example 2: Quest Entity Type**

```
Type Key: quest
Label: Quest
Label Plural: Quests
Icon: scroll-text
Color: #FF9800

Fields:
- title (text, required)
- description (richtext)
- questGiver (entity-ref: npc, character)
- objectives (textarea)
- status (select: not_started, in_progress, completed, failed, abandoned)
- difficulty (select: trivial, easy, medium, hard, deadly)
- rewards (richtext)
- location (entity-ref: location)
- relatedNPCs (entity-refs: npc, character)
- prerequisites (textarea)
- timeLimit (text)
- sessionStarted (number)
- sessionCompleted (number)
- notes (textarea)
- summary (computed): "{title} - {status}" [dependencies: title, status, output: text]
```

**Example 3: Vehicle Entity Type**

```
Type Key: vehicle
Label: Vehicle
Label Plural: Vehicles
Icon: ship
Color: #607D8B

Fields:
- name (text, required)
- type (select: ship, wagon, airship, submersible)
- size (select: small, medium, large, huge)
- speed (number)
- cargoCapacity (number)
- crewMin (number)
- crewMax (number)
- passengers (number)
- armor (number)
- hitPoints (number)
- currentHP (number)
- damageThreshold (number)
- description (richtext)
- owner (entity-ref: npc, character, faction)
- currentLocation (entity-ref: location)
- features (textarea)
- weapons (textarea)
- cost (number)
- condition (select: pristine, good, fair, poor, wrecked)
- hpPercentage (computed): "({currentHP} / {hitPoints}) * 100" [dependencies: currentHP, hitPoints, output: number]
```

### Managing Custom Entity Types

**Editing Custom Types**

1. Open Settings
2. Find the custom type in "Custom Entity Types"
3. Click "Edit"
4. Modify fields, add new fields, or change type properties
5. Save changes

Changes apply to the entity type definition, not existing entities. Existing entities keep their data even if you remove fields.

**Deleting Custom Types**

1. Open Settings
2. Find the custom type
3. Click "Delete"
4. Confirm deletion

Deleting a custom entity type does not delete entities of that type. Entities remain accessible but won't have a type definition for creating new ones.

**Hiding Custom Types**

If you want to temporarily disable a custom type without deleting it:

1. Edit the custom type
2. Toggle "Hidden from Sidebar"
3. The type won't appear in navigation but existing entities remain accessible

### Validation and Error Prevention

Director Assist validates custom entity types to prevent errors:

**Type Key Validation**
- Must be unique (no duplicates or conflicts with built-in types)
- Lowercase only
- Starts with a letter
- No spaces allowed

**Field Validation**
- Field keys must be unique within the type
- Required fields cannot be empty
- Select fields must have at least one option
- Entity reference fields must specify allowed types
- Computed fields must have valid formulas

**Computed Field Validation**
- All placeholders must reference existing fields
- All dependencies must be used in the formula
- All fields in formula must be in dependencies
- No circular dependencies (A depends on B, B depends on A)
- Balanced braces and parentheses

Validation errors appear immediately in the form, preventing invalid configurations.

### Best Practices

**Keep It Simple**
Start with a few essential fields. You can always add more later.

**Use Descriptive Keys**
Field keys should be readable: `castingTime` not `ct`, `hitPoints` not `hp`.

**Leverage Computed Fields**
Use computed fields for derived values to keep data consistent:
- Display names: `{firstName} {lastName}`
- Totals: `{quantity} * {price}`
- Status indicators: `{hp} > 0`

**Organize with Sections**
Use the `section` property to group related fields in the UI.

**Provide Help Text**
Add helpful guidance for complex fields to remind yourself what they're for.

**Consider AI Generation**
Fields marked for AI generation can be populated automatically. Disable for fields like IDs or system-specific stats.

**Test Your Types**
Create a test entity to verify your custom type works as expected before using it extensively.

**Document Custom Types**
Add a description to help remember what the type is for, especially if you have many custom types.

### Custom Types and AI Generation

AI generation works with custom entity types just like built-in types:

- Text, textarea, and richtext fields can be generated
- The AI uses field labels, help text, and other field values as context
- Computed fields are never generated (they calculate automatically)
- You can disable AI generation per-field with `aiGenerate: false`

When generating content for custom entities, provide clear field names and descriptions so the AI understands what to generate.

### Limitations

**Cannot Modify Core Entity Structure**
Custom types use the same base entity structure (name, description, tags, etc.). You cannot remove these core fields.

**No Custom Validation Rules**
Field validation is limited to built-in rules (required, type checking). You cannot add custom validation logic.

**Formula Evaluation is Client-Side**
Computed field formulas evaluate in the browser using JavaScript eval(). Keep formulas simple to avoid errors.

**No Scripting or Advanced Logic**
Computed fields support basic arithmetic and string concatenation, not complex programming logic.

## Connecting Entities

One of Director Assist's most powerful features is the ability to create relationships between entities. This helps you track how everything in your campaign connects.

### Creating a Relationship

**Method 1: During Entity Creation**

You can now add relationships while creating a new entity, before the first save:

1. Fill in the entity creation form (name, description, etc.)
2. Scroll to the "Relationships" section
3. Click "Add Relationship"
4. Select the target entity from the dropdown
5. Choose a relationship type (knows, allied_with, located_at, etc.)
6. Optionally make it bidirectional (both entities show the link)
7. Add relationship strength (strong, moderate, weak)
8. Add tags or tension level if relevant
9. Click "Create Link"
10. The relationship will be saved when you create the entity

**Method 2: From the Entity Detail Page**

1. View any entity's details
2. Scroll to the "Relationships" section
3. Click "Add Relationship"
4. Select the target entity from the dropdown
5. Choose a relationship type (knows, allied_with, located_at, etc.)
6. Optionally make it bidirectional (both entities show the link)
7. Add relationship strength (strong, moderate, weak)
8. Add tags or tension level if relevant
9. Click "Create Link"

**Method 3: Using the Command Palette**

1. View any entity's details
2. Press Cmd+K (Mac) or Ctrl+K (Windows)
3. Type "/relate"
4. Press Enter
5. Follow the same steps as Method 2

### Relationship Types

Common relationship types include:

- **knows** - Generic acquaintance or knowledge
- **allied_with** - Friendly or cooperative relationship
- **enemy_of** - Hostile or opposing relationship
- **member_of** - Membership in an organization
- **located_at** - Physical location connection
- **owns** - Ownership of items or property
- **works_for** - Employment or service relationship
- **parent_of** / **child_of** - Family relationships
- **patron_of** / **client_of** - Patronage relationships
- **employer_of** / **employee_of** - Employment relationships

You can also create custom relationship types in your campaign settings.

### Bidirectional Relationships

When you create a bidirectional relationship, both entities will show the connection on their detail pages.

**Symmetric Bidirectional**
Both entities show the same relationship name.
- Example: NPC "Grimwald" knows NPC "Elena" (both see "knows")

**Asymmetric Bidirectional**
Each entity shows a different relationship name that reflects their perspective.
- Example: NPC "Lord Vance" is patron_of NPC "Seraphina"
- Lord Vance's page shows: "patron_of Seraphina"
- Seraphina's page shows: "client_of Lord Vance"
- Look for the blue ↔ symbol to identify asymmetric relationships

### Relationship Metadata

You can add extra information to relationships:

**Strength**
- Strong: Core relationships that define the character or plot
- Moderate: Important but not central
- Weak: Casual acquaintances or minor connections

**Tags**
Add keywords like "secret", "romantic", "professional", or "family" to categorize relationships.

**Tension**
Rate the tension in the relationship from 0-10. Great for tracking conflicts or romantic subplots.

**Notes**
Add context about the relationship like how they met or current status.

### Viewing Relationships

On any entity's detail page, the Relationships section shows:
- All connected entities grouped by relationship type
- Visual indicators for bidirectional relationships (↔ symbol)
- Relationship strength, tags, and tension if set
- Quick links to view the connected entities

### Navigating Relationship Chains

When exploring how entities connect, Director Assist shows a breadcrumb trail to help you track your path through the relationship network.

**How It Works:**

When you click on a related entity from the Relationships section, a breadcrumb trail appears at the top of the page showing the chain of entities you've visited.

**Example:**
```
Lord Vance → Elena the Bard → Grimwald the Wise (current)
```

This shows you navigated from Lord Vance to Elena, and then to Grimwald.

**Using Breadcrumbs:**

- **Click any entity** in the trail to jump back to that entity
- **Click the X button** to clear the trail and view the current entity without navigation context
- The trail shows up to **6 most recent entities** (older entries are automatically removed)
- The trail persists when using browser back/forward buttons

**When Breadcrumbs Appear:**

Breadcrumbs appear only when you navigate through relationships by clicking links in the Relationships section.

**When Breadcrumbs Clear:**

The trail automatically clears when you:
- Use the global search to find an entity
- Click an entity in the sidebar
- Navigate directly via URL
- Click the X button to clear manually

**Why Use Breadcrumbs:**

- Track complex relationship chains ("How did I get here?")
- Quickly backtrack through your exploration path
- Understand the context of how entities connect
- Avoid getting lost in deep relationship networks

### Visualizing Your Relationship Network

Director Assist provides an interactive network diagram that shows how all entities in your campaign connect to each other. This visualization helps you see patterns, identify key figures, and understand the web of relationships at a glance.

**How to Access:**

Navigate to `/relationships/network` or use the navigation menu to access the network diagram.

**What You'll See:**

The network diagram displays your campaign as an interactive graph:
- **Nodes (entities)** are shown as shapes positioned by force-directed physics
- **Edges (relationships)** are lines connecting the nodes
- **Colors and shapes** identify entity types at a glance

**Entity Type Visual Styling:**

Each entity type has a unique color and shape to help you distinguish them:

| Entity Type | Shape | Color |
|-------------|-------|-------|
| Characters/NPCs/Player Profiles | Circle | Blue/Purple/Cyan |
| Locations | Square | Green |
| Factions | Hexagon | Orange |
| Items | Diamond | Yellow |
| Encounters/Sessions | Star | Red/Pink |
| Deities | Triangle | Purple |
| Timeline Events | Box | Teal |
| World Rules/Campaigns | Ellipse | Gray |

**Relationship Styling:**

Relationships are shown with visual indicators:
- **Arrow direction** shows the relationship direction (or no arrow for bidirectional)
- **Line thickness** indicates relationship strength:
  - Thick line = strong relationship
  - Medium line = moderate relationship
  - Thin line = weak relationship
- **Line style** varies based on relationship metadata

**Interactive Controls:**

- **Pan**: Click and drag on empty space to move the view
- **Zoom**: Use mouse wheel or pinch gestures to zoom in/out
- **Drag nodes**: Click and drag nodes to reposition them
- **Select nodes**: Click a node to see details in the right panel
- **Select relationships**: Click an edge (line) to see relationship details

**Filtering the Network:**

Use the left sidebar to filter what's displayed:

1. **Entity Type Filter**: Show only specific entity types (e.g., only NPCs and Locations)
2. **Relationship Type Filter**: Show only specific relationship types (e.g., only "allied_with" relationships)
3. **Combine filters**: Use both filters together for highly focused views

The network automatically updates to show only matching entities and relationships. The stats footer shows how many items are currently displayed.

**Detail Panels:**

Click on any node or edge to see details in the right sidebar:

**Node Details:**
- Entity name and type
- Number of relationships
- Navigate button to view full entity page

**Edge Details:**
- Source and target entities
- Relationship type
- Bidirectional status
- Relationship strength (if set)
- Navigate buttons to view either connected entity

**Dark Mode:**

The network diagram automatically adapts to your system theme, providing appropriate colors for both light and dark modes.

**Tips for Using the Network:**

- Use entity type filtering to focus on social networks (characters/NPCs/factions)
- Filter by relationship type to trace specific kinds of connections (e.g., "member_of" to see org charts)
- Drag nodes to organize the layout manually for better clarity
- Look for highly connected nodes to identify important campaign figures
- Use the network to find indirect connections you might have missed

### Managing Relationships (Advanced)

For comprehensive relationship management, use the dedicated relationships page. This page provides powerful tools for viewing, filtering, and managing all relationships for an entity in one place.

**How to Access:**

1. View any entity's detail page
2. Click "Manage Relationships" in the Relationships section header
3. Or navigate directly to `/entities/{type}/{id}/relationships`

**Features:**

**Filter Relationships**
- Filter by relationship type (knows, allied_with, etc.)
- Filter by target entity type (character, faction, location, etc.)
- Filter by relationship strength (strong, moderate, weak)
- Search across entity names, relationship types, notes, and tags

**Sort and View**
- Sort by target entity name, relationship type, strength, or creation date
- View relationships in a comprehensive table format
- See all relationship metadata at a glance
- Paginate through large relationship sets (20, 50, or 100 per page)

**Bulk Operations**
- Select multiple relationships using checkboxes
- Delete multiple relationships at once
- Update strength for all selected relationships
- Add tags to multiple relationships simultaneously
- Clear selection when done

**Quick Actions**
- Quick add button to create new relationships without leaving the page
- Edit and delete buttons for individual relationships
- Empty states guide you when there are no relationships

**Tips:**
- Use filters to find specific relationships quickly
- Bulk operations save time when managing many relationships
- The page remembers your pagination settings via URL parameters
- Filters reset pagination to page 1 automatically

### Editing Individual Relationships

You can modify existing relationships without having to delete and recreate them.

**To edit a relationship:**

1. View the entity's detail page
2. Find the relationship in the Relationships section
3. Click the edit icon (pencil button) on the relationship card
4. The edit modal opens with current values
5. Update any fields you want to change:
   - Relationship type
   - Strength (strong, moderate, weak)
   - Notes
   - Tags
   - Tension level (0-100)
   - Bidirectional toggle
6. Click "Save Changes"

**Important Notes:**

- Only forward links show the edit button. Reverse links (incoming relationships from bidirectional connections) must be edited from the other entity.
- When you toggle bidirectional ON, a reverse link is automatically created on the target entity.
- When you toggle bidirectional OFF, the reverse link is removed from the target entity.
- Timestamps are updated to reflect when the relationship was last modified.
- All changes are saved immediately after you click "Save Changes".

### Deleting Relationships

**Single Relationship:**
1. View the entity's detail page
2. Find the relationship in the Relationships section
3. Click the delete icon
4. Confirm the deletion

**Multiple Relationships:**
1. Navigate to the relationships management page
2. Select the relationships to delete using checkboxes
3. Click "Delete" in the bulk actions bar
4. Confirm the deletion

**Note**: Deleting a bidirectional relationship removes it from both entities.

### Visualizing Relationships with the Matrix View

The Relationship Matrix View provides a bird's-eye view of how entities connect across your campaign. Think of it as a spreadsheet where rows and columns are entities, and cells show their relationships.

**How to Access:**

Navigate to `/relationships/matrix` or click "Relationship Matrix" from the main navigation.

**What You'll See:**

A grid where:
- Rows represent one entity type (like NPCs)
- Columns represent another entity type (like Locations)
- Cells show how many relationships exist between specific entities
- Color intensity indicates relationship density (darker blue = more connections)

**Using the Matrix View:**

**Select Entity Types**
1. Choose what entity type to display in rows (default: Characters)
2. Choose what entity type to display in columns (default: Characters)
3. The matrix updates automatically to show those entity types

You can compare the same type (NPCs vs NPCs) or different types (NPCs vs Locations, Factions vs Items, etc.).

**View Relationships**
1. Look for colored cells in the grid
2. Hover over a cell to see the relationship count
3. Click a cell to see details of all relationships between those two entities
4. An empty (gray) cell means no relationships exist between those entities

**Create Relationships**
1. Click any cell in the matrix
2. If no relationship exists, the create relationship dialog opens
3. Fill in relationship details
4. Click "Create Link"

**Edit Relationships**
1. Click a cell that has existing relationships
2. Click the edit button next to any relationship
3. Modify relationship details
4. Click "Save Changes"

**Filter the View**

**By Relationship Type**
1. Click the relationship type dropdown in the controls
2. Select a specific type (knows, allied_with, located_at, etc.)
3. The matrix now shows only cells containing that relationship type

**Hide Empty Entities**
1. Toggle "Hide rows with no relationships" to remove entities that aren't connected to anything in the current column type
2. Toggle "Hide columns with no relationships" to remove entities that aren't connected to anything in the current row type
3. This focuses the matrix on entities that actually have connections

**Sort the Matrix**

**By Name**
1. Set row or column sort to "Alphabetical"
2. Choose ascending (A-Z) or descending (Z-A)
3. Entities display in alphabetical order

**By Connection Count**
1. Set row or column sort to "Connection Count"
2. Choose ascending (fewest connections first) or descending (most connections first)
3. Quickly identify well-connected entities or isolated ones

**Practical Use Cases:**

**Faction Network Mapping**
- Rows: Factions, Columns: Factions
- Filter: "allied_with" relationship type
- Result: See which factions are allied with each other at a glance

**NPC Location Tracking**
- Rows: NPCs, Columns: Locations
- Filter: "located_at" relationship type
- Result: See which NPCs are at which locations

**Item Ownership**
- Rows: NPCs, Columns: Items
- Filter: "owns" relationship type
- Result: Track who owns what items

**Character Connections**
- Rows: Characters, Columns: NPCs
- Sort by: Connection count
- Result: Identify which PCs know the most NPCs

**Tips:**

- Use the matrix to spot gaps in your campaign (isolated entities with no connections)
- Quickly identify hub entities with many connections (important NPCs, central locations)
- Compare different entity type combinations to discover unexpected patterns
- Hide empty entities to focus on the connected parts of your campaign
- The matrix uses the same relationship data as the entity detail pages—changes in one place appear everywhere

## Using Search

The global search feature helps you find anything in your campaign instantly.

### Opening Search

**Keyboard Shortcut**
Press Cmd+K (Mac) or Ctrl+K (Windows) from anywhere in the app.

**Click**
Click the search bar in the header.

### Searching for Entities

1. Start typing in the search bar
2. Results appear as you type (after a short delay)
3. Results are grouped by entity type
4. Up to 5 results shown per type
5. Use arrow keys to navigate results
6. Press Enter to view the selected entity
7. Press Escape to close search

### What Gets Searched

The search looks through:
- Entity names
- Descriptions
- Tags

**Example**: Searching for "wizard" will find:
- NPCs with "wizard" in their name
- Locations with "wizard" in the description
- Any entity tagged "wizard"

### Advanced Search Syntax

The global search supports special syntax for filtering by relationships:

**Relationship Filters:**
- `related:entity-name` - Find entities related to a specific entity
- `related:"entity name"` - Use quotes for entity names with spaces
- `related:entity-id` - Filter by exact entity ID
- `relationship:type` - Filter by relationship type (knows, allied_with, etc.)

**Combining Filters:**
You can combine relationship filters with regular search:
- `related:"Lord Vance" wizard` - Entities related to Lord Vance with "wizard" in their content
- `relationship:ally_of dragon` - Allied entities with "dragon" in their content
- `related:npc-123 relationship:knows` - Entities that "know" a specific NPC

**Examples:**
- `related:Grimwald` - All entities related to Grimwald
- `relationship:enemy_of` - All entities with enemy relationships
- `related:"The Silver Circle" relationship:member_of` - Members of The Silver Circle faction

### Search Tips

- Search is case-insensitive
- Partial matches work (searching "grim" finds "Grimwald")
- Use specific tags to narrow results
- The most recently updated entities appear first within each type
- Relationship syntax works anywhere in the search bar
- Multiple filters combine (AND logic)

### Keyboard Navigation

- **Arrow Down**: Move to next result
- **Arrow Up**: Move to previous result
- **Enter**: Open the selected result
- **Escape**: Close search and clear input
- **Tab**: Close search without clearing input

## Using Commands

The command palette provides quick access to common actions. Commands are context-aware shortcuts that speed up your workflow.

### Activating Command Mode

1. Open the search bar (Cmd+K or Ctrl+K)
2. Type "/" as the first character
3. Command list appears

### Available Commands

**/new [type]**
Create a new entity.
- Example: `/new npc` creates a new NPC
- Example: `/new location` creates a new location
- If you omit the type, it defaults to creating a character

**/search [query]**
Search across all entities.
- Example: `/search dragon` finds all entities related to dragons
- Behaves the same as regular search

**/go [destination]**
Navigate to specific pages.
- `/go campaign` - View campaign details
- `/go settings` - Open settings page
- `/go chat` - Open AI chat (future feature)

**/relate**
Create a relationship between entities.
- Only available when viewing an entity
- Opens the relationship creation form
- Faster than scrolling to the Relationships section

**/summarize**
Generate an AI summary of the current entity.
- Only available when viewing an entity
- Requires API key configured
- Creates a concise overview of the entity

**/settings**
Opens the settings page.
- Quick access to configuration
- Same as clicking the gear icon

### Using Commands

1. Open search (Cmd+K or Ctrl+K)
2. Type "/" followed by the command name
3. Add any arguments after a space
4. Press Enter to execute
5. The command runs and takes you to the relevant page

**Examples**:
- `/new faction` - Creates a new faction
- `/go settings` - Opens settings
- `/relate` - Starts creating a relationship (when viewing an entity)

### Command Tips

- Commands filter as you type
- Only relevant commands show (e.g., `/relate` only appears when viewing an entity)
- You can use arrow keys to select commands before pressing Enter
- Commands save time compared to clicking through menus

## Managing Campaigns

Director Assist supports multiple campaigns, allowing you to manage different adventures or game systems in one place.

### Viewing Your Campaigns

Access your campaign list by navigating to `/entities/campaign` or clicking on campaigns in the entity navigation.

**What You'll See:**
- List of all your campaigns
- Active campaign badge showing which campaign is currently active
- Campaign details (name, description, system, setting)
- Creation and update timestamps

### Active Campaign

One campaign is always marked as "active" - this is the campaign you're currently working with. All entities, relationships, and data belong to the active campaign.

**Campaign Switcher:**
- Available in the header for quick access
- Click to see all campaigns and switch between them
- Active campaign clearly indicated

### Switching Campaigns

To switch to a different campaign:

1. Navigate to the campaigns list (`/entities/campaign`)
2. Find the campaign you want to activate
3. Click the "Set as Active" button
4. The page will reload with the new active campaign

All navigation, entities, and relationships will now show data from the newly active campaign.

### Creating Additional Campaigns

To create a new campaign:

1. Go to the campaigns list
2. Click "New Campaign"
3. Fill in campaign details:
   - **Name**: Campaign title
   - **Description**: Brief overview
   - **System**: Game system (Draw Steel, D&D 5e, etc.)
   - **Setting**: Campaign world or setting name
4. Click "Create Campaign"

The new campaign is created but doesn't become active automatically.

### Editing Campaign Details

To update a campaign:

1. Click on the campaign to view its details
2. Click "Edit"
3. Modify any fields
4. Click "Save Changes"

**Editable Fields:**
- Campaign name
- Description
- Game system
- Setting name
- Custom entity types
- Campaign settings

### Deleting Campaigns

To delete a campaign:

1. Navigate to the campaign detail page
2. Scroll to the bottom
3. Click the "Delete" button
4. Confirm the deletion

**Important Protection:**
- You cannot delete the last remaining campaign
- The delete button will be disabled with a tooltip explaining why
- If you're viewing the last campaign, you must create another campaign first
- Deleting the active campaign automatically switches to another available campaign

**Warning:** Deleting a campaign removes all associated entities, relationships, and data permanently. This action cannot be undone unless you have a backup.

### Campaign Settings

Each campaign has its own settings stored separately:

- **Custom Entity Types**: Define custom entity types specific to this campaign
- **Entity Type Overrides**: Customize built-in entity types for this campaign
- **Custom Relationships**: Define custom relationship types
- **Enabled Entity Types**: Control which entity types appear in the UI

Access campaign-specific settings:
1. View the campaign details
2. Click "Edit"
3. Scroll to the settings section
4. Make changes and save

## Settings

### Game System

Director Assist supports multiple game systems with system-specific fields and terminology. You can change your campaign's game system at any time.

**Available Systems:**

- **Draw Steel**: MCDM's Draw Steel system with specific fields for ancestry, class, kit, threat levels, victory points, and combat roles
- **System Agnostic**: Generic fields suitable for any TTRPG system without game-specific mechanics

**How System Selection Affects Your Campaign:**

When you select a game system, entity forms automatically adapt to show system-appropriate fields:

**Draw Steel System Adds:**
- **Characters**:
  - Identity: Ancestry, Heritage, Ancestry Trait
  - Class: Class, Kit, Heroic Resource, Class Features
  - Characteristics: Might, Agility, Reason, Intuition, Presence
  - Skills with training levels (Trained, Expert, Master)
  - Health: Max HP, Current HP, Vitality, Conditions
  - Resources: XP, Gold, Weapons, Armor
- **NPCs**: Threat Level (minion/standard/elite/boss/solo), Combat Role (ambusher, artillery, brute, controller, defender, harrier, hexer, leader, mount, support)
- **Encounters**: Victory Points, Negotiation DC, Challenge Level, Threats (entity references to NPCs), Environment, Victory Conditions, Defeat Conditions, Read-Aloud Text, Tactical Notes, Treasure & Rewards, Negotiation Position (hostile/unfavorable/neutral/favorable/friendly), Negotiation Motivations, system-specific encounter types (combat, negotiation, montage, exploration, social, puzzle, trap)
- **Sessions**: Session Duration, In-World Date, Party Present (entity references to characters), XP Awarded, Glory Awarded, Treasure Awarded, Key Decisions, Character Development, Campaign Milestones (tags), Power Roll Outcomes, Negotiation Outcomes, Initiative Order, Encounters Run (entity references to encounters)

**System Agnostic:**
- Uses only generic fields without system-specific mechanics
- Suitable for any TTRPG system
- Default for backwards compatibility with existing campaigns

**Changing Your Game System:**

1. Open Settings (gear icon in header or `/settings` command)
2. Scroll to the "Game System" section
3. Select your preferred game system from the dropdown
4. The system description explains what changes
5. Changes apply immediately to all entity forms

**When to Change System:**

- You started with System Agnostic but now want Draw Steel-specific fields
- You're switching campaign systems and want appropriate terminology
- You want to remove system-specific fields by switching to System Agnostic

**Important Notes:**

- Changing systems does not delete existing entity data
- System-specific field values are preserved even when hidden
- If you switch from Draw Steel to System Agnostic, Draw Steel fields are hidden but not deleted
- Switching back to Draw Steel restores visibility of those fields with their original values
- AI generation uses system-appropriate context and terminology

### Relationship Context Settings

When generating content with AI, Director Assist can include information about related entities to provide richer context. These settings control how relationship context is used during both per-field generation and full-entity generation.

**Applies To:**
- Per-field AI generation (when editing existing entities)
- Full-entity AI generation (planned feature)
- Chat assistant (when implemented)

**How to Access:**

1. Open Settings (gear icon in header or `/settings` command)
2. Scroll to the "Relationship Context" section
3. Adjust settings as needed
4. Click "Save Relationship Settings"

**Available Settings:**

**Include Related Entities**
- Checkbox to enable or disable relationship context in AI generation by default
- Default: On
- When enabled, the "Include relationship context" checkbox on entity edit forms is checked by default
- When disabled, the checkbox is unchecked by default (you can still enable it manually per entity)
- **Smart Field Detection**: When relationship context is enabled, the system automatically determines which fields benefit from it most, adjusting the character budget based on field priority (high priority fields like personality get more context than low priority fields like appearance)

**Maximum Related Entities**
- Controls how many related entities to include in generation context
- Range: 1-50 entities
- Default: 20 entities
- Higher values provide more context but consume more API tokens
- Lower values save tokens but may miss relevant connections

**Maximum Characters per Entity**
- Limits how much text from each related entity gets included
- Range: 1000-10000 characters
- Default: 4000 characters
- Prevents very detailed entities from dominating the context budget
- Content is truncated to this length if needed

**Context Budget for Relationships**
- Slider controlling what percentage of total context to allocate for relationships
- Range: 0-100%
- Default: 50% (balanced)
- 0% = Minimal relationship context, maximum primary entity context
- 50% = Equal balance between current entity and related entities
- 100% = Maximum relationship context
- Adjust based on whether you value breadth (relationships) or depth (current entity)

**Automatically Generate Entity Summaries**
- Checkbox to enable automatic summary generation for related entities
- Default: Off
- When enabled, AI creates concise summaries of related entities (uses additional API tokens)
- When disabled, raw entity data is used as-is
- Requires API key configured

**When to Adjust These Settings:**

**Increase context for complex generation:**
- Raise maximum related entities to 30-50
- Increase context budget to 70-80%
- Enable auto-generate summaries

**Reduce API costs:**
- Lower maximum related entities to 5-10
- Decrease context budget to 20-30%
- Keep auto-generate summaries disabled
- Disable "Include Related Entities" to turn off relationship context by default

**Balance quality and cost:**
- Use default settings (20 entities, 50% budget, summaries off, relationship context enabled)
- Adjust based on your specific needs

**Technical Notes:**

- Settings are stored in browser localStorage
- Changes take effect immediately for new generation requests
- The "Include Related Entities" setting controls the default state of the checkbox on entity forms
- You can override the default on a per-entity basis when editing
- Settings persist across browser sessions
- Not included in backups (local preference only)

## AI Features

Director Assist supports multiple AI providers to help generate content for your campaign. All AI features can be completely disabled with a single toggle, allowing you to use Director Assist as a pure campaign management tool without any AI elements.

**AI Features Toggle**

The master "Enable AI Features" toggle in Settings controls all AI-related functionality:

- **When enabled**: Generate buttons, sparkle icons, chat interface, and AI settings are visible
- **When disabled**: All AI elements are hidden; the app functions as a traditional campaign organizer
- **Default behavior**: Enabled automatically if you have an API key configured, disabled otherwise
- **Existing content**: AI-generated summaries and content remain visible when disabled, but you cannot generate new content

To toggle AI features on or off:
1. Open Settings (gear icon in header)
2. Find "Enable AI Features" at the top of the settings page
3. Click the toggle switch
4. The change takes effect immediately across the entire app

Choose the provider that works best for you.

### Supported AI Providers

**Anthropic (Claude)**
- Models: Claude Opus, Sonnet, and Haiku
- Known for: High-quality, nuanced responses
- Get API key: [console.anthropic.com](https://console.anthropic.com)

**OpenAI (GPT)**
- Models: GPT-4.5, GPT-4, GPT-3.5
- Known for: Versatile and widely-used
- Get API key: [platform.openai.com](https://platform.openai.com)

**Google (Gemini)**
- Models: Gemini Pro and Flash
- Known for: Fast responses and competitive pricing
- Get API key: [aistudio.google.com](https://aistudio.google.com)

**Mistral**
- Models: Mistral Large, Small, Nemo
- Known for: European provider with strong performance
- Get API key: [console.mistral.ai](https://console.mistral.ai)

**Ollama (Local)**
- Models: Run models locally on your computer
- Known for: Privacy and no API costs
- Setup: [ollama.ai](https://ollama.ai)

### Setting Up AI

1. Open Settings (gear icon or `/settings` command)
2. Ensure "Enable AI Features" toggle is turned on
3. Find the "AI Configuration" section
4. Select your preferred provider
5. Enter your API key (or base URL for Ollama)
6. Choose a model (recommended models are marked)
7. Click "Save Settings"

**Important**: Your API key is stored only in your browser. It's never included in backups and never sent anywhere except to your chosen provider's API.

### Working Without AI

Director Assist is a fully-functional campaign management tool even with AI features disabled.

**When AI is Disabled**

With the "Enable AI Features" toggle turned off in Settings:

- **Hidden**: Generate buttons, sparkle icons, chat interface, chat button in header, and AI configuration settings
- **Visible**: All entity management, relationships, search, command palette, backup/restore, and other core features
- **Content preservation**: Existing AI-generated content (like summaries) remains visible and editable as regular text
- **Data retention**: AI-generated content is preserved in your database and backups

**Use Cases for Disabling AI**

- You prefer manual campaign management without AI assistance
- You want to reduce distractions and keep the interface minimal
- You're working offline or without an API key
- You want to prevent accidental AI API usage and costs
- You're sharing your screen and want to hide AI features

**Re-enabling AI**

Simply toggle "Enable AI Features" back on in Settings to restore all AI functionality. Your API key and model preferences are preserved.

### Generating Field Content

You can generate content for individual fields while creating or editing an entity. AI generation is available for core entity fields (Summary and Description) as well as custom fields.

**How to Use**:

1. Start creating or editing an entity
2. Fill in basic information (name, description, tags)
3. Look for the Generate button (sparkle icon) next to text fields
4. Click the Generate button for the field you want to generate
5. AI generates context-aware content based on what you've already filled in
6. The generated text appears in the field
7. Edit the generated content as needed

**Core Field Generation**:

Summary and Description fields have dedicated Generate buttons that appear next to the field label when you have an API key configured.

- **Summary Generation**: Creates a brief 1-2 sentence summary based on the entity's name, description, tags, and other filled fields. Ideal for providing context to AI features.
- **Description Generation**: Creates a detailed multi-paragraph description based on the entity's name, summary, tags, and other filled fields.
- **Confirmation Dialog**: If the field already has content, you'll be asked to confirm before replacing it with AI-generated content. This prevents accidentally overwriting your work.

**Which Fields Support Generation**:
- Core entity fields: Summary and Description (with dedicated Generate buttons)
- Text fields (single-line)
- Text areas (multi-line)
- Rich text fields (markdown)

**Which Fields Don't Get Generated**:
- Select dropdowns
- Checkboxes
- Entity references
- Images
- URLs

### How AI Uses Context

When generating content, the AI looks at:
- Entity name
- Entity description
- Tags you've added
- Other fields you've already filled in
- Your campaign setting and system
- Field hints and placeholders
- **Related entities** (for existing entities with relationships, when enabled)

**Example**:
If you create an NPC named "Grimwald the Wise" with the description "elderly wizard" and role "apothecary owner", then click generate on the Personality field, the AI will create a personality that fits an elderly wizard who runs an apothecary.

### Relationship Context in Field Generation

When editing an entity that has relationships, you can choose to include information about related entities in AI generation. This produces more contextually aware content that fits naturally with the rest of your campaign.

**How to Use:**

When editing an entity with relationships, an expandable Relationship Context panel appears below the tags field. This panel provides granular control over which relationships to include.

**The Relationship Context Panel:**

- **Expand/Collapse**: Click the header to show or hide the relationship list
- **Relationship count**: Badge shows total number of relationships
- **Cache status summary**: Displays how many relationship summaries are valid, stale, or missing
- **Select All/Select None**: Quick controls to toggle all relationships at once
- **Total token count**: Shows estimated tokens for all selected relationships

**Individual Relationship Cards:**

Each relationship displays:
- **Checkbox**: Include or exclude this relationship from context
- **Entity name and type**: Target entity and relationship type
- **Cache status badge**:
  - "Valid" (green): Summary is up-to-date
  - "Stale" (yellow): Entity changed since summary was cached
  - "No Cache" (gray): No summary generated yet
- **Cache age**: When the summary was last generated (e.g., "Cached 2 hours ago")
- **Summary preview**: First two lines of the cached relationship summary
- **Token count**: Estimated tokens this relationship contributes
- **Regenerate button**: Click to generate a fresh summary for this relationship

**Smart Selection:**

Only appears when the entity has relationships and AI features are enabled. The panel remembers which relationships you've selected for future generations.

**Smart Field Detection:**

When relationship context is enabled, the system intelligently determines which fields benefit most:

**High Priority Fields** (75% of context budget):
- personality
- motivation
- goals
- relationships, alliances, enemies

**Medium Priority Fields** (50% of context budget):
- background
- description
- history
- role, occupation
- atmosphere, values, resources

**Low Priority Fields** (25% of context budget):
- appearance, physical_description
- tactics, combat_behavior

**Other Fields**: No relationship context included

**Entity Type Awareness:**

Relationship context works best for:
- **NPCs** - High and medium priority fields benefit from knowing allies, enemies, faction memberships
- **Characters** - Background and motivations benefit from knowing relationships with other PCs and NPCs
- **Factions** - History and goals benefit from alliances and rivalries
- **Locations** - Descriptions benefit from knowing inhabitants and connected locations

**What Gets Included:**

For each selected relationship:
- Cached summary of the related entity (if available)
- Or raw entity data if no summary exists
- Relationship type and metadata
- Non-hidden fields only
- Token budget controlled by field priority (see Smart Field Detection below)

**Example Workflow:**

```
1. You have an NPC "Elena the Bard" with relationships:
   - allied_with: "The Silver Circle" (Faction)
   - knows: "Grimwald the Wise" (NPC)
   - enemy_of: "Shadow Guild" (Faction)

2. Open the Relationship Context panel:
   - All three relationships appear with cache status
   - The Silver Circle: "Valid" (green badge) - Cached 1 hour ago
   - Grimwald the Wise: "Stale" (yellow badge) - Cached 3 days ago
   - Shadow Guild: "No Cache" (gray badge)

3. Select relationships to include:
   - Check "The Silver Circle" and "Grimwald the Wise"
   - Optionally click Regenerate on Grimwald to refresh stale summary
   - Total token count updates: "2,450 tokens"

4. Click Generate on the "personality" field (high priority)

5. The AI receives:
   - Elena's existing fields (name, description, tags)
   - Campaign context
   - Summaries for the two selected relationships
   - Character budget: ~3000 characters for relationships

6. Generated personality reflects selected relationships:
   "Elena is fiercely loyal to the Silver Circle and their cause,
   drawing wisdom from her friendship with Grimwald..."
```

**When Relationship Context is NOT Included:**

- Creating new entities (they have no relationships yet)
- Fields that don't benefit from relationship awareness (equipment, stats, etc.)
- When no relationships are selected in the panel
- When relationship context is disabled in Settings
- When the entity has no relationships
- For entity types that don't benefit from social context (items, encounters, etc.)

**Cache Regeneration:**

When you click the Regenerate button:
- AI creates a fresh summary for that specific relationship
- Cache status updates to "Valid" with current timestamp
- Summary preview updates with new content
- Token count recalculates
- The regenerated summary is immediately available for AI generation

**Privacy Protection:**

Hidden fields (secrets) from related entities are never included, protecting your campaign secrets.

**Default Behavior:**

Settings under "Relationship Context" control:
- Whether the panel is visible by default
- Maximum number of relationships to show
- Maximum characters per relationship summary
- Context budget allocation between entity and relationships

You can override these defaults on a per-entity basis using the panel controls.

### Using Generation Types in Chat

The chat interface includes a Generation Type Selector that helps you get more focused and structured responses from the AI. Instead of generic responses, you can choose the specific type of content you want to generate.

**How to Use the Selector:**

1. Open the chat interface (navigate to `/chat` or use `/go chat` command)
2. Look for the dropdown selector at the top of the chat
3. Click to see all available generation types
4. Select the type that matches what you want to create
5. The AI will now provide responses structured for that content type

**Available Generation Types:**

**General (Default)**
- General-purpose assistant for any campaign needs
- Use for open-ended questions or when other types don't fit
- No specific output structure

**NPC**
- Generate non-player characters with personality and background
- Output includes: Name, Role, Personality traits, Motivations, Background, and Relationships
- Perfect for quickly creating quest-givers, villains, or supporting characters

**Location**
- Create locations, places, and settings with atmosphere
- Output includes: Description, Atmosphere, Inhabitants, Points of Interest, and Connections
- Generates vivid places with sensory details

**Plot Hook**
- Generate plot hooks, story threads, and adventure ideas
- Output includes: Premise, Complications, Stakes, Potential Resolutions, and Connections
- Creates actionable story ideas with clear stakes

**Encounter**
- Design combat encounters and challenges
- Output includes: Setup, Enemies/Challenges, Terrain, Objectives, Rewards, and Scaling suggestions
- Provides tactical details and environmental factors

**Item**
- Create items, artifacts, and treasures
- Output includes: Appearance, Properties, History, and Value
- Balances mechanical effects with narrative significance

**Faction**
- Build factions, organizations, and groups
- Output includes: Overview, Goals, Resources, Leadership, Relationships, and Secrets
- Creates cohesive organizations with clear impact on the campaign world

**Session Prep**
- Help plan and prepare game sessions
- Output includes: Session Overview, Key Scenes, NPCs to Prep, Pacing Notes, Key Moments, and Contingencies
- Provides practical preparation ready to run at the table

**How Generation Types Work:**

When you select a generation type:
1. The system prompt changes to guide the AI for that specific content type
2. The AI follows a suggested structure for its responses
3. Responses are formatted with consistent sections for easier reading
4. The selection persists for the entire conversation (or until you change it)
5. You can switch types at any time to generate different content

**Tips for Best Results:**

- **Start specific**: Choose the type that best matches what you need
- **Provide context**: Mention your campaign setting, themes, or existing elements
- **Iterate freely**: Switch between types as your conversation evolves
- **Use the structure**: The suggested output format makes it easy to copy content into entity forms
- **Combine with entities**: Generate content in chat, then create entities from the results
- **Session prep workflow**: Use Session Prep type to plan, then switch to NPC or Encounter types for details

**Example Workflow:**

```
1. Select "Session Prep" type
2. Ask: "Help me plan next session. The party just discovered the secret cult."
3. Review the structured session plan
4. Switch to "NPC" type
5. Ask: "Create the cult leader mentioned in scene 2"
6. Get detailed NPC with personality and motivations
7. Switch to "Encounter" type
8. Ask: "Design the ritual chamber confrontation"
9. Get tactical encounter with terrain and objectives
```

**Mobile and Desktop:**

The selector works on all device sizes:
- Desktop: Full dropdown with icons and descriptions
- Mobile: Compact view with touch-friendly controls
- Both maintain the same functionality

### Privacy and AI

**Your secrets are safe**:
- Fields marked as "hidden" (like secrets) are NEVER sent to AI
- The AI only sees information you've put in non-hidden fields
- Your API key never leaves your browser
- No data is stored on Director Assist servers (there aren't any)

### AI Model Selection

Each provider offers multiple models with different capabilities and pricing. Director Assist categorizes models into tiers:

**Fast Tier**
- Quick responses, lower cost
- Examples: Claude Haiku, GPT-3.5 Turbo, Gemini Flash
- Best for: Simple field generation, quick content

**Balanced Tier**
- Good mix of speed and capability
- Examples: Claude Sonnet, GPT-4, Gemini Pro
- Best for: Most content generation tasks

**Powerful Tier**
- Highest quality, slower, more expensive
- Examples: Claude Opus, GPT-4.5
- Best for: Complex reasoning, nuanced content

For generating short field content, Fast tier models work great. Save Powerful tier models for when you need the highest quality or most complex reasoning.

### Generation Tips

**For Best Results**:
1. Fill in name, description, and tags first
2. Add any specific fields that provide context (like role or personality)
3. Generate more complex fields last (like background or history)
4. Always review and edit generated content
5. Regenerate if you don't like the first result

**Cost Considerations**:
- Each field generation uses a small amount of API credits
- Fast tier models are very affordable (pennies per request)
- You're charged directly by your provider, not Director Assist
- Monitor your usage in your provider's console
- Ollama is free (runs locally on your computer)
- Relationship summaries are automatically cached to avoid repeated API calls for unchanged entities

### Managing Conversations

Director Assist includes a conversation management system that lets you organize your AI assistant chats into separate conversations, similar to how messaging apps work. This helps you keep different topics, sessions, or planning phases organized.

**Opening the AI Assistant**

Click the chat icon in the header to open the AI Assistant panel. The panel slides in from the right side of the screen and includes:
- Conversation sidebar (top section)
- Context selector (to attach entities to your messages)
- Message history for the active conversation
- Input area to send messages

**Creating Conversations**

1. Open the AI Assistant panel
2. Click the "New Conversation" button at the top of the sidebar
3. A new conversation is created with a default name like "New Conversation"
4. The new conversation becomes active automatically
5. Start chatting in the new conversation

**Viewing Your Conversations**

The conversation sidebar shows all your conversations with:
- **Conversation name**: Click to switch to that conversation
- **Message count**: Badge showing how many messages are in the conversation
- **Last activity time**: Relative time (e.g., "2 hours ago", "just now")
- **Active indicator**: Blue highlight on the currently active conversation

**Switching Between Conversations**

1. Click any conversation in the sidebar to switch to it
2. The message history reloads to show messages from that conversation
3. The active conversation is highlighted with a blue background
4. You can have as many conversations as you need

**Renaming Conversations**

Keep your conversations organized with descriptive names:

1. Double-click on a conversation name in the sidebar
2. The name becomes editable (you'll see an input field)
3. Type the new name (e.g., "Session 1 Planning", "NPC Ideas", "World Building")
4. Press Enter to save or Escape to cancel
5. Empty names are not allowed - the original name will be kept

**Deleting Conversations**

1. Hover over a conversation in the sidebar
2. A trash icon appears on the right
3. Click the trash icon
4. Confirm the deletion in the dialog
5. The conversation and all its messages are permanently deleted
6. If you delete the active conversation, another conversation becomes active automatically

**When No Conversations Exist**

- When you first open the AI Assistant, a default conversation is automatically created
- If you delete all conversations, a new one is created automatically next time you open the panel
- You'll never be left without a way to start chatting

**Auto-Created Default Conversation**

The first time you open the AI Assistant (after clearing data or on first use), Director Assist automatically creates a "New Conversation" for you. You can rename this to whatever makes sense for your first chat session.

**Conversation Tips**

- **Organize by purpose**: Create separate conversations for different aspects of your campaign (e.g., "Session Prep", "NPC Development", "Plot Ideas")
- **Organize by session**: Create a new conversation for each game session to keep planning organized
- **Keep context focused**: Use different conversations to keep different topics separated and avoid confusing the AI with unrelated context
- **Clean up old conversations**: Delete conversations you no longer need to keep your sidebar tidy
- **Use descriptive names**: Rename conversations as soon as you know what they're about

**What's Preserved**

- All conversations and their messages are stored in your browser
- Conversations are included in backup exports
- Conversation history persists between sessions
- Deleting conversations is permanent and cannot be undone

**Conversation Context**

Messages within a conversation maintain context:
- The AI remembers previous messages in the same conversation
- Entities you attach via the Context Selector are remembered for that message
- Switching conversations starts a fresh context

## Backup & Restore

Your campaign data is stored in your browser's local storage. It's important to export regular backups in case you clear your browser data or switch devices.

### Smart Backup Reminders

Director Assist includes a smart backup reminder system that helps you remember to export your campaign data regularly. The app tracks when you should backup and shows gentle, non-intrusive reminders at the right time.

**When Reminders Appear:**

Backup reminders appear as an amber-colored banner at the top of the app when one of these conditions is met:

1. **First-time milestone**: You've created 5 or more entities and haven't exported a backup yet
2. **Progress milestones**: You've reached significant entity counts (10, 25, 50, 100, and then every 50 after that)
3. **Time-based**: It's been 7 or more days since your last backup export

**Minimum threshold**: Reminders only appear when you have at least 5 entities. Small campaigns with fewer entities don't trigger reminders.

**24-hour dismissal window**: When you click "Remind Me Later" on a reminder, it won't appear again for 24 hours. This prevents the same reminder from appearing repeatedly during a single session.

**What the Banner Shows:**

The backup reminder banner displays:
- A contextual message based on why it's appearing (milestone, time elapsed, or first-time)
- Your current entity count or days since last backup
- "Backup Now" button that takes you directly to the backup export
- "Remind Me Later" button to dismiss for 24 hours
- Close button (X) to dismiss for 24 hours

**Days Since Last Backup:**

On the Settings page, you'll see a "Days since last backup" indicator in the Backup & Restore section. This helps you track when you last exported your data:
- Shows number of days since your last export
- If you've never exported, it shows "Never"
- Updates automatically when you create a new backup

**How It Works:**

The backup reminder system tracks three pieces of information in your browser:
- **Last export date**: When you last clicked "Export Backup"
- **Last dismissal date**: When you last dismissed a reminder
- **Last milestone reached**: The highest entity count milestone you've hit

This data is stored locally and is never sent anywhere. The system uses this to intelligently determine when to show reminders without being annoying.

**Tips:**
- Reminders automatically disappear after you export a backup
- The 24-hour dismissal ensures you won't see the same reminder repeatedly
- Milestones are progressive—once you hit a milestone, it won't remind you about it again
- Days since export resets to 0 when you create a new backup

### Exporting a Backup

1. Open Settings (gear icon or `/settings` command)
2. Scroll to the "Backup & Restore" section
3. Click "Export Backup"
4. Choose where to save the file
5. The backup downloads as a JSON file

When you export a backup, the app records the timestamp. This resets the backup reminder system and updates the "Days since last backup" indicator.

**File Name Format**: `director-assist-backup-YYYY-MM-DD.json`

### What's Included in Backups

- All entities (NPCs, locations, factions, etc.)
- All relationships between entities
- Campaign information (name, setting, system)
- Chat history (if you've used AI chat)
- Your selected AI provider and model preferences

### What's NOT Included in Backups

For security, backups never include:
- Your API key
- Any settings stored outside the campaign database

This means you can safely share backups with other Directors or store them in cloud services without exposing your API credentials.

### Importing a Backup

**Warning**: Importing a backup will replace all current data. Export a backup first if you want to save your current campaign.

1. Open Settings
2. Scroll to "Backup & Restore"
3. Click "Import Backup"
4. Select your backup JSON file
5. Confirm the import
6. Your campaign data is restored

After importing, you'll need to re-enter your API key in Settings if you want to use AI features. Your AI provider and model preferences will be restored automatically from the backup.

### Backup Best Practices

**How Often to Backup**:
- After every session
- Before making major changes
- Weekly if you're actively developing the campaign
- Before clearing browser data or switching browsers

**Where to Store Backups**:
- Cloud storage (Google Drive, Dropbox, OneDrive)
- External hard drive
- Multiple locations for important campaigns

**File Management**:
- Keep dated backups so you can restore to earlier versions
- Delete old backups after confirming new ones work
- Consider keeping backups from major campaign milestones

### Moving Between Devices

To transfer your campaign to another device:

1. Export a backup on the original device
2. Transfer the JSON file (email, USB drive, cloud storage)
3. Open Director Assist on the new device
4. Import the backup
5. Re-enter your API key in Settings

## Filtering Entities

Director Assist provides powerful filtering options to help you find entities based on their relationships and characteristics.

### Entity List Filtering

On any entity list page (NPCs, Locations, Factions, etc.), you'll find a filtering panel above the search bar with three options:

**Related To Filter**
- Dropdown showing all entities grouped by type
- Select an entity to see only entities connected to it
- Shows both forward relationships (entities this one links to) and reverse relationships (entities that link to this one)
- Example: Select "Lord Vance" to see all NPCs, locations, and factions connected to him

**Relationship Type Filter**
- Dropdown showing all relationship types used in your campaign
- Filter to specific relationship types like "allied_with", "enemy_of", "member_of"
- Dynamically populated based on relationships in your campaign
- Example: Select "enemy_of" to see all entities with enemy relationships

**Has Relationships Checkbox**
- Toggle to show only entities that have any relationships
- Useful for finding entities you've already connected
- Helps identify entities that need relationship mapping

**Clear Filters Button**
- Quickly reset all filters to their default state
- Located at the bottom right of the filter panel

### URL Persistence

Filter settings are saved in the URL, which means:
- You can bookmark filtered views
- Browser back/forward buttons work with filters
- Share URLs with specific filters applied
- Filters persist across page refreshes

**URL Parameters:**
- `relatedTo=entity-id` - Related to entity filter
- `relType=relationship-type` - Relationship type filter
- `hasRels=true` - Has relationships filter

### Combining Filters

Filters work together to narrow your results:

**Example 1: Enemy NPCs**
1. Go to NPCs page
2. Set Relationship Type to "enemy_of"
3. Results show all NPCs with enemy relationships

**Example 2: Faction Members in a City**
1. Go to Characters page
2. Set Related To to a specific city location
3. Set Relationship Type to "member_of"
4. Results show characters who are members of factions and connected to that city

**Example 3: Connected Entities**
1. Set Related To to any entity
2. Check "Has Relationships"
3. Results show all entities connected to the selected entity that also have their own relationships

### Using Filters with Search

Filters combine with the search bar for precise results:

1. Apply relationship filters from the filter panel
2. Type in the search bar to further narrow by name, description, or tags
3. Pagination automatically resets to page 1 when filters change

**Example:**
- Filter: Related To = "The Silver Circle"
- Filter: Relationship Type = "member_of"
- Search: "wizard"
- Result: Wizard members of The Silver Circle faction

## Tips & Best Practices

### Campaign Organization

**Start Small**
Don't try to create your entire world at once. Start with:
- The current location
- NPCs the players will meet soon
- Active factions or threats
- Important items or plot threads

Add more as it becomes relevant.

**Use Tags Effectively**
Good tagging makes search powerful. Consider tags like:
- Status: "active", "deceased", "missing"
- Type: "quest-giver", "villain", "ally", "neutral"
- Location: "waterdeep", "underdark", "chapter-1"
- Plot: "main-quest", "side-quest", "background"
- Mood: "comedy", "serious", "mysterious"

**Create Relationships as You Go**
When you introduce an NPC who knows another NPC, create the relationship immediately. It's harder to remember later.

**Leverage Session Entities**
Create a Session entity after each game session with:
- What happened
- Important decisions
- New NPCs or locations introduced
- Unresolved plot threads
- Next session prep notes

### Workflow Suggestions

**Session Prep Workflow**:
1. Review the previous Session entity
2. Create or update entities for planned encounters
3. Review NPC relationships to refresh dynamics
4. Use search to find relevant past entities
5. Create relationships for new connections
6. Export a backup before the session

**During Session Workflow**:
1. Use quick search (Cmd+K) to find NPCs or locations mid-session
2. Create new NPCs on the fly with `/new npc`
3. Add quick notes to existing entities as needed
4. Jot down new tags or relationships to add later

**Post-Session Workflow**:
1. Create a Session entity with notes
2. Update entity statuses (if NPCs died or plots resolved)
3. Create new entities for anything introduced
4. Add relationships that emerged in play
5. Tag entities with session numbers (e.g., "session-5")
6. Export a backup (the app will remind you if it's been a while)

### Field Tips

**Names**: Make them memorable and distinct. Avoid names that sound too similar.

**Descriptions**: Write one or two sentences that capture the essence. You can always expand later.

**Tags**: Use them liberally. It's better to over-tag than under-tag.

**Secrets**: Put anything players shouldn't know in secret fields. They're protected from AI generation.

**Images**: Use images sparingly - they increase backup file size and can slow things down.

**Rich Text**: Use the markdown editor toolbar for easy formatting:
- Click the toolbar buttons or use keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic)
- Switch between edit, preview, and split modes using the mode buttons
- Preview your formatted text in real-time
- Headings: `## Heading`
- Bold: `**bold text**` or Ctrl+B
- Italic: `*italic text*` or Ctrl+I
- Lists: Start lines with `-` or `1.`
- Code: Wrap text in backticks or use the code button
- Links: Use the link button or `[text](url)` syntax

### Search Tips

**Find Anything Fast**:
- Tag entities with session numbers to find "what happened in session 5"
- Tag locations by region to find "all entities in the underdark"
- Tag plot threads to find "all entities connected to the dragon cult"
- Use relationship filters to find connected entities
- Combine filters with search for precise queries

**Use Descriptive Tags**:
Instead of just "npc", use specific tags like "shopkeeper", "guard", "noble", "villain".

**Use Relationship Filters Effectively**:
- Filter by "related to" to see an entity's network
- Use relationship types to find specific connections (allies, enemies, members)
- Check "has relationships" to find entities you've already mapped
- Combine relationship filters with text search for precision
- Bookmark filtered URLs for quick access to common queries

### AI Tips

**Generate in Order**:
Generate simpler fields first (like role or occupation), then use those as context for more complex fields (like personality or motivation).

**Edit Freely**:
AI-generated content is a starting point. Always review and modify to fit your vision.

**Regenerate if Needed**:
Don't like what the AI created? Just click generate again for a new version.

**Provide Good Context**:
The more information you provide in name, description, and tags, the better the AI's output.

**Use Relationship Context Strategically**:
- Enable relationship context for entities deeply connected to your campaign (faction leaders, main NPCs, important locations)
- Consider disabling it for isolated entities or quick one-offs to save tokens
- Create relationships before generating to take full advantage of contextual awareness
- Review the estimated token cost to manage API usage

### Performance Tips

**Browser Choice**:
Chrome, Edge, and Firefox all work well. Safari works but may be slower with large campaigns.

**Entity Count**:
Director Assist handles thousands of entities efficiently. Don't worry about creating too many.

**Image Size**:
Keep images under 1MB each for best performance. Large images slow down backups.

**Regular Maintenance**:
- Delete unused entities periodically
- Clean up obsolete relationships
- Remove duplicate tags

## Troubleshooting

### Common Issues

**Issue: I can't see my data after refreshing the page**

This usually means browser data was cleared or you're in incognito/private mode.

**Solutions**:
- Check if you have a backup to restore
- Avoid using incognito mode for campaign management
- Make sure browser storage isn't being automatically cleared
- Try a different browser

**Issue: Search isn't finding entities I know exist**

Search looks at name, description, and tags only.

**Solutions**:
- Check if the entity has the term in those fields
- Try searching for a different term
- Navigate directly via the sidebar instead
- Check spelling of your search term

**Issue: AI generation isn't working**

Several things could cause this.

**Solutions**:
- Verify "Enable AI Features" toggle is turned ON in Settings
- Verify your API key is entered correctly in Settings
- Check your API key is active in your provider's console
- Ensure you have API credits available
- Check your internet connection
- Try refreshing the page

**Issue: I don't see generate buttons or AI features**

AI features may be disabled.

**Solutions**:
- Open Settings and check if "Enable AI Features" toggle is turned ON
- If you just added an API key, the toggle should enable automatically on page refresh
- Try manually toggling the switch on
- Refresh the page after toggling

**Issue: The app is running slowly**

Large campaigns or images can affect performance.

**Solutions**:
- Check how many entities you have (thousands are fine, tens of thousands may slow down)
- Look for very large images and replace with smaller versions
- Try a different browser
- Close other browser tabs using lots of memory
- Clear browser cache (but export a backup first!)

**Issue: I keep seeing backup reminders**

The backup reminder system is designed to be helpful, not intrusive.

**Solutions**:
- Click "Backup Now" to export a backup and reset the reminder system
- Click "Remind Me Later" to dismiss for 24 hours
- If you've hit a milestone, export a backup to acknowledge the reminder
- The reminder only appears when you've reached a new milestone or it's been 7+ days
- Once dismissed, it won't appear again for 24 hours even if you refresh the page

**Issue: I don't see backup reminders**

You may not meet the conditions for a reminder yet.

**Solutions**:
- Create at least 5 entities before reminders appear
- If you just dismissed a reminder, wait 24 hours before it can appear again
- If you recently exported a backup, reminders won't show until the next milestone or 7+ days
- Check the "Days since last backup" on the Settings page to see your export history

**Issue: Export/import isn't working**

File handling can sometimes have issues.

**Solutions**:
- Make sure you're selecting a valid JSON backup file when importing
- Try exporting to a different location
- Check available disk space
- Try a different browser
- Verify the backup file isn't corrupted (it should be valid JSON)

**Issue: Relationships aren't showing up**

Relationship display depends on proper creation.

**Solutions**:
- Refresh the page to ensure data is synced
- Verify the relationship was actually created (check both entities)
- Make sure you didn't accidentally delete one of the entities
- Check if you're looking at the right entity

**Issue: I lost my API key after importing a backup**

This is expected behavior for security.

**Solutions**:
- API keys are never included in backups for security reasons
- Your Claude model preference (Haiku, Sonnet, Opus) IS restored from the backup
- Re-enter your API key in Settings after importing
- Keep your API key stored securely elsewhere

**Issue: Theme isn't changing**

Theme issues usually relate to browser settings.

**Solutions**:
- Try selecting a different theme in Settings
- If using "System", check your OS dark mode setting
- Clear browser cache
- Try refreshing the page
- Check if browser extensions are interfering

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages (F12 or right-click > Inspect > Console)
2. Try the same action in a different browser
3. Export a backup before trying fixes
4. Open an issue on GitHub with details about the problem

### Data Recovery

If you've lost data and don't have a backup:

**Browser Storage**:
Your data might still be in the browser's IndexedDB. Don't clear browser data until you've tried:

1. Refreshing the page
2. Restarting the browser
3. Checking if you were using a different browser
4. Looking for backups in your download folder

**Prevention**:
- Export backups regularly
- Store backups in multiple locations
- Keep backups after major campaign events
- Don't rely solely on browser storage

---

## Quick Reference Card

**Keyboard Shortcuts**:
- Cmd/Ctrl + K: Open search/commands

**Commands**:
- `/new [type]`: Create entity
- `/relate`: Add relationship
- `/search [query]`: Search entities
- `/go [page]`: Navigate
- `/settings`: Open settings
- `/summarize`: AI summary

**Search Syntax**:
- `related:entity-name`: Filter by related entity
- `related:"entity name"`: Use quotes for names with spaces
- `relationship:type`: Filter by relationship type
- Combine with text: `related:Grimwald wizard`

**Relationship Filters**:
- Related To: See entities connected to another entity
- Relationship Type: Filter by specific relationship
- Has Relationships: Show only connected entities
- Clear Filters: Reset all filters

**Entity Types**:
Characters, NPCs, Locations, Factions, Items, Encounters, Sessions, Deities, Timeline Events, World Rules, Player Profiles

**Essential Workflows**:
1. Create campaign
2. Add entities
3. Create relationships
4. Filter by relationships
5. Search to find
6. Export backups

---

Happy directing! May your campaigns be epic and your notes stay organized.
