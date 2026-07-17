import { render, screen, waitFor } from "@testing-library/react";
import RentalPage from "@/app/rentals/page";
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

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => (
    <a href={href}>{children}</a>
  ),
}));

const mockRentals = [
  {
    _id: "1",
    startDate: "2026-07-01",
    endDate: "2026-07-05",
    rentalAmount: 5000,
    depositAmount: 10000,
    status: "confirmed",
    equipment: {
      title: "Canon EOS R5",
      images: ["/camera.jpg"],
    },
  },
];

describe("Rental Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders rentals returned from the API", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockRentals,
        pagination: {
          totalPages: 1,
        },
      },
    });

    render(<RentalPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Canon EOS R5")).toBeInTheDocument();
    });

    expect(screen.getByText("confirmed")).toBeInTheDocument();

    expect(screen.getByText("Rs. 15000")).toBeInTheDocument();
  });
});