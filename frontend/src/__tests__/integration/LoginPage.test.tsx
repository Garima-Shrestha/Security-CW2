import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isInitializing: false,
    loginStepOne: jest.fn(),
    loginStepTwo: jest.fn(),
  }),
}));

describe("Login Page", () => {
  test("renders login form", () => {
    render(<LoginPage />);

    expect( screen.getByRole("heading", { name: /welcome back/i,})).toBeInTheDocument();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

    expect(
        screen.getByRole("button", {
            name: /sign in/i,
        })
    ).toBeInTheDocument();
  });
});