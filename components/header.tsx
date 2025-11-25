"use client";

import React, { useState } from "react";
import { LogOut, Settings, Lock, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useVault } from "@/contexts/vault-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const { activeConfig, currentNamespace, switchNamespace, logout, isAuthenticated } =
    useVault();
  const pathname = usePathname();
  const [showNamespaces, setShowNamespaces] = useState(false);

  if (!isAuthenticated) return null;

  const handleNamespaceSwitch = (namespace: string | null) => {
    switchNamespace(namespace);
    setShowNamespaces(false);
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

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowNamespaces(!showNamespaces)}
              >
                <Globe className="h-4 w-4" />
                {currentNamespace || "Root"}
              </Button>

              {showNamespaces && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Switch Namespace
                  </div>
                  <button
                    className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                      !currentNamespace ? "bg-accent" : ""
                    }`}
                    onClick={() => handleNamespaceSwitch(null)}
                  >
                    Root
                  </button>
                  {activeConfig?.namespaces.map((ns) => (
                    <button
                      key={ns}
                      className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                        currentNamespace === ns ? "bg-accent" : ""
                      }`}
                      onClick={() => handleNamespaceSwitch(ns)}
                    >
                      {ns}
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
