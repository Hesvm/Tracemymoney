"use client";

import { AnimatePresence, motion } from "framer-motion";

export function DeleteConfirmPopover({
  open,
  title,
  body,
  onClose,
  onConfirm
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
          <motion.div
            className="w-full max-w-[350px] rounded-[28px] bg-[#fffdf8] p-5 shadow-[0_18px_42px_rgba(47,51,59,0.13),0_4px_14px_rgba(47,51,59,0.08)]"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#2f333b]">{title}</h2>
            <p className="mt-2 text-[14px] font-medium leading-5 text-[#777264]">{body}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-10 rounded-full bg-[#f4efe6] text-[14px] font-semibold text-[#777264] transition hover:bg-[#eee7db]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-full bg-[#f9dde2] text-[14px] font-semibold text-[#d9344f] transition hover:bg-[#f6d1d8]"
                onClick={onConfirm}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
