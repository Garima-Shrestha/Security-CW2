import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

describe("useAuth Hook", () => {
  test("returns the authentication context inside AuthProvider", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isInitializing).toBe(false);
    });
  });

  test("throws an error when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });
});