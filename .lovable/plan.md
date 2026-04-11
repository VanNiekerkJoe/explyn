

## "Code Canvas Awakens" — Premium Intro Redesign

Complete rewrite of `IntroSplash.tsx` to create a calm, purposeful animation that visually demonstrates what Explyn does: raw code → structure → understanding.

### The Experience (4.5s total)

**Phase 0 (0–0.8s) — Quiet opening**
Dark screen with a single soft pulse dot in the center, breathing slowly. No text. The app is "thinking."

**Phase 1 (0.8–2.2s) — Code tree assembles**
The pulse dissolves. Thin lines draw outward from center. Nodes appear in layers:
- First: file names (`App.tsx`, `auth/`, `api/`, `utils/`)
- Then: deeper structure (`UserService`, `Router`, `Database`)
- Connected by thin animated lines (SVG paths with `stroke-dashoffset` animation)
- Each node fades in with a slight scale-up, staggered 120ms apart

**Phase 2 (2.2–3.5s) — Intelligence moment**
A few key nodes glow softly. Small labels appear beside them: "structure", "logic", "flow", "dependencies". The tree subtly reorganizes — nodes shift positions slightly to suggest the transformation from raw code to a knowledge map.

**Phase 3 (3.5–4.5s) — Morph into app**
The entire structure contracts toward center, nodes fade, the "explyn" wordmark appears where the center node was, tagline fades in below, then the whole thing scales up and fades out into the actual page.

### Technical Approach

**`src/components/IntroSplash.tsx`** — Full rewrite:
- Use inline SVG for the node-and-line graph (no external deps)
- Define ~10 nodes with x,y positions, connected by ~8 edges
- Animate with CSS transitions + `stroke-dasharray`/`stroke-dashoffset` for line drawing
- Phase management via `useState` + `setTimeout` timeline (same pattern as current)
- Labels ("structure", "logic", etc.) appear as absolutely-positioned spans near specific nodes
- Exit animation: nodes scale to 0, wordmark scales in, then entire overlay fades

**`src/index.css`** — Add keyframes:
- `@keyframes draw-line` for SVG stroke animation
- `@keyframes node-appear` for node scale-in with glow
- `@keyframes pulse-soft` for the opening dot

**`src/pages/Index.tsx`** — No changes needed (already wired up)

### Node graph data structure
```text
        auth/
       /
App.tsx --- api/ --- Database
       \
        utils/ --- Router
                    |
                UserService
```

Each node: `{ id, label, x, y, glowLabel? }`. Edges: `{ from, to }`. Positions calculated relative to a centered 400x300 viewBox, responsive via SVG scaling.

### Files Changed

| File | Change |
|------|--------|
| `src/components/IntroSplash.tsx` | Full rewrite — SVG graph animation, 4 phases, node/edge system |
| `src/index.css` | Add 3 keyframes for line-draw, node-appear, pulse |

