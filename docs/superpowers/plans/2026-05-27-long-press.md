# Long Press Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add long press (420ms) as the mobile equivalent of right-click context menu. Desktop unchanged.

**Architecture:** New `useLongPress` hook returns touch handlers. MoneyNode applies them to node body and item rows. MoneyCanvas skips `onNodeContextMenu` on mobile.

**Tech Stack:** React 19, TypeScript, @xyflow/react

---

### Task 1: Create `hooks/useLongPress.ts`

**Files:**
- Create: `hooks/useLongPress.ts`

- [ ] **Step 1: Create the hook**

```ts
// hooks/useLongPress.ts
import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  delay?: number;
  moveThreshold?: number;
}

export function useLongPress(
  onLongPress: (clientX: number, clientY: number) => void,
  options: UseLongPressOptions = {}
) {
  const { delay = 420, moveThreshold = 8 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
    fired.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      fired.current = false;
      timerRef.current = setTimeout(() => {
        if (startPos.current) {
          fired.current = true;
          onLongPress(startPos.current.x, startPos.current.y);
        }
        timerRef.current = null;
      }, delay);
    },
    [delay, onLongPress]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
        cancel();
      }
    },
    [cancel, moveThreshold]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (fired.current) {
        // Prevent the subsequent tap from firing after long press
        e.preventDefault();
      }
      cancel();
    },
    [cancel]
  );

  const onTouchCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useLongPress.ts
git commit -m "feat(hook): add useLongPress for mobile context menu trigger"
```

---

### Task 2: Wire long press into MoneyNode

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

- [ ] **Step 1: Read MoneyNode**

Read `components/canvas/MoneyNode.tsx` to confirm current structure.

- [ ] **Step 2: Add imports**

Add to imports at top of file:
```ts
import { useLongPress } from "@/hooks/useLongPress";
import { useMobile } from "@/hooks/useMobile";
```

- [ ] **Step 3: Add long press to MoneyNode component**

Inside `MoneyNode`, after existing hook calls, add:

```ts
const isMobile = useMobile();
const nodeLongPress = useLongPress(
  (x, y) => openContextMenu(x, y, { type: "node", nodeId: id }),
  { delay: 420 }
);
```

- [ ] **Step 4: Apply long press to node article**

On the `<article>` element, add the touch handlers conditionally:

```tsx
<article
  className={`money-node group ...`}
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
  {...(isMobile ? nodeLongPress : {})}
  style={{ ... }}
>
```

- [ ] **Step 5: Add long press to MoneyRow item rows**

In `MoneyRow`, add a `useLongPress` call. MoneyRow needs `openContextMenu` and `isMobile` — it already has `openContextMenu` via the store. Add `isMobile`:

```ts
const isMobile = useMobile();
const itemLongPress = useLongPress(
  (x, y) => openContextMenu(x, y, { type: "item", nodeId, itemId: item.id }),
  { delay: 420 }
);
```

Then on the `<motion.li>`:
```tsx
<motion.li
  className="nodrag ..."
  onContextMenu={(event) => { ... }}
  {...(isMobile ? itemLongPress : {})}
  ...
>
```

- [ ] **Step 6: Add long press to GoalRow**

Same pattern in `GoalRow`:
```ts
const isMobile = useMobile();
const itemLongPress = useLongPress(
  (x, y) => openContextMenu(x, y, { type: "item", nodeId, itemId: item.id }),
  { delay: 420 }
);
```

Apply to `<li>`:
```tsx
<li
  className="nodrag"
  onContextMenu={(e) => { ... }}
  {...(isMobile ? itemLongPress : {})}
>
```

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "feat(mobile): wire long press context menu into MoneyNode and item rows"
```

---

### Task 3: Guard desktop-only onNodeContextMenu in MoneyCanvas

**Files:**
- Modify: `components/canvas/MoneyCanvas.tsx`

- [ ] **Step 1: Read MoneyCanvas**

Read `components/canvas/MoneyCanvas.tsx` to find `handleNodeContextMenu`.

- [ ] **Step 2: Add mobile guard**

Find `handleNodeContextMenu`:
```ts
const handleNodeContextMenu = useCallback(
  (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    openContextMenu(event.clientX, event.clientY, { type: "node", nodeId: node.id });
  },
  [openContextMenu]
);
```

Change to:
```ts
const handleNodeContextMenu = useCallback(
  (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (isMobile) return; // handled by useLongPress in MoneyNode
    openContextMenu(event.clientX, event.clientY, { type: "node", nodeId: node.id });
  },
  [openContextMenu, isMobile]
);
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/canvas/MoneyCanvas.tsx
git commit -m "fix(mobile): skip onNodeContextMenu on mobile — long press handles it"
```
