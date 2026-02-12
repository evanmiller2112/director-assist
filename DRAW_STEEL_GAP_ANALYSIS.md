# Draw Steel Gap Analysis: Features NOT Yet Implemented or Planned

**Last Updated:** February 2026
**Project:** Director Assist
**Status:** Comprehensive analysis of Draw Steel mechanics not yet in the codebase or GitHub issues

---

## Executive Summary

Director Assist has implemented a solid foundation for Draw Steel campaign management with full support for:
- **Combat tracking** (2d10 initiative, threat levels, hero points, victory points, conditions)
- **Montage challenges** (difficulty-based success/failure tracking, two-round system)
- **Negotiations** (interest/patience tracking, 13 motivations, pitfalls, tier-based arguments)
- **Creature templates** (searchable monster library with roles and abilities)
- **Entity management** (characters, NPCs, locations, custom types with Draw Steel fields)
- **Relationship visualization** (matrix and network views)

However, several **significant Draw Steel features** are either partially implemented, planned but not started, or not yet identified. This document catalogs all gaps organized by game mechanic category.

---

## I. CHARACTER CREATION & ADVANCEMENT

### A. Character Sheet Implementation

**Status:** Partially Implemented
**Current:** Basic entity fields for Draw Steel characters exist (ancestry, class, culture, etc.)
**Gap:** No dedicated character sheet page designed specifically for Draw Steel heroes

**Missing Features:**
1. **Comprehensive Draw Steel Character Attributes**
   - Might, Agility, Reason, Intuition, Presence tracking (5 core attributes)
   - Attribute rolls (2d10 based on attribute level)
   - Current implementation only stores these as generic custom fields

2. **Skill System**
   - Skill list with training levels (Untrained, Trained, Expert, Master)
   - Skill modifier calculations based on attributes
   - Specialized training tracking per skill
   - Current implementation doesn't calculate or track skill DC vs. rolls

3. **Class-Specific Tracking**
   - Class choice dropdown validation
   - Subclass-specific features tracking
   - Kit feature tracking
   - Heritage/Ancestry trait effects management

4. **Equipment Management**
   - Weapon tracking with damage types and properties
   - Armor and AC calculation
   - Encumbrance tracking
   - Equipment condition tracking

5. **Experience & Advancement**
   - XP tracking toward level up
   - Milestone tracking UI
   - Level progression calculator
   - Advancement history

**Why It Matters:**
Directors need a complete, Draw Steel-accurate character sheet to quickly reference hero stats during play. Current generic entity fields don't provide the focused, tactical information needed.

**Suggested Priority:** MEDIUM-HIGH
Character sheets would be used constantly at the table and improve the core Director experience.

---

### B. Character Creation Wizard

**Status:** Not Implemented
**Gap:** No guided character creation process

**Missing Features:**
1. Step-by-step character creation following Draw Steel rules
2. Ancestry selection with trait suggestions
3. Culture/Career combination guidance
4. Class selection with feature explanations
5. Attribute generation (standard array vs. rolling)
6. Starting equipment selection
7. Background/motivation interview questions
8. Finishing touches (alignment, bonds, personality)

**Why It Matters:**
New players often struggle with character creation. A guided wizard that validates Draw Steel rules as they go would be invaluable for onboarding and reducing table setup time.

**Suggested Priority:** LOW-MEDIUM
Nice-to-have for player onboarding but not essential for Directors running campaigns.

---

## II. COMBAT SYSTEM

### A. Power Roll Integration

**Status:** Partially Implemented
**Current:** Types and logging structure exist for power rolls (2d10 tier system)
**Gap:** No UI for rolling and interpreting power rolls in the moment

**Missing Features:**
1. **Power Roll Interface**
   - Quick roll button (2d10)
   - Dice roller widget showing both dice individually
   - Automatic tier calculation and highlighting
   - Critical detection (double 10s)
   - Display of tier effects on combat

2. **Power Roll History**
   - Session history of all power rolls
   - Filter by combatant, action type, or result
   - Statistics on roll success rates

3. **Modifier Application**
   - Quick modifier input (+/- bonuses)
   - Save common modifiers
   - Attribute-based modifier suggestions

**Why It Matters:**
Power rolls happen dozens of times per combat. A dedicated roller would speed up play and make the 2d10 system feel more integrated into the tool.

**Suggested Priority:** MEDIUM
Highly useful during active combat sessions but not blocking.

---

### B. Combatant Action Economy

**Status:** Not Implemented
**Gap:** No tracking of action/maneuver spent per turn

**Missing Features:**
1. **Action Tracking Per Combatant**
   - Track actions spent (one per turn for most creatures)
   - Track maneuvers spent (one per turn for most creatures)
   - Track reactions (reset per round)
   - Visual indication of what's been spent

2. **Action Economy Validation**
   - Prevent spending more than allowed
   - Warn when spending last action/maneuver
   - Visual feedback when combatant is "done" for the turn

