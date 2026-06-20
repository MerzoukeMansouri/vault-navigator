"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Trash2, Terminal, Lightbulb, RefreshCw, Keyboard } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "./ui/button";
import { STORAGE_KEYS, RELEASE_NOTES_VERSION } from "@/lib/constants";
import Link from "next/link";

export function ReleaseNotes() {
  const [visible, setVisible] = useState(false);
  const isLocalRef = useRef(false);

  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    isLocalRef.current = isLocal;

    const read = localStorage.getItem(STORAGE_KEYS.RELEASE_NOTES_READ);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLocal || read !== RELEASE_NOTES_VERSION) setVisible(true);
  }, []);

  const dismiss = () => {
    if (!isLocalRef.current) {
      localStorage.setItem(STORAGE_KEYS.RELEASE_NOTES_READ, RELEASE_NOTES_VERSION);
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-xl border bg-background shadow-xl"
          >
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                    What&apos;s new
                  </span>
                  <span className="text-sm font-medium">UI refresh — June 2026</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7 -mt-1 -mr-1 shrink-0" onClick={dismiss}>
                <X className="size-3.5" />
              </Button>
            </div>

            <ul className="px-5 pb-5 space-y-3.5 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <Trash2 className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="text-foreground font-medium">Delete your existing configurations</span>
                  {" "}and recreate them — the storage format changed and old entries may behave unexpectedly.
                </span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Terminal className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="text-foreground font-medium">
                    Use <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">vault-me</code> for a smoother experience
                  </span>
                  {" "}— one command logs you in, copies your token, and opens the app pre-configured.
                </span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <RefreshCw className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="text-foreground font-medium">Auto token refresh</span>
                  {" "}— when <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">vault-me</code> opens the app, it automatically updates the token of the matching configuration. No manual copy-paste.
                </span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Keyboard className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="text-foreground font-medium">
                    <kbd className="font-mono text-xs bg-muted border rounded px-1 py-0.5">⌘G</kbd> switches configuration
                  </span>
                  {" "}— hit it anywhere to instantly jump between your saved Vault configs.
                </span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Lightbulb className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  New{" "}
                  <Link href="/tips" onClick={dismiss} className="underline underline-offset-2 text-foreground hover:text-foreground/80">
                    Tips page
                  </Link>
                  {" "}with the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">vault-me</code> snippet — fill in your address and namespace to get a ready-to-paste function.
                </span>
              </li>
            </ul>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
