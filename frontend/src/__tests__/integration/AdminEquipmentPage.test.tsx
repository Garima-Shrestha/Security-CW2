import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminEquipmentPage from "@/app/admin/equipment/page";
import api from "@/lib/axios";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn(),
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
    dailyRate: 5000,
    isActive: true,
    images: ["/camera.jpg"],
    category: {
      _id: "cat1",
      name: "Camera",
    },
  },
];

describe("Admin Equipment Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockEquipment,
        pagination: {
          totalPages: 1,
        },
      },
    });
  });

  test("renders equipment returned from the API", async () => {
    render(<AdminEquipmentPage />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Canon EOS R5")).toBeInTheDocument();
    });

    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Canon · R5")).toBeInTheDocument();
    expect(screen.getByText("Rs. 5000")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("opens delete confirmation modal", async () => {
    render(<AdminEquipmentPage />);

    await waitFor(() => {
      expect(screen.getByText("Canon EOS R5")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /delete canon eos r5/i,
      })
    );

    expect(
      screen.getByText(/Delete equipment\?/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Are you sure you want to delete/i)
    ).toBeInTheDocument();
  });

  test("deletes equipment when confirmed", async () => {
    (api.delete as jest.Mock).mockResolvedValue({});

    render(<AdminEquipmentPage />);

    await waitFor(() => {
      expect(screen.getByText("Canon EOS R5")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /delete canon eos r5/i,
      })
    );

    fireEvent.click(screen.getByText(/^Delete$/));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/equipment/1");
    });
  });
});