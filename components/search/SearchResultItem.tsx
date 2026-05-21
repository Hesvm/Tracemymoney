"use client";

import { CornerDownLeft } from "lucide-react";
import type { SearchResult } from "@/lib/search";

export function SearchResultItem({
  result,
  active,
  onSelect
}: {
  result: SearchResult;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-3 rounded-[18px] px-3.5 py-3 text-left transition ${
        active ? "bg-[#f1ede5] text-[#30333b]" : "text-[#4a4e58] hover:bg-[#f7f5ef]"
      }`}
      onClick={onSelect}
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold">{result.label}</span>
        {result.detail && <span className="mt-0.5 block truncate text-[12px] font-medium text-[#918c82]">{result.detail}</span>}
      </span>
      {active && <CornerDownLeft className="size-4 shrink-0 text-[#9a9284]" strokeWidth={2.1} />}
    </button>
  );
}
