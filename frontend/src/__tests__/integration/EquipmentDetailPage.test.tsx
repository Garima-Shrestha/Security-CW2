import { render, screen, waitFor } from "@testing-library/react";
import EquipmentDetailPage from "@/app/equipment/[id]/page";
import api from "@/lib/axios";

const mockPush = jest.fn();

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

jest.mock("next/navigation", () => ({
  useParams: () => ({
    id: "1",
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockEquipment = {
  _id: "1",
  title: "Canon EOS R5",
  brand: "Canon",
  model: "R5",
  category: {
    name: "Camera",
  },
  condition: "Excellent",
  description: "Professional mirrorless camera.",
  specs: {
    Resolution: "45 MP",
    Weight: "738 g",
  },
  dailyRate: 5000,
  depositAmount: 10000,
  isBooked: false,
  images: ["/camera.jpg"],
};

describe("Equipment Detail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders equipment details returned from the API", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockEquipment,
      },
    });

    render(<EquipmentDetailPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Canon EOS R5" })).toBeInTheDocument();
    });

    expect(screen.getByText("Professional mirrorless camera.")).toBeInTheDocument();

    expect(screen.getByText("Canon")).toBeInTheDocument();

    expect(screen.getByText("R5")).toBeInTheDocument();

    expect(screen.getByText("Camera")).toBeInTheDocument();

    expect(screen.getByText("Excellent")).toBeInTheDocument();

    expect(screen.getByText(/Rs\. 5000/i)).toBeInTheDocument();

    expect(screen.getByText(/Rs\. 10000/i)).toBeInTheDocument();

    expect(screen.getByText("In Stock")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /rent this equipment/i,
      })
    ).toBeInTheDocument();
  });
});