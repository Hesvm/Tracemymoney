"use client";

import { ArrowDown, ArrowUp, Goal, PiggyBank, Plus } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatConvertedAmount, formatPrimaryAmount } from "@/lib/formatters";
import { formatShortDate, isItemInMonth } from "@/lib/months";
import { getGoalImage } from "@/lib/analytics";
import { useAnimatedRate } from "@/hooks/useAnimatedRate";
import { useLongPress } from "@/hooks/useLongPress";
import { useMobile } from "@/hooks/useMobile";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import { EmptyNodeAction } from "@/components/canvas/EmptyNodeAction";
import { NodeTotalChip } from "@/components/canvas/NodeTotalChip";
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import { calculateBucketPercentages } from "@/lib/calculateBucketPercentages";
import type { MoneyFlowNode, MoneyItem, MoneyNodeType } from "@/types/money";

const nodeStyles: Record<MoneyNodeType, { pill: string; iconBg: string; icon: React.ElementType }> = {
  income: { pill: "bg-[#e8f6dd] text-[#2d7f36]", iconBg: "bg-[#2d7f36]", icon: ArrowDown },
  expense: { pill: "bg-[#f9dde2] text-[#d9344f]", iconBg: "bg-[#d9344f]", icon: ArrowUp },
  savings: { pill: "bg-[#fff1d7] text-[#a16325]", iconBg: "bg-[#a16325]", icon: PiggyBank },
  goal: { pill: "bg-[#fff1d7] text-[#a16325]", iconBg: "bg-[#a16325]", icon: Goal },
  bucket: { pill: "bg-[#f7e6e2] text-[#8b625a]", iconBg: "bg-[#8b625a]", icon: PiggyBank }
};

const recurrenceLabel: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly"
};

function NodeBadge({ type, title }: { type: MoneyNodeType; title: string }) {
  const Icon = nodeStyles[type].icon;

  return (
    <div className={`inline-flex h-6 md:h-8 items-center gap-1 md:gap-1.5 rounded-full px-2 md:px-2.5 text-[11px] md:text-[14px] ${nodeStyles[type].pill}`}>
      {type === "savings" && (
        <span className="grid size-4 md:size-5 place-items-center overflow-hidden rounded-full bg-white/70">
          <Image src="/icons/savings-piggy.webp" alt="" width={20} height={20} className="size-4 md:size-5 object-cover" aria-hidden="true" />
        </span>
      )}
      {type !== "bucket" && type !== "savings" && (
        <span className={`grid size-4 md:size-5 place-items-center rounded-full ${nodeStyles[type].iconBg}`}>
          <Icon className="size-3 md:size-3.5 text-white" strokeWidth={2.4} />
        </span>
      )}
      <span className="font-serif italic leading-none">{title}</span>
    </div>
  );
}

function MoneyRow({
  item,
  nodeId,
  calendarSystem,
  animatedRate,
  rateTick,
  bucketPct,
}: {
  item: MoneyItem;
  nodeId: string;
  calendarSystem: "shamsi" | "gregorian";
  animatedRate: number | null;
  rateTick: number;
  bucketPct?: number;
}) {
  const primary = formatPrimaryAmount(item.amount);
  const title = item.title ? ` :: ${item.title}` : "";
  const openContextMenu = useMoneyMapStore((state) => state.openContextMenu);
  const isRecurring = item.recurrence && item.recurrence !== "none";
  const isMobile = useMobile();
  const itemLongPress = useLongPress(
    (x, y) => openContextMenu(x, y, { type: "item", nodeId, itemId: item.id }),
    { delay: 420, stopPropagation: true }
  );

  return (
    <motion.li
      className="nodrag grid grid-cols-[1fr_auto] gap-3 md:gap-7 rounded-[10px] md:rounded-[14px] px-1.5 py-1 -mx-1.5 md:px-2 md:py-1.5 md:-mx-2 transition hover:bg-[#fbfaf7]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
      {...(isMobile ? itemLongPress : {})}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openContextMenu(event.clientX, event.clientY, { type: "item", nodeId, itemId: item.id });
      }}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] md:text-[17px] font-semibold leading-[1.15] tracking-[-0.01em] text-[#2f333b]">
          {primary}
          {title}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={rateTick}
            className="mt-1 text-[11px] md:text-[13px] italic leading-none text-[#868b9b]"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatConvertedAmount(item.amount, animatedRate)}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="pt-1 text-right text-[10px] md:text-[11px] leading-none text-[#868b9b]">
        {isRecurring ? (
          <>
            <div>{formatShortDate(item.date, calendarSystem)}</div>
            <div className="mt-0.5 italic opacity-70">↻ {recurrenceLabel[item.recurrence!]}</div>
          </>
        ) : (
          formatShortDate(item.date, calendarSystem)
        )}
        {bucketPct !== undefined && bucketPct > 0 && (
          <div className="mt-0.5 tabular-nums" style={{ opacity: 0.55 }}>
            {bucketPct < 1 ? "<1%" : `${Math.round(bucketPct)}%`}
          </div>
        )}
      </div>
    </motion.li>
  );
}

