import axios from "axios";
import { getCsrfToken, clearCsrfToken } from "@/lib/csrf";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("CSRF Helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCsrfToken();
  });

  test("fetches a CSRF token from the server", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        csrfToken: "csrf-token-123",
      },
    });

    const token = await getCsrfToken();

    expect(token).toBe("csrf-token-123");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test("returns the cached token on subsequent calls", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        csrfToken: "cached-token",
      },
    });

    const first = await getCsrfToken();
    const second = await getCsrfToken();

    expect(first).toBe("cached-token");
    expect(second).toBe("cached-token");

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test("fetches a new token after cache is cleared", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          csrfToken: "first-token",
        },
      })
      .mockResolvedValueOnce({
        data: {
          csrfToken: "second-token",
        },
      });

    const first = await getCsrfToken();

    clearCsrfToken();

    const second = await getCsrfToken();

    expect(first).toBe("first-token");
    expect(second).toBe("second-token");

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test("calls the correct CSRF endpoint", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        csrfToken: "token",
      },
    });

    await getCsrfToken();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/csrf-token"),
      { withCredentials: true }
    );
  });

  test("propagates server errors", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));

    await expect(getCsrfToken()).rejects.toThrow("Network Error");
  });

  test("clearCsrfToken removes the cached token", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          csrfToken: "token-one",
        },
      })
      .mockResolvedValueOnce({
        data: {
          csrfToken: "token-two",
        },
      });

    await getCsrfToken();

    clearCsrfToken();

    const token = await getCsrfToken();

    expect(token).toBe("token-two");
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});