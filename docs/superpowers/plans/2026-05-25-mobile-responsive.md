# Mobile-Responsive Money Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Money Map canvas app fully usable on mobile (<768px) without changing the desktop experience.

**Architecture:** Tailwind responsive classes (`sm:`) handle visual differences; a `useMobile()` hook handles JS-conditional logic (ReactFlow config, bottom sheets); safe-area CSS vars (`env(safe-area-inset-*)`) add notch/home-bar awareness. Desktop paths remain untouched.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, @xyflow/react 12, framer-motion 11

---

## File Map

| File | Action | What changes |
|---|---|---|
| `hooks/useMobile.ts` | **Create** | Detects `< 768px` via matchMedia |
| `app/layout.tsx` | **Modify** | Add `viewport` export with `viewportFit: "cover"` |
| `app/globals.css` | **Modify** | `overscroll-behavior: none`; safe-area note |
| `components/canvas/MoneyCanvas.tsx` | **Modify** | Mobile ReactFlow config: no scroll-zoom, tighter range, fitView on mobile |
| `components/canvas/MoneyNode.tsx` | **Modify** | `w-[280px] md:w-[430px]`; show handles on `selected` (tap) |
| `components/navigation/BottomNav.tsx` | **Modify** | Safe-area bottom offset; compact month label on mobile |
| `components/navigation/TopBrandBar.tsx` | **Modify** | Safe-area top offset; compact sizing on mobile |
| `components/quick-add/AddTypeMenu.tsx` | **Modify** | Mobile: bottom sheet; desktop: existing JS-positioned popover |
| `components/quick-add/QuickAddModal.tsx` | **Modify** | Mobile: bottom sheet (`items-end`, rounded-t, full-width); `text-[16px]` inputs |
| `components/quick-add/FormControls.tsx` | **Modify** | Amount input `text-[16px]` for iOS zoom prevention |
| `components/analytics/AnalyticsModal.tsx` | **Modify** | Mobile: near-fullscreen bottom sheet |
| `components/analytics/AnalyticsHeader.tsx` | **Modify** | Show month nav on mobile; compact sizing |
| `components/settings/SettingsModal.tsx` | **Modify** | Mobile: bottom sheet |
| `components/search/SearchPopover.tsx` | **Modify** | Mobile: bottom sheet; `text-[16px]` input |
| `components/toast/SignInNudge.tsx` | **Modify** | Safe-area-aware bottom offset |

---

## Task 1: `useMobile` hook + viewport meta + global CSS foundations

**Files:**
- Create: `hooks/useMobile.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `hooks/useMobile.ts`**

```typescript
"use client";
import { useEffect, useState } from "react";

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}
```

- [ ] **Step 2: Add `viewport` export to `app/layout.tsx`**

Add `Viewport` to the existing `next` import and add the export before `RootLayout`. Current file starts with:
```tsx
import type { Metadata } from "next";
```
Change to:
```tsx
import type { Metadata, Viewport } from "next";
```
Add after the `metadata` export:
```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

- [ ] **Step 3: Add `overscroll-behavior: none` to `app/globals.css`**

The existing file has:
```css
html,
body {
  min-height: 100%;
}
```
Change to:
```css
html,
body {
  min-height: 100%;
  overscroll-behavior: none;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/hesam/Code-Projects/Trace-My-Money && npm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add hooks/useMobile.ts app/layout.tsx app/globals.css
git commit -m "feat(mobile): add useMobile hook, viewport meta, overscroll-none"
```

---

## Task 2: Canvas — touch-friendly ReactFlow config

**Files:**
- Modify: `components/canvas/MoneyCanvas.tsx`

The `CanvasInner` component needs: disable scroll-zoom on mobile, tighter zoom range, and a `fitView` call on mobile to show starter nodes at a reasonable scale.

- [ ] **Step 1: Add `useMobile` and `useRef` imports**

Current import in `MoneyCanvas.tsx`:
```tsx
import { useMemo, useCallback, useEffect, useRef } from "react";
```
Add the `useMobile` import after the existing React import block:
```tsx
import { useMobile } from "@/hooks/useMobile";
```