function GoalRow({ item, nodeId, bucketPct }: { item: MoneyItem; nodeId: string; bucketPct?: number }) {
  const openContextMenu = useMoneyMapStore((state) => state.openContextMenu);
  const isMobile = useMobile();
  const itemLongPress = useLongPress(
    (x, y) => openContextMenu(x, y, { type: "item", nodeId, itemId: item.id }),
    { delay: 420, stopPropagation: true }
  );
  const category = item.category ?? "other";
  const targetAmt = item.targetAmount ?? item.amount;
  const savedAmt = item.amount;

  const target = targetAmt?.amount ?? 0;
  const saved = savedAmt && item.targetAmount ? Math.min(target, savedAmt.amount) : 0;
  const progress = target > 0 && saved > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  const circumference = 2 * Math.PI * 22;
  const dash = (progress / 100) * circumference;

  return (
    <li
      className="nodrag"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(e.clientX, e.clientY, { type: "item", nodeId, itemId: item.id });
      }}
      {...(isMobile ? itemLongPress : {})}
    >
      <article className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-[24px] bg-[#fbfaf7] p-3.5">
        <div className="grid size-14 place-items-center overflow-hidden rounded-[20px] bg-white shadow-[0_10px_24px_rgba(76,74,68,0.08)]">
          <Image src={getGoalImage(category)} alt="" width={48} height={48} className="size-12 object-contain" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold leading-none tracking-[-0.02em] text-[#2f333b]">{item.title || "Goal"}</div>
          <div className="mt-2 text-[13px] font-medium text-[#8d919e]">
            {formatPrimaryAmount(targetAmt)}
          </div>
          {bucketPct !== undefined && bucketPct > 0 && (
            <div className="mt-0.5 text-[10px] tabular-nums text-[#868b9b]" style={{ opacity: 0.55 }}>
              {bucketPct < 1 ? "<1%" : `${Math.round(bucketPct)}%`}
            </div>
          )}
        </div>

        <div className="relative grid size-14 place-items-center">
          <svg className="absolute inset-0 size-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#eee7da" strokeWidth="7" />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#d6a45c"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <span className="text-[13px] font-bold text-[#2f333b]">{progress}%</span>
        </div>
      </article>
    </li>
  );
}

const positionKey: Record<Position, string> = {
  [Position.Top]: "top",
  [Position.Right]: "right",
  [Position.Bottom]: "bottom",
  [Position.Left]: "left",
};

