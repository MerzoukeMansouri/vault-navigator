"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { VaultClient } from "@/lib/vault-client";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";

interface VaultContextType {
  client: VaultClient | null;
  activeConfig: SavedConfig | null;
  currentNamespace: string | null;
  isAuthenticated: boolean;
  login: (config: SavedConfig) => void;
  logout: () => void;
  switchNamespace: (namespace: string | null) => void;
  refreshConfig: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<VaultClient | null>(null);
  const [activeConfig, setActiveConfig] = useState<SavedConfig | null>(null);
  const [currentNamespace, setCurrentNamespace] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback((config: SavedConfig) => {
    const vaultClient = new VaultClient({
      url: config.url,
      token: config.token,
      namespace: config.namespace,
    });

    setClient(vaultClient);
    setActiveConfig(config);
    setCurrentNamespace(config.namespace || null);
    setIsAuthenticated(true);
    storage.setActiveConfig(config.id);
  }, []);

  const logout = useCallback(() => {
    setClient(null);
    setActiveConfig(null);
    setCurrentNamespace(null);
    setIsAuthenticated(false);
    storage.setActiveConfig(null);
  }, []);

  const switchNamespace = useCallback((namespace: string | null) => {
    if (client) {
      client.updateNamespace(namespace || undefined);
      setCurrentNamespace(namespace);
    }
  }, [client]);

  const refreshConfig = useCallback(() => {
    const savedConfig = storage.getActiveConfig();
    if (savedConfig) {
      setActiveConfig(savedConfig);
    }
  }, []);

  useEffect(() => {
    const savedConfig = storage.getActiveConfig();
    if (savedConfig) {
      login(savedConfig);
    }
  }, [login]);

  return (
    <VaultContext.Provider
      value={{
        client,
        activeConfig,
        currentNamespace,
        isAuthenticated,
        login,
        logout,
        switchNamespace,
        refreshConfig,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
