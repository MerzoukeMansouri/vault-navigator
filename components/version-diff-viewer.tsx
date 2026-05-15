"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface VersionDiffViewerProps {
  version1: number;
  version2: number;
  data1: Record<string, unknown>;
  data2: Record<string, unknown>;
  onClose: () => void;
}

type DiffType = "added" | "removed" | "modified" | "unchanged";

interface DiffItem {
  key: string;
  type: DiffType;
  oldValue?: string;
  newValue?: string;
}

export function VersionDiffViewer({
  version1,
  version2,
  data1,
  data2,
  onClose,
}: VersionDiffViewerProps) {
  const computeDiff = (): DiffItem[] => {
    const diffs: DiffItem[] = [];
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    for (const key of allKeys) {
      const oldValue = stringify(data1[key]);
      const newValue = stringify(data2[key]);

      if (!(key in data1)) {
        diffs.push({ key, type: "added", newValue });
      } else if (!(key in data2)) {
        diffs.push({ key, type: "removed", oldValue });
      } else if (oldValue !== newValue) {
        diffs.push({ key, type: "modified", oldValue, newValue });
      } else {
        diffs.push({ key, type: "unchanged", oldValue });
      }
    }

    return diffs.sort((a, b) => {
      const typeOrder = { modified: 0, added: 1, removed: 2, unchanged: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  };

  const stringify = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  };

  const getDiffColor = (
    type: DiffType
  ): { bg: string; border: string; text: string } => {
    switch (type) {
      case "added":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/50",
          text: "text-green-700 dark:text-green-400",
        };
      case "removed":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-700 dark:text-red-400",
        };
      case "modified":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-700 dark:text-blue-400",
        };
      default:
        return { bg: "", border: "", text: "" };
    }
  };

  const getDiffLabel = (type: DiffType): string => {
    switch (type) {
      case "added":
        return "+ Added";
      case "removed":
        return "- Removed";
      case "modified":
        return "~ Modified";
      default:
        return "= Unchanged";
    }
  };

  const diffs = computeDiff();
  const hasChanges = diffs.some((d) => d.type !== "unchanged");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-y-0">
          <CardTitle>
            Version Comparison: v{version1} ↔ v{version2}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {!hasChanges ? (
            <div className="p-4 text-center text-muted-foreground">
              No differences found between versions
            </div>
          ) : (
            <div className="space-y-2">
              {diffs.map((diff) => {
                if (diff.type === "unchanged") return null;

                const colors = getDiffColor(diff.type);
                return (
                  <motion.div
                    key={diff.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <code className="font-mono text-sm font-semibold">
                        {diff.key}
                      </code>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {getDiffLabel(diff.type)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {diff.oldValue && (
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground min-w-fit">
                            v{version1}:
                          </span>
                          <code className="font-mono text-xs break-all text-muted-foreground line-through">
                            {diff.oldValue}
                          </code>
                        </div>
                      )}
                      {diff.newValue && (
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground min-w-fit">
                            v{version2}:
                          </span>
                          <code className="font-mono text-xs break-all font-semibold">
                            {diff.newValue}
                          </code>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
