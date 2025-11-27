"use client";

import React from "react";
import { Save, Edit2, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { SecretViewer } from "./secret/secret-viewer";
import { SecretFormEditor } from "./secret/secret-form-editor";
import { SecretJsonEditor } from "./secret/secret-json-editor";
import { useSecretEditor } from "@/hooks/use-secret-editor";
import { useConfirm } from "@/hooks/use-confirm";
import { motion } from "framer-motion";

interface SecretEditorProps {
  path: string;
  onDeleted?: () => void;
  onSaved?: () => void;
}

export function SecretEditor({ path, onDeleted, onSaved }: SecretEditorProps) {
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
    setEditMode,
    setJsonValue,
    setFormData,
    startEditing,
    cancelEditing,
    handleSave,
    handleDelete,
    handleAddField,
    handleRemoveField,
    handleCopy,
  } = useSecretEditor(path, onDeleted, onSaved);

  const { confirm, confirmState, handleClose } = useConfirm();

  const onDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Secret",
      description: `Are you sure you want to delete ${path}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await handleDelete();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete secret");
      }
    }
  };

  const onSave = async () => {
    try {
      await handleSave();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save secret");
    }
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
    <>
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
                      onClick={startEditing}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={onDelete}
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
                      onClick={onSave}
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
                      onClick={cancelEditing}
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
      </motion.div>

      <ConfirmDialog
        open={confirmState.open}
        onClose={handleClose}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </>
  );
}
