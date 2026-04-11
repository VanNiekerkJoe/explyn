

## Intro Splash Screen — Once Per Day

A full-screen cinematic intro overlay that plays once every 24 hours (tracked via `localStorage` timestamp). Clean, minimal, dark — matching Explyn's monochrome aesthetic.

### The Experience

1. **Phase 1 (0–1s)**: Black screen. A single thin horizontal line draws itself across the center.
2. **Phase 2 (1–2s)**: The line splits open vertically, revealing the word **"explyn"** letter-by-letter with a subtle stagger.
3. **Phase 3 (2–3s)**: A tagline fades in below: *"Understand any codebase, deeply."*
4. **Phase 4 (3–3.5s)**: The entire intro fades out and scales up slightly, revealing the landing page underneath. The component unmounts.

A small "Skip" text in the bottom-right corner lets impatient users dismiss immediately.

### Technical Approach

- **New component**: `src/components/IntroSplash.tsx` — self-contained, uses CSS keyframe animations (no extra dependencies)
- **Once-per-day logic**: On mount, checks `localStorage` key `explyn_intro_last_shown`. If the stored timestamp is less than 24 hours ago, the component renders nothing. Otherwise it plays the animation and updates the timestamp.
- **Integration**: Rendered at the top of `Index.tsx`, before the main content. Uses a state flag `introDone` — while the intro plays, the main page content is hidden (or rendered behind with `pointer-events: none`).
- **CSS**: All animations defined inline or in `index.css` — line draw, letter stagger, fade-out with scale transform.

### Files Changed

| File | Change |
|------|--------|
| `src/components/IntroSplash.tsx` | New component with all animation logic |
| `src/pages/Index.tsx` | Import and render `IntroSplash`, gate main content visibility |
| `src/index.css` | Add keyframes for line-draw, letter-stagger, and exit animations |

