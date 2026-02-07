# Richtext Field Formatting Guidelines

This guide provides recommendations for formatting richtext fields in Director Assist to maintain consistency and maximize utility across your campaign.

## Overview

Richtext fields use Markdown formatting and support structured content. Following these guidelines helps you:

- Create consistent, scannable records
- Maximize AI generation quality
- Enable easier session reviews
- Prepare for future features like scene analytics

These are recommendations, not requirements. Use the structure that works best for your campaign.

## General Richtext Best Practices

### Use Markdown Structure

Richtext fields support full Markdown formatting. Use it to create clear, organized content:

**Headings**: Organize content into sections
```markdown
## Main Section
### Subsection
```

**Lists**: Present related items clearly
```markdown
- First point
- Second point
- Third point
```

**Emphasis**: Highlight important details
```markdown
**Bold** for critical information
*Italic* for emphasis or internal thoughts
```

**Code blocks**: Format mechanics or stats
```markdown
`3d6 damage` or `DC 15 Strength check`
```

### Keep It Scannable

- Use short paragraphs (2-4 sentences)
- Break up long text with headings
- Use bullet points for lists
- Add blank lines between sections

### Be Specific

Include concrete details:
- Names of characters involved
- Specific locations within the scene
- Mechanical outcomes (damage dealt, checks made, resources spent)
- Emotional beats or character moments

## Scene-Specific Formatting

Scenes use four richtext fields, each with a different purpose and recommended structure.

### Scene Setting (Read-Aloud)

**Purpose**: Vivid description you read to players when the scene begins

**Structure**:
```
Opening image paragraph (what players see first)

Sensory details paragraph (sounds, smells, atmosphere)

Key elements paragraph (important NPCs, objects, or features)
```

**Style Guidelines**:
- Write in present tense for immediacy
- Engage multiple senses
- Keep paragraphs short for natural pauses
- End with a hook or question to prompt player action

**Example**:
```markdown
The bandit camp sprawls before you in a clearing ringed by ancient oaks. Firelight flickers from a dozen crude shelters, casting dancing shadows across the trampled grass.

The acrid smell of woodsmoke mingles with unwashed bodies and leather. Rough laughter carries from the largest tent, where a pennant bearing a broken crown hangs limp in the still air.

Near the fire pit, three guards play dice, their weapons leaning against a supply wagon. In the shadows beyond, you catch a glimpse of movement—the hostages, bound but alive.
```

### What Happened

**Purpose**: Record what actually occurred during play for future reference

**Structure**:
```markdown
## Key Events
Major plot points and encounters that occurred

## Decisions
Important choices the party made

## Outcomes
Consequences and results of actions

## Notes
Mechanical details, round counts, memorable moments
```

**Content Guidelines**:
- Record in past tense
- Include round counts for combat encounters
- Note important dialogue or character moments
- Track consequences for future sessions
- List any treasure, XP, or rewards gained

**Example**:
```markdown
## Key Events
- Party attempted to negotiate with bandit leader Krell
- Negotiations broke down when ranger insulted Krell's honor
- Combat began, lasting 5 rounds
- Bandits were defeated but Krell escaped on horseback

## Decisions
- Tactician chose to target lieutenants first rather than Krell
- Shadow freed hostages during round 3 instead of joining combat
- Party decided to pursue Krell rather than loot the camp

## Outcomes
- 8 bandits captured, 4 dead, Krell fled north
- 3 hostages rescued: merchant Garvin, his daughter Elara, guard Tormund
- Garvin offered reward of 200 gold and information about northern ruins
- Party learned Krell works for "The Broken Crown" organization

## Notes
- **Combat**: 5 rounds, party used 2 Victories, Fury used heroic ability
- **Memorable moment**: Shadow's acrobatic rescue through burning tent
- **XP**: 400 XP awarded (major encounter)
- **Resources**: Party down 1 Recovery each, Fury at half HP
```

### Pre-Scene Summary

**Purpose**: Brief setup for the scene (used in session timelines and AI context)

**Structure**: Exactly 1-2 sentences
- **Setup sentence**: Where are they and what's the situation?
- **Expectation sentence**: What do they plan to do?

**Style Guidelines**:
- Write in present tense
- Keep under 50 words total
- Focus on setup, not outcomes
- Include key NPCs or locations by name

**Examples**:
```markdown
The party arrives at Krell's bandit camp at dusk. They plan to negotiate for the hostages' release before resorting to combat.
```

```markdown
Following the map from Garvin, the party enters the Northern Ruins. They seek the Chamber of Echoes where the ritual components are hidden.
```

```markdown
Lady Thornhaven summons the party to her estate. She needs their help investigating mysterious disappearances among the city's nobility.
```

### Post-Scene Summary

**Purpose**: Brief outcome for the scene (used in session timelines and AI context)

**Structure**: Exactly 1-2 sentences
- **Key event sentence**: What was the primary outcome?
- **Consequence sentence**: What happens next or what changed?

