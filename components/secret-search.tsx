"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileKey, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useVault } from "@/contexts/vault-context";
import { SecretListItem } from "@/lib/types";
import { logger } from "@/lib/utils/logger";
import { motion, AnimatePresence } from "framer-motion";

interface SecretSearchProps {
  onSelectSecret: (path: string) => void;
}

const DEBOUNCE_DELAY = 300; // ms

export function SecretSearch({ onSelectSecret }: SecretSearchProps) {
  const { client } = useVault();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SecretListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setShowResults(false);
      setSearching(false);
      return;
    }

     
    setSearching(true);
    setShowResults(true);

    debounceTimerRef.current = setTimeout(async () => {
      if (!client) return;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const searchResults = await client.searchSecrets(
          query.trim(),
          "secret",
          abortController.signal
        );

        if (!abortController.signal.aborted) {
          setResults(searchResults);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error("Search error", error);
          setResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearching(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, client]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(true);
    }
  };

  const handleSelectResult = (path: string) => {
    onSelectSecret(path);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search secrets by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={searching || !query.trim()}>
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full rounded-md border p-2 shadow-lg" style={{ backgroundColor: "white", color: "black" }}
          >
            {searching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-1">
                <div className="px-2 py-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Found {results.length} result{results.length !== 1 ? "s" : ""}
                  </div>
                </div>
                {results.map((result) => (
                  <button
                    key={`${result.path}${result.isFolder ? "/" : ""}`}
                    onClick={() => handleSelectResult(result.path)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <FileKey className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{result.path}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