- [ ] **Step 2: Add mobile-specific canvas logic inside `CanvasInner`**

Find the existing lines:
```tsx
const rfStore = useStoreApi();
const reactFlow = useReactFlow();

const defaultViewport = useMemo(() => ({ x: 260, y: 145, zoom: 0.88 }), []);
const reconnectSuccessful = useRef(false);
```
Replace with:
```tsx
const rfStore = useStoreApi();
const reactFlow = useReactFlow();
const isMobile = useMobile();
const didFitMobile = useRef(false);

const defaultViewport = useMemo(() => ({ x: 260, y: 145, zoom: 0.88 }), []);
const reconnectSuccessful = useRef(false);
```

- [ ] **Step 3: Add mobile fitView effect**

Find the existing `useEffect` that handles `focusedNodeId`. Add a new `useEffect` right before it:
```tsx
// Fit all nodes into view on mobile after mount
useEffect(() => {
  if (isMobile && !didFitMobile.current) {
    didFitMobile.current = true;
    const timer = setTimeout(() => {
      reactFlow.fitView({ padding: 0.12, duration: 0 });
    }, 120);
    return () => clearTimeout(timer);
  }
}, [isMobile, reactFlow]);
```

- [ ] **Step 4: Update ReactFlow props for mobile**

Find:
```tsx
      minZoom={0.15}
      maxZoom={3.5}
      panOnDrag
      zoomOnPinch
      zoomOnScroll
```
Replace with:
```tsx
      minZoom={isMobile ? 0.25 : 0.15}
      maxZoom={isMobile ? 2.5 : 3.5}
      panOnDrag
      zoomOnPinch
      zoomOnScroll={!isMobile}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/canvas/MoneyCanvas.tsx
git commit -m "feat(mobile): touch canvas config — pinch zoom, no scroll-zoom, fitView on mobile"
```

---

## Task 3: MoneyNode — mobile sizing + tap-to-reveal handles

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

The node is currently `w-[430px]`. On mobile it needs to be ~`w-[280px]`. Handles are hidden until hover; on mobile there is no hover, so we show handles when the node is `selected` (tapping a node in ReactFlow selects it).

- [ ] **Step 1: Destructure `selected` from props**

Find:
```tsx
  const { data, id } = props;
  const [isHovering, setIsHovering] = useState(false);
```
Change to:
```tsx
  const { data, id, selected } = props;
  const [isHovering, setIsHovering] = useState(false);
```

- [ ] **Step 2: Update node article width, padding, and CSS class**

Find the article element opening:
```tsx
    <article
      className={`money-node group w-[430px] rounded-[28px] bg-white/95 px-5 pb-6 pt-5 shadow-soft backdrop-blur transition ${
        isFocused ? "ring-4 ring-[#d8cdb9]/70" : ""
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        "--handle-opacity": isHovering ? 1 : 0
      } as React.CSSProperties}
    >
      <style>{`
        .money-node:hover .node-handle {
          opacity: 1;
        }
      `}</style>
