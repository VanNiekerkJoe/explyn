# Local Sessions, Memory, and Skills

## What will be built

- A session rail in the Explyn. console with a new-session action and browser-saved conversations.
- A dedicated URL for every session so refreshing or sharing the local route restores the same conversation.
- Session search plus rename, duplicate, Markdown export, and delete actions.
- A skills workspace containing Explyn.'s built-in coding modes and user-created instruction sets.
- Per-session skill activation, explanation level, and model selection so each conversation keeps its own working context.
- New slash commands for session and skill management while preserving the existing command workflow.

## Experience

- Desktop uses a compact collapsible session rail beside the transcript.
- Phone uses a slide-over session drawer, keeping the conversation and composer full width.
- The Explyn. mascot remains the assistant identity and animated waiting state.
- Empty sessions clearly surface recent sessions, starter prompts, and active skills without becoming a marketing page.

## Technical details

- Store sessions and custom skills in versioned browser storage with safe parsing and an idempotent first-session bootstrap.
- Use `/console/:sessionId` as the canonical session route; `/console` redirects to the latest or a newly created session.
- Keep messages isolated per session and persist updates at the same point state changes.
- Continue using the existing browser-configured AI transport; no hosted database or login dependency will be introduced.
- Compose the transcript and prompt with AI Elements where compatible, preserving the current local streaming boundary.
- Add migration support for the current global level/skills preferences and existing console entry points.

## Verification

- Create two sessions, send content in each, switch between them, and reload both URLs.
- Verify search, rename, duplicate, export, delete, custom skill creation, and per-session skill toggling.
- Check desktop and 393px phone layouts, keyboard focus, runtime errors, and the production build.