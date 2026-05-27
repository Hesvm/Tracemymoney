"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { todayIsoDate } from "@/lib/calendar";
import { getAmountSuggestions, saveAmountSuggestion } from "@/lib/suggestions";
import { formatPrimaryAmount } from "@/lib/formatters";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import type { Currency, GoalCategory, MoneyNodeType, RecurrenceType } from "@/types/money";
import { AmountInput, CurrencySegmentedToggle, GoalCategoryChips, recurrenceOptions, StyledDatePicker, StyledDropdown } from "./FormControls";
import { getHistoricalRate } from "@/lib/exchangeRates/getHistoricalRate";
import { calculatePercentageAmount, type PercentageResult } from "@/lib/percentageAmount";

const labels: Record<MoneyNodeType, { title: string; submit: string; subject: string; amount: string }> = {
  income: { title: "Add Income", submit: "Add Income", subject: "Source", amount: "Amount" },
  expense: { title: "Add Expense", submit: "Add Expense", subject: "Expense name", amount: "Amount" },
  savings: { title: "Add Savings", submit: "Add Savings", subject: "Savings target", amount: "Amount" },
  goal: { title: "Add Goal", submit: "Add Goal", subject: "Goal name", amount: "Target amount" },
  bucket: { title: "Add Bucket", submit: "Add Bucket", subject: "Bucket name", amount: "Amount" }
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 text-sm font-medium text-[#686d7a]">
      <span>{label}</span>
      {children}
    </div>
  );
}

const inputClass =
  "h-12 rounded-full bg-[#fbfaf7] px-4 text-[16px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";

function submitButtonClass(type: MoneyNodeType) {
  if (type === "income") {
    return "bg-[#e8f6dd] text-[#2d7f36] shadow-[0_12px_24px_rgba(69,160,71,0.14)] hover:bg-[#ddf1ce]";
  }
  if (type === "expense") {
    return "bg-[#f9dde2] text-[#d9344f] shadow-[0_12px_24px_rgba(217,52,79,0.12)] hover:bg-[#f6d1d8]";
  }
  return "bg-[#2f333b] text-white shadow-[0_12px_24px_rgba(47,51,59,0.14)] hover:bg-[#272b32]";
}

function SuggestionChips({
  title,
  currency,
  onSelect
}: {
  title: string;
  currency: Currency;
  onSelect: (amount: number) => void;
}) {
  const suggestions = useMemo(() => getAmountSuggestions(title), [title]);
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((amt) => (
        <button
          key={amt}
          type="button"
          className="rounded-full bg-[#f4f2ec] px-3 py-1 text-[13px] font-medium text-[#686d7a] transition hover:bg-[#ece9e1] active:scale-95"
          onClick={() => onSelect(amt)}
        >
          {formatPrimaryAmount({ amount: amt, currency })}
        </button>
      ))}
    </div>
  );
}

