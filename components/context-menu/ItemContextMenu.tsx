"use client";

import { useState } from "react";
import { ContextMenu } from "@/components/context-menu/ContextMenu";
import { ContextMenuItem } from "@/components/context-menu/ContextMenuItem";
import { DeleteConfirmPopover } from "@/components/context-menu/DeleteConfirmPopover";
import { useMoneyMapStore } from "@/store/moneyMapStore";

export function ItemContextMenu({
  open,
  x,
  y,
  itemId,
  onEdit,
  onClose
}: {
  open: boolean;
  x: number;
  y: number;
  itemId: string;
  onEdit: (itemId: string) => void;
  onClose: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const item = useMoneyMapStore((state) => state.items.find((candidate) => candidate.id === itemId));
  const duplicateItem = useMoneyMapStore((state) => state.duplicateItem);
  const deleteItem = useMoneyMapStore((state) => state.deleteItem);

  if (!item) return null;

  return (
    <>
      <ContextMenu open={open} x={x} y={y} onClose={onClose}>
        <ContextMenuItem
          onSelect={() => {
            onClose();
            onEdit(item.id);
          }}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            duplicateItem(item.id);
            onClose();
          }}
        >
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          tone="danger"
          onSelect={() => {
            onClose();
            setDeleteOpen(true);
          }}
        >
          Delete
        </ContextMenuItem>
      </ContextMenu>

      <DeleteConfirmPopover
        open={deleteOpen}
        title={`Delete "${item.title || "item"}"?`}
        body="This removes the row from its node."
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteItem(item.id);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
