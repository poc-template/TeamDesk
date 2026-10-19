/**
 * 领域模型定义：只描述业务概念，不涉及任何存储与传输细节。
 */

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const USER_ROLES = ["admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** 风险评级：审核时可在 HIGH / MEDIUM / LOW 之间选择 */
export const RISK_GRADES = ["HIGH", "MEDIUM", "LOW"] as const;
export type RiskGrade = (typeof RISK_GRADES)[number];

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

/** 对外暴露的用户信息，永远不包含密码哈希 */
export type PublicUser = Omit<UserRecord, "passwordHash">;

export interface TicketRecord {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  reporterId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface CommentRecord {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface TagRecord {
  id: string;
  name: string;
  color: string;
}

/** 工单详情：附带关联对象，供详情页与接口直接消费 */
export interface TicketDetail extends TicketRecord {
  reporter: PublicUser | null;
  assignee: PublicUser | null;
  tags: TagRecord[];
  commentCount: number;
}

/** 列表查询条件，全部可选；由 repository 负责翻译成 SQL */
export interface TicketQuery {
  keyword?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  reporterId?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
  sort?: "created_at" | "updated_at" | "priority";
  order?: "asc" | "desc";
}

/** 远程实体查询条件 */
export interface EntityQuery {
  page?: number;
  pageSize?: number;
  /** OGR 筛选条件：Y / N，不传则不作为检索条件 */
  ogrFlag?: string;
}

/** 远程实体：结构由远端 API 决定，本地只做透传 */
export interface EntityDetail {
  id: string;
  [key: string]: unknown;
}

/** 待审查项目：来自远程 API 的 pendingReviewList */
export interface PendingReviewItem {
  entityId: string;
  entityName: string;
  entityRiskCode: string;
  nrdDate: string;
  ogrFlag: string;
  [key: string]: unknown;
}

/** 远程实体服务返回结果：包含分页数据与待审查列表 */
export interface EntityListResult {
  paginated: Paginated<EntityDetail>;
  pendingReviewList: PendingReviewItem[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