export function QuickAddModal({
  type,
  editItemId,
  open,
  onClose
}: {
  type: MoneyNodeType | null;
  editItemId?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const addItemFromForm = useMoneyMapStore((state) => state.addItemFromForm);
  const updateItemFromForm = useMoneyMapStore((state) => state.updateItemFromForm);
  const items = useMoneyMapStore((state) => state.items);
  const nodes = useMoneyMapStore((state) => state.nodes);
  const calendarSystem = useMoneyMapStore((state) => state.calendarSystem);
  const defaultCurrency = useMoneyMapStore((state) => state.settings.defaultCurrency);
  const editItem = editItemId ? items.find((item) => item.id === editItemId) : null;
  const activeType = editItem?.type ?? type;
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => todayIsoDate());
  const [parentNodeId, setParentNodeId] = useState("");
  const [goalCategory, setGoalCategory] = useState<GoalCategory>("phone");
  const [titleValue, setTitleValue] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const liveRate = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
  const [resolvedRate, setResolvedRate] = useState<number | null>(null);
  const [resolvedRateSource, setResolvedRateSource] = useState<"historical_cache" | "current_api" | "manual">("current_api");
  const [resolvedRateHint, setResolvedRateHint] = useState<"exact" | "nearest_previous" | null>(null);
  const [manualRate, setManualRate] = useState<string>("");
  const [isRateManual, setIsRateManual] = useState(false);
  const [inputMode, setInputMode] = useState<"fixed" | "percentage">("fixed");
  const copy = activeType ? labels[activeType] : labels.income;

  const parentOptions = useMemo(
    () => [{ value: "", label: "No parent" }, ...nodes.map((node) => ({ value: node.id, label: node.data.title }))],
    [nodes]
  );

  const pctPreview = useMemo((): PercentageResult | null => {
    if (inputMode !== "percentage" || !activeType || activeType === "bucket" || activeType === "income") return null;
    if (!amount) return null;
    return calculatePercentageAmount(amount, date.slice(0, 7), currency, nodes, items, liveRate);
  }, [inputMode, amount, date, currency, nodes, items, liveRate, activeType]);

  function resetForm() {
    setCurrency(defaultCurrency);
    setRecurrence("none");
    setAmount(0);
    setInputMode("fixed");
    setDate(todayIsoDate());
    setParentNodeId("");
    setGoalCategory("phone");
    setTitleValue("");
    setResetKey((current) => current + 1);
    setResolvedRate(null);
    setResolvedRateHint(null);
    setManualRate("");
    setIsRateManual(false);
    setResolvedRateSource("current_api");
  }

  useEffect(() => {
    if (!open) return;
    if (!editItem) {
      setCurrency(defaultCurrency);
      setTitleValue("");
      return;
    }

    const amountValue = editItem.type === "goal" ? editItem.targetAmount : editItem.amount;
    setCurrency(amountValue?.currency ?? defaultCurrency);
    setAmount(amountValue?.amount ?? 0);
    setDate(editItem.date ?? todayIsoDate());
    setRecurrence(editItem.recurrence ?? "none");
    setParentNodeId(editItem.parentId ?? "");
    setGoalCategory(editItem.category ?? "phone");
    setTitleValue(editItem.title ?? "");
    setResetKey((current) => current + 1);
    if (editItem.amount?.exchangeRateAtEntry) {
      setManualRate(String(editItem.amount.exchangeRateAtEntry));
      setResolvedRate(editItem.amount.exchangeRateAtEntry);
      setResolvedRateSource(editItem.amount.rateSource ?? "current_api");
      setIsRateManual(editItem.amount.rateSource === "manual");
    }
  }, [defaultCurrency, editItem, open]);

  useEffect(() => {
    if (currency !== "USD" || activeType === "bucket" || activeType === "goal") {
      setResolvedRate(null);
      setResolvedRateHint(null);
      setManualRate("");
      setIsRateManual(false);
      return;
    }

    let cancelled = false;
    getHistoricalRate(date).then((result) => {
      if (cancelled) return;
      if (result) {
        setResolvedRate(result.rate);
        setResolvedRateSource(result.source);
        setResolvedRateHint(result.hint);
        setManualRate(String(result.rate));
      } else {
        setResolvedRate(liveRate);
        setResolvedRateSource("current_api");
        setResolvedRateHint(null);
        setManualRate(liveRate ? String(liveRate) : "");
      }
      setIsRateManual(false);
    });

    return () => { cancelled = true; };
  }, [date, currency, activeType, liveRate]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeType) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();

    const isPercentageMode =
      inputMode === "percentage" &&
      activeType !== "bucket" &&
      activeType !== "income" &&
      pctPreview !== null &&
      pctPreview.baseSnapshot > 0;

    if (title && amount && activeType !== "bucket" && inputMode === "fixed") {
      saveAmountSuggestion(title, amount);
    }

    const parsedManualRate = parseFloat(manualRate.replace(/,/g, ""));
    const effectiveRate = isRateManual && Number.isFinite(parsedManualRate) && parsedManualRate > 0
      ? parsedManualRate
      : resolvedRate ?? undefined;
    const effectiveRateSource = isRateManual ? "manual" : resolvedRateSource;

    const resolvedAmount = isPercentageMode ? pctPreview!.amount : amount;

    const payload = {
      type: activeType,
      title,
      amount: activeType === "bucket" ? undefined : (activeType === "goal" ? undefined : resolvedAmount),
      targetAmount: activeType === "goal" ? resolvedAmount : undefined,
      currency,
      date,
      note: String(form.get("note") ?? ""),
      recurrence: activeType === "goal" ? "none" : recurrence,
      parentNodeId: parentNodeId || undefined,
      category: activeType === "goal" ? goalCategory : undefined,
      rateOverride: effectiveRate,
      rateSource: effectiveRateSource,
      inputMode: isPercentageMode ? ("percentage" as const) : undefined,
      percentageValue: isPercentageMode ? amount : undefined,
      baseAmountSnapshot: isPercentageMode ? pctPreview!.baseSnapshot : undefined,
    };

    if (editItemId) {
      updateItemFromForm(editItemId, payload);
    } else {
      addItemFromForm(payload);
    }

    event.currentTarget.reset();
    resetForm();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && activeType && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#2f333b]/14 px-3 sm:px-5 backdrop-blur-[2px]"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.form
            className="flex w-full sm:max-w-[430px] flex-col rounded-[32px] bg-white shadow-soft"
            style={{ maxHeight: "calc(100dvh - 24px)" }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onSubmit={submit}
          >
            {/* pinned header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.04em] text-[#2f333b]">
                {editItemId ? copy.title.replace("Add", "Edit") : copy.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-[#f7f6f3] text-[#8e92a0] transition hover:bg-[#efeee9] active:scale-95"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* scrollable fields */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid gap-4 pb-2 px-4 sm:px-6">
                <Field label={copy.subject}>
                  <input
                    className={inputClass}
                    name="title"
                    placeholder={activeType === "income" ? "Salary" : copy.subject}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    dir="auto"
                    required
                  />
                </Field>

                {activeType !== "bucket" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_176px] gap-3">
                      <Field label={copy.amount}>
                        <AmountInput
                          currency={currency}
                          value={amount}
                          onValueChange={setAmount}
                          resetKey={resetKey}
                          mode={activeType === "income" ? "fixed" : inputMode}
                          onModeChange={activeType !== "income" ? (newMode) => {
                            setInputMode(newMode);
                            setAmount(0);
                            setResetKey((k) => k + 1);
                          } : undefined}
                        />
                      </Field>
                      <Field label="Currency">
                        <CurrencySegmentedToggle value={currency} onChange={setCurrency} />
                      </Field>
                    </div>
                    {inputMode === "fixed" && (
                      <SuggestionChips
                        title={titleValue}
                        currency={currency}
                        onSelect={(v) => {
                          setAmount(v);
                          setResetKey((k) => k + 1);
                        }}
                      />
                    )}
                    {inputMode === "percentage" && activeType !== "income" && (
                      <p className="px-1 text-[12px] leading-none">
                        {pctPreview && pctPreview.baseSnapshot > 0 ? (
                          <span className="text-[#a8a39a]">
                            {amount}% of {formatPrimaryAmount({ amount: pctPreview.baseSnapshot, currency })}{" "}
                            <span className="font-semibold text-[#2d7f36]">= {formatPrimaryAmount({ amount: pctPreview.amount, currency })}</span>
                          </span>
                        ) : (
                          <span className="text-[#a16325]">No income recorded for this month</span>
                        )}
                      </p>
                    )}
                  </>
                )}

                {activeType === "bucket" && (
                  <Field label="Parent">
                    <StyledDropdown value={parentNodeId} options={parentOptions} onChange={setParentNodeId} label="Parent" />
                  </Field>
                )}

                {activeType !== "bucket" && activeType !== "goal" && currency === "USD" && (
                  <Field label="USD rate for this date">
                    <div className="grid gap-1.5">
                      <input
                        className={inputClass}
                        type="text"
                        inputMode="numeric"
                        value={manualRate}
                        onChange={(e) => {
                          setManualRate(e.target.value);
                          setIsRateManual(true);
                        }}
                        placeholder="e.g. 82000"
                      />
                      <span className="px-1 text-[12px] text-[#b1b1b8]">
                        {isRateManual
                          ? "Using your custom rate"
                          : resolvedRateHint === "exact"
                          ? "Historical rate loaded"
                          : resolvedRateHint === "nearest_previous"
                          ? "No exact rate found. Using nearest available rate."
                          : "No historical rate found. Using latest available rate."}
                      </span>
                    </div>
                  </Field>
                )}

                {activeType !== "bucket" && (
                  <Field label="Date">
                    <StyledDatePicker value={date} onChange={setDate} calendarSystem={calendarSystem} />
                  </Field>
                )}

                {activeType !== "bucket" && activeType !== "goal" && (
                  <Field label="Recurring">
                    <StyledDropdown value={recurrence} options={recurrenceOptions} onChange={setRecurrence} label="Recurring" />
                  </Field>
                )}

                {activeType === "goal" && (
                  <Field label="Category">
                    <GoalCategoryChips value={goalCategory} onChange={setGoalCategory} />
                  </Field>
                )}

                <Field label="Note">
                  <textarea
                    key={editItemId ?? "new-note"}
                    className={`${inputClass} h-24 resize-none rounded-xl py-3`}
                    name="note"
                    placeholder="Optional"
                    defaultValue={editItem?.note ?? ""}
                    dir="auto"
                  />
                </Field>
              </div>
            </div>

            {/* pinned submit */}
            <div className="shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6">
              <button
                type="submit"
                disabled={
                  inputMode === "percentage" &&
                  (!pctPreview || pctPreview.baseSnapshot === 0)
                }
                className={`h-13 w-full rounded-full px-5 py-3.5 text-[16px] font-semibold transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${submitButtonClass(activeType)}`}
              >
                {editItemId ? copy.submit.replace("Add", "Save") : copy.submit}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
