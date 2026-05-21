"use client";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedSetting<T extends string>({
  value,
  options,
  onChange,
  ariaLabel
}: {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="grid h-11 grid-flow-col auto-cols-fr rounded-full bg-[#eee9df] p-1" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={`rounded-full px-3 text-[14px] font-semibold transition ${
            option.value === value ? "bg-white text-[#30333b] shadow-[0_9px_18px_rgba(91,82,65,0.13)]" : "text-[#858175] hover:text-[#55504a]"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
