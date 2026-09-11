# RakshaGrid — fixes, shared header, and endpoint wiring

## Where these files go
Everything here is a **flat replacement** for the folder your 9 original
files already lived in (same folder that has `Dashboard.tsx`,
`RiskZones.tsx`, etc., two levels below `lib/`). Drop `AppHeader.tsx` and
`AppSidebar.tsx` into that same folder alongside the rest — they use the
same `../../lib/AuthContext` and `../../lib/useApi` relative paths your
existing files already use, so nothing else needs to move.

`lib/AuthContext.tsx`, `lib/useApi.ts` and `lib/api.ts` are **not**
included in this package — you already have real versions of them (they're
what Dashboard.tsx, RiskZones.tsx and Resources.tsx were importing from).
Nothing here touches them except by adding new exports, described below.

---

## 1. The header/profile bug you asked about

**Root cause:** `Dashboard.tsx` was the only screen that read the signed-in
user from `useAuth()`. Every other screen (Analytics, Population,
Relocation, Reports, Resources, Risk Zones, System) had its own
copy-pasted header with the profile block **hard-coded**:

```tsx
<div className="...">DM</div>
<div className="text-xs"><b>District Officer</b><div className="text-muted">SDMA Control Room</div></div>
```

So the moment you navigated off the Dashboard, the header silently
reverted to a fake placeholder user instead of showing whoever was
actually logged in.

**Fix:** all 7 pages now render a single `<AppHeader/>` component that
calls `useAuth()` itself. There is exactly one header implementation left
in the whole app, so it's fixed everywhere at once and can't drift again.

## 2. Separate header (and sidebar) components

- **`AppHeader.tsx`** — logo, tagline pill, notification bell, and the
  real profile block (initials, name, role, sign out) driven by
  `useAuth()`.
- **`AppSidebar.tsx`** — the workspace nav, the "System settings / Help /
  Sign out" footer, and the scoring-model note. Takes `active` (which
  page you're on) and `onNavigate`, plus an optional `badges` map if a
  page wants to show a live count next to its own nav item.

Every page file went from ~30 lines of duplicated chrome markup down to
two component calls:

```tsx
<AppHeader onOpenMobileNav={() => setMobileOpen(true)} />
<AppSidebar active="Resources" onNavigate={onNavigate} mobileOpen={mobileOpen} onCloseMobileNav={() => setMobileOpen(false)} badges={{Resources: resources.length}} />
```

## 3. Other bugs fixed while going through the code

| File | Bug | Fix |
|---|---|---|
| `RiskZones.tsx` | `districts` dropdown was built with `useMemo(..., [])` — an empty dependency array — so once live zones arrived from the API, the dropdown kept showing only the districts present on the very first render. | Added `zones` to the dependency array. |
| `RiskZones.tsx` | If live API zones replaced the static seed, `selected` could keep pointing at a zone id that no longer exists in the new list. | Selected zone is now recomputed as `zones.find(...) ?? zones[0]` on every render instead of trusted from stale state. |
| `RiskMap.tsx` | The map only had coordinates for 4 of the 8 zones used elsewhere in the app (missing Pindar Basin, Bhilangana Fringe, Kali Ganga Bank, Dhauliganga Terrace). Selecting one of those zones in Risk Zones or Population rendered a blank map with no marker. | Added the missing 4 points with plausible coordinates. |
| `System.tsx` | The sidebar never highlighted any item as active — not even "System" itself — because it used a bare `nav.map` with no active-state class. It also used a different icon (`Shield`) for "System settings" than the `UserCog` icon System.tsx used for its own header. | Shared `AppSidebar` highlights "System" correctly and uses one consistent icon (`UserCog`) everywhere. |
| `System.tsx` | "Data sources" card subtitle said the hardcoded string `"1 offline, 1 delayed"` regardless of the actual `sources` array. | Now computed as `${offlineCount} offline, ${delayedCount} delayed` from the data. |
| `Population.tsx` | `vulnPct` (and the two per-category percentages) divided by `totals.total` with no guard — would render `NaN%` if the dataset were ever empty. | Added a `totals.total > 0` guard. |
| `Reports.tsx` | "This month" stat was hardcoded to `4` regardless of the actual report dates. | Now counts reports whose parsed date falls in the current month/year. |
| `Relocation.tsx` | "Total plans" subtitle said the hardcoded `"Across 4 districts"`. | Now computed from `new Set(plans.map(p => p.district)).size`. |
| `System.tsx` | "Active users" subtitle said the hardcoded `"Across 4 districts"`. | Same fix, computed from the `roles` list. |

None of these are dramatic, but they're exactly the kind of thing that
quietly goes stale the first time someone edits the underlying array and
forgets there's a hardcoded number describing it three lines down.

---

## 4. Connecting the remaining screens to your backend easily

Right now only **3 of 7** screens actually call your API — Dashboard
(`fetchPriorities`), Risk Zones (`fetchZones`), and Resources
(`fetchSites`) — each via the same pattern:

```tsx
const { data, loading, error } = useApi(fetchSomething);
const merged = useMemo(() => (!data || data.length === 0) ? staticSeed : mapApiToUiShape(data), [data]);
```

Population, Relocation, Reports, and Analytics are still 100% static
arrays. Since I don't have your `lib/api.ts` / `lib/useApi.ts` source in
this handoff, I didn't want to guess at their internals and risk
overwriting a real backend contract — but wiring the rest up is a
15-minute, copy-paste job because the pattern above is already proven out
three times in your own code. To connect all remaining endpoints:

1. **Add one `fetchX` function per resource to `lib/api.ts`**, following
   whatever your existing `fetchZones` / `fetchSites` / `fetchPriorities`
   look like internally (same base URL, same auth headers, same error
   handling) — e.g.:

   ```ts
   export type RelocationPlan = { plan_id: string; zone_id: string; families: number; capacity: number; stage: string; target_date: string };
   export async function fetchRelocationPlans(): Promise<RelocationPlan[]> {
     return apiFetch("/relocation-plans"); // reuse whatever helper fetchZones already uses
   }
   ```

   Do the same for `fetchPopulationGroups`, `fetchReports`, and
   `fetchAnalyticsSummary` (or whatever your backend's actual routes are
   named).

2. **In each page, add the exact three lines Risk Zones already has:**

   ```tsx
   const { data: apiPlans, loading, error } = useApi(fetchRelocationPlans);
   const plans = useMemo(() => (!apiPlans || apiPlans.length === 0) ? staticPlans : apiPlans.map(mapToUiShape), [apiPlans]);
   ```

   then swap the page's local `plans` / `groups` / `reports` array for
   this derived value, and optionally show the same
   `{loading && ...}` / `{error && ...}` banners Risk Zones and Resources
   already use for consistency.

3. **Keep the "live data over static fallback" merge pattern.** It's
   what makes the app resilient when the backend is briefly down (you'll
   see the amber "showing cached/demo data" banner instead of a crash),
   and it's already battle-tested in three of your screens.

Because `AppHeader` / `AppSidebar` are now single components, if you
later want a global "backend connectivity" indicator (e.g. a small dot
in the header that goes amber when any `useApi` call is erroring), you'd
only need to add it in one file instead of seven.
