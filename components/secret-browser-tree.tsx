"use client";

import { memo, useState } from "react";
import {
  Folder,
  FileKey,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderOpen,
  Star,
  Copy,
  Check,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { detectEnvColor } from "@/lib/utils/env-utils";
import type { MouseEvent } from "react";

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

export type FavoriteItem = { path: string; name: string; isFolder: boolean };

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  selectedPath?: string;
  favorites: Map<string, FavoriteItem>;
  onToggle: (node: TreeNode) => void;
  onToggleFavorite: (node: TreeNode) => void;
}

function FolderChevron({ node }: { node: TreeNode }) {
  if (node.isLoading) return <Loader2 className="size-4 animate-spin" />;
  if (node.isExpanded) return <ChevronDown className="size-4" />;
  return <ChevronRight className="size-4" />;
}

function NodeIcon({ node, envColor }: { node: TreeNode; envColor: string }) {
  if (!node.isFolder) return <FileKey className="size-4 shrink-0" style={{ color: envColor }} />;
  if (node.isExpanded) return <FolderOpen className="size-4 shrink-0" style={{ color: envColor }} />;
  return <Folder className="size-4 shrink-0" style={{ color: envColor }} />;
}

export function CopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
      title="Copy path"
    >
      {copied ? (
        <Check className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export const TreeNodeComponent = memo(({
  node,
  level,
  selectedPath,
  favorites,
  onToggle,
  onToggleFavorite,
}: TreeNodeComponentProps) => {
  const isSelected = selectedPath === node.path;
  const isFavorite = favorites.has(node.path);
  const envColor = detectEnvColor(node.name) ?? (node.isFolder ? "#f59e0b" : "#38bdf8");

  const handleFavorite = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(node);
  };

  return (
    <div>
      <m.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group relative"
      >
        <button
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
            isSelected ? "bg-accent font-medium" : ""
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={() => onToggle(node)}
        >
          {node.isFolder && (
            <span className="flex-shrink-0">
              <FolderChevron node={node} />
            </span>
          )}
          <NodeIcon node={node} envColor={envColor} />
          <span className="truncate pr-14">{node.name}</span>
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <CopyButton path={node.path} />
          <button
            onClick={handleFavorite}
            className={`rounded p-1 transition-opacity hover:bg-muted ${
              isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            title={isFavorite ? "Unpin" : "Pin"}
          >
            <Star
              className={`size-3.5 ${
                isFavorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
      </m.div>

      <AnimatePresence>
        {node.isExpanded && node.children && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                favorites={favorites}
                onToggle={onToggle}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TreeNodeComponent.displayName = "TreeNodeComponent";
