"use client";

import { useEffect, useRef, useState } from "react";

const VAULT_TOKEN_PREFIX = "hvs.";
const CHECK_INTERVAL = 1000; // Check every second when window is focused

export interface DetectedToken {
  token: string;
  detectedAt: number;
}

export function useTokenDetection(enabled: boolean = true) {
  const [detectedToken, setDetectedToken] = useState<DetectedToken | null>(null);
  const lastCheckedTokenRef = useRef<string>("");
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkClipboard = async () => {
    if (!enabled) return;

    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        return;
      }

      // Read clipboard content
      const text = await navigator.clipboard.readText();

      // Check if it's a Vault token and we haven't seen it before
      if (
        text &&
        text.trim().startsWith(VAULT_TOKEN_PREFIX) &&
        text.trim() !== lastCheckedTokenRef.current
      ) {
        const token = text.trim();
        lastCheckedTokenRef.current = token;

        setDetectedToken({
          token,
          detectedAt: Date.now(),
        });
      }
    } catch (error) {
      // Clipboard access denied or not available - silently fail
      // This is expected in many browsers without user interaction
      console.debug("Clipboard access not available:", error);
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check clipboard when window gains focus
    const handleFocus = () => {
      checkClipboard();
    };

    // Also check periodically when window is focused
    const startPeriodicCheck = () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      checkIntervalRef.current = setInterval(checkClipboard, CHECK_INTERVAL);
    };

    const stopPeriodicCheck = () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };

    // Add event listeners
    window.addEventListener("focus", handleFocus);
    window.addEventListener("focus", startPeriodicCheck);
    window.addEventListener("blur", stopPeriodicCheck);

    // Initial check if window is already focused
    if (document.hasFocus()) {
      checkClipboard();
      startPeriodicCheck();
    }

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("focus", startPeriodicCheck);
      window.removeEventListener("blur", stopPeriodicCheck);
      stopPeriodicCheck();
    };
  }, [enabled]);

  const dismissToken = () => {
    setDetectedToken(null);
  };

  return {
    detectedToken,
    dismissToken,
  };
}
