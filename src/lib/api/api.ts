/**
 * 远端 API 服务标识：
 * - "base" 使用通用 API_BASE_URL
 * - "pbi" 供pbi机能使用
 * - "rob" 供rob机能使用
 */
export type ApiService = "base" | "pbi" | "rob";

type ApiRequestOptions = Omit<RequestInit, "body" | "method"> & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class RemoteApiClient {
  private readonly apiKey?: string = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // 已校验通过的地址缓存，避免每次请求重复校验；校验在首次发起远端请求时惰性执行
  private readonly validatedUrls = new Map<ApiService, string>();

  /** 解析指定服务对应的原始地址：base 使用通用地址，pbi/rob 可用独立地址覆盖后回退 */
  private rawBaseUrl(service: ApiService): string | undefined {
    switch (service) {
      case "base":
        return process.env.API_BASE_URL;
      case "pbi":
        return process.env.API_BASE_URL_PBI ?? process.env.API_BASE_URL;
      case "rob":
        return process.env.API_BASE_URL_ROB ?? process.env.API_BASE_URL;
    }
  }

  private resolveBaseUrl(service: ApiService): string {
    const cached = this.validatedUrls.get(service);
    if (cached !== undefined) return cached;
    const url = this.validateUrl(service, this.rawBaseUrl(service));
    this.validatedUrls.set(service, url);
    return url;
  }

  private validateUrl(service: ApiService, raw?: string): string {
    if (!raw?.trim()) {
      throw new Error(`请配置 API_BASE_URL（${service}）`);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(raw);
    } catch {
      throw new Error("API_BASE_URL 必须是有效的绝对 URL");
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("API_BASE_URL 必须使用 HTTP 或 HTTPS");
    }
    return raw;
  }

  get<T>(service: ApiService, path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(service, path, "GET", undefined, options);
  }

  post<T>(
    service: ApiService,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(service, path, "POST", body, options);
  }

  put<T>(
    service: ApiService,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(service, path, "PUT", body, options);
  }

  private async request<T>(
    service: ApiService,
    path: string,
    method: "GET" | "POST" | "PUT",
    body: unknown,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const baseUrl = this.resolveBaseUrl(service);
    const headers = new Headers(options.headers);
    if (body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    if (this.apiKey && !headers.has("apikey")) {
      headers.set("apikey", this.apiKey);
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    const url = path ? `${baseUrl}/${path.replace(/^\/+/, "")}` : baseUrl;
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      throw new ApiError(
        response.status === 401 ? "未认证" : responseBody || `请求失败（HTTP ${response.status}）`,
        response.status,
        responseBody || undefined,
      );
    }

    if (!responseBody) return undefined as T;

    try {
      return JSON.parse(responseBody) as T;
    } catch {
      throw new ApiError("远程 API 返回了无效的 JSON", response.status, responseBody);
    }
  }
}
