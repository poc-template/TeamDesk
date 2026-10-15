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
  private readonly baseUrl?: string = process.env.API_BASE_URL;
  private readonly apiKey?: string = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  constructor(
  ) {
    if (!this.baseUrl?.trim()) {
      throw new Error("请配置 API_BASE_URL");
    }

    let parsedBaseUrl: URL;
    try {
      parsedBaseUrl = new URL(this.baseUrl);
    } catch {
      throw new Error("API_BASE_URL 必须是有效的绝对 URL");
    }
    if (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") {
      throw new Error("API_BASE_URL 必须使用 HTTP 或 HTTPS");
    }
  }

  get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, "GET", undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, "POST", body, options);
  }

  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, "PUT", body, options);
  }

  private async request<T>(
    path: string,
    method: "GET" | "POST" | "PUT",
    body: unknown,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    if (this.apiKey && !headers.has("apikey")) {
      headers.set("apikey", this.apiKey);
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    const response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, "")}`, {
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
