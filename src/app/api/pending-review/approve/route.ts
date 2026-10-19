import type { NextRequest } from "next/server";
import { handle } from "@/lib/api/response";
import { parseOrThrow, readJsonBody } from "@/lib/api/validate";
import { requireUser } from "@/lib/auth/current-user";
import { ogrReviewSchema } from "@/lib/domain/validation";
import { getServices } from "@/lib/services/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 审核提交：校验入参后转发到远端 OKPRealNRDProcess 接口 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireUser();
    const payload = parseOrThrow(ogrReviewSchema, await readJsonBody(request));
    return getServices().remoteEntity.okpRealNRDProcess(payload);
  });
}
