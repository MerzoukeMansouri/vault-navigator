"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    const savedConfig = storage.getActiveConfig();
    if (savedConfig) {
      login(savedConfig);
    }
  }, []);

  const login = (config: SavedConfig) => {
    const vaultClient = new VaultClient({
      url: config.url,
      token: config.token,
      namespace: config.namespaces[0] || undefined,
    });

    setClient(vaultClient);
    setActiveConfig(config);
    setCurrentNamespace(config.namespaces[0] || null);
    setIsAuthenticated(true);
    storage.setActiveConfig(config.id);
  };

  const logout = () => {
    setClient(null);
    setActiveConfig(null);
    setCurrentNamespace(null);
    setIsAuthenticated(false);
    storage.setActiveConfig(null);
  };

  const switchNamespace = (namespace: string | null) => {
    if (client) {
      client.updateNamespace(namespace || undefined);
      setCurrentNamespace(namespace);
    }
  };

  const refreshConfig = () => {
    const savedConfig = storage.getActiveConfig();
    if (savedConfig) {
      setActiveConfig(savedConfig);
    }
  };

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
