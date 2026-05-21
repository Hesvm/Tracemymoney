"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Goal, PiggyBank, WalletCards } from "lucide-react";
import Image from "next/image";
import type { MoneyNodeType } from "@/types/money";

const menuItems: Array<{ type: MoneyNodeType; label: string; icon: React.ElementType; iconClass: string }> = [
  { type: "income", label: "Income", icon: ArrowDown, iconClass: "bg-[#47b83f] text-white" },
  { type: "expense", label: "Expense", icon: ArrowUp, iconClass: "bg-[#df314f] text-white" },
  { type: "savings", label: "Savings", icon: PiggyBank, iconClass: "text-[#d78b44]" },
  { type: "goal", label: "Goals", icon: Goal, iconClass: "text-[#d78b44]" },
  { type: "bucket", label: "Bucket", icon: WalletCards, iconClass: "text-[#d78b44]" }
];

export function AddTypeMenu({
  open,
  onClose,
  onSelect,
  menuPos
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (type: MoneyNodeType) => void;
  menuPos: { bottom: number; left: number } | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <button className="fixed inset-0 z-20 cursor-default" aria-label="Close add menu" type="button" onClick={onClose} />
          <motion.div
            className="fixed z-30 w-[255px] rounded-[24px] bg-white px-5 py-4 shadow-soft"
            style={menuPos ?? undefined}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    className="flex h-11 w-full items-center gap-2.5 rounded-full px-2 text-left text-[18px] font-semibold tracking-[-0.02em] text-[#2f333b] transition hover:bg-[#fbfaf7] active:scale-[0.99]"
                    onClick={() => onSelect(item.type)}
                  >
                    <span className={`grid size-6 place-items-center overflow-hidden rounded-full ${item.iconClass}`}>
                      {item.type === "savings" ? (
                        <Image src="/icons/savings-piggy.webp" alt="" width={24} height={24} className="size-6 object-cover" aria-hidden="true" />
                      ) : (
                        <Icon className="size-4" strokeWidth={2.5} />
                      )}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
