"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { todayIsoDate } from "@/lib/calendar";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import type { Currency, GoalCategory, MoneyNodeType, RecurrenceType } from "@/types/money";
import { AmountInput, CurrencySegmentedToggle, GoalCategoryChips, recurrenceOptions, StyledDatePicker, StyledDropdown } from "./FormControls";

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
  "h-12 rounded-full bg-[#fbfaf7] px-4 text-[15px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";

function submitButtonClass(type: MoneyNodeType) {
  if (type === "income") {
    return "bg-[#e8f6dd] text-[#2d7f36] shadow-[0_12px_24px_rgba(69,160,71,0.14)] hover:bg-[#ddf1ce]";
  }

  if (type === "expense") {
    return "bg-[#f9dde2] text-[#d9344f] shadow-[0_12px_24px_rgba(217,52,79,0.12)] hover:bg-[#f6d1d8]";
  }

  return "bg-[#2f333b] text-white shadow-[0_12px_24px_rgba(47,51,59,0.14)] hover:bg-[#272b32]";
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
  const [goalCategory, setGoalCategory] = useState<GoalCategory>("car");
  const [resetKey, setResetKey] = useState(0);
  const copy = activeType ? labels[activeType] : labels.income;

  const parentOptions = useMemo(
    () => [{ value: "", label: "No parent" }, ...nodes.map((node) => ({ value: node.id, label: node.data.title }))],
    [nodes]
  );

  function resetForm() {
    setCurrency(defaultCurrency);
    setRecurrence("none");
    setAmount(0);
    setDate(todayIsoDate());
    setParentNodeId("");
    setGoalCategory("car");
    setResetKey((current) => current + 1);
  }

  useEffect(() => {
    if (!open) return;
    if (!editItem) {
      setCurrency(defaultCurrency);
      return;
    }

    const amountValue = editItem.type === "goal" ? editItem.targetAmount : editItem.amount;
    setCurrency(amountValue?.currency ?? defaultCurrency);
    setAmount(amountValue?.amount ?? 0);
    setDate(editItem.date ?? todayIsoDate());
    setRecurrence(editItem.recurrence ?? "none");
    setParentNodeId(editItem.parentId ?? "");
    setGoalCategory(editItem.category ?? "car");
    setResetKey((current) => current + 1);
  }, [defaultCurrency, editItem, open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeType) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();

    const payload = {
      type: activeType,
      title,
      amount: activeType === "bucket" ? undefined : amount,
      targetAmount: activeType === "goal" ? amount : undefined,
      currency,
      date,
      note: String(form.get("note") ?? ""),
      recurrence: activeType === "goal" ? "none" : recurrence,
      parentNodeId: parentNodeId || undefined,
      category: activeType === "goal" ? goalCategory : undefined
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
          className="fixed inset-0 z-40 grid place-items-center bg-[#2f333b]/14 px-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.form
            className="w-full max-w-[430px] rounded-[32px] bg-white px-6 py-6 shadow-soft"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onSubmit={submit}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#2f333b]">
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

            <div className="grid gap-4">
              <Field label={copy.subject}>
                <input
                  key={editItemId ?? "new-title"}
                  className={inputClass}
                  name="title"
                  placeholder={activeType === "income" ? "Salary" : copy.subject}
                  defaultValue={editItem?.title ?? ""}
                  required
                />
              </Field>

              {activeType !== "bucket" && (
                <div className="grid grid-cols-[1fr_176px] gap-3">
                  <Field label={copy.amount}>
                    <AmountInput currency={currency} value={amount} onValueChange={setAmount} resetKey={resetKey} />
                  </Field>
                  <Field label="Currency">
                    <CurrencySegmentedToggle value={currency} onChange={setCurrency} />
                  </Field>
                </div>
              )}

              {activeType === "bucket" && (
                <Field label="Parent">
                  <StyledDropdown value={parentNodeId} options={parentOptions} onChange={setParentNodeId} label="Parent" />
                </Field>
              )}

              {activeType !== "bucket" && (
                <>
                  <Field label="Date">
                    <StyledDatePicker value={date} onChange={setDate} calendarSystem={calendarSystem} />
                  </Field>
                </>
              )}

              {activeType !== "bucket" && activeType !== "goal" && (
                <>
                  <Field label="Recurring">
                    <StyledDropdown value={recurrence} options={recurrenceOptions} onChange={setRecurrence} label="Recurring" />
                  </Field>
                </>
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
                />
              </Field>
            </div>

            <button
              type="submit"
              className={`mt-6 h-13 w-full rounded-full px-5 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${submitButtonClass(activeType)}`}
            >
              {editItemId ? copy.submit.replace("Add", "Save") : copy.submit}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
