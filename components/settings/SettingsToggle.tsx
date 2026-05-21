"use client";

import { SettingsRow } from "@/components/settings/SettingsRow";

export function SettingsToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingsRow label={label}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#30333b]" : "bg-[#d9d5cc]"}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-1 grid size-5 place-items-center rounded-full bg-white shadow-[0_4px_10px_rgba(47,51,59,0.18)] transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </SettingsRow>
  );
}
