# Nav/Header Sizing Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bump BottomNav and TopBrandBar sizes on mobile only for better touch comfort.

**Architecture:** Pure CSS/Tailwind class changes in two components. No logic changes. Desktop untouched.

**Tech Stack:** Next.js 15, Tailwind CSS, React 19

---

### Task 1: Bump BottomNav mobile sizes

**Files:**
- Modify: `components/navigation/BottomNav.tsx`

- [ ] **Step 1: Read current BottomNav**

Read `components/navigation/BottomNav.tsx` to confirm current class names before editing.

- [ ] **Step 2: Update DockButton size**

Find the DockButton circle classes. Change mobile size from `size-11` to `size-12`. Keep any `sm:` or `md:` classes unchanged.

- [ ] **Step 3: Update icons inside DockButton**

Find `size-6` on icons inside DockButton. Change to `size-[26px]` (mobile only, no `md:` wrapper needed as DockButton is mobile-only).

- [ ] **Step 4: Update nav gap**

Find `gap-1.5` on the `<nav>` element. Change to `gap-2`. Keep `sm:gap-2` if present (no change needed there).

- [ ] **Step 5: Update month pill**

Find the month pill container. Change:
- `h-11` → `h-12`
- `px-2` → `px-3` (if present)
- Month text: find `text-[13px]` → `text-[14px]`

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/navigation/BottomNav.tsx
git commit -m "feat(mobile): bump BottomNav touch targets to 48px"
```

---

### Task 2: Bump TopBrandBar mobile sizes

**Files:**
- Modify: `components/navigation/TopBrandBar.tsx`

- [ ] **Step 1: Read current TopBrandBar**

Read `components/navigation/TopBrandBar.tsx` to confirm current class names.

- [ ] **Step 2: Update Settings/Search icon circles**

Find `size-11` on the Settings and Search `<button>` elements (the `sm:hidden` ones). Change to `size-12`.

- [ ] **Step 3: Update brand pill height**

Find `h-11` on the brand pill `<div>`. Change to `h-12`.

- [ ] **Step 4: Update logo size**

Find `size-[18px]` on the logo `<Image>`. Change to `size-5` (20px). Update `width={18} height={18}` props to `width={20} height={20}`.

- [ ] **Step 5: Update brand text**

Find `text-[14px]` on the brand name `<span>`. Change to `text-[15px]`.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/navigation/TopBrandBar.tsx
git commit -m "feat(mobile): bump TopBrandBar touch targets to 48px"
```
