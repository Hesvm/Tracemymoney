"use client";

export function SettingsRow({
  label,
  detail,
  children,
  compact = false
}: {
  label: string;
  detail?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[20px] bg-[#f7f5ef] ${compact ? "px-3 py-2.5" : "px-3.5 py-3"}`}>
      <div className="min-w-0">
        <div className="text-[15px] font-medium leading-5 text-[#343840]">{label}</div>
        {detail && <div className="mt-0.5 text-[12px] leading-4 text-[#8e8b83]">{detail}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
