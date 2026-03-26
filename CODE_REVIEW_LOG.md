# Code Review Log — ROA PDI Web App

**Review Date:** 2026-03-26  
**Reviewer:** Claude (automated code review)  
**Branch Reviewed:** `claude/add-file-upload-zHu1N`  
**Fix Branch:** `claude/code-review-performance-7lih7`  
**Scope:** Performance, mobile optimization, UI/UX quality  
**Focus:** Script/function correctness first, UI/UX second

---

## Issue Index

| # | File | Severity | Status | Description |
|---|------|----------|--------|-------------|
| 1 | `src/firebase.js` | 🔴 Critical | ✅ **Fixed** | Deprecated Firestore persistence API |
| 2 | `src/contexts/AuthContext.jsx` | 🔴 Critical | ✅ **Fixed** | Blocking `await` delays app load on every login |
| 3 | `src/contexts/AuthContext.jsx` | 🟠 High | ✅ **Fixed** | Context value not memoized — cascading re-renders |
| 4 | `src/App.jsx` | 🟠 High | 🔲 Open | No `React.lazy` — all pages load eagerly |
| 5 | `vite.config.js` | 🟠 High | 🔲 Open | `recharts` + `@react-pdf/renderer` not in `manualChunks` |
| 6 | `src/components/AppShell.jsx` | 🟠 High | 🔲 Open | Nav icon JSX in data array + `getNavItems` not memoized |
| 7 | `src/components/AppShell.jsx` | 🟠 High | 🔲 Open | `MenuIcon` unused import |
| 8 | `firestore.rules` | 🟡 Medium | 🔲 Open | `get()` on parent PDI for every item read — doubles Firestore read cost |
| 9 | `src/index.css` | 🟡 Medium | 🔲 Open | Google Fonts `@import` is render-blocking |
| 10 | `vite.config.js` | 🟡 Medium | 🔲 Open | PWA icon `purpose: 'any maskable'` is invalid per spec |
| 11 | `src/components/AppShell.jsx` | 🟠 High (UI) | 🔲 Open | iOS safe area not applied to bottom nav or content area |
| 12 | `src/components/AppShell.jsx` | 🟡 Medium (UI) | 🔲 Open | `useMediaQuery` causes mobile layout flash |
| 13 | `src/components/AppShell.jsx` | 🟡 Medium (UI) | 🔲 Open | Bottom nav uses array index as value — breaks with role-filtered nav |
| 14 | `src/index.css` | 🟡 Medium (UI) | 🔲 Open | No `prefers-reduced-motion` support |

---

## Fixed Issues — Detail

### ✅ Issue #1 — `src/firebase.js`: Deprecated Firestore Persistence API

**Severity:** 🔴 Critical  
**Commit:** `claude/code-review-performance-7lih7`

**Problem:**  
`enableIndexedDbPersistence()` is deprecated in the Firebase modular SDK and removed/non-functional in Firebase v12 (current version in `package.json`). Calling it produces a runtime error swallowed by the `.catch()` handler, meaning **offline persistence was silently not working**. The multi-tab error (`failed-precondition`) also meant any user with two tabs open had no offline support.

**Fix Applied:**  
Replaced `getFirestore(app)` + `enableIndexedDbPersistence()` with `initializeFirestore()` using the new persistence API:

```js
// Before (broken in Firebase v12)
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => { ... });

// After (correct for Firebase v9+ modular SDK)
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

**Impact:**  
- Offline persistence now actually works  
- Multi-tab support enabled (no longer fails with two tabs open)  
- Eliminates runtime error on every app load

---

### ✅ Issue #2 — `src/contexts/AuthContext.jsx`: Blocking Auth Load

**Severity:** 🔴 Critical  
**Commit:** `claude/code-review-performance-7lih7`

**Problem:**  
On every login (including page refresh with an active session), `onAuthStateChanged` performed two sequential Firestore round-trips before calling `setLoading(false)`:
1. `await getDoc(profileRef)` — fetch user profile
2. `await setDoc(profileRef, { lastLoginAt: ... }, { merge: true })` — update timestamp

Step 2 is a non-critical write that served only for auditing. Awaiting it blocked the entire app from rendering (showing the loading spinner) for the full Firestore round-trip latency (~100–400ms depending on connection), on **every single page load**.

**Fix Applied:**  
Removed `await` from the `lastLoginAt` write — it now fires and resolves in the background while the app renders immediately:

```jsx
// Before — blocked rendering
await setDoc(profileRef, { lastLoginAt: serverTimestamp() }, { merge: true });
setUserProfile(snap.data());

// After — fire-and-forget, unblocks immediately
setDoc(profileRef, { lastLoginAt: serverTimestamp() }, { merge: true });
setUserProfile(snap.data());
```

Note: The first-login profile creation (`setDoc` for a new user) **remains awaited** intentionally — the document must exist before Firestore security rules can evaluate subsequent reads.

**Impact:**  
- Eliminates one full Firestore round-trip from every page load's critical path  
- App renders ~100–400ms faster per session start on mobile connections  
- `lastLoginAt` still updates correctly — just asynchronously

---

### ✅ Issue #3 — `src/contexts/AuthContext.jsx`: Context Value Not Memoized

**Severity:** 🟠 High  
**Commit:** `claude/code-review-performance-7lih7`  
**Note:** Fixed in the same file as Issue #2.

**Problem:**  
The `value` object passed to `AuthContext.Provider` was a plain object literal recreated on every render of `AuthProvider`. Since object identity changes on every render, **all components consuming `useAuth()` would re-render whenever `AuthProvider` re-rendered**, even if no auth state actually changed.

**Fix Applied:**  
Wrapped `value` in `useMemo` with appropriate dependencies:

```jsx
// Before
const value = { user, userProfile, loading, authError, ... };

