import { describe, test, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirm } from "../use-confirm";

describe("useConfirm", () => {
  test("initializes with closed state", () => {
    const { result } = renderHook(() => useConfirm());

    expect(result.current.confirmState.open).toBe(false);
  });

  test("opens confirmation dialog with options", async () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: "Delete Item",
        description: "Are you sure?",
        confirmText: "Delete",
        variant: "destructive",
      });
    });

    expect(result.current.confirmState.open).toBe(true);
    expect(result.current.confirmState.title).toBe("Delete Item");
    expect(result.current.confirmState.description).toBe("Are you sure?");
    expect(result.current.confirmState.confirmText).toBe("Delete");
    expect(result.current.confirmState.variant).toBe("destructive");
  });

  test("resolves promise with true when confirmed", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmResult: boolean | undefined;

    // Start confirm (don't await yet)
    act(() => {
      result.current.confirm({
        title: "Test",
        description: "Test description",
      }).then((value) => {
        confirmResult = value;
      });
    });

    // Dialog should be open
    expect(result.current.confirmState.open).toBe(true);

    // Confirm
    await act(async () => {
      result.current.confirmState.onConfirm?.();
    });

    // Dialog should be closed
    expect(result.current.confirmState.open).toBe(false);

    // Promise should resolve to true
    expect(confirmResult).toBe(true);
  });

  test("resolves promise with false when cancelled", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmResult: boolean | undefined;

    act(() => {
      result.current.confirm({
        title: "Test",
        description: "Test description",
      }).then((value) => {
        confirmResult = value;
      });
    });

    // Trigger cancel
    await act(async () => {
      result.current.confirmState.onCancel?.();
    });

    expect(result.current.confirmState.open).toBe(false);
    expect(confirmResult).toBe(false);
  });

  test("resolves promise with false when closed via handleClose", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmResult: boolean | undefined;

    act(() => {
      result.current.confirm({
        title: "Test",
        description: "Test description",
      }).then((value) => {
        confirmResult = value;
      });
    });

    // Close dialog
    await act(async () => {
      result.current.handleClose();
    });

    expect(result.current.confirmState.open).toBe(false);
    expect(confirmResult).toBe(false);
  });

  test("supports default variant", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: "Save Changes",
        description: "Do you want to save?",
      });
    });

    expect(result.current.confirmState.variant).toBeUndefined();
  });

  test("supports destructive variant", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: "Delete",
        description: "This cannot be undone",
        variant: "destructive",
      });
    });

    expect(result.current.confirmState.variant).toBe("destructive");
  });

  test("allows custom button text", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: "Logout",
        description: "Are you sure?",
        confirmText: "Yes, logout",
        cancelText: "No, stay",
      });
    });

    expect(result.current.confirmState.confirmText).toBe("Yes, logout");
    expect(result.current.confirmState.cancelText).toBe("No, stay");
  });

  test("handles multiple sequential confirmations", async () => {
    const { result } = renderHook(() => useConfirm());

    // First confirmation
    let result1: boolean | undefined;
    act(() => {
      result.current.confirm({
        title: "First",
        description: "First confirmation",
      }).then((value) => {
        result1 = value;
      });
    });

    await act(async () => {
      result.current.confirmState.onConfirm?.();
    });

    expect(result1).toBe(true);

    // Second confirmation
    let result2: boolean | undefined;
    act(() => {
      result.current.confirm({
        title: "Second",
        description: "Second confirmation",
      }).then((value) => {
        result2 = value;
      });
    });

    await act(async () => {
      result.current.confirmState.onCancel?.();
    });

    expect(result2).toBe(false);
  });

  test("can be used in async/await pattern", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise: Promise<boolean>;

    // Start the confirmation
    act(() => {
      confirmPromise = result.current.confirm({
        title: "Proceed?",
        description: "This is async",
      });
    });

    // Confirm it
    await act(async () => {
      result.current.confirmState.onConfirm?.();
    });

    // Check result
    const confirmed = await confirmPromise!;
    expect(confirmed).toBe(true);
  });
});
