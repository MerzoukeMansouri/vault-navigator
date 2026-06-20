/**
 * Read-only secret viewer component
 * Displays secret data with copy functionality
 */

"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";

interface SecretViewerProps {
  data: Record<string, unknown>;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  envColor?: string;
}

export function SecretViewer({ data, copiedKey, onCopy, envColor }: SecretViewerProps) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="group rounded-md border p-3 hover:bg-accent/50 transition-colors"
          style={envColor ? { borderLeftColor: envColor, borderLeftWidth: "2px" } : undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{key}</span>
            <Button
              size="sm"
              variant="ghost"
              className="size-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() =>
                onCopy(
                  key,
                  typeof value === "string" ? value : JSON.stringify(value)
                )
              }
              aria-label={`Copy ${key}`}
            >
              {copiedKey === key ? (
                <Check className="size-3 text-green-500" />
              ) : (
                <Copy className="size-3" />
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