const handleStyle = {
  width: 14,
  height: 14,
  borderRadius: "999px",
  background: "#fffaf2",
  border: "1px solid rgba(60, 55, 45, 0.18)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

function NodeHandle({ position }: { position: Position }) {
  const side = positionKey[position];
  return (
    <>
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
    </>
  );
}

export function MoneyNode(props: NodeProps<MoneyFlowNode>) {
  const { data, id, selected } = props;
  const [isHovering, setIsHovering] = useState(false);
  const items = useMoneyMapStore((state) => state.items);
  const calendarSystem = useMoneyMapStore((state) => state.calendarSystem);
  const selectedMonth = useMoneyMapStore((state) => state.selectedMonth);
  const focusedNodeId = useMoneyMapStore((state) => state.focusedNodeId);
  const setPendingAddNode = useMoneyMapStore((state) => state.setPendingAddNode);
  const liveRate = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
  const defaultCurrency = useMoneyMapStore((state) => state.settings.defaultCurrency);
  const usdToToman = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
  const secondaryCurrency = defaultCurrency === "TOMAN" ? "USD" : "TOMAN" as const;

  const primaryTotal = useMemo(
    () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
    [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
  );
  const secondaryTotal = useMemo(
    () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman),
    [data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman]
  );

  const bucketPercentages = useMemo(
    () => calculateBucketPercentages(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
    [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
  );

  const { displayed: animatedRate, ticked: rateTick } = useAnimatedRate(liveRate);
  const isMobile = useMobile();
  const openContextMenu = useMoneyMapStore((state) => state.openContextMenu);
  const nodeLongPress = useLongPress(
    (x, y) => openContextMenu(x, y, { type: "node", nodeId: id }),
    { delay: 420 }
  );

  const nodeItems = data.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is MoneyItem => Boolean(item))
    .filter((item) => isItemInMonth(item, selectedMonth));
  const isFocused = focusedNodeId === id;

  return (
    <article
      className={`money-node group w-[200px] md:w-[430px] rounded-[20px] md:rounded-[28px] bg-white/95 px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-5 shadow-soft backdrop-blur transition ${
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
        @media (max-width: 768px) {
          .node-handle {
            width: 20px !important;
            height: 20px !important;
          }
        }
      `}</style>
      <NodeHandle position={Position.Top} />
      <NodeHandle position={Position.Right} />
      <NodeHandle position={Position.Bottom} />
      <NodeHandle position={Position.Left} />

      <div
        className="mb-3 md:mb-6 flex items-center justify-between gap-2"
        {...(isMobile ? nodeLongPress : {})}
      >
        <NodeBadge type={data.type} title={data.title} />
        <div className="flex items-center gap-1.5 shrink-0">
          <NodeTotalChip
            total={primaryTotal}
            currency={defaultCurrency}
            nodeType={data.type}
            secondaryTotal={secondaryTotal}
            secondaryCurrency={secondaryCurrency}
          />
          <button
            className="nodrag grid size-7 md:size-8 place-items-center rounded-full bg-[#f7f6f3] text-[#9a9da9] transition hover:bg-[#efeee9] active:scale-95"
            aria-label={`Add to ${data.title}`}
            onClick={() => setPendingAddNode(id)}
          >
            <Plus className="size-4 md:size-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {data.collapsed ? (
          <li className="rounded-[14px] md:rounded-[18px] bg-[#fbfaf7] px-3 py-2 md:px-4 md:py-3 text-[12px] md:text-[14px] font-medium text-[#9a958d]">
            {nodeItems.length} item{nodeItems.length === 1 ? "" : "s"} hidden
          </li>
        ) : (
          <AnimatePresence initial={false} mode="sync">
            {data.itemIds.length === 0 ? (
              <EmptyNodeAction key="empty" type={data.type} onClick={() => setPendingAddNode(id)} />
            ) : nodeItems.length > 0 ? (
              nodeItems.map((item) =>
                data.type === "goal" ? (
                  <GoalRow key={item.id} item={item} nodeId={id} bucketPct={bucketPercentages[item.id]} />
                ) : (
                  <MoneyRow
                    key={item.id}
                    item={item}
                    nodeId={id}
                    calendarSystem={calendarSystem}
                    animatedRate={animatedRate}
                    rateTick={rateTick}
                    bucketPct={bucketPercentages[item.id]}
                  />
                )
              )
            ) : (
              <motion.li
                key="no-items"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-[14px] md:rounded-[18px] bg-[#fbfaf7] px-3 py-2 md:px-4 md:py-3 text-[12px] md:text-[14px] font-medium text-[#9a958d]"
              >
                No items this month
              </motion.li>
            )}
          </AnimatePresence>
        )}
      </ul>
    </article>
  );
}
