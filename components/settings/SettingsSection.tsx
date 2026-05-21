"use client";

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-[#ece8df] px-5 py-4 first:border-t-0">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8b867b]">{title}</h3>
      <div className="grid gap-2.5">{children}</div>
    </section>
  );
}
