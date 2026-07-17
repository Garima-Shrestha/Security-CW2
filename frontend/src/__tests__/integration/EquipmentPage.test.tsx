import { render, screen, waitFor } from "@testing-library/react";
import EquipmentPage from "@/app/equipment/page";
import api from "@/lib/axios";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("next/link", () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

const mockEquipment = [
  {
    _id: "1",
    title: "Canon EOS R5",
    brand: "Canon",
    model: "R5",
    condition: "Excellent",
    dailyRate: 5000,
    images: ["/camera.jpg"],
  },
];

describe("Equipment Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders equipment returned from the API", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockEquipment,
        pagination: {
          totalPages: 1,
        },
      },
    });

    render(<EquipmentPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText("Canon EOS R5")).toBeInTheDocument();
    });

    expect(
        screen.getByText("Canon · R5 · Excellent")
    ).toBeInTheDocument();

    expect(screen.getByText(/Rs. 5000\/day/i)).toBeInTheDocument();
  });
});