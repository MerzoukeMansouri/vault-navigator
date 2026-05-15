"use client";

import React from "react";
import { Save, Edit2, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SecretViewer } from "./secret/secret-viewer";
import { SecretFormEditor } from "./secret/secret-form-editor";
import { SecretJsonEditor } from "./secret/secret-json-editor";
import { VersionSelector } from "./version-selector";
import { VersionDiffViewer } from "./version-diff-viewer";
import { useSecretEditor } from "@/hooks/use-secret-editor";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SecretEditorProps {
  path: string;
  onSaved?: () => void;
}

export function SecretEditor({ path, onSaved }: SecretEditorProps) {
  const {
    secret,
    loading,
    saving,
    isEditing,
    editMode,
    jsonValue,
    jsonError,
    copiedKey,
    formData,
    versions,
    loadingVersions,
    setEditMode,
    setJsonValue,
    setFormData,
    startEditing,
    cancelEditing,
    handleSave,
    handleAddField,
    handleRemoveField,
    handleCopy,
    readSecretVersion,
  } = useSecretEditor(path, onSaved);

  const [diffState, setDiffState] = React.useState<{
    v1: number;
    v2: number;
    data1: Record<string, unknown>;
    data2: Record<string, unknown>;
  } | null>(null);

  const handleSwitchToFormMode = React.useCallback(() => {
    if (editMode === "json") {
      try {
        const parsed = JSON.parse(jsonValue);
        const stringified = Object.entries(parsed).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === "string" ? value : JSON.stringify(value),
          }),
          {}
        );
        setFormData(stringified);
      } catch {
        toast.error("Invalid JSON - cannot switch to form mode");
        return;
      }
    }
    setEditMode("form");
  }, [editMode, jsonValue, setFormData, setEditMode]);

  const handleSwitchToJsonMode = React.useCallback(() => {
    setEditMode("json");
    setJsonValue(JSON.stringify(formData, null, 2));
  }, [formData, setEditMode, setJsonValue]);

  const onSave = async () => {
    try {
      await handleSave();
      toast.success("Secret saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save secret");
    }
  };

  const handleCompare = async (v1: number, v2: number) => {
    try {
      const data1 = await readSecretVersion(v1);
      const data2 = await readSecretVersion(v2);

      if (data1 && data2) {
        setDiffState({
          v1,
          v2,
          data1: data1.data,
          data2: data2.data,
        });
      }
    } catch {
      toast.error("Failed to load version data for comparison");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary" />
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
    <>
      <m.div
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startEditing}
                    className="gap-2"
                  >
                    <Edit2 className="size-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={onSave}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                      className="gap-2"
                    >
                      <X className="size-4" />
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

            {versions.length > 1 && !isEditing && (
              <VersionSelector
                versions={versions}
                currentVersion={secret.metadata?.version || 1}
                onCompare={handleCompare}
                isLoading={loadingVersions}
              />
            )}

            <AnimatePresence>
              {diffState && (
                <VersionDiffViewer
                  version1={diffState.v1}
                  version2={diffState.v2}
                  data1={diffState.data1}
                  data2={diffState.data2}
                  onClose={() => setDiffState(null)}
                />
              )}
            </AnimatePresence>

            {isEditing && (
              <div className="flex gap-2 border-b pb-3">
                <Button
                  size="sm"
                  variant={editMode === "form" ? "default" : "outline"}
                  onClick={handleSwitchToFormMode}
                >
                  Form
                </Button>
                <Button
                  size="sm"
                  variant={editMode === "json" ? "default" : "outline"}
                  onClick={handleSwitchToJsonMode}
                >
                  JSON
                </Button>
              </div>
            )}

            {isEditing && editMode === "form" ? (
              <SecretFormEditor
                formData={formData}
                onFormDataChange={setFormData}
                onAddField={handleAddField}
                onRemoveField={handleRemoveField}
              />
            ) : isEditing && editMode === "json" ? (
              <SecretJsonEditor
                value={jsonValue}
                error={jsonError}
                onChange={(value) => {
                  setJsonValue(value);
                }}
              />
            ) : (
              <SecretViewer
                data={secret.data}
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />
            )}
          </CardContent>
        </Card>
      </m.div>
    </>
  );
}