// After
const value = useMemo(() => ({
  user, userProfile, loading, authError, ...
}), [user, userProfile, loading, authError]);
```

**Impact:**  
- Prevents unnecessary re-renders of all auth-dependent components  
- Particularly important on mobile where re-renders are more expensive

---

## Open Issues — Detail

### 🔲 Issue #4 — `src/App.jsx`: No Route-Level Code Splitting

**Severity:** 🟠 High  
**Recommended Fix:**  
Convert all page imports to `React.lazy()` and wrap `<Routes>` in `<Suspense>`:

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewPDI    = lazy(() => import('./pages/PDI/NewPDI'));
// etc.

<Suspense fallback={<CircularProgress />}>
  <Routes>...</Routes>
</Suspense>
```

**Address before:** Phase 2 page implementations begin.

---

### 🔲 Issue #5 — `vite.config.js`: Missing Chunk Splits for Heavy Libraries

**Severity:** 🟠 High  
`recharts` (~500 KB) and `@react-pdf/renderer` (~1.5 MB) are not in `manualChunks`. They will land in the main bundle.

**Recommended Fix:**
```js
if (id.includes('node_modules/recharts'))    return 'recharts';
if (id.includes('node_modules/@react-pdf')) return 'pdf';
```

---

### 🔲 Issue #6 — `src/components/AppShell.jsx`: Nav Icons + `getNavItems` Not Memoized

**Severity:** 🟠 High  
JSX icon elements instantiated inside the nav data array are recreated on every call. `getNavItems` is called on every render.

**Recommended Fix:**  
Store `Icon` as a component reference, not instantiated JSX. Wrap the call in `useMemo`.

```jsx
const NAV_ITEMS = [
  { label: 'Dashboard', Icon: DashboardIcon, path: '/', roles: [...] },
  ...
];
const items = useMemo(() => NAV_ITEMS.filter(i => i.roles.includes(role)), [role]);
// In render: <item.Icon />
```

---

### 🔲 Issue #7 — `src/components/AppShell.jsx`: `MenuIcon` Unused Import

**Severity:** 🟠 High  
Remove: `import MenuIcon from '@mui/icons-material/Menu';`

---

### 🔲 Issue #8 — `firestore.rules`: `get()` on Parent PDI Per Item Read

**Severity:** 🟡 Medium  
Every `pdis/{pdiId}/items/{itemId}` read/write triggers an extra Firestore document read for the parent PDI (to check `assignedTo`). This doubles per-item operation cost.

**Recommended Fix:**  
Denormalize `assignedTo` onto each item document at creation time, or add it as a custom Firebase Auth claim for the assigned technician.

---

### 🔲 Issue #9 — `src/index.css`: Render-Blocking Google Fonts Import

**Severity:** 🟡 Medium  
`@import url(...)` inside CSS is render-blocking. Move to `index.html` with `<link rel="preconnect">` and non-blocking `media="print" onload="this.media='all'"` pattern. Remove `@import` from CSS.

---

### 🔲 Issue #10 — `vite.config.js`: Invalid PWA Icon `purpose` Value

**Severity:** 🟡 Medium  
`purpose: 'any maskable'` is not a valid single value per the Web App Manifest spec. Split into two separate icon entries per size — one `purpose: 'any'` and one `purpose: 'maskable'`.

---

### 🔲 Issue #11 — `src/components/AppShell.jsx`: iOS Safe Area Not Applied

**Severity:** 🟠 High (UI/UX)  
`viewport-fit=cover` is set in `index.html` (edge-to-edge mode) but the bottom nav has no `paddingBottom: 'env(safe-area-inset-bottom)'`. On iPhone X+ the nav overlaps the home indicator.

**Recommended Fix:**
```jsx
<BottomNavigation sx={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom)' }}>
// Content area:
<Box sx={{ pb: 'calc(72px + env(safe-area-inset-bottom))' }}>
```

---

### 🔲 Issue #12 — `src/components/AppShell.jsx`: Mobile Layout Flash on First Render

**Severity:** 🟡 Medium (UI/UX)  
`useMediaQuery` returns `false` (desktop) before the browser evaluates the media query, causing a layout flash for mobile users.

**Recommended Fix:**
```jsx
const isMobile = useMediaQuery(theme.breakpoints.down('md'), { defaultMatches: true });
```

---

### 🔲 Issue #13 — `src/components/AppShell.jsx`: Bottom Nav Uses Array Index as Value

**Severity:** 🟡 Medium (UI/UX)  
Role-filtered nav arrays have different lengths per user type. Using array index as `BottomNavigation` value means index `2` maps to different routes for different roles.

**Recommended Fix:** Use `item.path` as the `value` prop and match against `location.pathname`.

---

### 🔲 Issue #14 — `src/index.css`: No `prefers-reduced-motion` Support

**Severity:** 🟡 Medium (UI/UX)  
No reduced motion support for accessibility and lower-end mobile devices.

**Recommended Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Summary

- **Total issues flagged:** 14
- **Critical fixed:** 2 (issues #1, #2) — also fixed #3 as part of same file touch
- **High open:** 4 (issues #4, #5, #6, #7) + 1 UI (issue #11)
- **Medium open:** 4 (issues #8, #9, #10) + 3 UI (issues #12, #13, #14)
- **Recommended next action:** Address issues #4–#7 before Phase 2 pages are built out