**Style Guidelines**:
- Write in past tense
- Keep under 50 words total
- Focus on significant outcomes only
- Set up the next scene if applicable

**Examples**:
```markdown
Negotiations failed and the party fought Krell's bandits, rescuing the hostages. Krell escaped north, and Garvin revealed information about The Broken Crown organization.
```

```markdown
The party solved the Chamber of Echoes puzzle and obtained the ritual components. They discovered evidence that someone else has been searching the ruins recently.
```

```markdown
Lady Thornhaven hired the party to investigate the disappearances. The first lead points to the abandoned Riverside District warehouse.
```

## Entity-Specific Formatting

### Character & NPC Richtext Fields

**Background, Personality, Motivation**:
- Use paragraphs for narrative descriptions
- Use bullet points for key traits or goals
- Mix both for comprehensive profiles

**Example (NPC Personality)**:
```markdown
Krell is a pragmatic leader who values loyalty above all else. Once an honorable soldier, he became disillusioned after being betrayed by his commanding officer.

**Key Traits**:
- Calculating and patient
- Protective of his crew
- Holds grudges deeply
- Respects courage, despises treachery

**Mannerisms**:
- Taps his sword pommel when thinking
- Speaks in military terminology
- Never breaks eye contact during negotiations
```

### Location Richtext Fields

**Atmosphere, Features, History**:
- Start with sensory overview
- Use headings to organize features
- Include both visible and hidden elements

**Example (Location Atmosphere)**:
```markdown
The Riverside District warehouse looms in perpetual shadow, trapped between crumbling tenements and the polluted Blackwater River. Even in daylight, fog clings to the cobblestones, muffling sound and obscuring vision beyond twenty feet.

## Visible Features
- Three-story brick building, most windows boarded
- Heavy iron door with broken lock
- Faded sign: "Merrick & Sons Trading Company"
- Rat-gnawed wooden crates scattered outside

## Hidden Details
- Basement entrance behind false wall on ground floor
- Recent tracks in the dust despite building's "abandoned" appearance
- The smell of alchemical reagents from the basement
```

### Faction Richtext Fields

**Goals, Values, Resources**:
- Use clear headings and lists
- Separate public face from secret agenda
- Track current status and changes

**Example (Faction Goals)**:
```markdown
## Public Goals
- Restore order to the Borderlands
- Protect trade routes from bandits
- Establish legitimate governance

## Secret Goals
- Locate and control all Time of Titans artifacts in the region
- Eliminate political rivals through "bandit attacks"
- Position leadership for royal succession when old king dies

## Current Priorities
1. Find the Titan's Blade before the Red Circle cult
2. Discredit Duke Harrington's military competence
3. Recruit or eliminate the adventuring party investigating warehouse
```

### Session Richtext Fields

**Summary, Preparation, Plot Threads**:
- Use chronological order for session summaries
- Organize preparation notes by scene or encounter
- Track plot threads with status indicators

**Example (Plot Threads)**:
```markdown
## Active Threads

**The Broken Crown**: Party pursuing Krell north to find organization headquarters
- Status: Just started, high priority
- Next step: Follow tracks to northern hideout

**Garvin's Ruins**: Information about ritual components in Northern Ruins
- Status: Lead obtained, not yet pursued
- Next step: Decide whether to investigate immediately or continue Krell pursuit

## Background Threads

**City Disappearances**: Lady Thornhaven's quest regarding missing nobles
- Status: On hold while party in wilderness
- Next step: Return to city to investigate warehouse

**Shadow's Past**: Mentioned recognizing Krell's lieutenant
- Status: Personal subplot, not urgent
- Next step: Roleplay opportunity when returning to camp
```

## Markdown Formatting Reference

