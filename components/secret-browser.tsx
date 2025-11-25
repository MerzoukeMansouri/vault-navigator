"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FileKey,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useVault } from "@/contexts/vault-context";
import { motion, AnimatePresence } from "framer-motion";

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

export function SecretBrowser({
  onSelectSecret,
  selectedPath,
}: SecretBrowserProps) {
  const { client, currentNamespace } = useVault();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Error loading secrets:", error);
      setError(error instanceof Error ? error.message : "Failed to load secrets");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      loadRootSecrets();
    }
  }, [client, currentNamespace, loadRootSecrets]);

  const loadChildren = async (node: TreeNode) => {
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
        path: `${node.path}/${s.name}`.replace("//", "/"),
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
      console.error("Error loading children:", error);
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: false }))
      );
    }
  };

  const toggleNode = async (node: TreeNode) => {
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
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.path}>
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
            isSelected ? "bg-accent font-medium" : ""
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={() => toggleNode(node)}
        >
          {node.isFolder && (
            <span className="flex-shrink-0">
              {node.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          {node.isFolder ? (
            node.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-primary" />
            )
          ) : (
            <FileKey className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </motion.button>

        <AnimatePresence>
          {node.isExpanded && node.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children.map((child) => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          className="text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No secrets found. Make sure the &quot;secret&quot; KV engine is mounted.
        </div>
      ) : (
        tree.map((node) => renderNode(node))
      )}
    </div>
  );
}
