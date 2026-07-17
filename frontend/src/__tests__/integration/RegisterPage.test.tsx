import { render, screen } from "@testing-library/react";
import RegisterPage from "@/app/register/page";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isInitializing: false,
  }),
}));

jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt} />;
});

describe("Register Page", () => {
  test("renders the registration form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", {
        name: /join shutter/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

    expect(
      screen.getByLabelText(/^password$/i)
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/confirm password/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /create account/i,
      })
    ).toBeInTheDocument();
  });
});