Director Assist supports these Markdown features in richtext fields:

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Text Emphasis
```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code or mechanics`
```

### Lists
```markdown
- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Second item
```

### Links
```markdown
[Link text](https://example.com)
```

### Code Blocks
```markdown
```
Multiple lines of
formatted text or mechanics
```
```

### Blockquotes
```markdown
> A quote or important note
> Multiple lines supported
```

### Horizontal Rules
```markdown
---
```

## AI Generation Tips

When using AI to generate content for richtext fields:

1. **Provide Structure**: Tell the AI what structure you want
   - "Generate a scene setting in three paragraphs: opening image, sensory details, key elements"

2. **Reference Guidelines**: Point AI to these formatting guidelines
   - "Follow the Scene Setting structure from the formatting guidelines"

3. **Give Examples**: Include examples from your campaign
   - "Use a style similar to this previous scene: [paste example]"

4. **Iterate**: Refine AI output to match your campaign's tone
   - Start with AI suggestion, then edit for your voice

5. **Specify Length**: Be explicit about desired length
   - "Keep summaries to exactly 2 sentences"
   - "Generate 3 short paragraphs, each 2-3 sentences"

## Tools and Workflow

### Using the Markdown Editor

The richtext editor includes a toolbar for common formatting:

- **Bold** (Ctrl+B): Emphasize important text
- **Italic** (Ctrl+I): Add emphasis or internal thoughts
- **Heading**: Add section headers
- **Code**: Format mechanics or inline stats
- **Link**: Create links to external resources
- **List**: Start a bulleted list
- **Preview** (eye icon): Toggle preview mode to see formatted output

### Keyboard Shortcuts

- **Ctrl+B** / **Cmd+B**: Make selected text bold
- **Ctrl+I** / **Cmd+I**: Make selected text italic
- **Tab**: Indent current line

### Preview Mode

Use preview mode to verify formatting before saving:
1. Click the eye icon in the toolbar
2. Review rendered Markdown
3. Click pencil icon to return to editing

## Common Patterns

### Decision Points
When recording decisions, frame them as choices with alternatives:

```markdown
## Decision: Negotiate or Attack?
**Choice**: Attempted negotiation first
**Alternative considered**: Surprise attack at night
**Reasoning**: Party prioritized hostage safety
**Outcome**: Negotiation failed, led to disadvantageous combat position
```

### Combat Records
Track combats with consistent structure:

```markdown
## Combat: Bandit Camp (5 rounds)
**Enemies**: 8 bandits (minions), 2 lieutenants (level 2), Krell (boss, level 3)
**Victories Used**: 2 (Tactician coordination, Shadow distraction)
**Heroic Abilities**: Fury's Unstoppable
**Casualties**: 4 bandits dead, 8 captured, Krell escaped
**Treasure**: 150 gold, 2 potions of healing, detailed map
```

### NPC Introductions
First mention of important NPCs:

```markdown
**Krell** (Bandit Leader, Level 3 Boss)
- Former soldier, betrayed by commanding officer
- Leads The Broken Crown bandits
- Taps sword pommel when thinking
- Speaks in military terminology
- Escaped the party's assault, swore revenge
```

## Examples by Use Case

### Planning a Session
Use structured preparation notes:

```markdown
## Session 12 Preparation

### Scene 1: Travel Montage
- Cover 2 days of travel north through Thornwood
- Random encounter: Merchant caravan under attack
- Introduce NPC: Merchant Lyra (potential ally)

### Scene 2: Discovering the Hideout
- **Read-aloud**: [Draft scene setting]
- **NPCs Present**: Krell, 4 guards, hostage Elara
- **Possible Outcomes**: Stealth approach, direct assault, parley

### Scene 3: Confrontation
- Boss fight: Krell + reinforcements
- Complication: Elara held at knifepoint
- Victory condition: Defeat Krell or force his retreat
```

### Recording a Session
Capture what actually happened:

```markdown
## Session 12: The Northern Hideout

### Travel Montage
Party traveled north through Thornwood. Encountered merchant caravan under attack by dire wolves (4 rounds, used 1 Victory). Saved Merchant Lyra, who warned them about increased beast activity.

### Discovering the Hideout
Party scouted hideout and chose stealth approach. Shadow and Tactician advanced, but Fury accidentally triggered alarm. Full combat initiated.

### Confrontation (8 rounds)
Epic boss fight with Krell. Midway through, Krell took Elara hostage. Shadow pulled off dramatic rescue (nat 20 on Athletics). Krell, seeing Elara freed, surrendered. Party captured him alive.

**Key Development**: Krell revealed The Broken Crown is seeking Titan artifacts to resurrect ancient war machine. Time pressure now factor.
```

### Reviewing Campaign Arc
Track long-term story threads:

```markdown
## Arc: The Broken Crown Conspiracy

### Sessions 8-10: Discovery
- Party first encountered bandits (Session 8)
- Found Broken Crown symbol on bandit gear (Session 9)
- Rescued hostages from camp, Krell escaped (Session 10)

### Sessions 11-12: Investigation
- Garvin provided info about northern ruins (Session 11)
- Tracked Krell to northern hideout, captured him (Session 12)
- Learned about Titan artifact goal (Session 12)

### Sessions 13+: Resolution (Planned)
- Interrogate Krell for organization structure
- Race to find Titan's Blade before cult
- Confront organization leadership
```

## Troubleshooting

### Text Not Formatting

Make sure you're using the preview mode to see rendered Markdown. The edit mode shows raw Markdown syntax.

### Lists Not Working

Lists need a blank line before them:

```markdown
Wrong:
This is a paragraph:
- List item

Right:
This is a paragraph:

- List item
```

### Headings Not Rendering

Headings need a space after the # symbols:

```markdown
Wrong: ##Heading

Right: ## Heading
```

### Long Content Hard to Read

Break up long sections with:
- More headings (## or ###)
- Shorter paragraphs
- Bullet points for related items
- Horizontal rules (---) to separate major sections

## Related Documentation

- [Field Types API](./api/FIELD_TYPES.md) - Technical documentation for richtext field type
- [User Guide](./USER_GUIDE.md) - General introduction to using Director Assist
- [Architecture](./ARCHITECTURE.md) - System design including entity structure

## Version

This guide reflects Director Assist v1.2.0 formatting capabilities. Check the changelog for updates to richtext field features.
