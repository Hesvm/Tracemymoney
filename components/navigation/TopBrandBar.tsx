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
      className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:gap-3 rounded-full bg-white px-3 py-1.5 md:px-4 md:py-2 shadow-dock max-w-[calc(100vw-32px)]"
      style={{ top: "max(12px, calc(8px + env(safe-area-inset-top, 0px)))" }}
    >
      <span className="grid size-6 md:size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={18} height={18} className="size-[18px] md:size-[22px]" aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap text-[14px] md:text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>

      {/* Settings + Search — visible on mobile only, hidden on sm+ (they stay in the bottom nav there) */}
      <span className="sm:hidden ml-1 flex items-center gap-1">
        <span className="h-4 w-px bg-[#e8e7e3]" aria-hidden="true" />
        <button
          type="button"
          onClick={onSettingsClick}
          className="grid size-8 place-items-center rounded-full text-[#989ba8] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
          aria-label="Settings"
        >
          <Settings className="size-[17px]" strokeWidth={2.1} />
        </button>
        <button
          type="button"
          onClick={onSearchClick}
          className="grid size-8 place-items-center rounded-full text-[#989ba8] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
          aria-label="Search"
        >
          <Search className="size-[17px]" strokeWidth={2.1} />
        </button>
      </span>
    </div>
  );
}
