import api, { setAuthToken } from "@/lib/axios";
import * as csrf from "@/lib/csrf";

jest.mock("@/lib/csrf", () => ({
  getCsrfToken: jest.fn(),
}));

describe("Axios Instance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
  });

  test("sets the auth token", async () => {
    setAuthToken("jwt.token");

    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "get",
      url: "/api/test",
    });

    expect(config.headers.Authorization).toBe("Bearer jwt.token");
  });

  test("does not set Authorization header when token is null", async () => {
    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "get",
      url: "/api/test",
    });

    expect(config.headers.Authorization).toBeUndefined();
  });

  test("adds CSRF token for Google OAuth POST request", async () => {
    (csrf.getCsrfToken as jest.Mock).mockResolvedValue("csrf123");

    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "post",
      url: "/api/auth/google",
    });

    expect(csrf.getCsrfToken).toHaveBeenCalledTimes(1);
    expect(config.headers["X-CSRF-Token"]).toBe("csrf123");
  });

  test("does not request CSRF token for GET request", async () => {
    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    await handler({
      headers: {},
      method: "get",
      url: "/api/auth/google",
    });

    expect(csrf.getCsrfToken).not.toHaveBeenCalled();
  });

  test("does not request CSRF token for non-Google routes", async () => {
    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    await handler({
      headers: {},
      method: "post",
      url: "/api/login",
    });

    expect(csrf.getCsrfToken).not.toHaveBeenCalled();
  });

  test("adds both Authorization and CSRF headers together", async () => {
    setAuthToken("jwt.token");
    (csrf.getCsrfToken as jest.Mock).mockResolvedValue("csrf456");

    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "post",
      url: "/api/auth/google",
    });

    expect(config.headers.Authorization).toBe("Bearer jwt.token");
    expect(config.headers["X-CSRF-Token"]).toBe("csrf456");
  });

  test("supports PUT requests for Google OAuth", async () => {
    (csrf.getCsrfToken as jest.Mock).mockResolvedValue("csrf789");

    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "put",
      url: "/api/auth/google",
    });

    expect(config.headers["X-CSRF-Token"]).toBe("csrf789");
  });

  test("supports DELETE requests for Google OAuth", async () => {
    (csrf.getCsrfToken as jest.Mock).mockResolvedValue("csrf999");

    const handler = (api.interceptors.request as any).handlers[0].fulfilled;

    const config = await handler({
      headers: {},
      method: "delete",
      url: "/api/auth/google",
    });

    expect(config.headers["X-CSRF-Token"]).toBe("csrf999");
  });
});