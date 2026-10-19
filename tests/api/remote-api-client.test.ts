import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, RemoteApiClient } from "@/lib/api/api";

describe("RemoteApiClient", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let client: RemoteApiClient;

  beforeEach(() => {
    // 客户端在构造时读取环境变量，测试内自给自足，避免依赖运行环境
    process.env.API_BASE_URL = "https://api.example.com";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    client = new RemoteApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_BASE_URL;
    delete process.env.API_BASE_URL_PBI;
    delete process.env.API_BASE_URL_ROB;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("发送 GET 请求并返回 JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "1" }), { status: 200 }),
    );

    await expect(client.get<{ id: string }>("pbi", "/items/1")).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/items/1",
      expect.objectContaining({ method: "GET" }),
    );
    const [, options] = fetchMock.mock.calls[0]!;
    expect(new Headers(options?.headers).get("apikey")).toBe("publishable-key");
  });

  it("根据 service 选择对应的基础 URL", async () => {
    process.env.API_BASE_URL_ROB = "https://rob.example.com";
    const scopedClient = new RemoteApiClient();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await scopedClient.get("rob", "/items/1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rob.example.com/items/1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it.each(["POST", "PUT"] as const)("发送带 JSON 请求体的 %s 请求", async (method) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ saved: true }), { status: 200 }));
    const payload = { title: "Example" };

    const result =
      method === "POST"
        ? await client.post<{ saved: boolean }>("pbi", "/items", payload)
        : await client.put<{ saved: boolean }>("pbi", "/items/1", payload);

    expect(result).toEqual({ saved: true });
    const [, options] = fetchMock.mock.calls[0]!;
    expect(options?.method).toBe(method);
    expect(options?.body).toBe(JSON.stringify(payload));
    expect(new Headers(options?.headers).get("content-type")).toBe("application/json");
  });

  it("将非成功响应作为 ApiError 抛出", async () => {
    fetchMock.mockResolvedValue(new Response("Not found", { status: 404 }));

    await expect(client.get("pbi", "/missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Not found",
      responseBody: "Not found",
    } satisfies Partial<ApiError>);
  });

  it("无内容响应返回 undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(client.put("pbi", "/items/1", { title: "Updated" })).resolves.toBeUndefined();
  });

  it("未配置基础 URL 时构造不报错，首次请求才惰性抛出带服务名的错误", async () => {
    delete process.env.API_BASE_URL;
    // 仅引入/构造不应抛错（例如 container.ts 被加载但不发起远端调用）
    const lazyClient = new RemoteApiClient();
    // 首次真正发起请求时才校验并报错
    await expect(lazyClient.get("base", "/items")).rejects.toThrow("请配置 API_BASE_URL（base）");
    await expect(lazyClient.get("pbi", "/items")).rejects.toThrow("请配置 API_BASE_URL（pbi）");
  });
});
