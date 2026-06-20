"use client";


import { Plus, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "./ui/sheet";
import { useSecretCreator } from "@/hooks/use-secret-creator";

interface SecretCreatorProps {
  onCreated?: (path: string) => void;
}

export function SecretCreator({ onCreated }: SecretCreatorProps) {
  const {
    isOpen,
    saving,
    mode,
    path,
    jsonValue,
    jsonError,
    formFields,
    setMode,
    setPath,
    setJsonValue,
    setJsonError,
    handleAddField,
    handleRemoveField,
    handleUpdateField,
    switchToJsonMode,
    handleCreate,
    handleOpen,
    handleClose,
  } = useSecretCreator({ onCreated });

  return (
    <>
      <Button onClick={handleOpen} className="gap-2">
        <Plus className="size-4" />
        Create Secret
      </Button>

      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <SheetContent side="left" showCloseButton={false}>
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Create New Secret</SheetTitle>
            <SheetDescription>Add a new secret to your Vault instance</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-path">Secret Path</Label>
              <Input
                id="secret-path"
                placeholder="myapp/database"
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
                onClick={switchToJsonMode}
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
                      onChange={(e) => handleUpdateField(key, e.target.value, value)}
                      className="w-1/3 font-mono text-sm"
                    />
                    <Input
                      placeholder="Value"
                      value={value}
                      onChange={(e) => handleUpdateField(key, key, e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveField(key)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddField} className="gap-2">
                  <Plus className="size-4" />
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
          </div>

          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={saving || !path.trim()}
              className="gap-2"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Create
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
