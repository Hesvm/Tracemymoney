"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { useMoneyMapStore } from "@/store/moneyMapStore";

export function MoneyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.36
  });

  const deleteEdge = useMoneyMapStore((state) => state.deleteEdge);

  const stroke = selected ? "#8b8b91" : "#b9babd";
  const strokeWidth = selected ? 2.4 : 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke,
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
          transition: "stroke 160ms ease, stroke-width 160ms ease",
          ...style
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY}px)`,
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #8b5cf6",
                boxShadow: "0 0 0 3px rgba(139,92,246,0.15), 0 1px 4px rgba(0,0,0,0.10)"
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`,
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#8b5cf6",
                border: "2px solid #6d28d9",
                boxShadow: "0 0 0 3px rgba(139,92,246,0.15), 0 1px 4px rgba(0,0,0,0.10)"
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all"
            }}
          >
            <button
              onClick={() => deleteEdge(id)}
              className="grid size-6 place-items-center rounded-full bg-white text-[#d9344f] shadow-soft transition hover:bg-[#fef0f3] active:scale-95"
              aria-label="Delete connection"
              title="Delete this connection"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
