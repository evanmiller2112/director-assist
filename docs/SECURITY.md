# Security Documentation

This document outlines the security architecture and best practices for Director Assist.

## Security Model Overview

Director Assist follows a **local-first architecture** with security designed into its foundation:

- **No backend server**: All processing happens in your browser
- **No authentication system**: No user accounts or passwords to manage
- **Privacy by default**: Your data never leaves your device unless you explicitly export it
- **Client-side only**: Zero server-side vulnerabilities because there is no server

This architecture eliminates entire categories of security risks including server breaches, man-in-the-middle attacks on your data, and unauthorized access to stored campaigns.

## API Key Handling

### Storage Location

Your Anthropic API key is stored exclusively in browser localStorage:

- **Storage key**: `dm-assist-api-key`
- **Scope**: Limited to your browser on this device
- **Persistence**: Remains until explicitly removed or browser data is cleared

### Security Measures

Director Assist implements multiple layers of protection for API keys:

1. **Visual Protection**
   - API key input uses `type="password"` to prevent shoulder-surfing
   - Key is never displayed in plain text after entry

2. **Transmission Security**
   - API key is only transmitted to Anthropic's API endpoint: `https://api.anthropic.com`
   - Communication uses HTTPS encryption
   - No third-party services receive your key

3. **Logging Protection**
   - API keys are never logged to browser console
   - Error messages never include API key values
   - Debug output excludes credential information

4. **Export Exclusion**
   - API keys are explicitly excluded from backup exports
   - Comprehensive test coverage validates this protection
   - See `/src/routes/settings/backup-export.test.ts` for validation tests

### API Key Usage

The API key is only accessed when:
- Fetching available Claude models
- Sending chat messages to Claude
- Generating entity summaries
- Auto-generating entity fields
- Auto-generating field values

In all cases, the key is passed directly to the Anthropic SDK and never logged or stored elsewhere.

## Data Storage Architecture

Director Assist uses two browser storage mechanisms with different purposes:

### IndexedDB (via Dexie.js)

Stores campaign data with full query capabilities:

- **Entities**: Characters, locations, factions, items, etc.
- **Chat history**: Conversation logs with AI assistant
- **Relationships**: Links between entities
- **App configuration**: Active campaign ID

### localStorage

Stores simple key-value configuration:

- **API key**: `dm-assist-api-key`
- **Model preference**: `dm-assist-selected-model`
- **Theme preference**: UI appearance settings

## Backup and Export Security

### Validated Security Posture

The backup export system has been thoroughly tested to ensure credentials are never exposed. Comprehensive security tests validate that API keys cannot leak through exports, even in edge cases.

**Test coverage** (`/src/routes/settings/backup-export.test.ts`):
- API keys never appear in backup objects or JSON output
- Backup structure contains only expected fields
- Edge cases like API key-like strings in user data don't trigger false positives
- Multiple scenarios validated (empty keys, multiple campaigns, etc.)

### What's Included in Backups

Backup files are plain JSON containing:

- **Entity data**: All campaign entities (characters, locations, factions, etc.)
- **Chat history**: Complete AI conversation logs
- **Active campaign ID**: Reference to the current campaign
- **Selected model preference**: Your preferred Claude model
- **Export metadata**: Version number and timestamp

### What's Excluded from Backups

The following are never included in exports:

- **API keys**: Explicitly filtered out
- **Other localStorage configuration**: Only model preference is included
- **Browser-specific data**: Cache, cookies, session storage

### User Responsibilities

- **No encryption applied**: Backup files are plain JSON
- **Secure storage**: Store backup files in a secure location
- **Sensitive content**: Consider encrypting backups if they contain sensitive campaign information
- **Sharing safely**: Backups can be shared without exposing API credentials

## Hidden Field Protection

### What Are Hidden Fields?

Entity types can define fields in the "hidden" section. These fields are intended for DM-only secrets that should never be shared with players or sent to AI.

### Security Guarantees

Fields marked as hidden (section: 'hidden'):

1. **Never sent to AI**: Excluded from all AI prompts
   - Summary generation skips hidden fields (see `buildEntityContext()` in `summaryService.ts`)
   - Chat context includes only entity summaries (which already exclude hidden fields)
   - Field generation requests don't expose hidden fields

2. **Not in summaries**: AI-generated summaries explicitly exclude hidden information
   - Prompt instructs AI: "Do NOT include any secrets or hidden information"
   - Context building filters out `section !== 'hidden'` fields

3. **Stored locally only**: Hidden fields remain in IndexedDB
   - Included in backup exports (they're part of your campaign data)
   - Never transmitted except within backup files you explicitly export

### Example Use Cases

- **NPC Secrets**: Hidden motivations, betrayal plans
- **Location Secrets**: Trap mechanisms, hidden treasures
- **Faction Secrets**: True allegiances, secret agendas
- **Item Secrets**: Cursed properties, hidden powers

## Best Practices for Users

### API Key Security

1. **Generate dedicated keys**: Create a separate API key for Director Assist rather than reusing keys
2. **Monitor usage**: Check your Anthropic dashboard regularly for unexpected API usage
3. **Rotate periodically**: Update your API key every few months
4. **Revoke if compromised**: If you suspect exposure, revoke the key immediately in your Anthropic account
5. **Browser security**: Use a secure browser with updated security patches
6. **Shared computers**: Log out or clear browser data if using shared/public computers

### Campaign Data Security

1. **Regular backups**: Export backups frequently to prevent data loss
   - Director Assist includes smart backup reminders that prompt you when it's time to export
   - Reminders appear at milestones (5, 10, 25, 50, 100+ entities) and time intervals (7+ days)
   - Use the "Days since last backup" indicator on the Settings page to track export history
2. **Secure backup storage**: Store backup files in encrypted storage or secure cloud services
3. **Version control**: Keep multiple backup versions with timestamps
4. **Sensitive content**: Be mindful of what information you store in non-hidden fields
5. **Sharing campaigns**: Review campaign content before sharing exported backups

### Browser Security

1. **Use HTTPS**: Always access Director Assist via HTTPS
2. **Keep browsers updated**: Update your browser regularly for security patches
3. **Extension caution**: Be cautious with browser extensions that can access localStorage or IndexedDB
4. **Private browsing**: Don't use private/incognito mode if you want to persist your data

## Security Audit Compliance

This documentation satisfies the requirements of **Issue #27 - Security Audit for API Key Handling**.

The audit verified:
- API keys are never logged to console
- API keys are never sent to any endpoint except Anthropic's API
- API keys are excluded from all backup exports
- No credentials in error messages or debug output

Validation tests: `/src/routes/settings/backup-export.test.ts`

## Reporting Security Issues

If you discover a security vulnerability in Director Assist:

1. **Do not** create a public GitHub issue
2. Contact the maintainers privately through GitHub
3. Provide detailed reproduction steps
4. Allow time for a fix before public disclosure

## Additional Resources

- **Architecture Documentation**: `/docs/ARCHITECTURE.md` - Technical implementation details
- **User Guide**: `/docs/USER_GUIDE.md` - Privacy and AI interaction guidelines
- **Backup Tests**: `/src/routes/settings/backup-export.test.ts` - Security test suite
