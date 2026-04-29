"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { VaultClient } from "@/lib/vault-client";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/utils/logger";

interface VaultContextType {
  client: VaultClient | null;
  activeConfig: SavedConfig | null;
  currentNamespace: string | null;
  isAuthenticated: boolean;
  login: (config: SavedConfig) => void;
  logout: () => void;
  switchNamespace: (namespace: string | null) => void;
  refreshConfig: () => void;
  handleOIDCCallback: (params: URLSearchParams) => boolean;
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

  const handleOIDCCallback = useCallback((params: URLSearchParams): boolean => {
    const oidcSuccess = params.get('oidc_success');
    const token = params.get('token');
    const vaultUrl = params.get('vault_url');
    const namespace = params.get('namespace');
    const username = params.get('username');
    const policies = params.get('policies');
    const expiresIn = params.get('expires_in');

    if (oidcSuccess === 'true' && token && vaultUrl) {
      logger.info('OIDC callback received, creating config');

      // Create a config from OIDC authentication
      const config: SavedConfig = {
        id: Date.now().toString(),
        name: `OIDC: ${username || 'User'}${namespace ? ` (${namespace})` : ''}`,
        url: vaultUrl,
        token: token,
        namespace: namespace || undefined,
      };

      // Save the config
      storage.saveConfig(config);

      // Log in with the new config
      login(config);

      logger.info('OIDC login successful', {
        namespace,
        policies,
        expiresIn: expiresIn ? `${expiresIn}s` : 'unknown',
      });

      return true;
    }

    // Check for OIDC errors
    const error = params.get('error');
    const message = params.get('message');
    if (error) {
      logger.error('OIDC authentication failed', { error, message });
      return false;
    }

    return false;
  }, [login]);

  useEffect(() => {
    const savedConfig = storage.getActiveConfig();
    if (savedConfig) {
      login(savedConfig);
    }
  }, [login]);

  // Handle OIDC callback on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const handled = handleOIDCCallback(params);

      // Clean up URL parameters after handling OIDC callback
      if (handled || params.has('oidc_success') || params.has('error')) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [handleOIDCCallback]);

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
        handleOIDCCallback,
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
