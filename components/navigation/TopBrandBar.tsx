"use client";

import Image from "next/image";
import { Search, Settings } from "lucide-react";

export function TopBrandBar({
  onSettingsClick,
  onSearchClick,
}: {
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
}) {
  return (
    <div
      className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 max-w-[calc(100vw-32px)]"
      style={{ top: "max(12px, calc(8px + env(safe-area-inset-top, 0px)))" }}
    >
      {/* Settings — left of brand pill */}
      <button
        type="button"
        onClick={onSettingsClick}
        className="grid size-11 md:size-12 place-items-center rounded-full bg-white text-[#989ba8] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
        aria-label="Settings"
      >
        <Settings className="size-5" strokeWidth={2.1} />
      </button>

      {/* Brand pill */}
      <div className="flex items-center gap-2 md:gap-3 rounded-full bg-white px-3 md:px-4 md:py-2 shadow-dock h-11 md:h-12">
        <span className="grid size-6 md:size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
          <Image src="/logo.svg" alt="" width={20} height={20} className="size-5 md:size-[22px]" aria-hidden="true" />
        </span>
        <span className="whitespace-nowrap text-[15px] md:text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
      </div>

      {/* Search — right of brand pill */}
      <button
        type="button"
        onClick={onSearchClick}
        className="grid size-11 md:size-12 place-items-center rounded-full bg-white text-[#989ba8] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
        aria-label="Search"
      >
        <Search className="size-5" strokeWidth={2.1} />
      </button>
    </div>
  );
}
