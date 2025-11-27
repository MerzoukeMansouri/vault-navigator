/**
 * Read-only secret viewer component
 * Displays secret data with copy functionality
 */

"use client";

import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";

interface SecretViewerProps {
  data: Record<string, unknown>;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}

export function SecretViewer({ data, copiedKey, onCopy }: SecretViewerProps) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="group rounded-md border p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{key}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() =>
                onCopy(
                  key,
                  typeof value === "string" ? value : JSON.stringify(value)
                )
              }
              aria-label={`Copy ${key}`}
            >
              {copiedKey === key ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-all font-mono">
            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
