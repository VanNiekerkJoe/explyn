

## Add Intro & Tutorial Display Constraints

### Changes

**`src/components/IntroSplash.tsx`** — Update `shouldShowIntro()`:
- Track intro shows using localStorage key `explyn_intro_shows` storing an array of timestamps (or today's date + count)
- Logic: get today's date string, count how many times the intro was shown today. If < 4, allow it. Otherwise, skip.
- When the intro runs, increment the counter in `localStorage`

**`src/components/onboarding/OnboardingTutorial.tsx`** — Update `shouldShowOnboarding()`:
- Current logic already checks `localStorage.getItem(ONBOARDING_KEY)` — this is correct
- No change needed here; it already only shows once

**`src/pages/Index.tsx`** — Add auth-based tutorial suppression:
- After auth state is resolved, if the user is logged in, skip onboarding (`shouldShowOnboarding` should also return `false` if user is logged in)
- When user logs in for the first time, mark onboarding as done: set `explyn_onboarding_done` in localStorage
- Adjust: pass `loggedIn` into the onboarding gate so that once authenticated, tutorial never appears again

### Files Changed

| File | Change |
|------|--------|
| `src/components/IntroSplash.tsx` | `shouldShowIntro()` checks daily count < 4, increments on show |
| `src/pages/Index.tsx` | Skip onboarding when `loggedIn` is true, mark done on first login |

