# Connector UX (Mobile) Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make node connection on mobile reliable: larger handles, pan disabled during drag, increased snap radius, soft target highlight.

**Architecture:** Handle wrapper adds invisible touch padding in MoneyNode. MoneyCanvas adds `isConnecting` state to control `panOnDrag` and CSS class for target highlighting.

**Tech Stack:** React 19, @xyflow/react 12.5.5, TypeScript, Tailwind CSS

---

### Task 1: Expand handle touch areas in MoneyNode

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

- [ ] **Step 1: Read MoneyNode**

Read `components/canvas/MoneyNode.tsx` to see current `NodeHandle` and `handleStyle`.

- [ ] **Step 2: Update handleStyle for mobile**

Find `handleStyle` object (currently `width: 14, height: 14`). Change to:
```ts
const handleStyle = {
  width: 14,
  height: 14,
  borderRadius: "999px",
  background: "#fffaf2",
  border: "1px solid rgba(60, 55, 45, 0.18)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
```
(Keep as-is — visual size stays 14px. We expand touch area via wrapper.)

- [ ] **Step 3: Wrap Handle in touch-area div**

Find `NodeHandle` component. Replace the `<Handle>` return with a wrapper that expands the touch target:

```tsx
function NodeHandle({ position }: { position: Position }) {
  const side = positionKey[position];
  return (
    <>
      <div
        style={{
          position: "absolute",
          ...getHandleWrapperStyle(position),
          padding: 10,
          margin: -10,
          zIndex: 10,
          cursor: "crosshair",
          touchAction: "none",
        }}
      >
        <Handle
          id={`${side}-source`}
          type="source"
          position={position}
          className="node-handle opacity-0 transition-opacity duration-160"
          style={handleStyle}
        />
        <Handle
          id={`${side}-target`}
          type="target"
          position={position}
          className="node-handle opacity-0 transition-opacity duration-160"
          style={handleStyle}
        />
      </div>
    </>
  );
}
```

Add helper for wrapper positioning offset:
```ts
function getHandleWrapperStyle(position: Position): React.CSSProperties {
  // Wrapper needs to be positioned to center around where the handle sits
  return {};
}
```

Actually — simpler approach: just add `style={{ touchAction: "none" }}` directly to existing Handle elements to ensure touch events are not blocked, and expand with a CSS wrapper pseudo approach.

Simplest reliable approach: increase handle visual + touch area on mobile via CSS. Add to the `<style>` block already in MoneyNode:

```tsx
<style>{`
  .money-node:hover .node-handle,
  .money-node-selected .node-handle {
    opacity: 1;
  }
  @media (max-width: 768px) {
    .node-handle {
      width: 20px !important;
      height: 20px !important;
    }
  }
`}</style>
```

This bumps handles from 14px to 20px on mobile devices. Combined with the `reconnectRadius` increase in MoneyCanvas, this significantly improves mobile connection reliability.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "feat(mobile): increase handle size to 20px on mobile for easier connection"
```

---

### Task 2: Pan disable + snap radius + target highlight in MoneyCanvas

**Files:**
- Modify: `components/canvas/MoneyCanvas.tsx`
- Modify: `app/globals.css` (or nearest global CSS file)

- [ ] **Step 1: Read MoneyCanvas**

Read `components/canvas/MoneyCanvas.tsx` to confirm current ReactFlow props and imports.

- [ ] **Step 2: Add isConnecting state**

After existing `const isMobile = useMobile();`, add:
```ts
const [isConnecting, setIsConnecting] = useState(false);
```

Add `useState` to the React import if not already there.

- [ ] **Step 3: Add onConnectStart and onConnectEnd handlers**

```ts
const handleConnectStart = useCallback(() => {
  setIsConnecting(true);
}, []);

const handleConnectEnd = useCallback(() => {
  setIsConnecting(false);
}, []);
```

- [ ] **Step 4: Wire into ReactFlow**

On the `<ReactFlow>` element:
- Add `onConnectStart={handleConnectStart}`
- Add `onConnectEnd={handleConnectEnd}`
- Change `panOnDrag` from `panOnDrag` (static `true`) to `panOnDrag={!isConnecting}`
- Change `reconnectRadius={20}` to `reconnectRadius={isMobile ? 36 : 20}`
- Add `className={`money-canvas${isConnecting ? " is-connecting" : ""}`}`

- [ ] **Step 5: Add target-highlight CSS**

Find the global CSS file (check `app/globals.css`). Add:

```css
/* Soft highlight for connection targets */
.is-connecting .money-node {
  transition: box-shadow 0.15s ease;
}
.is-connecting .money-node {
  box-shadow: 0 0 0 2px rgba(216, 205, 185, 0.55), 0 8px 32px rgba(0,0,0,0.06);
}
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/MoneyCanvas.tsx app/globals.css
git commit -m "feat(mobile): disable pan during connection, larger snap radius, target highlight"
```
