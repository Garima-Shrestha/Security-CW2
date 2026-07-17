import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import api, { setAuthToken } from "@/lib/axios";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { post: jest.fn() },
  setAuthToken: jest.fn(),
}));

const mockUser = {
  _id: "u1",
  username: "testuser",
  email: "test@example.com",
  role: "user" as const,
  authProvider: "local" as const,
  isTotpEnabled: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("starts with no user and finishes initializing when no stored session exists", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  test("rehydrates user and token from localStorage on load", async () => {
    localStorage.setItem("auth_token", "stored.token");
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    expect(result.current.token).toBe("stored.token");
    expect(result.current.user).toEqual(mockUser);
    expect(setAuthToken).toHaveBeenCalledWith("stored.token");
  });

  test("loginStepOne logs the user in directly when TOTP is not required", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { requiresTotp: false, token: "new.token", data: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let response: any;
    await act(async () => {
      response = await result.current.loginStepOne("test@example.com", "Password123!");
    });

    expect(response.requiresTotp).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("new.token");
    expect(localStorage.getItem("auth_token")).toBe("new.token");
  });

  test("loginStepOne returns a preAuthToken when TOTP is required, without logging in", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { requiresTotp: true, preAuthToken: "pre.auth.token" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let response: any;
    await act(async () => {
      response = await result.current.loginStepOne("test@example.com", "Password123!");
    });

    expect(response.requiresTotp).toBe(true);
    expect(response.preAuthToken).toBe("pre.auth.token");
    expect(result.current.user).toBeNull();
  });

  test("loginStepTwo completes login after verifying TOTP code", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { data: mockUser, token: "final.token" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let loggedInUser: any;
    await act(async () => {
      loggedInUser = await result.current.loginStepTwo("pre.auth.token", "123456");
    });

    expect(loggedInUser).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("final.token");
  });

  test("logout clears user, token, and localStorage", async () => {
    localStorage.setItem("auth_token", "stored.token");
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });

  test("setUserAndToken updates state and persists to localStorage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    act(() => {
      result.current.setUserAndToken(mockUser, "manual.token");
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("manual.token");
    expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(mockUser));
  });
});