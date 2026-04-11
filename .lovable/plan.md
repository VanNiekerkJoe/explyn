

## Fix Tutorial Alignment

The tutorial speech bubbles don't align properly on the 393px mobile viewport. The issues:

1. **SpeechBubble uses `absolute` positioning** inside the fixed overlay — this is fine structurally, but the underlying page scrolls and content can shift visually.
2. **The overlay container doesn't prevent scroll** — the page behind scrolls freely, making the tutorial feel disconnected.
3. **Step 4 (code demo) can overflow** on small screens — the speech bubble + code demo stacked vertically may exceed viewport height at 617px.
4. **No `overflow-y-auto`** on the overlay — if content is taller than the screen, it clips.

### Changes

**`src/components/onboarding/OnboardingTutorial.tsx`**:
- Add `overflow-hidden` to the body when the tutorial is active (prevent background scroll)
- Add `overflow-y-auto` to the fixed overlay container so tall steps can scroll
- Change the overlay to use `flex items-center justify-center` for consistent centering instead of relying on SpeechBubble's absolute positioning

**`src/components/onboarding/SpeechBubble.tsx`**:
- When `position="center"`, switch from `absolute top-1/2 left-1/2 -translate` to a simpler flex-child approach (no absolute positioning needed when parent is a flex centering container)
- Increase `max-w-[340px]` to `max-w-[380px]` for slightly more room on mobile
- Ensure the bubble doesn't overflow the viewport by adding `max-h-[85vh] overflow-y-auto` to the bubble body

**`src/components/onboarding/OnboardingTutorial.tsx` — Step 4 (code demo)**:
- Add `overflow-y-auto` and `max-h-screen` to the step 4 container
- Reduce gap/padding so both the speech bubble and code demo fit within 617px

### Files Changed

| File | Change |
|------|--------|
| `src/components/onboarding/SpeechBubble.tsx` | Wider max-width, scroll support for tall content, better centering |
| `src/components/onboarding/OnboardingTutorial.tsx` | Lock body scroll, flex-center layout, fix step 4 overflow |

