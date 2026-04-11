

## Make Intro Cleaner and Bigger

Simplify the intro to fewer visual elements with larger, bolder typography and smoother transitions. Remove visual clutter (grid background, neural dots, glass panel) and lean into a minimal, cinematic feel.

### Changes

**`src/components/IntroSplash.tsx`** — Rewrite the render output:

1. **Remove clutter**: Delete the grid background, glass-panel tree view, and neural dots row. These make it feel busy on mobile (393px viewport).

2. **Phase 1 — Terminal typing**: Increase font size from `text-sm` to `text-lg sm:text-2xl`. Keep cursor blink but make cursor taller (`h-6`).

3. **Phase 2 — Logo reveal** (replaces the tree phase): Instead of showing a code tree, transition directly to the **"explyn"** wordmark at `text-5xl sm:text-7xl` with letter-spacing and a smooth scale-in from 90% to 100%. Clean, bold, centered.

4. **Phase 3 — Tagline**: Single phrase below the logo: *"Understand any codebase, deeply."* at `text-base sm:text-xl`, fading in with a slight upward slide. No cycling through multiple phrases.

5. **Exit**: The logo and tagline scale up slightly (`scale-110`) and fade out together into the app.

6. **Glow orb**: Keep but make it larger (`w-96 h-96`) and more diffuse (`blur(80px)`) for a subtle ambient effect behind the logo.

7. **Skip button**: Keep as-is, it's already minimal.

8. **Timing**: Tighten to ~4s total:
   - 0–1.2s: typing
   - 1.2–2.5s: logo reveal
   - 2.5–3.5s: tagline fade-in
   - 3.5–4.2s: exit

### Files Changed

| File | Change |
|------|--------|
| `src/components/IntroSplash.tsx` | Simplified phases, larger typography, removed tree/dots/grid |

