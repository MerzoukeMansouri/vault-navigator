"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Search, Globe } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SavedConfig } from "@/lib/types";

interface ConfigSwitcherProps {
  open: boolean;
  onClose: () => void;
  configs: SavedConfig[];
  activeConfig: SavedConfig | null;
  onSelect: (config: SavedConfig) => void;
}

export function ConfigSwitcher({ open, onClose, configs, activeConfig, onSelect }: ConfigSwitcherProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = configs.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.url.toLowerCase().includes(q) ||
      (c.namespace ?? "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor(0);
  }, [query]);

  useEffect(() => {
    const item = listRef.current?.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && filtered[cursor]) { onSelect(filtered[cursor]); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, cursor, filtered, onSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <m.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-popover border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 border-b">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search configurations…"
                className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘G
              </kbd>
            </div>

            {/* List */}
            <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No configurations found</p>
              ) : (
                filtered.map((config, i) => {
                  const isActive = activeConfig?.id === config.id;
                  const isCursor = cursor === i;
                  return (
                    <button
                      key={config.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isCursor ? "bg-accent" : "hover:bg-accent/50"
                      )}
                      onClick={() => { onSelect(config); onClose(); }}
                      onMouseEnter={() => setCursor(i)}
                    >
                      <Globe className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{config.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {config.namespace ? `${config.namespace} · ` : ""}{config.url}
                        </div>
                      </div>
                      {isActive && <Check className="size-4 shrink-0 text-foreground" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-3 py-2 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
