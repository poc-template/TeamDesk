import { RemoteApiClient } from "@/lib/api/api";
import type {
  EntityQuery,
  EntityDetail,
  EntityListResult,
  PendingReviewItem,
  RiskGrade,
} from "@/lib/domain/types";

/** 把当前时间格式化为 `YYYY-MM-DDTHH:mm:ss`（本地时间，无毫秒/时区），对齐远端接口示例 */
function formatApproveFinishTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export class EntityRemoteService {
  private readonly apiClient: RemoteApiClient;

  constructor() {
    this.apiClient = new RemoteApiClient();
  }

  async getEntityList(query: EntityQuery): Promise<EntityListResult> {
    const body: Record<string, unknown> = {
      serviceId: "queryPendingOgrReviewListApiService",
      action: "queryPendingOgrReviewList",
    };
    // ogrFlag 有值时才传递给 API，空值不作为检索条件
    if (query.ogrFlag) {
      body.ogrFlag = query.ogrFlag;
    }

    const raw = await this.apiClient.post<{
      items?: EntityDetail[];
      pendingReviewList?: PendingReviewItem[];
      [key: string]: unknown;
    }>("pbi", "", body);

    const items = (raw.items ?? []) as EntityDetail[];
    const pendingReviewList = (raw.pendingReviewList ?? []) as PendingReviewItem[];

    return {
      paginated: {
        items,
        total: items.length,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? items.length,
      },
      pendingReviewList,
    };
  }

  /**
   * OGR 审核处理：bizType / approveResult 为固定值，risk_grade 取画面选定的风险评级，
   * approveFinishTime 取提交时刻的当前时间。
   */
  async okpRealNRDProcess(input: {
    entityId: string;
    riskGrade: RiskGrade;
  }): Promise<unknown> {
    const body = {
      serviceId: "OKPRealNRDProcessApiService",
      action: "okpRealNRDProcess",
      entityId: input.entityId,
      bizType: "OGR_REVIEW",
      approveResult: "PASS",
      risk_grade: input.riskGrade,
      approveFinishTime: formatApproveFinishTime(new Date()),
    };

    return this.apiClient.post<unknown>("pbi", "", body);
  }
}
