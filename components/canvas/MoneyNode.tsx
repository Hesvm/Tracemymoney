"use client";

import { ArrowDown, ArrowUp, Goal, PiggyBank, Plus } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Image from "next/image";
import { useState } from "react";
import { formatConvertedAmount, formatDateLabel, formatPrimaryAmount } from "@/lib/formatters";
import { isItemInMonth } from "@/lib/months";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import type { MoneyFlowNode, MoneyItem, MoneyNodeType } from "@/types/money";

const nodeStyles: Record<MoneyNodeType, { pill: string; icon: React.ElementType }> = {
  income: { pill: "bg-[#e8f6dd] text-[#2d7f36]", icon: ArrowDown },
  expense: { pill: "bg-[#f9dde2] text-[#d9344f]", icon: ArrowUp },
  savings: { pill: "bg-[#fff1d7] text-[#a16325]", icon: PiggyBank },
  goal: { pill: "bg-[#fff1d7] text-[#a16325]", icon: Goal },
  bucket: { pill: "bg-[#f7e6e2] text-[#8b625a]", icon: PiggyBank }
};

function NodeBadge({ type, title }: { type: MoneyNodeType; title: string }) {
  const Icon = nodeStyles[type].icon;

  return (
    <div className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[14px] ${nodeStyles[type].pill}`}>
      {type === "savings" && (
        <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-white/70">
          <Image src="/icons/savings-piggy.webp" alt="" width={20} height={20} className="size-5 object-cover" aria-hidden="true" />
        </span>
      )}
      {type !== "bucket" && (
        type !== "savings" && (
          <span className="grid size-5 place-items-center rounded-full bg-current text-white">
            <Icon className="size-3.5 text-white" strokeWidth={2.4} />
          </span>
        )
      )}
      <span className="font-serif italic leading-none">{title}</span>
    </div>
  );
}

function MoneyRow({ item, calendarSystem }: { item: MoneyItem; calendarSystem: "shamsi" | "gregorian" }) {
  const primary = formatPrimaryAmount(item.amount);
  const title = item.title ? ` :: ${item.title}` : "";

  return (
    <li className="grid grid-cols-[1fr_auto] gap-7">
      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold leading-[1.15] tracking-[-0.01em] text-[#2f333b]">
          {primary}
          {title}
        </div>
        <div className="mt-1 text-[13px] italic leading-none text-[#868b9b]">{formatConvertedAmount(item.amount)}</div>
      </div>
      <div className="pt-1 text-[11px] leading-none text-[#868b9b]">{formatDateLabel(item.date, calendarSystem)}</div>
    </li>
  );
}

function NodeHandle({ position }: { position: Position }) {
  return (
    <>
      <Handle
        type="source"
        position={position}
        className="node-handle opacity-0 transition-opacity duration-160"
        style={{
          width: 10,
          height: 10,
          borderRadius: "999px",
          background: "#fffaf2",
          border: "1px solid rgba(60, 55, 45, 0.18)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      />
      <Handle
        type="target"
        position={position}
        className="node-handle opacity-0 transition-opacity duration-160"
        style={{
          width: 10,
          height: 10,
          borderRadius: "999px",
          background: "#fffaf2",
          border: "1px solid rgba(60, 55, 45, 0.18)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      />
    </>
  );
}

export function MoneyNode(props: NodeProps<MoneyFlowNode>) {
  const { data, id } = props;
  const [isHovering, setIsHovering] = useState(false);
  const items = useMoneyMapStore((state) => state.items);
  const calendarSystem = useMoneyMapStore((state) => state.calendarSystem);
  const selectedMonth = useMoneyMapStore((state) => state.selectedMonth);
  const focusedNodeId = useMoneyMapStore((state) => state.focusedNodeId);
  const nodeItems = data.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is MoneyItem => Boolean(item))
    .filter((item) => isItemInMonth(item, selectedMonth));
  const isFocused = focusedNodeId === id;

  return (
    <article
      className={`money-node group w-[330px] rounded-[28px] bg-white/95 px-5 pb-6 pt-5 shadow-soft backdrop-blur transition ${
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
      <NodeHandle position={Position.Top} />
      <NodeHandle position={Position.Right} />
      <NodeHandle position={Position.Bottom} />
      <NodeHandle position={Position.Left} />

      <div className="mb-6 flex items-center justify-between">
        <NodeBadge type={data.type} title={data.title} />
        {data.type !== "bucket" && (
          <button
            className="grid size-8 place-items-center rounded-full bg-[#f7f6f3] text-[#9a9da9] transition hover:bg-[#efeee9] active:scale-95"
            aria-label={`Add ${data.title}`}
          >
            <Plus className="size-5" strokeWidth={2.2} />
          </button>
        )}
      </div>
      <ul className="space-y-4">
        {nodeItems.length > 0 ? (
          nodeItems.map((item) => (
            <MoneyRow key={item.id} item={item} calendarSystem={calendarSystem} />
          ))
        ) : (
          <li className="rounded-[18px] bg-[#fbfaf7] px-4 py-3 text-[14px] font-medium text-[#9a958d]">No items this month</li>
        )}
      </ul>
    </article>
  );
}
