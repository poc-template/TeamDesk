import { RemoteApiClient } from "@/lib/api/api";
import type { TicketQuery, TicketDetail, Paginated } from "@/lib/domain/types";

export class TicketRemoteService {
  private readonly apiClient: RemoteApiClient;

  constructor() {
    this.apiClient = new RemoteApiClient();
  }

  async list(query: TicketQuery): Promise<Paginated<TicketDetail>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    const path = qs ? `/tickets?${qs}` : "/tickets";
    const result = await this.apiClient.get<TicketDetail[]>("base", path);
    return {
      items: result,
      total: result.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? result.length,
    };
  }
}
