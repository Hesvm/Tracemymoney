# Long Press (Mobile Context Menu) — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

## Goal
Replace right-click context menu with long press on mobile. Desktop right-click unchanged.

## Files
- Create: `hooks/useLongPress.ts`
- Modify: `components/canvas/MoneyNode.tsx`
- Modify: `components/canvas/MoneyCanvas.tsx`

## `hooks/useLongPress.ts`

Pure hook. No store dependencies.

```ts
useLongPress(
  onLongPress: (clientX: number, clientY: number) => void,
  options?: { delay?: number; moveThreshold?: number }
)
// returns: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel }
```

**Logic:**
1. `touchstart` → record start position, start 420ms timer
2. `touchmove` → if movement > 8px from start, cancel timer (user is scrolling/panning)
3. `touchend` before timer fires → cancel (normal tap)
4. Timer fires → call `onLongPress(clientX, clientY)`, provide scale feedback via CSS class
5. After long press fires, consume subsequent `touchend` to prevent tap from also firing

## MoneyNode.tsx

- Node `<article>` element: add `useLongPress` handlers → calls `openContextMenu(x, y, { type: "node", nodeId: id })`
- Each `<li>` item row (MoneyRow, GoalRow): add `useLongPress` → calls `openContextMenu(x, y, { type: "item", nodeId, itemId: item.id })`
- Long press on node body only fires if not pressing an interactive child (button, input)

## MoneyCanvas.tsx

- `onNodeContextMenu`: guard with `if (isMobile) return` — long press in MoneyNode handles it on mobile, preventing double-fire
- No other changes needed

## Conflict Prevention
- Long press checks `touchmove` distance before firing — drag cancels it
- Items already have `nodrag` class so ReactFlow drag doesn't conflict with item long press
- The node article has `nodrag` children; long press on node body only fires on non-interactive areas

## Acceptance Criteria
- [ ] Long press on node body opens node context menu on mobile
- [ ] Long press on item row opens item context menu on mobile
- [ ] Normal tap still works (add, toggle, etc.)
- [ ] Drag cancels the long press (move > 8px)
- [ ] Desktop right-click context menu unchanged
- [ ] No double-fire on mobile
