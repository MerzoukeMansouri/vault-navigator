/**
 * Custom hook for managing confirmation dialogs
 * Provides a simple API for showing confirmation dialogs
 */

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...options,
        onConfirm: () => {
          resolve(true);
          setState((prev) => ({ ...prev, open: false }));
        },
        onCancel: () => {
          resolve(false);
          setState((prev) => ({ ...prev, open: false }));
        },
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => {
      // Trigger cancel if there's a pending promise
      if (prev.onCancel) {
        prev.onCancel();
      }
      return { ...prev, open: false };
    });
  }, []);

  return {
    confirm,
    confirmState: state,
    handleClose,
  };
}
