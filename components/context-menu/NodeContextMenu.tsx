"use client";

import { useState } from "react";
import { ContextMenu } from "@/components/context-menu/ContextMenu";
import { ContextMenuItem } from "@/components/context-menu/ContextMenuItem";
import { DeleteConfirmPopover } from "@/components/context-menu/DeleteConfirmPopover";
import { RenamePopover } from "@/components/context-menu/RenamePopover";
import { useMoneyMapStore } from "@/store/moneyMapStore";

const systemNodeIds = new Set(["node-income", "node-expense", "node-savings"]);

export function NodeContextMenu({
  open,
  x,
  y,
  nodeId,
  onAddItem,
  onClose
}: {
  open: boolean;
  x: number;
  y: number;
  nodeId: string;
  onAddItem: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const node = useMoneyMapStore((state) => state.nodes.find((candidate) => candidate.id === nodeId));
  const renameNode = useMoneyMapStore((state) => state.renameNode);
  const duplicateNode = useMoneyMapStore((state) => state.duplicateNode);
  const deleteNode = useMoneyMapStore((state) => state.deleteNode);
  const toggleNodeCollapsed = useMoneyMapStore((state) => state.toggleNodeCollapsed);

  if (!node) return null;

  const isSystem = systemNodeIds.has(node.id);
  const isGoal = node.data.type === "goal";

  return (
    <>
      <ContextMenu open={open} x={x} y={y} onClose={onClose}>
        {isSystem ? (
          <>
            <ContextMenuItem
              onSelect={() => {
                onClose();
                onAddItem(node.id);
              }}
            >
              Add item
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                toggleNodeCollapsed(node.id);
                onClose();
              }}
            >
              {node.data.collapsed ? "Expand" : "Collapse"}
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem
              onSelect={() => {
                onClose();
                setRenameOpen(true);
              }}
            >
              {isGoal ? "Edit Goal" : "Rename"}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                duplicateNode(node.id);
                onClose();
              }}
            >
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                toggleNodeCollapsed(node.id);
                onClose();
              }}
            >
              {node.data.collapsed ? "Expand" : "Collapse"}
            </ContextMenuItem>
            {isGoal && (
              <ContextMenuItem onSelect={onClose}>
                Archive
              </ContextMenuItem>
            )}
            <ContextMenuItem
              tone="danger"
              onSelect={() => {
                onClose();
                setDeleteOpen(true);
              }}
            >
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenu>

      <RenamePopover
        open={renameOpen}
        title={node.data.title}
        onClose={() => setRenameOpen(false)}
        onRename={(title) => {
          renameNode(node.id, title);
          setRenameOpen(false);
        }}
      />
      <DeleteConfirmPopover
        open={deleteOpen}
        title={`Delete "${node.data.title}"?`}
        body="This will also remove connected relationships."
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteNode(node.id);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
