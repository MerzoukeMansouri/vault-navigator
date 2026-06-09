"use client";

import { useState } from "react";
import { X, Key, CheckCircle, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useVault } from "@/contexts/vault-context";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";

interface TokenUpdateDialogProps {
  token: string;
  onClose: () => void;
}

export function TokenUpdateDialog({ token, onClose }: TokenUpdateDialogProps) {
  const [configs] = useState<SavedConfig[]>(() => storage.getConfigs());
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { activeConfig, login } = useVault();
  const { push } = useRouter();

  const maskedToken =
    token.length > 20
      ? `${token.substring(0, 10)}...${token.substring(token.length - 8)}`
      : token;

  const handleUpdateConfig = async (config: SavedConfig) => {
    setUpdating(true);
    const updatedConfig: SavedConfig = { ...config, token };
    storage.saveConfig(updatedConfig);
    if (activeConfig?.id === config.id) login(updatedConfig);
    setUpdatedId(config.id);
    setTimeout(onClose, 900);
  };

  const handleCreateNewConfig = () => {
    push(`/config?token=${encodeURIComponent(token)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <m.div
        className="fixed bottom-4 left-1/2 z-[9999] w-full max-w-lg -translate-x-1/2 px-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="bg-card text-card-foreground border rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "hsl(var(--color-card))", color: "hsl(var(--color-card-foreground))" }}>
          <Key className="size-4 text-primary shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">New token detected</span>
              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-[160px]">
                {maskedToken}
              </code>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {configs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => handleUpdateConfig(config)}
                  disabled={updating}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatedId === config.id ? (
                    <CheckCircle className="size-3 text-primary" />
                  ) : null}
                  {config.name}
                </button>
              ))}
              <button
                onClick={handleCreateNewConfig}
                disabled={updating}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-dashed text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Plus className="size-3" />
                New
              </button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={onClose}
            disabled={updating}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
