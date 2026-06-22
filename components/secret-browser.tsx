"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Folder, FileKey, Star, Loader2 } from "lucide-react";
import { useVault } from "@/contexts/vault-context";
import { VaultPathUtils } from "@/lib/utils/vault-path-utils";
import { logger } from "@/lib/utils/logger";
import { detectEnvColor } from "@/lib/utils/env-utils";
import {
  TreeNode,
  FavoriteItem,
  TreeNodeComponent,
  CopyButton,
} from "./secret-browser-tree";

const favoritesKey = (namespace?: string | null) =>
  `vault-navigator-favorites:${namespace || "root"}`;

interface SecretBrowserProps {
  onSelectSecret: (path: string) => void;
  selectedPath?: string;
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

function updateNodeInTree(
  nodes: TreeNode[],
  targetPath: string,
  updater: (node: TreeNode) => TreeNode
): TreeNode[] {
  return nodes.map((n) => {
    if (n.path === targetPath) return updater(n);
    if (n.children) return { ...n, children: updateNodeInTree(n.children, targetPath, updater) };
    return n;
  });
}

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
      const stored = localStorage.getItem(favoritesKey(currentNamespace));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavorites(stored ? new Map(JSON.parse(stored)) : new Map());
    } catch {}
  }, [currentNamespace]);

  const toggleFavorite = useCallback((node: TreeNode) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.set(node.path, { path: node.path, name: node.name, isFolder: node.isFolder });
      }
      try {
        localStorage.setItem(favoritesKey(currentNamespace), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, [currentNamespace]);

  const removeFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      next.delete(path);
      try {
        localStorage.setItem(favoritesKey(currentNamespace), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, [currentNamespace]);

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
    } catch (err: unknown) {
      logger.error("Error loading secrets", err);
      setError(err instanceof Error ? err.message : "Failed to load secrets");
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

    setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: true })));

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
    } catch (err) {
      logger.error("Error loading children", err);
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: false })));
    }
  }, [client]);

  const toggleNode = useCallback(async (node: TreeNode) => {
    if (node.isFolder) {
      if (!node.isExpanded && (!node.children || node.children.length === 0)) {
        await loadChildren(node);
      } else {
        setTree((prev) =>
          updateNodeInTree(prev, node.path, (n) => ({ ...n, isExpanded: !n.isExpanded }))
        );
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