3. **Custom Action Points**
   - Support for creatures/abilities with different action economies
   - Customizable action names (Fury Points, Focus, etc.)

**Why It Matters:**
Draw Steel's action economy (action + maneuver per turn) is core to combat tactics. Tracking spent actions prevents confusion and speeds up turn resolution.

**Suggested Priority:** MEDIUM-HIGH
Essential for combat accuracy but could be worked around with manual notes.

---

### C. Turn Summary & Log Export

**Status:** Partially Implemented
**Current:** Combat log exists but only in-app
**Gap:** No export or session summary features

**Missing Features:**
1. **Turn Summary Display**
   - What each combatant did this turn
   - Damage dealt/taken summary
   - Conditions applied/expired
   - Readable natural language summary

2. **Combat Log Export**
   - Export log to text/markdown
   - Export to PDF for sharing
   - Include combatant stats and final state
   - Formatted for human reading

3. **Combat Statistics**
   - Damage dealt per combatant
   - Damage taken per combatant
   - Kill/defeat count
   - Most impactful abilities used

**Why It Matters:**
Directors often want to recap combat in session notes or share memorable moments. Easy export would tie combats into the narrative trail system better.

**Suggested Priority:** LOW-MEDIUM
Quality of life improvement but not essential for running combat.

---

### D. Grouped Combatant Actions

**Status:** Partially Implemented
**Current:** Groups can be created and tracked; they share initiative
**Gap:** No action selection/management for grouped combatants

**Missing Features:**
1. **Group Action Interface**
   - Select actions for all group members at once
   - Apply same damage/healing to entire group
   - Add condition to entire group
   - Collapse/expand group to show/hide members

2. **Individual Member Tracking**
   - While grouped, still track individual HP/conditions
   - Allow individual actions/damage within group's turn
   - Sequential indication (Member 1 of 3, etc.)

**Why It Matters:**
Groups of identical creatures (goblin squad, zombie horde) are common in Draw Steel. Better UI for managing them would make combat flow smoother.

**Suggested Priority:** MEDIUM
Useful but groups still function; improvement is UI-focused.

---

### E. Encounter Difficulty Calculator

**Status:** Not Implemented
**Gap:** No tool to calculate encounter balance

**Missing Features:**
1. **XP Budget Calculator**
   - Input hero count and level
   - Calculate XP budget for encounter
   - Show XP cost of each creature
   - Suggest difficulty (Easy, Moderate, Hard, Deadly)

2. **Encounter Templates**
   - Pre-built encounter templates by difficulty
   - Creature recommendation suggestions
   - Number of creatures suggestions

3. **Balance Checker**
   - Real-time encounter balance assessment
   - Adjust creature count or swap creatures
   - Show difficulty curve

**Why It Matters:**
Many Directors struggle with encounter balance. A calculator would reduce prep time and help create better, more challenging combats.

**Suggested Priority:** MEDIUM
Useful for prep but not essential for running sessions.

---

## III. NEGOTIATION SYSTEM

### A. Outcome Tracking & Consequences

**Status:** Partially Implemented
**Current:** Outcomes are calculated and displayed
**Gap:** No system for tracking consequences or follow-up interactions

**Missing Features:**
1. **Relationship Impact Tracking**
   - Automatically update NPC relationship strength based on outcome
   - Track whether NPC becomes ally, neutral, or hostile
   - Link negotiation outcome to ongoing NPC interactions

2. **Follow-up Negotiation Support**
   - Show previous negotiation outcome when creating new one with same NPC
   - Warn if attempting same arguments that previously failed
   - Remember which motivations have been used

3. **Faction Reputation Integration**
   - Track faction reputation changes based on negotiations
   - Show reputation threshold effects
   - Multiple faction loyalty tracking

**Why It Matters:**
Negotiations should have lasting table impact. Tying outcomes to relationships and faction reputation would make negotiations feel consequential.

**Suggested Priority:** MEDIUM
Requires relationship system enhancement but very rewarding for campaign continuity.

---

### B. Quick Reference & Cheat Sheet

**Status:** Not Implemented
**Gap:** No in-tool negotiation reference

**Missing Features:**
1. **Negotiation Rules Summary**
   - Quick reference for interest/patience mechanics
   - Argument effect tables (visible in tool, not just in rules)
   - Outcome descriptions with party perspectives

2. **Motivation/Pitfall Suggestions**
   - Suggest motivations based on NPC type/description
   - Suggest pitfalls based on NPC background
   - Learning tool for new Directors

3. **Argument Effectiveness Hints**
   - Show which motivation type the NPC cares most about
   - Highlight if an argument targets already-used motivation
   - Suggest next best argument

**Why It Matters:**
New Directors struggle with negotiation mechanics. A quality quick reference would help them master the system.

**Suggested Priority:** LOW-MEDIUM
Educational/QoL improvement.

