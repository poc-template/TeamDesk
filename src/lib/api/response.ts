/**
 * 接口协议层：统一成功/失败响应结构，把 AppError 翻译成 HTTP 状态码。
 * 业务代码只管抛 AppError，不感知 HTTP。
 */
import { NextResponse } from "next/server";
import { isAppError } from "@/lib/domain/errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: unknown): NextResponse<ApiFailure> {
  if (isAppError(error)) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  // Unexpected exceptions do not leak stack traces or internals; only logged server-side
  console.error("[api] Unhandled exception", error);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

/** 包裹 handler：统一做异常捕获与响应包装 */
export async function handle<T>(fn: () => T | Promise<T>): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
