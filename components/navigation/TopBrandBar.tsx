"use client";

import Image from "next/image";

export function TopBrandBar() {
  return (
    <div className="fixed left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-2 shadow-dock">
      <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={22} height={22} className="size-[22px]" aria-hidden="true" />
      </span>
      <span className="text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
    </div>
  );
}
