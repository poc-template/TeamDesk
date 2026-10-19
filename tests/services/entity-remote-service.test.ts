import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntityRemoteService } from "@/lib/services/entity-remote-service";

describe("EntityRemoteService.okpRealNRDProcess", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    // 服务在构造时读取该变量，测试内自给自足，避免依赖运行环境
    process.env.API_BASE_URL = "http://localhost:8088/app/execute";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("按约定组装审核请求体并 POST 到远端接口", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const service = new EntityRemoteService();

    await service.okpRealNRDProcess({ entityId: "ENT001", riskGrade: "MEDIUM" });

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:8088/app/execute");
    expect(options?.method).toBe("POST");

    const body = JSON.parse(String(options?.body));
    expect(body).toMatchObject({
      serviceId: "OKPRealNRDProcessApiService",
      action: "okpRealNRDProcess",
      entityId: "ENT001",
      bizType: "OGR_REVIEW",
      approveResult: "PASS",
      risk_grade: "MEDIUM",
    });
    // approveFinishTime 为当前时间，格式 YYYY-MM-DDTHH:mm:ss（无毫秒/时区）
    expect(body.approveFinishTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
