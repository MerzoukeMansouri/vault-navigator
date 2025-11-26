"use client";

import React from "react";
import { useTokenDetection } from "@/hooks/use-token-detection";
import { TokenUpdateDialog } from "./token-update-dialog";

interface TokenDetectionProviderProps {
  children: React.ReactNode;
}

export function TokenDetectionProvider({ children }: TokenDetectionProviderProps) {
  const { detectedToken, dismissToken } = useTokenDetection(true);

  return (
    <>
      {children}
      {detectedToken && (
        <TokenUpdateDialog
          token={detectedToken.token}
          onClose={dismissToken}
        />
      )}
    </>
  );
}
