"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "pwa-install-declined";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user previously declined and if TTL has expired
    const checkInstallPromptStatus = () => {
      const declinedData = localStorage.getItem(STORAGE_KEY);
      if (declinedData) {
        try {
          const { timestamp } = JSON.parse(declinedData);
          const now = Date.now();
          const elapsed = now - timestamp;

          // If more than 1 week has passed, remove the flag
          if (elapsed > ONE_WEEK_MS) {
            localStorage.removeItem(STORAGE_KEY);
            return true; // Can show prompt
          }
          return false; // Still within TTL, don't show
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(STORAGE_KEY);
          return true;
        }
      }
      return true; // No decline record, can show prompt
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();

      // Check if we should show the prompt
      if (!checkInstallPromptStatus()) {
        return;
      }

      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for the install prompt event
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // App is already installed, don't show prompt
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
      // Store decline with timestamp
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
        })
      );
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDeclineClick = () => {
    // Store decline with timestamp
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
      })
    );

    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <Card className="shadow-lg border-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">
                    Install Vault Navigator
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install this app for quick access and offline support. Works
                    like a native app!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstallClick}
                      size="sm"
                      className="flex-1"
                    >
                      Install
                    </Button>
                    <Button
                      onClick={handleDeclineClick}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Not now
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDeclineClick}
                  className="flex-shrink-0 p-1 rounded-sm hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
