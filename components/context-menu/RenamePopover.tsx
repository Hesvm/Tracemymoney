"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function RenamePopover({
  open,
  title,
  onClose,
  onRename
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onRename: (title: string) => void;
}) {
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(title);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [open, title]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(value);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#2f333b]/14 px-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.form
            className="w-full max-w-[340px] rounded-[28px] bg-[#fffdf8] p-4 shadow-[0_18px_42px_rgba(47,51,59,0.13),0_4px_14px_rgba(47,51,59,0.08)]"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onSubmit={submit}
          >
            <label className="grid gap-2 text-[13px] font-medium text-[#777264]">
              Rename
              <input
                ref={inputRef}
                className="h-12 rounded-full bg-[#fbfaf7] px-4 text-[15px] font-medium text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onClose();
                }}
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-10 rounded-full bg-[#f4efe6] text-[14px] font-semibold text-[#777264] transition hover:bg-[#eee7db]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 rounded-full bg-[#2f333b] text-[14px] font-semibold text-white transition hover:bg-[#282c33]"
              >
                Save
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
