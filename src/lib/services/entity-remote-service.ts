import { RemoteApiClient } from "@/lib/api/api";
import type { EntityQuery, EntityDetail, EntityListResult, PendingReviewItem } from "@/lib/domain/types";

export class EntityRemoteService {
  private readonly apiClient: RemoteApiClient;

  constructor() {
    this.apiClient = new RemoteApiClient();
  }

  async getEntityList(query: EntityQuery): Promise<EntityListResult> {
    const raw = await this.apiClient.post<{
      items?: EntityDetail[];
      pendingReviewList?: PendingReviewItem[];
      [key: string]: unknown;
    }>("", {
      serviceId: "queryPendingOgrReviewListApiService",
      action: "queryPendingOgrReviewList",
      ogrFlag: "Y",
    });

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
}
