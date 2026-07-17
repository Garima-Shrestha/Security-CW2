import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("ProtectedRoute", () => {
  const replaceMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });
  });

  test("renders nothing while auth is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("redirects to /login when there is no authenticated user", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  test("renders children when a regular user is authenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: "user" },
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(await screen.findByText("Protected Content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("redirects a non-admin user away from an admin-only route", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: "user" },
      isLoading: false,
    });

    render(
      <ProtectedRoute adminOnly>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  test("renders children when an admin user accesses an admin-only route", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: "admin" },
      isLoading: false,
    });

    render(
      <ProtectedRoute adminOnly>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(await screen.findByText("Admin Content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});