"use client";

import React, { useState } from "react";
import { X, Key, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useVault } from "@/contexts/vault-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TokenUpdateDialogProps {
  token: string;
  onClose: () => void;
}

export function TokenUpdateDialog({ token, onClose }: TokenUpdateDialogProps) {
  const [configs] = useState<SavedConfig[]>(storage.getConfigs());
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeConfig, login } = useVault();
  const router = useRouter();

  const handleUpdateConfig = async (config: SavedConfig) => {
    setUpdating(true);
    setError(null);

    try {
      // Update the config with new token
      const updatedConfig: SavedConfig = {
        ...config,
        token,
      };

      storage.saveConfig(updatedConfig);

      // If this is the active config, re-login with new token
      if (activeConfig?.id === config.id) {
        login(updatedConfig);
      }

      // Show success and close
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update token");
      setUpdating(false);
    }
  };

  const handleCreateNewConfig = () => {
    // Navigate to config page with token in URL/state
    router.push(`/config?token=${encodeURIComponent(token)}`);
    onClose();
  };

  const maskedToken = token.length > 20
    ? `${token.substring(0, 10)}...${token.substring(token.length - 8)}`
    : token;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Vault Token Detected
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={updating}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground mb-1">
                  Detected token:
                </p>
                <p className="font-mono text-xs break-all">{maskedToken}</p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {configs.length > 0 ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Update token for which configuration?
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {configs.map((config) => (
                        <button
                          key={config.id}
                          onClick={() => handleUpdateConfig(config)}
                          disabled={updating}
                          className="w-full rounded-md border p-3 text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {config.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {config.url}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Namespace: {config.namespace || "Root"}
                              </p>
                            </div>
                            {activeConfig?.id === config.id && (
                              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCreateNewConfig}
                      disabled={updating}
                      className="w-full"
                    >
                      Create New Configuration
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    No configurations found. Create a new configuration with
                    this token?
                  </p>
                  <Button
                    onClick={handleCreateNewConfig}
                    disabled={updating}
                    className="w-full"
                  >
                    Create Configuration
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
