"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { MoneyNodeType } from "@/types/money";

const placeholderLabel: Partial<Record<MoneyNodeType, string>> = {
  income: "Add first income",
  expense: "Add first expense",
  savings: "Add first savings",
  goal: "Add first goal",
  bucket: "Add first entry",
};

export function EmptyNodeAction({
  type,
  onClick,
}: {
  type: MoneyNodeType;
  onClick: () => void;
}) {
  const label = placeholderLabel[type] ?? "Add entry";

  return (
    <motion.li
      className="nodrag"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <button
        onClick={onClick}
        className="group/empty w-full rounded-[14px] border border-dashed border-[#d5d0c8] px-3 py-2.5 text-left transition hover:border-[#b8b2a8] hover:bg-[#fbfaf7] active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-[#c8c2b8] text-[#c8c2b8] transition group-hover/empty:border-[#9a958d] group-hover/empty:text-[#9a958d]">
            <Plus className="size-3" strokeWidth={2.5} />
          </span>
          <span className="text-[14px] font-medium text-[#bab5ad] transition group-hover/empty:text-[#9a958d]">
            {label}
          </span>
        </div>
      </button>
    </motion.li>
  );
}
