"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Lock, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useVault } from "@/contexts/vault-context";
import { storage } from "@/lib/storage";
import { SavedConfig } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const { activeConfig, currentNamespace, login, logout, isAuthenticated } =
    useVault();
  const pathname = usePathname();
  const [showConfigs, setShowConfigs] = useState(false);
  const [configs, setConfigs] = useState<SavedConfig[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      setConfigs(storage.getConfigs());
    }
  }, [isAuthenticated, activeConfig]);

  if (!isAuthenticated) return null;

  const handleConfigSwitch = (config: SavedConfig) => {
    login(config);
    setShowConfigs(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Vault Navigator</span>
          </Link>

          {isAuthenticated && (
            <nav className="flex gap-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Browser
              </Link>
              <Link
                href="/config"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/config"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Configurations
              </Link>
            </nav>
          )}
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Connected to:</span>
              <span className="font-medium">{activeConfig?.name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Namespace:</span>
              <span className="font-medium">{currentNamespace || "Root"}</span>
            </div>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowConfigs(!showConfigs)}
              >
                <Globe className="h-4 w-4" />
                Switch Config
              </Button>

              {showConfigs && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Switch Configuration
                  </div>
                  {configs.map((config) => (
                    <button
                      key={config.id}
                      className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                        activeConfig?.id === config.id ? "bg-accent" : ""
                      }`}
                      onClick={() => handleConfigSwitch(config)}
                    >
                      <div className="font-medium">{config.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {config.namespace || "Root"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
