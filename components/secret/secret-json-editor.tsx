/**
 * JSON-based secret editor component
 * Allows editing secrets as raw JSON
 */

"use client";

import React from "react";
import { Textarea } from "../ui/textarea";

interface SecretJsonEditorProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export function SecretJsonEditor({
  value,
  error,
  onChange,
}: SecretJsonEditorProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[300px] font-mono text-sm"
        aria-label="JSON editor"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
