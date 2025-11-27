/**
 * Form-based secret editor component
 * Allows editing secrets as key-value pairs
 */

"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface SecretFormEditorProps {
  formData: Record<string, string>;
  onFormDataChange: (data: Record<string, string>) => void;
  onAddField: (key: string) => void;
  onRemoveField: (key: string) => void;
}

export function SecretFormEditor({
  formData,
  onFormDataChange,
  onAddField,
  onRemoveField,
}: SecretFormEditorProps) {
  const handleAddClick = () => {
    const key = prompt("Enter field name:");
    if (key) {
      onAddField(key);
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(formData).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <Input
            value={key}
            disabled
            className="w-1/3 font-mono text-sm"
            aria-label="Field name"
          />
          <Input
            value={value}
            onChange={(e) =>
              onFormDataChange({ ...formData, [key]: e.target.value })
            }
            className="flex-1 font-mono text-sm"
            aria-label={`Value for ${key}`}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemoveField(key)}
            aria-label={`Remove ${key}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddClick}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}
