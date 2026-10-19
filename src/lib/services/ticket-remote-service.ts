import { RemoteApiClient } from "@/lib/api/api";
import type { TicketQuery, TicketDetail, Paginated } from "@/lib/domain/types";

export class TicketRemoteService {
  private readonly apiClient: RemoteApiClient;

  constructor() {
    this.apiClient = new RemoteApiClient();
  }

  async list(query: TicketQuery): Promise<Paginated<TicketDetail>> {
    const result = await this.apiClient.get<TicketDetail[]>("base", "/tickets", query as any);
    return {
      items: result,
      total: result.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? result.length,
    };
  }
}
