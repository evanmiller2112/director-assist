# Director Assist User Guide

Welcome to Director Assist! This guide will help you get started managing your Draw Steel campaign with confidence.

## Table of Contents

1. [What is Director Assist?](#what-is-director-assist)
2. [Getting Started](#getting-started)
3. [Creating Entities](#creating-entities)
4. [Connecting Entities](#connecting-entities)
5. [Using Search](#using-search)
6. [Using Commands](#using-commands)
7. [AI Features](#ai-features)
8. [Backup & Restore](#backup--restore)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

## What is Director Assist?

Director Assist is a campaign management tool designed specifically for Directors running Draw Steel TTRPG campaigns. Think of it as your digital campaign notebook that helps you organize everything in one place.

**What makes it special:**

- Works completely in your browser - no account or login needed
- All your data stays private on your device
- Fast global search to find anything instantly
- Create relationships between NPCs, locations, factions, and more
- Optional AI-powered content generation using Claude
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
3. Paste your Anthropic API key
4. Select your preferred AI model (or leave the default)
5. Click "Save Settings"

Don't have an API key? You can still use Director Assist! The AI features are completely optional. Visit [console.anthropic.com](https://console.anthropic.com) to get an API key if you want them later.

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

Director Assist includes 11 entity types to help you organize your campaign.

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
Plan combat, social, or exploration encounters. Include objective, difficulty, enemies, rewards, and notes.

**Sessions**
Keep session notes and prep for upcoming sessions. Track what happened, what's next, and any loose threads.

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
Full markdown editor for formatted text. Supports headings, lists, bold, italic, and more. Great for backgrounds, histories, or detailed descriptions.

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

## Connecting Entities

One of Director Assist's most powerful features is the ability to create relationships between entities. This helps you track how everything in your campaign connects.

### Creating a Relationship

**Method 1: From the Entity Detail Page**

1. View any entity's details
2. Scroll to the "Relationships" section
3. Click "Add Relationship"
4. Select the target entity from the dropdown
5. Choose a relationship type (knows, allied_with, located_at, etc.)
6. Optionally make it bidirectional (both entities show the link)
7. Add relationship strength (strong, moderate, weak)
8. Add tags or tension level if relevant
9. Click "Create Link"

**Method 2: Using the Command Palette**

1. View any entity's details
2. Press Cmd+K (Mac) or Ctrl+K (Windows)
3. Type "/relate"
4. Press Enter
5. Follow the same steps as Method 1

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

### Editing Relationships

To modify a relationship:

1. View the entity's detail page
2. Find the relationship in the Relationships section
3. Click the edit icon
4. Update the fields
5. Click "Save Changes"

### Deleting Relationships

To remove a relationship:

1. View the entity's detail page
2. Find the relationship in the Relationships section
3. Click the delete icon
4. Confirm the deletion

**Note**: Deleting a bidirectional relationship removes it from both entities.

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

### Search Tips

- Search is case-insensitive
- Partial matches work (searching "grim" finds "Grimwald")
- Use specific tags to narrow results
- The most recently updated entities appear first within each type

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

## AI Features

If you've configured an Anthropic API key, Director Assist can help generate content using Claude AI.

### Setting Up AI

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open Settings (gear icon or `/settings` command)
3. Paste your API key in the "Anthropic API Key" field
4. Select your preferred model (Claude Haiku is recommended for speed and cost)
5. Click "Save Settings"

**Important**: Your API key is stored only in your browser. It's never included in backups and never sent anywhere except directly to Anthropic's API.

### Generating Field Content

You can generate content for individual fields while creating or editing an entity.

**How to Use**:

1. Start creating or editing an entity
2. Fill in basic information (name, description, tags)
3. Look for the sparkle (✨) button next to text fields
4. Click the sparkle button for the field you want to generate
5. AI generates context-aware content based on what you've already filled in
6. The generated text appears in the field
7. Edit the generated content as needed

**Which Fields Support Generation**:
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

**Example**:
If you create an NPC named "Grimwald the Wise" with the description "elderly wizard" and role "apothecary owner", then click generate on the Personality field, the AI will create a personality that fits an elderly wizard who runs an apothecary.

### Privacy and AI

**Your secrets are safe**:
- Fields marked as "hidden" (like secrets) are NEVER sent to AI
- The AI only sees information you've put in non-hidden fields
- Your API key never leaves your browser
- No data is stored on Director Assist servers (there aren't any)

### AI Model Selection

Director Assist automatically selects the latest Claude Haiku model for the best balance of speed, quality, and cost. You can change models in Settings if you prefer a different model.

**Model Options**:
- Claude Haiku: Fast and cost-effective (recommended)
- Claude Sonnet: More capable, slower, more expensive
- Claude Opus: Most capable, slowest, most expensive

For generating short field content, Haiku works great. Save Sonnet or Opus for when you need higher quality or more complex reasoning.

### Generation Tips

**For Best Results**:
1. Fill in name, description, and tags first
2. Add any specific fields that provide context (like role or personality)
3. Generate more complex fields last (like background or history)
4. Always review and edit generated content
5. Regenerate if you don't like the first result

**Cost Considerations**:
- Each field generation uses a small amount of API credits
- Haiku is very affordable (pennies per request)
- You're charged directly by Anthropic, not Director Assist
- Monitor your usage in the Anthropic console

## Backup & Restore

Your campaign data is stored in your browser's local storage. It's important to export regular backups in case you clear your browser data or switch devices.

### Exporting a Backup

1. Open Settings (gear icon or `/settings` command)
2. Scroll to the "Backup & Restore" section
3. Click "Export Backup"
4. Choose where to save the file
5. The backup downloads as a JSON file

**File Name Format**: `director-assist-backup-YYYY-MM-DD.json`

### What's Included in Backups

- All entities (NPCs, locations, factions, etc.)
- All relationships between entities
- Campaign information (name, setting, system)
- Chat history (if you've used AI chat)

### What's NOT Included in Backups

For security, backups never include:
- Your API key
- AI model preferences
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

After importing, you'll need to re-enter your API key in Settings if you want to use AI features.

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
6. Export a backup

### Field Tips

**Names**: Make them memorable and distinct. Avoid names that sound too similar.

**Descriptions**: Write one or two sentences that capture the essence. You can always expand later.

**Tags**: Use them liberally. It's better to over-tag than under-tag.

**Secrets**: Put anything players shouldn't know in secret fields. They're protected from AI generation.

**Images**: Use images sparingly - they increase backup file size and can slow things down.

**Rich Text**: Use markdown for formatted descriptions:
- Headings: `## Heading`
- Bold: `**bold text**`
- Italic: `*italic text*`
- Lists: Start lines with `-` or `1.`

### Search Tips

**Find Anything Fast**:
- Tag entities with session numbers to find "what happened in session 5"
- Tag locations by region to find "all entities in the underdark"
- Tag plot threads to find "all entities connected to the dragon cult"

**Use Descriptive Tags**:
Instead of just "npc", use specific tags like "shopkeeper", "guard", "noble", "villain".

### AI Tips

**Generate in Order**:
Generate simpler fields first (like role or occupation), then use those as context for more complex fields (like personality or motivation).

**Edit Freely**:
AI-generated content is a starting point. Always review and modify to fit your vision.

**Regenerate if Needed**:
Don't like what the AI created? Just click generate again for a new version.

**Provide Good Context**:
The more information you provide in name, description, and tags, the better the AI's output.

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
- Verify your API key is entered correctly in Settings
- Check your API key is active in the Anthropic console
- Ensure you have API credits available
- Check your internet connection
- Try refreshing the page

**Issue: The app is running slowly**

Large campaigns or images can affect performance.

**Solutions**:
- Check how many entities you have (thousands are fine, tens of thousands may slow down)
- Look for very large images and replace with smaller versions
- Try a different browser
- Close other browser tabs using lots of memory
- Clear browser cache (but export a backup first!)

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
- API keys are never included in backups
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

**Entity Types**:
Characters, NPCs, Locations, Factions, Items, Encounters, Sessions, Deities, Timeline Events, World Rules, Player Profiles

**Essential Workflows**:
1. Create campaign
2. Add entities
3. Create relationships
4. Search to find
5. Export backups

---

Happy directing! May your campaigns be epic and your notes stay organized.
