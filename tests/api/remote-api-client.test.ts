import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, RemoteApiClient } from "@/lib/api/api";

describe("RemoteApiClient", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let client: RemoteApiClient;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    client = new RemoteApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("发送 GET 请求并返回 JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "1" }), { status: 200 }),
    );

    await expect(client.get<{ id: string }>("/items/1")).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/items/1",
      expect.objectContaining({ method: "GET" }),
    );
    const [, options] = fetchMock.mock.calls[0]!;
    expect(new Headers(options?.headers).get("apikey")).toBe("publishable-key");
  });

  it.each(["POST", "PUT"] as const)("发送带 JSON 请求体的 %s 请求", async (method) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ saved: true }), { status: 200 }));
    const payload = { title: "Example" };

    const result =
      method === "POST"
        ? await client.post<{ saved: boolean }>("/items", payload)
        : await client.put<{ saved: boolean }>("/items/1", payload);

    expect(result).toEqual({ saved: true });
    const [, options] = fetchMock.mock.calls[0]!;
    expect(options?.method).toBe(method);
    expect(options?.body).toBe(JSON.stringify(payload));
    expect(new Headers(options?.headers).get("content-type")).toBe("application/json");
  });

  it("将非成功响应作为 ApiError 抛出", async () => {
    fetchMock.mockResolvedValue(new Response("Not found", { status: 404 }));

    await expect(client.get("/missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Not found",
      responseBody: "Not found",
    } satisfies Partial<ApiError>);
  });

  it("无内容响应返回 undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(client.put("/items/1", { title: "Updated" })).resolves.toBeUndefined();
  });

  it("未配置基础 URL 时给出明确错误", () => {
    expect(() => new RemoteApiClient("")).toThrow("请配置 API_BASE_URL");
  });
});
