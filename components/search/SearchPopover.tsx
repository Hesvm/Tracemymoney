"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { SearchResultItem } from "@/components/search/SearchResultItem";
import { searchMoneyMap } from "@/lib/search";
import { useMoneyMapStore } from "@/store/moneyMapStore";

export function SearchPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodes = useMoneyMapStore((state) => state.nodes);
  const items = useMoneyMapStore((state) => state.items);
  const focusNode = useMoneyMapStore((state) => state.focusNode);
  const results = useMemo(() => searchMoneyMap({ query, nodes, items }), [items, nodes, query]);
  const activeResult = results[Math.min(activeIndex, Math.max(results.length - 1, 0))];

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter" && activeResult) {
        event.preventDefault();
        focusNode(activeResult.nodeId);
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeResult, focusNode, onClose, open, results.length]);

  function selectNode(nodeId: string) {
    focusNode(nodeId);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-center bg-[#2f333b]/12 sm:px-4 sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
            className="w-full sm:w-[420px] sm:max-w-[calc(100vw-32px)] overflow-hidden rounded-t-[30px] sm:rounded-[30px] bg-white p-4 shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="search-title" className="text-[24px] font-semibold leading-none text-[#30333b]">
                Search
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-white text-[#8e92a0] shadow-[inset_0_0_0_1px_#ece8df] transition hover:bg-[#f4f1eb] hover:text-[#626677] active:scale-95"
                aria-label="Close search"
              >
                <X className="size-5" strokeWidth={2.1} />
              </button>
            </div>

            <label className="flex h-12 items-center gap-2.5 rounded-full bg-white px-4 shadow-[inset_0_0_0_1px_#ece8df]">
              <Search className="size-4 text-[#9a958d]" strokeWidth={2.2} />
              <input
                ref={inputRef}
                className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-[#30333b] outline-none placeholder:text-[#aaa59c]"
                placeholder="Search money map..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
              />
            </label>

            <div className="mt-4">
              <div className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#928b80]">Results</div>
              <div className="max-h-[310px] overflow-y-auto">
                {results.length > 0 ? (
                  <div className="grid gap-1">
                    {results.map((result, index) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        active={index === activeIndex}
                        onSelect={() => selectNode(result.nodeId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] bg-[#f7f5ef] px-4 py-5 text-center text-[14px] font-medium text-[#9a958d]">
                    {query ? "No results" : "Type to search nodes, transactions, notes, and amounts"}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
