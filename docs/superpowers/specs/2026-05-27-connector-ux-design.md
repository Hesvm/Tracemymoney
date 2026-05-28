# Connector UX (Mobile) — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

## Goal
Make connecting nodes/buckets reliable on mobile. Larger handles, disable canvas panning during connection, soft target highlighting, increased snap radius.

## Files
- Modify: `components/canvas/MoneyNode.tsx`
- Modify: `components/canvas/MoneyCanvas.tsx`

## Handle Touch Area Expansion (MoneyNode.tsx)

The `NodeHandle` component wraps ReactFlow's `<Handle>`. Add an invisible larger hit area:

```tsx
// Wrap Handle in a relative container with padding for touch area
<div className="absolute" style={{ padding: 10, margin: -10, cursor: 'crosshair' }}>
  <Handle ... />
</div>
```

Visual handle stays 14×14px. The surrounding 10px padding makes the effective touch target 34×34px without looking larger.

On mobile: handle visual size bumped to `width: 18, height: 18` (from 14).

## Pan Disable During Connection (MoneyCanvas.tsx)

```ts
const [isConnecting, setIsConnecting] = useState(false);
```

Wire to ReactFlow:
- `onConnectStart={() => setIsConnecting(true)}`
- `onConnectEnd={() => setIsConnecting(false)}`
- `panOnDrag={!isConnecting}` — disables canvas panning while dragging a connector

## Snap/Reconnect Radius (MoneyCanvas.tsx)

```ts
reconnectRadius={isMobile ? 36 : 20}
connectionRadius={isMobile ? 36 : 20}  // ReactFlow v12 prop
```

More forgiving snapping on mobile.

## Target Highlighting (CSS)

Add `is-connecting` class to ReactFlow container when `isConnecting`:

```tsx
<ReactFlow className={`money-canvas ${isConnecting ? 'is-connecting' : ''}`} ...>
```

In global CSS:
```css
.is-connecting .money-node {
  transition: box-shadow 0.15s ease;
}
.is-connecting .money-node:not(.source-node) {
  box-shadow: 0 0 0 2px rgba(216, 205, 185, 0.6), var(--shadow-soft);
}
```

Source node excluded via a `data-connecting-source` attribute set in `onConnectStart`.

## Failed Connection
Already handled by existing `handleReconnectEnd` — restores cancelled edges. No change needed.

## Acceptance Criteria
- [ ] Handles have ≥ 34px touch target on mobile
- [ ] Canvas does not pan while dragging a connector
- [ ] Snap radius is 36px on mobile
- [ ] Non-source nodes softly highlight during connection drag
- [ ] Failed connections cancel cleanly (existing behaviour preserved)
- [ ] Desktop connector behaviour unchanged
