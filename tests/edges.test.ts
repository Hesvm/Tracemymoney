import { createEdge, decorateEdge } from "@/lib/edges";

// createEdge defaults to right-source / left-target
const e1 = createEdge("a", "b");
if (e1.sourceHandle !== "right-source")
  throw new Error(`default sourceHandle should be "right-source", got ${e1.sourceHandle}`);
if (e1.targetHandle !== "left-target")
  throw new Error(`default targetHandle should be "left-target", got ${e1.targetHandle}`);
if (e1.source !== "a") throw new Error("source must be set");
if (e1.target !== "b") throw new Error("target must be set");
if (e1.id !== "edge-a-b") throw new Error(`id should be "edge-a-b", got ${e1.id}`);

// createEdge with explicit handles
const e2 = createEdge("a", "b", "top-source", "bottom-target");
if (e2.sourceHandle !== "top-source")
  throw new Error(`explicit sourceHandle should be preserved, got ${e2.sourceHandle}`);
if (e2.targetHandle !== "bottom-target")
  throw new Error(`explicit targetHandle should be preserved, got ${e2.targetHandle}`);

// decorateEdge preserves existing handles (does not overwrite them)
const e3 = decorateEdge({
  id: "x",
  source: "a",
  target: "b",
  sourceHandle: "left-source",
  targetHandle: "right-target",
});
if (e3.sourceHandle !== "left-source")
  throw new Error("decorateEdge must not overwrite existing sourceHandle");
if (e3.targetHandle !== "right-target")
  throw new Error("decorateEdge must not overwrite existing targetHandle");

// decorateEdge applies visual styling
if (e3.type !== "moneyEdge") throw new Error("decorateEdge must set type to moneyEdge");
if (!e3.style || (e3.style as { stroke?: string }).stroke !== "#b9babd")
  throw new Error("decorateEdge must set stroke color");

console.log("edges: all tests passed ✓");
