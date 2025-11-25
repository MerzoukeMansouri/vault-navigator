"use client";

import React, { useState } from "react";
import { Plus, Loader2, Save, X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { useVault } from "@/contexts/vault-context";
import { Textarea } from "./ui/textarea";

interface SecretCreatorProps {
  onCreated?: (path: string) => void;
}

export function SecretCreator({ onCreated }: SecretCreatorProps) {
  const { client } = useVault();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [path, setPath] = useState("");
  const [jsonValue, setJsonValue] = useState("{}");
  const [jsonError, setJsonError] = useState("");
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  const handleAddField = () => {
    const key = `field_${Object.keys(formFields).length + 1}`;
    setFormFields({ ...formFields, [key]: "" });
  };

  const handleRemoveField = (key: string) => {
    const newFields = { ...formFields };
    delete newFields[key];
    setFormFields(newFields);
  };

  const handleUpdateField = (oldKey: string, newKey: string, value: string) => {
    const newFields = { ...formFields };
    delete newFields[oldKey];
    newFields[newKey] = value;
    setFormFields(newFields);
  };

  const handleCreate = async () => {
    if (!client || !path.trim()) return;

    setSaving(true);
    try {
      let dataToSave: Record<string, unknown>;

      if (mode === "json") {
        try {
          dataToSave = JSON.parse(jsonValue);
          setJsonError("");
        } catch {
          setJsonError("Invalid JSON");
          setSaving(false);
          return;
        }
      } else {
        dataToSave = formFields;
      }

      const fullPath = path.startsWith("secret/")
        ? path
        : `secret/${path}`;

      await client.writeSecret(fullPath, dataToSave);
      onCreated?.(fullPath);
      handleClose();
    } catch (error: unknown) {
      console.error("Error creating secret:", error);
      alert(`Error creating secret: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPath("");
    setFormFields({});
    setJsonValue("{}");
    setJsonError("");
    setMode("form");
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Secret
      </Button>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Create New Secret</CardTitle>
        <CardDescription>
          Add a new secret to your Vault instance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="path">Secret Path</Label>
          <Input
            id="path"
            placeholder="secret/myapp/database"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Path where the secret will be stored
          </p>
        </div>

        <div className="flex gap-2 border-b pb-3">
          <Button
            size="sm"
            variant={mode === "form" ? "default" : "outline"}
            onClick={() => setMode("form")}
          >
            Form
          </Button>
          <Button
            size="sm"
            variant={mode === "json" ? "default" : "outline"}
            onClick={() => {
              setMode("json");
              setJsonValue(JSON.stringify(formFields, null, 2));
            }}
          >
            JSON
          </Button>
        </div>

        {mode === "form" ? (
          <div className="space-y-3">
            {Object.entries(formFields).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <Input
                  placeholder="Key"
                  value={key}
                  onChange={(e) =>
                    handleUpdateField(key, e.target.value, value)
                  }
                  className="w-1/3 font-mono text-sm"
                />
                <Input
                  placeholder="Value"
                  value={value}
                  onChange={(e) =>
                    handleUpdateField(key, key, e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveField(key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddField}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={jsonValue}
              onChange={(e) => {
                setJsonValue(e.target.value);
                setJsonError("");
              }}
              className="min-h-[200px] font-mono text-sm"
            />
            {jsonError && (
              <p className="text-sm text-destructive">{jsonError}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleCreate}
            disabled={saving || !path.trim()}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create
          </Button>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
