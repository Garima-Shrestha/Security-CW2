import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next/link", () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;

describe("Navbar", () => {
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUsePathname.mockReturnValue("/equipment");

    mockedUseAuth.mockReturnValue({
      user: {
        username: "John",
        role: "user",
      },
      logout,
    });
  });

  test("does not render when no user is logged in", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      logout,
    });

    const { container } = render(<Navbar />);

    expect(container.firstChild).toBeNull();
  });

  test("does not render on login page", () => {
    mockedUsePathname.mockReturnValue("/login");

    const { container } = render(<Navbar />);

    expect(container.firstChild).toBeNull();
  });

  test("renders user navigation links", () => {
    render(<Navbar />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("My Rentals")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  test("renders admin navigation links", () => {
    mockedUseAuth.mockReturnValue({
      user: {
        username: "Admin",
        role: "admin",
      },
      logout,
    });

    render(<Navbar />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Rentals")).toBeInTheDocument();
  });

  test("opens dropdown when user menu is clicked", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Account Details")).toBeInTheDocument();
    expect(screen.getByText("MFA")).toBeInTheDocument();
  });

  test("calls logout when Logout button is clicked", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    fireEvent.click(screen.getByText("Logout"));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});