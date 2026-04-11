

## Fix: Credit Gate Shows Before Credits Load

### Problem

Race condition in `Report.tsx`: the `analyzeCode` function runs on mount via `useEffect`, but `useCredits()` hasn't finished fetching yet. Since `credits` is `null` initially, `hasCredits` defaults to `false`, so every authenticated user immediately hits the "Out of credits" gate.

### Solution

**`src/pages/Report.tsx`** — Wait for credits to finish loading before running the analysis:
- Destructure `loading` from `useCredits()` (rename to `creditsLoading` to avoid conflict with the existing `loading` state)
- Add `creditsLoading` as a dependency check: don't call `analyzeCode` until credits are loaded
- Change the `useEffect` to depend on `creditsLoading` and only trigger analysis once it becomes `false`

Specifically:
1. Change `const { hasCredits, useCredit, remaining } = useCredits();` to include `loading: creditsLoading`
2. Update the `useEffect` to wait: if `creditsLoading` is true, return early. Once false, proceed with the existing logic (read sessionStorage, call `analyzeCode`).
3. Add `creditsLoading` to the dependency array of that `useEffect`.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Report.tsx` | Wait for credit loading to complete before checking `hasCredits` and starting analysis |