---

### C. Extended Negotiation Features

**Status:** Not Planned
**Gap:** Advanced negotiation mechanics

**Missing Features:**
1. **Multi-Party Negotiations**
   - Track multiple NPCs in one negotiation
   - Different interest/patience per NPC
   - NPC alliances/opposition

2. **Negotiation Complications**
   - Surprise obstacles mid-negotiation
   - Time pressure mechanics
   - Interruptions or third parties

3. **Negotiation Branching**
   - Different outcomes lead to different follow-ups
   - Conditional consequences
   - Negotiation chains

**Why It Matters:**
More sophisticated negotiations (multiple parties, complications) add depth to campaigns. Currently not in scope but would be valuable future additions.

**Suggested Priority:** LOW
Advanced feature for campaign depth.

---

## IV. MONTAGE SYSTEM

### A. Enhanced Challenge Types

**Status:** Partially Implemented
**Current:** Generic challenges with optional predefined list
**Gap:** Limited challenge customization and context

**Missing Features:**
1. **Challenge Templates**
   - Pre-built montage challenge types by setting/scenario
   - Common challenges: Finding Shelter, Rally Horse, Forage, Recruit Allies, Gather Information
   - Suggested skills per challenge
   - Difficulty indicators

2. **Challenge Context Tracking**
   - Track which player tackled which challenge
   - Results affect narrative
   - Failure consequences suggestions

3. **Montage Complications**
   - Random event that complicates a challenge
   - Twist results mid-montage
   - Failure cascades (one failure affects others)

**Why It Matters:**
Directors want guidance on what montage challenges to offer. Templates and examples would improve montage quality and variety.

**Suggested Priority:** MEDIUM
Would enhance montage creation process significantly.

---

### B. Montage Outcome Narrativization

**Status:** Not Implemented
**Gap:** No tools to turn mechanical outcomes into narrative

**Missing Features:**
1. **Outcome Description Generator**
   - AI-powered (Claude integration) descriptions of montage success/failure
   - Considers challenge types and player actions
   - Tie to character motivations from entities

2. **Consequence Tracker**
   - What each outcome means for the story
   - Resource impact (supplies gained, travel speed, etc.)
   - Follow-up complications

3. **Montage-to-Scene Bridge**
   - Automatically create scene entities from montage
   - Summary of what party accomplished
   - Link to related entities (locations, NPCs encountered)

**Why It Matters:**
Montages can feel mechanical. Better tools for narrativizing outcomes would make them feel more integrated into the campaign story.

**Suggested Priority:** MEDIUM
Quality-of-life improvement that would be very table-friendly.

---

## V. RESPITE & DOWNTIME

### A. Respite Activity System (IMPLEMENTED - v1.7.0, Issues #408-412)

**Status:** IMPLEMENTED (v1.7.0)
**Scope:** Full respite activity tracker for Draw Steel's downtime mechanics

