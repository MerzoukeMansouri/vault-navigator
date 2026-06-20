"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, Key, Settings2, LogOut, Menu, X, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import { useVault } from "@/contexts/vault-context";
import { storage } from "@/lib/storage";
import { SavedConfig } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfigSwitcher } from "./config-switcher";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

function useConfigSwitcher() {
  const { activeConfig, currentNamespace, login, isAuthenticated } = useVault();
  const [open, setOpen] = useState(false);

  const configs = useMemo(
    () => (isAuthenticated ? storage.getConfigs() : []),
    [isAuthenticated]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        if (isAuthenticated) setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAuthenticated, configs.length]);

  const handleSelect = (config: SavedConfig) => login(config);

  return { open, setOpen, configs, activeConfig, currentNamespace, handleSelect };
}

function SidebarContent() {
  const { logout, isAuthenticated } = useVault();
  const pathname = usePathname();
  const { open, setOpen, configs, activeConfig, currentNamespace, handleSelect } = useConfigSwitcher();

  return (
    <>
      <div className="px-4 py-5 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Lock className="size-4 shrink-0" />
          <span className="font-heading text-sm">Vault Navigator</span>
        </Link>
      </div>

      {isAuthenticated && (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-accent cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{activeConfig?.name}</p>
            <kbd className="shrink-0 hidden sm:inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘G
            </kbd>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {currentNamespace || "Root"}
          </p>
        </button>
      )}

      <nav className="flex-1 p-2 space-y-0.5">
        <NavLink href="/" icon={Key} label="Secrets" active={pathname === "/"} />
        <NavLink href="/config" icon={Settings2} label="Configurations" active={pathname === "/config"} />
        <NavLink href="/tips" icon={Lightbulb} label="Tips" active={pathname === "/tips"} />
      </nav>

      {isAuthenticated && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full gap-2 justify-start text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Logout
          </Button>
        </div>
      )}

      <ConfigSwitcher
        open={open}
        onClose={() => setOpen(false)}
        configs={configs}
        activeConfig={activeConfig}
        onSelect={handleSelect}
      />
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r bg-background flex flex-col z-40 hidden md:flex">
      <SidebarContent />
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-40 border-b bg-background flex items-center justify-between h-12 px-4">
      <Link href="/" className="flex items-center gap-2">
        <Lock className="size-4" />
        <span className="font-heading text-sm">Vault Navigator</span>
      </Link>

      <div className="relative">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(!open)}>
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded-md border p-1 shadow-md z-50"
            style={{ backgroundColor: "hsl(var(--color-popover))" }}
          >
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                pathname === "/" ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              )}
            >
              <Key className="size-4" /> Secrets
            </Link>
            <Link
              href="/config"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                pathname === "/config" ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              )}
            >
              <Settings2 className="size-4" /> Configurations
            </Link>
            <Link
              href="/tips"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                pathname === "/tips" ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              )}
            >
              <Lightbulb className="size-4" /> Tips
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
