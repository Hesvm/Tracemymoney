"use client";

export function ContextMenuItem({
  children,
  tone = "default",
  onSelect
}: {
  children: React.ReactNode;
  tone?: "default" | "danger";
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 w-full items-center rounded-full px-3.5 text-left text-[14px] font-medium transition ${
        tone === "danger" ? "text-[#d9344f] hover:bg-[#f9dde2]/70" : "text-[#3b3f47] hover:bg-[#f4efe6]"
      }`}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
