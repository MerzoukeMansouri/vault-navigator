"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
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
import { useVault } from "@/contexts/vault-context";
import { m, AnimatePresence } from "framer-motion";
import { VaultPathUtils } from "@/lib/utils/vault-path-utils";
import { logger } from "@/lib/utils/logger";
import { detectEnvColor } from "@/lib/utils/env-utils";

const FAVORITES_KEY = "vault-navigator-favorites";

interface SecretBrowserProps {
  onSelectSecret: (path: string) => void;
  selectedPath?: string;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

type FavoriteItem = { path: string; name: string; isFolder: boolean };

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  selectedPath?: string;
  favorites: Map<string, FavoriteItem>;
  onToggle: (node: TreeNode) => void;
  onToggleFavorite: (node: TreeNode) => void;
}

function CopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
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

function PinnedItemRow({
  item,
  selectedPath,
  onSelect,
  onUnpin,
}: {
  item: FavoriteItem;
  selectedPath?: string;
  onSelect: (path: string) => void;
  onUnpin: (path: string) => void;
}) {
  const isSelected = selectedPath === item.path;
  const envColor = detectEnvColor(item.name) ?? (item.isFolder ? "#f59e0b" : "#38bdf8");

  return (
    <div className="group relative">
      <button
        onClick={() => onSelect(item.path)}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
          isSelected ? "bg-accent font-medium" : ""
        }`}
      >
        {item.isFolder ? (
          <Folder className="size-4 shrink-0" style={{ color: envColor }} />
        ) : (
          <FileKey className="size-4 shrink-0" style={{ color: envColor }} />
        )}
        <span className="truncate pr-14 text-muted-foreground">{item.name}</span>
      </button>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        <CopyButton path={item.path} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(item.path);
          }}
          className="rounded p-1 hover:bg-muted"
          title="Unpin"
        >
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
        </button>
      </div>
    </div>
  );
}

const TreeNodeComponent = memo(({
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

  const handleFavorite = (e: React.MouseEvent) => {
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
              {node.isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </span>
          )}
          {node.isFolder ? (
            node.isExpanded ? (
              <FolderOpen className="size-4 shrink-0" style={{ color: envColor }} />
            ) : (
              <Folder className="size-4 shrink-0" style={{ color: envColor }} />
            )
          ) : (
            <FileKey className="size-4 shrink-0" style={{ color: envColor }} />
          )}
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

export function SecretBrowser({
  onSelectSecret,
  selectedPath,
}: SecretBrowserProps) {
  const { client, currentNamespace } = useVault();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Map<string, FavoriteItem>>(new Map());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setFavorites(new Map(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggleFavorite = useCallback((node: TreeNode) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.set(node.path, { path: node.path, name: node.name, isFolder: node.isFolder });
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const removeFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      next.delete(path);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const loadRootSecrets = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);
    try {
      const secrets = await client.listSecrets("secret");
      setTree(
        secrets.map((s) => ({
          name: s.name,
          path: s.path,
          isFolder: s.isFolder,
          isExpanded: false,
        }))
      );
    } catch (error: unknown) {
      logger.error("Error loading secrets", error);
      setError(error instanceof Error ? error.message : "Failed to load secrets");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRootSecrets();
    }
  }, [client, currentNamespace, loadRootSecrets]);

  const loadChildren = useCallback(async (node: TreeNode) => {
    if (!client) return;

    const updateNodeInTree = (
      nodes: TreeNode[],
      targetPath: string,
      updater: (node: TreeNode) => TreeNode
    ): TreeNode[] => {
      return nodes.map((n) => {
        if (n.path === targetPath) {
          return updater(n);
        }
        if (n.children) {
          return { ...n, children: updateNodeInTree(n.children, targetPath, updater) };
        }
        return n;
      });
    };

    setTree((prev) =>
      updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: true }))
    );

    try {
      const secrets = await client.listSecrets(node.path);
      const children = secrets.map((s) => ({
        name: s.name,
        path: VaultPathUtils.joinPaths(node.path, s.name),
        isFolder: s.isFolder,
        isExpanded: false,
      }));

      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({
          ...n,
          children,
          isExpanded: true,
          isLoading: false,
        }))
      );
    } catch (error) {
      logger.error("Error loading children", error);
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: false }))
      );
    }
  }, [client]);

  const toggleNode = useCallback(async (node: TreeNode) => {
    if (node.isFolder) {
      if (!node.isExpanded && (!node.children || node.children.length === 0)) {
        await loadChildren(node);
      } else {
        const updateNodeInTree = (
          nodes: TreeNode[],
          targetPath: string
        ): TreeNode[] => {
          return nodes.map((n) => {
            if (n.path === targetPath) {
              return { ...n, isExpanded: !n.isExpanded };
            }
            if (n.children) {
              return { ...n, children: updateNodeInTree(n.children, targetPath) };
            }
            return n;
          });
        };

        setTree((prev) => updateNodeInTree(prev, node.path));
      }
    } else {
      onSelectSecret(node.path);
    }
  }, [onSelectSecret, loadChildren]);

  const favoritesArray = useMemo(() => [...favorites.values()], [favorites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-2">
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm font-semibold text-destructive mb-1">
            Error loading secrets
          </p>
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
        <button
          onClick={loadRootSecrets}
          className="text-xs underline underline-offset-2 text-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {favoritesArray.length > 0 && (
        <div className="mb-2">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pinned
          </p>
          {favoritesArray.map((item) => (
            <PinnedItemRow
              key={item.path}
              item={item}
              selectedPath={selectedPath}
              onSelect={onSelectSecret}
              onUnpin={removeFavorite}
            />
          ))}
          <div className="mx-3 my-2 border-t border-border" />
        </div>
      )}
      {tree.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No secrets found. Make sure the &quot;secret&quot; KV engine is mounted.
        </div>
      ) : (
        tree.map((node) => (
          <TreeNodeComponent
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            favorites={favorites}
            onToggle={toggleNode}
            onToggleFavorite={toggleFavorite}
          />
        ))
      )}
    </div>
  );
}
