

## Explyn: Major Feature Upgrade Plan

This plan covers 6 major feature areas to transform Explyn from a functional tool into an interactive intelligence system.

---

### 1. Persistent Project Brain (Database + UI)

**Database changes:**
- New `projects` table: `id, user_id, name, description, file_structure (jsonb), created_at, updated_at`
- New `project_files` table: `id, project_id, path, content, language, explanation (cached), created_at`
- New `project_chat_history` table: `id, project_id, user_id, role, content, created_at`
- New `project_notes` table: `id, project_id, user_id, file_path, line_number, content, created_at`
- RLS policies scoped to `auth.uid() = user_id` on all tables

**Frontend:**
- New `/project/:id` page showing the saved project with file tree, cached explanations, chat history, and user notes
- Update Upload flow to optionally save as a "Project" (persisted) vs one-off analysis
- Dashboard gets a "Projects" tab alongside Snippets and Collections

**Edge function:**
- Update `chat-code` to accept a `project_id` and load context from `project_files` instead of requiring client to send all code every time

---

### 2. "Ask Your Codebase" — Project-Aware Chat

**Changes:**
- On the Project page, the chat panel loads previous `project_chat_history` messages on mount
- Each new message is saved to `project_chat_history`
- Suggested prompts: "Where is authentication handled?", "Why is this function slow?", "Who calls this method?"
- The `chat-code` edge function receives project file paths/content from the DB (server-side) for better context

---

### 3. Enhanced Debug Mode (Premium Feature)

**Changes:**
- Update the `analyze-code` edge function's debug mode prompt to produce structured output with severity badges, corrected code blocks, and prevention tips (already partially done)
- Add a "Debug" quick-action on the Upload page that defaults to debug mode
- Gate debug mode behind authentication + credit check (1 credit per debug run)
- On the Report page, render debug-specific UI: color-coded severity cards (red/yellow/green), collapsible fix sections with diff-style before/after code blocks

---

### 4. System Map View (Dependency Graph)

**Frontend:**
- New `SystemMapView` component using a lightweight graph library (e.g., `reactflow`)
- Parses the code structure tree from the AI report to extract nodes (files, classes, functions) and edges (imports, calls)
- Renders an interactive node graph with zoom/pan
- Clicking a node scrolls to or opens its explanation
- Add a "Map" tab/button on the Report and Project pages

---

### 5. Shareable Explanations (Viral Loop)

**Database:**
- Add `is_public` boolean and `share_slug` text columns to `snippets` table
- New RLS policy: allow anonymous SELECT when `is_public = true`

**Frontend:**
- New `/share/:slug` public page that renders a read-only snippet view (no auth required)
- "Share" button on Report and SnippetView pages that generates a unique slug and copies the public URL
- Open Graph meta tags on the share page for link previews

---

### 6. Performance Strategy

**Chunking:** Split large files at 8K chars before sending to AI; process in parallel batches of 3-5 files max per request
**Caching:** Store explanations in `project_files.explanation` so re-opening a file doesn't re-call AI
**Lazy loading:** File tree only loads file content on click, not all at once
**Credit efficiency:** Skip re-analysis if cached explanation exists; only charge credits for new analysis

---

### Technical Summary

| Area | Files touched |
|------|--------------|
| DB migration | 4 new tables, 2 column additions |
| Edge functions | `chat-code` (project context), `analyze-code` (chunking) |
| New pages | `/project/:id`, `/share/:slug` |
| New components | `SystemMapView`, `ProjectFileTree`, `DebugCard`, `ShareButton` |
| Updated pages | Upload, Dashboard, Report, SnippetView |
| New dependency | `reactflow` for system map |

### Implementation Order

1. Database migration (all new tables + columns)
2. Project Brain — save/load projects, file tree, cached explanations
3. Project-aware chat with history persistence
4. Debug mode UI enhancements
5. System Map View with reactflow
6. Shareable public links
7. Performance optimizations (chunking, caching, lazy load)