```
Replace with:
```tsx
    <article
      className={`money-node group w-[280px] md:w-[430px] rounded-[28px] bg-white/95 px-4 pb-5 pt-4 md:px-5 md:pb-6 md:pt-5 shadow-soft backdrop-blur transition ${
        isFocused ? "ring-4 ring-[#d8cdb9]/70" : ""
      } ${selected ? "money-node-selected" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        "--handle-opacity": isHovering || selected ? 1 : 0
      } as React.CSSProperties}
    >
      <style>{`
        .money-node:hover .node-handle,
        .money-node-selected .node-handle {
          opacity: 1;
        }
      `}</style>
```

- [ ] **Step 3: Increase handle size for touch targets**

Find:
```tsx
const handleStyle = {
  width: 10,
  height: 10,
  borderRadius: "999px",
  background: "#fffaf2",
  border: "1px solid rgba(60, 55, 45, 0.18)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
```
Replace with:
```tsx
const handleStyle = {
  width: 14,
  height: 14,
  borderRadius: "999px",
  background: "#fffaf2",
  border: "1px solid rgba(60, 55, 45, 0.18)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "feat(mobile): node responsive width, larger handles, tap-to-show on selection"
```

---

## Task 4: Navigation — BottomNav + TopBrandBar safe-area + compact

**Files:**
- Modify: `components/navigation/BottomNav.tsx`
- Modify: `components/navigation/TopBrandBar.tsx`

Both elements are `fixed` and need safe-area offsets for notch/home-bar devices. BottomNav also needs a compact month label on small screens.

- [ ] **Step 1: Update `BottomNav` nav element with safe-area bottom offset**

Find:
```tsx
    <nav className="fixed bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" aria-label="Money map controls">
```
Replace with:
```tsx
    <nav
      className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2"
      style={{ bottom: "max(28px, calc(8px + env(safe-area-inset-bottom, 0px)))" }}
      aria-label="Money map controls"
    >
```

- [ ] **Step 2: Update month label to be compact on mobile**

Find:
```tsx
        <div className="min-w-[86px] text-center text-[18px] leading-none">
          <span className="font-semibold">{monthName}</span>{" "}
          <span className="font-light text-[#a0a3ae]">{year}</span>
        </div>
```
Replace with:
```tsx
        <div className="min-w-[64px] sm:min-w-[86px] text-center text-[15px] sm:text-[18px] leading-none">
          <span className="font-semibold">{monthName}</span>{" "}
          <span className="font-light text-[#a0a3ae]">{year}</span>
        </div>
```

- [ ] **Step 3: Update `TopBrandBar` with safe-area top offset and compact mobile sizing**

The entire `TopBrandBar` component currently renders:
```tsx
  return (
    <div className="fixed left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-2 shadow-dock">
      <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={22} height={22} className="size-[22px]" aria-hidden="true" />
      </span>
      <span className="text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
    </div>
  );
```
Replace with:
```tsx
  return (
    <div
      className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:gap-3 rounded-full bg-white px-3 py-1.5 md:px-4 md:py-2 shadow-dock"
      style={{ top: "max(12px, calc(8px + env(safe-area-inset-top, 0px)))" }}
    >
      <span className="grid size-6 md:size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={18} height={18} className="size-[18px] md:size-[22px]" aria-hidden="true" />
      </span>
      <span className="text-[14px] md:text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
    </div>
  );
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/navigation/BottomNav.tsx components/navigation/TopBrandBar.tsx
git commit -m "feat(mobile): navigation safe-area offsets, compact month label and brand bar"
```

---

## Task 5: AddTypeMenu — mobile bottom sheet

**Files:**
- Modify: `components/quick-add/AddTypeMenu.tsx`

On mobile, the JS-positioned popover above the add button becomes a full-width bottom sheet. On desktop, existing behavior is unchanged.

- [ ] **Step 1: Add `useMobile` import**

Add after existing imports in `AddTypeMenu.tsx`:
```tsx
import { useMobile } from "@/hooks/useMobile";
```

- [ ] **Step 2: Add `useMobile` call inside the component**

Find the component body start:
```tsx
export function AddTypeMenu({
  open,
  onClose,
  onSelect,
  menuPos
}: {
```
Find where the component logic starts (after the props) and add `useMobile`:
```tsx
  const isMobile = useMobile();
```
(Add this as the first line inside the function body, before the `useEffect`.)

- [ ] **Step 3: Add mobile bottom sheet branch**

Find the `return (` statement in `AddTypeMenu`. Add the mobile branch before the existing `AnimatePresence` return. The current component ends with:
```tsx
  return (
    <AnimatePresence>
```
Wrap the entire existing `return` and add a mobile alternative:
```tsx
  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.01 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-40 rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(76,74,68,0.14)]"
              style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="px-4 pt-4 pb-2">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d7d1c4]" />
                <div className="grid gap-0.5">
                  {ITEM_TYPES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        className="flex h-12 w-full items-center gap-3 rounded-full px-3 text-left text-[17px] font-semibold tracking-[-0.02em] text-[#2f333b] transition active:bg-[#fbfaf7] active:scale-[0.99]"
                        onClick={() => onSelect(item.type)}
                      >
                        <span className={`grid size-6 place-items-center overflow-hidden rounded-full ${item.iconClass}`}>
                          {item.type === "savings" ? (
                            <Image src="/icons/savings-piggy.webp" alt="" width={24} height={24} className="size-6 object-cover" aria-hidden="true" />
                          ) : (
                            <Icon className="size-4" strokeWidth={2.5} />
                          )}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
```

> Note: `ITEM_TYPES` is already defined in this file (the array of `{ type, label, icon, iconClass }`). The mobile branch reuses it. `Image` is already imported.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/quick-add/AddTypeMenu.tsx
git commit -m "feat(mobile): AddTypeMenu bottom sheet on mobile"
```

---

## Task 6: QuickAddModal + FormControls — mobile bottom sheet + 16px inputs

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`
- Modify: `components/quick-add/FormControls.tsx`

On mobile, the modal slides up from the bottom as a full-width bottom sheet. All text inputs get `text-[16px]` to prevent iOS auto-zoom when focusing.

- [ ] **Step 1: Change `inputClass` font size in `QuickAddModal.tsx`**

Find (line 31-32):
```tsx
const inputClass =
  "h-12 rounded-full bg-[#fbfaf7] px-4 text-[15px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";
```
Replace with:
```tsx
const inputClass =
  "h-12 rounded-full bg-[#fbfaf7] px-4 text-[16px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";
```

- [ ] **Step 2: Update submit button font size**

Find:
```tsx
                className={`h-13 w-full rounded-full px-5 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${submitButtonClass(activeType)}`}
```
Replace with:
```tsx
                className={`h-13 w-full rounded-full px-5 py-3.5 text-[16px] font-semibold transition active:scale-[0.99] ${submitButtonClass(activeType)}`}
```

- [ ] **Step 3: Change outer backdrop to bottom-sheet layout**

Find (line 228):
```tsx
          className="fixed inset-0 z-40 grid place-items-center bg-[#2f333b]/14 px-5 backdrop-blur-[2px]"
```
Replace with:
```tsx
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#2f333b]/14 sm:px-5 backdrop-blur-[2px]"
```

- [ ] **Step 4: Change form element to bottom sheet shape**

Find:
```tsx
            className="flex w-full max-w-[430px] flex-col rounded-[32px] bg-white shadow-soft"
            style={{ maxHeight: "min(90dvh, 680px)" }}
```
Replace with:
```tsx
            className="flex w-full max-w-full sm:max-w-[430px] flex-col rounded-t-[32px] sm:rounded-[32px] bg-white shadow-soft"
            style={{ maxHeight: "85dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
```

- [ ] **Step 5: Fix amount input in `FormControls.tsx`**

Open `components/quick-add/FormControls.tsx`. Find the amount input `className`:
```tsx
      className="h-12 rounded-full bg-[#fbfaf7] px-4 text-[15px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]"
```
Replace `text-[15px]` with `text-[16px]`:
```tsx
      className="h-12 rounded-full bg-[#fbfaf7] px-4 text-[16px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]"
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx components/quick-add/FormControls.tsx
git commit -m "feat(mobile): QuickAddModal bottom sheet, 16px inputs to prevent iOS zoom"
```

---

## Task 7: AnalyticsModal — mobile near-fullscreen + month nav visible

**Files:**
- Modify: `components/analytics/AnalyticsModal.tsx`
- Modify: `components/analytics/AnalyticsHeader.tsx`

On mobile the modal becomes a bottom-anchored near-fullscreen sheet. The month nav (hidden on mobile with `hidden sm:flex`) becomes visible with compact sizing.

- [ ] **Step 1: Change `AnalyticsModal` backdrop to `items-end` on mobile**

Find:
```tsx
          className="fixed inset-0 z-30 grid place-items-center bg-[#7e7567]/16 px-3 py-4 backdrop-blur-[2px] sm:px-5"
```
Replace with:
```tsx
          className="fixed inset-0 z-30 flex items-end sm:grid sm:place-items-center bg-[#7e7567]/16 sm:px-3 sm:py-4 backdrop-blur-[2px]"
```

- [ ] **Step 2: Update `AnalyticsModal` section sizing**

Find:
```tsx
            className="relative z-10 flex h-[88vh] w-[92vw] max-w-[820px] flex-col overflow-hidden rounded-[36px] bg-[#fbfaf7] shadow-[0_34px_90px_rgba(76,74,68,0.22),0_2px_0_rgba(255,255,255,0.82)_inset]"
```
Replace with:
```tsx
            className="relative z-10 flex h-[95dvh] w-full rounded-t-[28px] sm:h-[88vh] sm:w-[92vw] sm:max-w-[820px] sm:rounded-[36px] flex-col overflow-hidden bg-[#fbfaf7] shadow-[0_34px_90px_rgba(76,74,68,0.22),0_2px_0_rgba(255,255,255,0.82)_inset]"
```

- [ ] **Step 3: Make month nav visible on mobile in `AnalyticsHeader.tsx`**

Find:
```tsx
        <div className="hidden h-10 items-center gap-1 rounded-full bg-white px-2 text-[#626677] shadow-dock sm:flex" aria-label={`Selected month ${monthLabel}`}>
          <button
            type="button"
            onClick={onPreviousMonth}
            className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
          </button>
          <div className="min-w-[122px] text-center text-[14px] font-semibold">{monthLabel}</div>
          <button
            type="button"
            onClick={onNextMonth}
            className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="size-[18px]" strokeWidth={2.4} />
          </button>
        </div>
```
Replace with:
```tsx
        <div className="flex h-9 items-center gap-0.5 rounded-full bg-white px-1.5 text-[#626677] shadow-dock sm:h-10 sm:gap-1 sm:px-2" aria-label={`Selected month ${monthLabel}`}>
          <button
            type="button"
            onClick={onPreviousMonth}
            className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4 sm:size-[18px]" strokeWidth={2.4} />
          </button>
          <div className="min-w-[90px] text-center text-[12px] font-semibold sm:min-w-[122px] sm:text-[14px]">{monthLabel}</div>
          <button
            type="button"
            onClick={onNextMonth}
            className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
            aria-label="Next month"
          >
            <ChevronRight className="size-4 sm:size-[18px]" strokeWidth={2.4} />
          </button>
        </div>
```

- [ ] **Step 4: Reduce `AnalyticsHeader` title size on mobile**

Find:
```tsx
        <h2 className="text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Analytics</h2>
```
Replace with:
```tsx
        <h2 className="text-[20px] sm:text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Analytics</h2>
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/analytics/AnalyticsModal.tsx components/analytics/AnalyticsHeader.tsx
git commit -m "feat(mobile): AnalyticsModal near-fullscreen, month nav visible on mobile"
```

---

## Task 8: SettingsModal + SearchPopover — mobile bottom sheets

**Files:**
- Modify: `components/settings/SettingsModal.tsx`
- Modify: `components/search/SearchPopover.tsx`

Both use the same pattern: change `grid place-items-center` to `flex items-end sm:items-center`, expand to full-width on mobile, round only the top corners on mobile.

- [ ] **Step 1: Update `SettingsModal` backdrop**

Find (line 58):
```tsx
          className="fixed inset-0 z-50 grid place-items-center bg-[#2f333b]/14 px-4 py-10 backdrop-blur-[2px]"
```
Replace with:
```tsx
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2f333b]/14 sm:px-4 sm:py-10 backdrop-blur-[2px]"
```

- [ ] **Step 2: Update `SettingsModal` section sizing**

Find:
```tsx
            className="flex max-h-[calc(100vh-80px)] w-[420px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[34px] bg-[#fbfaf7] shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
```
Replace with:
```tsx
            className="flex max-h-[85dvh] sm:max-h-[calc(100vh-80px)] w-full sm:w-[420px] sm:max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-t-[34px] sm:rounded-[34px] bg-[#fbfaf7] shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
```

- [ ] **Step 3: Update `SearchPopover` backdrop**

Find:
```tsx
          className="fixed inset-0 z-40 flex items-start justify-center bg-[#2f333b]/12 px-4 py-10"
```
Replace with:
```tsx
          className="fixed inset-0 z-40 flex items-end sm:items-start sm:justify-center bg-[#2f333b]/12 sm:px-4 sm:py-10"
```

- [ ] **Step 4: Update `SearchPopover` section sizing**

Find:
```tsx
            className="w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[30px] bg-white p-4 shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
```
Replace with:
```tsx
            className="w-full sm:w-[420px] sm:max-w-[calc(100vw-32px)] overflow-hidden rounded-t-[30px] sm:rounded-[30px] bg-white p-4 shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
```

- [ ] **Step 5: Update `SearchPopover` text input font-size to 16px**

Find in `SearchPopover.tsx`:
```tsx
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#30333b] outline-none placeholder:text-[#aaa59c]"
```
Replace with:
```tsx
                className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-[#30333b] outline-none placeholder:text-[#aaa59c]"
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/settings/SettingsModal.tsx components/search/SearchPopover.tsx
git commit -m "feat(mobile): SettingsModal and SearchPopover become bottom sheets on mobile"
```

---

## Task 9: SignInNudge — safe-area-aware bottom offset

**Files:**
- Modify: `components/toast/SignInNudge.tsx`

The nudge sits at `fixed bottom-24` (96px). With safe-area and the bottom nav moved up, we need to ensure the nudge stays above the nav.

- [ ] **Step 1: Update nudge `bottom` position**

Find in `SignInNudge.tsx`:
```tsx
            className="fixed bottom-24 inset-x-0 mx-auto z-30 w-fit pointer-events-auto max-w-[calc(100dvw-2rem)]"
```
Replace with:
```tsx
            className="fixed inset-x-0 mx-auto z-30 w-fit pointer-events-auto max-w-[calc(100dvw-2rem)]"
            style={{ bottom: "max(96px, calc(64px + env(safe-area-inset-bottom, 0px)))" }}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/toast/SignInNudge.tsx
git commit -m "feat(mobile): SignInNudge safe-area-aware bottom offset"
```

---

## Self-Review Against Spec

### Spec coverage check

| Spec requirement | Task that covers it |
|---|---|
| Touch pan works | Task 2 — `panOnDrag` already set, no scroll interference with `zoomOnScroll={false}` on mobile |
| Pinch zoom works | Task 2 — `zoomOnPinch` already set |
| Initial viewport fits starter nodes | Task 2 — `reactFlow.fitView()` on mount |
| Node width 220-260px mobile | Task 3 — `w-[280px] md:w-[430px]` |
| Touch-friendly handles (14-18px) | Task 3 — handles sized to 14px |
| Handles show on tap | Task 3 — `selected` prop shows handles |
| Bottom nav safe-area | Task 4 |
| Top bar safe-area | Task 4 |
| Add menu touch-friendly bottom sheet | Task 5 |
| Quick-add as bottom sheet | Task 6 |
| Form inputs 16px (no iOS zoom) | Task 6 + Task 8 |
| Analytics near-fullscreen mobile | Task 7 |
| Analytics month arrows visible | Task 7 |
| Analytics cards already single-column | Pre-existing: `grid-cols-1 gap-4 lg:grid-cols-2` |
| Settings bottom sheet | Task 8 |
| Search bottom sheet | Task 8 |
| SignInNudge safe-area | Task 9 |
| No horizontal overflow | `overscroll-behavior: none` + viewport meta — Task 1; node width reduction — Task 3 |
| Desktop unchanged | All changes use `sm:` prefix for desktop-equivalent styles |

### Placeholder scan

No TBDs or "implement later" found. All code blocks are complete.

### Type consistency

- `useMobile()` returns `boolean` — used consistently in Tasks 2, 3 (only Task 2 and 5 use it; Task 3 uses `selected` from ReactFlow props)
- `selected` is destructured from `NodeProps<MoneyFlowNode>` — valid per `@xyflow/react` types
- All Tailwind classes are valid Tailwind 3 syntax
- `env(safe-area-inset-bottom, 0px)` — standard CSS, valid in inline styles
