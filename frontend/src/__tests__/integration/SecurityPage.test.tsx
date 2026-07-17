import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SecurityPage from "@/app/settings/security/page";
import api from "@/lib/axios";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      username: "John",
      isTotpEnabled: false,
    },
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe("Security Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("starts MFA setup and displays QR code", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          qrCode: "/qr.png",
          secret: "ABC123SECRET",
        },
      },
    });

    render(<SecurityPage />);

    expect(
      screen.getByRole("heading", {
        name: /two-factor authentication/i,
      })
    ).toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: /enable mfa/i,
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/auth/totp/setup");
    });

    expect(screen.getByAltText(/totp qr code/i)).toBeInTheDocument();

    expect(
      screen.getByText(/ABC123SECRET/i)
    ).toBeInTheDocument();
  });
});