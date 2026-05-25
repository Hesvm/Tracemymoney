"use client";

import Image from "next/image";

export function TopBrandBar() {
  return (
    <div
      className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:gap-3 rounded-full bg-white px-3 py-1.5 md:px-4 md:py-2 shadow-dock max-w-[calc(100vw-32px)]"
      style={{ top: "max(12px, calc(8px + env(safe-area-inset-top, 0px)))" }}
    >
      <span className="grid size-6 md:size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={18} height={18} className="size-[18px] md:size-[22px]" aria-hidden="true" />
      </span>
      <span className="text-[14px] md:text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
    </div>
  );
}
