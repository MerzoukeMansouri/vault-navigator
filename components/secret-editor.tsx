"use client";

import React, { useState, useEffect } from "react";
import { Save, Edit2, X, Trash2, Plus, Loader2, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useVault } from "@/contexts/vault-context";
import { Secret } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { motion } from "framer-motion";

interface SecretEditorProps {
  path: string;
  onDeleted?: () => void;
  onSaved?: () => void;
}

export function SecretEditor({ path, onDeleted, onSaved }: SecretEditorProps) {
  const { client } = useVault();
  const [secret, setSecret] = useState<Secret | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"form" | "json">("form");
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSecret();
  }, [path, client]);

  const loadSecret = async () => {
    if (!client) return;

    setLoading(true);
    setIsEditing(false);
    try {
      const data = await client.readSecret(path);
      setSecret(data);
      setFormData(
        Object.entries(data.data).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === "string" ? value : JSON.stringify(value),
          }),
          {}
        )
      );
      setJsonValue(JSON.stringify(data.data, null, 2));
    } catch (error: any) {
      console.error("Error loading secret:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    try {
      let dataToSave: Record<string, any>;

      if (editMode === "json") {
        try {
          dataToSave = JSON.parse(jsonValue);
          setJsonError("");
        } catch (error) {
          setJsonError("Invalid JSON");
          setSaving(false);
          return;
        }
      } else {
        dataToSave = formData;
      }

      await client.writeSecret(path, dataToSave);
      await loadSecret();
      setIsEditing(false);
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving secret:", error);
      alert(`Error saving secret: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;

    try {
      await client.deleteSecret(path);
      onDeleted?.();
    } catch (error: any) {
      console.error("Error deleting secret:", error);
      alert(`Error deleting secret: ${error.message}`);
    }
  };

  const handleAddField = () => {
    const key = prompt("Enter field name:");
    if (key && !formData[key]) {
      setFormData({ ...formData, [key]: "" });
    }
  };

  const handleRemoveField = (key: string) => {
    const newData = { ...formData };
    delete newData[key];
    setFormData(newData);
  };

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Select a secret to view</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="truncate">{path}</CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      loadSecret();
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {secret.metadata && (
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <div>
                <span className="font-semibold">Version:</span>{" "}
                {secret.metadata.version}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {new Date(secret.metadata.created_time).toLocaleString()}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2 border-b pb-3">
              <Button
                size="sm"
                variant={editMode === "form" ? "default" : "outline"}
                onClick={() => setEditMode("form")}
              >
                Form
              </Button>
              <Button
                size="sm"
                variant={editMode === "json" ? "default" : "outline"}
                onClick={() => {
                  setEditMode("json");
                  setJsonValue(JSON.stringify(formData, null, 2));
                }}
              >
                JSON
              </Button>
            </div>
          )}

          {isEditing && editMode === "form" ? (
            <div className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Input
                    value={key}
                    disabled
                    className="w-1/3 font-mono text-sm"
                  />
                  <Input
                    value={value}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
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
          ) : isEditing && editMode === "json" ? (
            <div className="space-y-2">
              <Textarea
                value={jsonValue}
                onChange={(e) => {
                  setJsonValue(e.target.value);
                  setJsonError("");
                }}
                className="min-h-[300px] font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(secret.data).map(([key, value]) => (
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
                        handleCopy(
                          key,
                          typeof value === "string"
                            ? value
                            : JSON.stringify(value)
                        )
                      }
                    >
                      {copiedKey === key ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-all font-mono">
                    {typeof value === "string"
                      ? value
                      : JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