**What's Implemented:**
- Core types, database, repository, and store (Issue #408)
- UI components: RespiteSetup, HeroRecoveryPanel, RespiteActivityCard, ActivityControls, KitSwapTracker, VictoryPointsConverter, RespiteRulesReference, RespiteProgress, RespiteAnalytics
- Routes: /respite (list), /respite/new (create), /respite/[id] (detail with 3-column active layout)
- Sidebar navigation with active respite count badge
- Narrative event integration (createFromRespite)
- Activity templates with quick-select (15 predefined templates across 5 types)
- Campaign and character linking support
- Analytics: VP conversion totals, activity distribution, completion stats
- 96+ tests covering repository, store, and templates

**Remaining Gaps (Future Enhancement):**
1. **Resource Tracking During Respite**
   - Gold spent/earned tracking
   - Resources consumed tracking

2. **Respite Complications**
   - Random events during respite
   - Encounters in town/camp

3. **Respite-to-Active Bridge**
   - Finish respite, transition to next adventure
   - Complications become adventure hooks

**Suggested Priority:** LOW (core feature complete, enhancements can follow)

---

## VI. CHARACTER DEVELOPMENT & STORY

### A. Character Bonds & Relationships

**Status:** Partially Implemented
**Current:** Generic entity relationships exist
**Gap:** No Draw Steel-specific bonds system

**Missing Features:**
1. **Draw Steel Bonds System**
   - Bond types (patron, rival, ally, enemy, romantic, etc.)
   - Bond impact on gameplay (advantage on helps, disadvantage on hindrances)
   - Bond development tracker
   - Bond resolutions

2. **Motivation & Goals Tracking**
   - Character personal motivations
   - Campaign goals vs. character goals alignment
   - Motivation-based story hooks
   - Resolution tracking

3. **Character Development Arc**
   - Track how characters change through campaign
   - Milestone achievements
   - Character growth points
   - Betrayals/reconciliations

**Why It Matters:**
Character bonds drive narrative engagement. A dedicated system would help Directors track character arcs and tie mechanics to story.

**Suggested Priority:** MEDIUM-HIGH
Would significantly improve campaign narrative quality.

---

### B. Pressure & Bonds Resolution

**Status:** Not Implemented
**Gap:** No Pressure system tracking

**Missing Features:**
1. **Pressure Tracker**
   - Track current pressure on party (0-5 scale or similar)
   - Pressure sources (enemies getting closer, time running out, etc.)
   - Pressure effects on gameplay
   - Pressure resolution mechanics

2. **Bond Resolution Support**
   - Help Director recognize when bonds should resolve
   - Suggested consequences for resolution
   - Tracking impact of resolved bonds

3. **Campaign Tension Management**
   - Visual indicator of campaign threat level
   - Suggested escalation paths
   - Climax readiness tracker

**Why It Matters:**
Pressure and bonds resolution are Draw Steel's narrative tension mechanics. Supporting them would help Directors create more engaging campaigns.

**Suggested Priority:** MEDIUM
Advanced feature for campaign pacing and drama.

---

## VII. WORLD BUILDING & LORE

### A. Timeline System

**Status:** Partially Implemented
**Current:** Timeline Event entity type exists
**Gap:** No visual timeline or event linking

**Missing Features:**
1. **Visual Timeline**
   - Chronological display of events
   - Filter by type, location, NPC, faction
   - Zoom in/out by time scale
   - Color-coded event types

2. **Cause & Effect Tracking**
   - Link events to their consequences
   - Show ripple effects through timeline
   - Suggest consequences for PC actions

3. **Timeline Anchors**
   - Campaign start date
   - Known future events (prophecies, planned invasions)
   - Historical epochs/eras

**Why It Matters:**
Complex campaigns have interconnected events. A timeline would help Directors track cause/effect and plan revelations.

**Suggested Priority:** MEDIUM
Nice-to-have for campaign organization.

---

### B. Faction Dynamics System

**Status:** Not Implemented
**Gap:** Factions are entities but lack mechanical systems

**Missing Features:**
1. **Faction Resource Tracking**
   - Power (military, economic, political)
   - Territory held
   - Number of members
   - Goals and priorities

2. **Faction Relationship Web**
   - Alliances between factions
   - Rivalries and conflicts
   - Trade relationships
   - Hidden enmities

3. **Faction Events & Turns**
   - Faction action tracker (what each faction is doing)
   - Initiative-style faction turn order
   - Faction consequences of PC actions
   - Faction turn summary

4. **Faction Goals & Intrigues**
   - Each faction has goals
   - Intrigues working toward goals
   - PC can support/oppose faction goals
   - Influence PC perception of factions

**Why It Matters:**
Faction dynamics add political depth to campaigns. A tracker would make faction intrigue feel mechanical and consequential.

**Suggested Priority:** MEDIUM
Good for complex campaigns but not essential.

---

### C. Lore & Secrets Management

**Status:** Partially Implemented
**Current:** Entities have hidden field/notes system
**Gap:** No specialized secrets or revelation tracker

**Missing Features:**
1. **Secret Categories**
   - Hidden until revealed
   - Revealed when condition met
   - Automatic revelation on combat/negotiation/montage
   - Player-known vs. Director-known

2. **Revelation Tracker**
   - What secrets have been revealed
   - When and how they were revealed
   - Reactions from NPCs/factions
   - Consequences set off by revelation

3. **Information Availability**
   - Track what each player character knows
   - Knowledge checks needed to learn secrets
   - Misinformation tracking
   - False leads

**Why It Matters:**
Managing secrets across a long campaign is complex. Better tools would help Directors maintain mystery and manage reveals.

**Suggested Priority:** MEDIUM
Quality-of-life improvement for campaign management.

---

## VIII. ENCOUNTER DESIGN & EXPLORATION

### A. Exploration Tracker

**Status:** Not Implemented
**Gap:** No mechanical support for exploration scenes

**Missing Features:**
1. **Exploration Scene Setup**
   - Location setup with exploration challenges
   - Environmental hazards and obstacles
   - Search checks and hidden details
   - Encounter triggers

2. **Active Exploration Tracking**
   - Track which areas party has explored
   - Time spent exploring
   - Resources consumed (light, rope, etc.)
   - Hazard triggers

3. **Exploration Rewards**
   - Treasure found
   - Information discovered
   - Relationships made
   - Secrets learned

**Why It Matters:**
Exploration is less combat-focused than montage but still mechanically important. Tools would help Directors run varied, interesting exploration scenes.

**Suggested Priority:** LOW-MEDIUM
Useful but less critical than combat/negotiation.

---

### B. Trap & Hazard System

**Status:** Not Implemented
**Gap:** No dedicated trap/hazard tracking

**Missing Features:**
1. **Trap Templates**
   - Pre-built common traps by type
   - Damage/effect mechanics
   - DC to spot and disarm
   - Consequences

2. **Hazard Tracking**
   - Current status of hazards
   - Trigger conditions
   - Damage over time
   - Mitigation options

3. **Trap Encounter Balance**
   - Difficulty assessment
   - Scaling suggestions
   - Consequences of failure

**Why It Matters:**
Traps and hazards are common encounter elements. Templates would speed prep and improve encounter variety.

**Suggested Priority:** LOW
Less critical than core combat/negotiation.

---

## IX. ITEMS & TREASURE

### A. Treasure & Loot Distribution

**Status:** Not Implemented
**Gap:** No loot tracking or distribution system

**Missing Features:**
1. **Loot Tracker**
   - Treasure found in current adventure
   - Gold, items, artifacts
   - Distribution history
   - Outstanding distribution

2. **Character Inventory Integration**
   - Link items in inventory to character entities
   - Equip/unequip tracking
   - Item condition tracking
   - Weight/encumbrance calculation

3. **Treasure Value Assessment**
   - Monetary value
   - Rarity/significance
   - Curse tracking
   - Enchantment level

**Why It Matters:**
Loot tracking is a bread-and-butter mechanic many Directors want. Integration would improve character customization depth.

**Suggested Priority:** LOW-MEDIUM
Useful but lower priority than core mechanics.

---

### B. Item Properties & Effects

**Status:** Not Implemented
**Gap:** No mechanical support for item effects

**Missing Features:**
1. **Equipment Properties**
   - Damage type
   - Special properties (magical, cursed, etc.)
   - Rarity levels
   - Set bonuses

2. **Item Effects Tracking**
   - Ongoing effects from items
   - Daily use limits
   - Attunement requirements
   - Curse tracking

3. **Item Identification**
   - Unknown vs. identified
   - Identification cost/DC
   - Partial information

**Why It Matters:**
Items with special effects are common in Draw Steel. Tracking them properly would improve character customization and encounter design.

**Suggested Priority:** LOW
Advanced feature for item-focused campaigns.

---

## X. PLAYER MANAGEMENT & TABLE TOOLS

### A. Player Availability & Scheduling

**Status:** Not Implemented
**Gap:** No player schedule/availability tracking

**Missing Features:**
1. **Player Profiles**
   - Character assignment to player
   - Availability calendar
   - Scheduling preferences
   - Rules familiarity level

2. **Session Scheduling**
   - Session date/time setting
   - Availability checking
   - Notification system for scheduled sessions
   - Absence tracking

3. **Character Absence Handling**
   - How to handle absent characters in combat
   - Suggested actions for absent PCs
   - Retro-catch-up notes

**Why It Matters:**
Directors with multiple regular players need schedule coordination. Built-in tools would reduce scheduling friction.

**Suggested Priority:** LOW-MEDIUM
Useful for organized play but not essential for campaign running.

---

### B. Initiative Roller & Dice Integration

**Status:** Partially Implemented
**Current:** Initiative rolling exists in combat
**Gap:** No general dice roller or integration with other mechanics

**Missing Features:**
1. **General Dice Roller**
   - Roll arbitrary dice (2d10, d20, 4d6, etc.)
   - Dice pool rolling
   - Disadvantage/advantage
   - Kept results tracking

2. **Roll History**
   - Record all rolls in session
   - Link rolls to combat/negotiation/montage
   - Re-roll audit trail

3. **Dice Shortcuts**
   - Quick buttons for common rolls
   - Custom dice presets
   - Roll templates by action type

**Why It Matters:**
Many mechanics require rolling outside of structured systems (random encounters, improvised checks). A general roller would be useful.

**Suggested Priority:** LOW
Nice-to-have convenience feature.

---

### C. Session Notes & Recap Generator

**Status:** Partially Implemented
**Current:** Scene entities and narrative trail exist
**Gap:** No automatic session recap or notes generator

**Missing Features:**
1. **Session Recap Generator**
   - AI-powered (Claude) summary of session events
   - Key moments highlighted
   - XP/treasure summary
   - Plot threads advanced

2. **Notes Templates**
   - What to record for good session notes
   - Suggested sections (combat summary, negotiation outcomes, discoveries)
   - Linked to entities affected

3. **Between-Session Prep**
   - What happened last session (AI summary)
   - Plot threads still active
   - Foreshadowing elements
   - NPC status updates

**Why It Matters:**
Session notes are important for campaign continuity. AI-powered recaps would save Director time and improve memory between sessions.

**Suggested Priority:** MEDIUM
Would be very table-friendly but nice-to-have.

---

## XI. SYSTEM EXPANSION & MULTIPLATFORM

### A. Other Game System Support

**Status:** Planned (Issue #142)
**Current:** System-agnostic mode exists; Draw Steel is primary focus
**Gap:** D&D 5e, Pathfinder 2e, and other systems not supported

**Planned:** Issue #142 tracks "Add support for additional TTRPG systems (D&D 5e, Pathfinder 2e)"

**Missing Features:**
1. **D&D 5e Support**
   - Full character sheet with ability scores
   - Proficiencies and expertise
   - Prepared spells and known spells
   - Short/long rest mechanics

2. **Pathfinder 2e Support**
   - Archetype system
   - Feats and skill feats
   - Action economy (3 actions per turn)
   - Conditions and degrees of success

3. **Generic TTRPG Support**
   - Flexible attributes (any number, any name)
   - Custom mechanic templates

**Why It Matters:**
Many Directors run multiple systems. Support would expand the user base significantly.

**Suggested Priority:** MEDIUM
Planned but appropriate for post-launch expansion.

---

### B. Mobile App / PWA

**Status:** Not Implemented
**Current:** Responsive web design in progress (Issues #466-473)
**Gap:** No native mobile app or PWA

**Missing Features:**
1. **Progressive Web App (PWA)**
   - Install to home screen
   - Works offline
   - Push notifications for session reminders
   - Sync across devices

2. **Mobile-Optimized Features**
   - Touch-friendly combat tracker
   - Quick combatant add
   - Damage input optimized for touch
   - Simplified UI for table use

3. **Native Mobile Apps**
   - iOS app (App Store)
   - Android app (Google Play)
   - Offline-first architecture
   - Cloud sync option

**Why It Matters:**
Many Directors want to use Director Assist on tablets or phones at the table. A mobile-optimized experience would transform table usability.

**Suggested Priority:** MEDIUM-HIGH
Planned mobile support (Issues #466-473) but PWA/native apps are future work.

---

### C. Cloud Sync & Multi-Device

**Status:** Partially Planned
**Current:** Local IndexedDB storage only
**Gap:** No cloud sync or multi-device synchronization

**Missing Features:**
1. **Optional Cloud Storage**
   - Encrypted backup to cloud service
   - Sync across multiple devices
   - Conflict resolution
   - Auto-sync on changes

2. **Collaborative Features**
   - Real-time combat viewing for remote players
   - Shared entity editing
   - Real-time chat integration
   - Remote player companion app

3. **Version Control**
   - Campaign version history
   - Rollback to previous state
   - Compare campaign versions
   - Merge changes from multiple devices

**Why It Matters:**
Cloud sync would enable remote play and multi-device workflow. Appropriate for post-MVP expansion.

**Suggested Priority:** MEDIUM
Valuable but appropriate for future expansion.

---

## XII. QUALITY OF LIFE & ACCESSIBILITY

### A. Custom Themes & Skins

**Status:** Partially Implemented
**Current:** Light/dark mode exists
**Gap:** No custom themes or color customization

**Missing Features:**
1. **Theme Customization**
   - Custom color palettes
   - Font size adjustment
   - High contrast mode
   - Dyslexia-friendly font options

2. **Theme Presets**
   - Campaign-themed color schemes
   - System-specific themes (Draw Steel colors, etc.)
   - Saved theme library

**Why It Matters:**
Accessibility matters, especially for long campaign sessions. Better theme options would improve usability for diverse Directors.

**Suggested Priority:** LOW-MEDIUM
Good for accessibility but not essential.

---

### B. Keyboard Shortcuts & Commander Mode

**Status:** Partially Implemented
**Current:** Command palette exists with "/" shortcut
**Gap:** Limited keyboard shortcuts for combat

**Missing Features:**
1. **Combat Keyboard Shortcuts**
   - N = next turn, P = previous turn
   - D = apply damage, H = apply healing
   - Q = add condition
   - Quick number keys for damage amounts

2. **Searchable Action Index**
   - Find any action by searching
   - Recently used actions
   - Customizable shortcuts
   - Macro support

3. **Hands-Free Mode**
   - Voice commands (experimental)
   - Macros for common sequences
   - One-handed operation for accessibility

**Why It Matters:**
Combat flows faster with keyboard shortcuts. Full keyboard support would improve experienced Directors' workflow significantly.

**Suggested Priority:** MEDIUM
Great QoL but not blocking.

---

### C. Print & PDF Export

**Status:** Partially Planned
**Current:** Some PDF export in settings
**Gap:** Limited print-friendly formats

**Missing Features:**
1. **Character Sheet PDF**
   - Draw Steel-formatted character sheet
   - Print-ready layout
   - Fillable form option

2. **Combat Sheet PDF**
   - Initiative tracker printable
   - Combatant cards printable
   - Combat log printable

3. **Campaign Compendium**
   - All entities as printable reference
   - Organized by type
   - Indexed and cross-referenced

**Why It Matters:**
Some Directors prefer paper backups or printed reference sheets. Exporting would support diverse preferences.

**Suggested Priority:** LOW
Nice-to-have but lower priority.

---

## XIII. AI & AUTOMATION

### A. Combat Suggestions

**Status:** Not Implemented
**Gap:** No AI-powered creature tactics or combat suggestions

**Missing Features:**
1. **Creature Tactical Suggestions**
   - AI suggests next action for creature based on situation
   - Considers creature role, abilities, combat status
   - Suggests damage targets, condition applications

2. **Combat Encounter Flow**
   - AI-powered encounter pacing suggestions
   - When to escalate difficulty
   - Environmental effects suggestions

3. **Damage Calculation Help**
   - Suggest damage rolls based on creature abilities
   - Calculate expected damage
   - Help adjudicate ambiguous situations

**Why It Matters:**
New Directors struggle with creature tactics. AI suggestions would improve creature behavior and encounter quality.

**Suggested Priority:** LOW-MEDIUM
Nice-to-have but not essential.

---

### B. Plot Hook Generation

**Status:** Partially Implemented
**Current:** AI field generation exists
**Gap:** No specialized plot hook or adventure generation

**Missing Features:**
1. **Hook Generator**
   - Generate plot hooks tied to party relationships
   - Based on character motivations
   - Based on faction interests
   - Tie to existing entities

2. **Encounter Generation**
   - Generate combats based on party level
   - Generate NPCs for specific roles
   - Generate locations for specific purposes

3. **Session Prep Assistant**
   - What to prep for next session
   - Suggested NPCs to include
   - Suggested encounters based on plot
   - Pacing suggestions

**Why It Matters:**
AI generation exists but could be more specialized for campaign context. Better hooks would help Directors prep faster.

**Suggested Priority:** MEDIUM
Would be useful but not critical.

---

### C. Grammar & Lore Consistency Checking

**Status:** Not Implemented
**Gap:** No automated quality checking

**Missing Features:**
1. **Lore Consistency Checker**
   - Flag contradictions in entity descriptions
   - Check date consistency
   - Verify relationship coherence
   - Suggest linking related entities

2. **Grammar & Style Checker**
   - Spell check entity descriptions
   - Grammar suggestions
   - Tone consistency
   - Style matching between entities

3. **Completeness Checker**
   - Flag incomplete entity entries
   - Suggest missing relationships
   - Identify orphaned entities
   - Recommend additional field fill-in

**Why It Matters:**
Long campaigns accumulate inconsistencies. Automated checking would catch errors early and improve campaign quality.

**Suggested Priority:** LOW
Nice-to-have improvement feature.

---

## XIV. INTEGRATION & INTEROPERABILITY

### A. Forge Steel Export Enhancements

**Status:** Partially Implemented
**Current:** Basic Forge Steel character import exists
**Gap:** Limited data mapping and no export

**Missing Features:**
1. **Enhanced Import**
   - Import all character field data
   - Map Forge Steel attributes to Draw Steel character sheet
   - Import equipment
   - Import complete background

2. **Character Export to Forge Steel**
   - Export updated character back to Forge Steel format
   - Roundtrip workflow (edit in Forge Steel or Director Assist)
   - Version sync

3. **Batch Import**
   - Import entire party from Forge Steel
   - Assign to player profiles
   - Quick setup for established campaigns

**Why It Matters:**
Forge Steel is the primary character builder. Better integration would streamline player character management.

**Suggested Priority:** MEDIUM
Useful but foundational features exist.

---

### B. OCF Compliance & Export

**Status:** Partially Implemented
**Current:** OCF (Open Campaign Format) audit is tracked (Issue #314)
**Gap:** Full spec compliance and export features

**Missing Features:**
1. **Full OCF Support**
   - Complete spec compliance for all data types
   - Import from OCF files
   - Export to OCF format
   - Roundtrip data integrity

2. **Interoperability**
   - Import campaigns from other OCF-compliant tools
   - Export to use in other tools
   - Data portability

3. **Version Management**
   - OCF version tracking
   - Migration guides for version updates

**Why It Matters:**
OCF is the emerging standard for TTRPG data. Compliance would enable ecosystem interoperability.

**Suggested Priority:** MEDIUM
Good for long-term tool independence and data portability.

---

### C. VTT Integration

**Status:** Not Implemented
**Gap:** No integration with Virtual Tabletops

**Missing Features:**
1. **Roll20 Integration**
   - Export campaign to Roll20 format
   - Import Roll20 campaigns
   - Sync character sheets

2. **Foundry Integration**
   - Export to Foundry VTT format
   - Creature/NPC import from Foundry
   - Two-way sync

3. **Fantasy Grounds Integration**
   - Similar export/import
   - Data mapping

**Why It Matters:**
Many Directors use VTTs for remote play. Integration would extend Director Assist utility.

**Suggested Priority:** LOW-MEDIUM
Valuable for VTT users but not essential for in-person play.

---

## XV. COMMUNITY & CONTENT

### A. Shared Content Library

**Status:** Not Implemented
**Gap:** No mechanism for sharing user-created content

**Missing Features:**
1. **Content Marketplace**
   - Share creature templates with community
   - Share encounter setups
   - Share adventure hooks
   - Community ratings/reviews

2. **Community Packs**
   - Curated sets of creatures (monster packs)
   - Encounter libraries by setting
   - NPC packs
   - Item libraries

3. **Content Creator Support**
   - Tools to create and package content
   - Revenue sharing for creators
   - Quality assurance process

**Why It Matters:**
A community content ecosystem would make the tool more valuable and self-sustaining.

**Suggested Priority:** LOW
Post-MVP expansion, appropriate for long-term growth.

---

### B. Built-In Content

**Status:** Partially Implemented
**Current:** Some creature templates and example entities
**Gap:** Limited draw Steel-specific content packs

**Missing Features:**
1. **Draw Steel Compendium**
   - Official creature stat blocks
   - Common NPCs and templates
   - Published adventure encounters
   - Treasure tables

2. **Example Content**
   - Sample campaign setup
   - Example encounters for each difficulty
   - Example NPCs and factions
   - Best practices guide

3. **Setting-Specific Content**
   - Content for popular Draw Steel settings
   - Creature lists by setting
   - Faction templates
   - Location types

**Why It Matters:**
New users need example content and reference material. Official content would accelerate adoption.

**Suggested Priority:** MEDIUM
Good for onboarding but lower priority than core features.

---

## XVI. SUMMARY TABLE

| Feature | Category | Status | Priority | Effort | Impact |
|---------|----------|--------|----------|--------|--------|
| **Character Sheet** | Character | Partial | HIGH | Medium | HIGH |
| **Character Creation Wizard** | Character | None | MEDIUM | Large | MEDIUM |
| **Power Roll Interface** | Combat | Partial | MEDIUM | Medium | HIGH |
| **Action Economy Tracking** | Combat | None | HIGH | Medium | HIGH |
| **Encounter Difficulty Calculator** | Combat | None | MEDIUM | Medium | MEDIUM |
| **Respite Activity System** | Downtime | Planned | HIGH | Large | HIGH |
| **Character Bonds System** | Story | None | MEDIUM | Medium | MEDIUM |
| **Visual Timeline** | World | Partial | MEDIUM | Medium | MEDIUM |
| **Faction Dynamics** | World | None | MEDIUM | Large | MEDIUM |
| **Exploration Tracker** | Encounters | None | MEDIUM | Medium | MEDIUM |
| **Mobile/PWA Support** | Tech | Partial | HIGH | Large | HIGH |
| **Cloud Sync** | Tech | None | MEDIUM | Large | MEDIUM |
| **Combat Suggestions** | AI | None | MEDIUM | Medium | MEDIUM |
| **Forge Steel Export** | Integration | Partial | MEDIUM | Medium | MEDIUM |

---

## RECOMMENDATIONS

### High Priority Gaps (Implement Next)
1. **Character Sheet Page** - Uses/session; needed for table use
2. **Action Economy Tracking** - Core combat mechanic
3. **Power Roll Interface** - Used every combat session
4. **Respite Activity System** - Already planned; major feature
5. **Mobile Responsiveness** - Already in progress (Issues #466-473)

### Medium Priority Gaps (Plan for Future)
1. **Character Bonds & Development** - Improves narrative depth
2. **Encounter Difficulty Calculator** - Speeds prep
3. **Enhanced Negotiation Features** - Polish existing system
4. **Combat Suggestions** - QoL improvement
5. **Session Recap Generator** - Improves note-taking

### Low Priority Gaps (Consider Later)
1. **Trap/Hazard Templates** - Useful but less critical
2. **Loot Distribution** - Useful but simpler workaround exists
3. **Print/PDF Export** - Nice-to-have convenience
4. **Community Content** - Post-MVP expansion
5. **VTT Integration** - For remote players; not in-person essential

### Not Recommended (Probably Out of Scope)
1. **Multiple TTRPG Systems** - Planned but expansive; do after full Draw Steel
2. **Native Mobile Apps** - PWA is more practical
3. **Real-Time Collaboration** - Complex; appropriate for later

---

## CONCLUSION

Director Assist has built an excellent Draw Steel foundation with working combat, montage, and negotiation systems. The planned Respite Activity System (Issues #408-412) is a significant and appropriate next feature.

**The most impactful remaining gaps are:**
1. **Character Sheet focused UI** - Currently scattered across generic entity fields
2. **Combat action economy tracking** - Core mechanic not yet supported
3. **Power roll interface** - Used every session; currently only logging available
4. **Character bonds/development** - Story integration is weak

These four features would significantly improve both table usability and narrative depth. The technical foundation is solid; these are UX/feature additions rather than architectural changes.

The roadmap is well-prioritized with respite activities planned next. Continue this trajectory while gathering Director feedback from alpha/beta users about what would most improve their sessions.
