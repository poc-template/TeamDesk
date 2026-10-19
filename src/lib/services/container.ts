import { getDb, type Db } from "@/lib/db/connection";
import { CommentRepository } from "@/lib/repositories/comment-repository";
import { StatsRepository } from "@/lib/repositories/stats-repository";
import { TagRepository } from "@/lib/repositories/tag-repository";
import { TicketRepository } from "@/lib/repositories/ticket-repository";
import { UserRepository } from "@/lib/repositories/user-repository";
import { StatsService } from "./stats-service";
import { TagService } from "./tag-service";
import { TicketService } from "./ticket-service";
import { UserService } from "./user-service";

import { TicketRemoteService } from "./ticket-remote-service";
import { EntityRemoteService } from "./entity-remote-service";

export interface Services {
  tickets: TicketService;
  tags: TagService;
  users: UserService;
  stats: StatsService;
  remoteTickets: TicketRemoteService;
  remoteEntity: EntityRemoteService;
}

export function createServices(db: Db): Services {
  const users = new UserService(new UserRepository(db));
  const tags = new TagRepository(db);
  const comments = new CommentRepository(db);
  const tickets = new TicketRepository(db);

  return {
    tickets: new TicketService({ tickets, comments, tags, users }),
    tags: new TagService(tags),
    users,
    stats: new StatsService(new StatsRepository(db)),
    remoteTickets: new TicketRemoteService(),
    remoteEntity: new EntityRemoteService(),
  };
}

/** 复用进程内数据库单例 */
export function getServices(): Services {
  return createServices(getDb());
}
