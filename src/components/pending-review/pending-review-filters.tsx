/**
 * 待审查一览筛选表单：原生 GET 表单提交，条件写进查询串，
 * 服务端组件直接从 searchParams 读取。
 */
import Link from "next/link";

export interface PendingReviewFiltersProps {
  defaultValues: {
    keyword?: string;
    riskCode?: string;
    ogrFlag?: string;
    sort?: string;
    order?: string;
    pageSize?: string;
  };
}

const SELECT_CLASS =
  "h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:border-blue-500";

const RISK_CODES = ["HIGH", "MEDIUM", "LOW"] as const;
const RISK_LABELS: Record<string, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

const OGR_FLAGS = ["Y", "N"] as const;
const OGR_LABELS: Record<string, string> = {
  Y: "是",
  N: "否",
};

export function PendingReviewFilters({ defaultValues }: PendingReviewFiltersProps) {
  return (
    <form method="get" action="/pending-review" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        关键词
        <input
          type="search"
          name="keyword"
          defaultValue={defaultValues.keyword ?? ""}
          placeholder="Entity ID 或名称"
          className="h-9 w-56 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        风险等级
        <select name="riskCode" defaultValue={defaultValues.riskCode ?? ""} className={SELECT_CLASS}>
          <option value="">全部</option>
          {RISK_CODES.map((code) => (
            <option key={code} value={code}>
              {RISK_LABELS[code]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        OGR Flag
        <select name="ogrFlag" defaultValue={defaultValues.ogrFlag ?? ""} className={SELECT_CLASS}>
          <option value="">全部</option>
          {OGR_FLAGS.map((flag) => (
            <option key={flag} value={flag}>
              {OGR_LABELS[flag]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        排序
        <select name="sort" defaultValue={defaultValues.sort ?? "entityName"} className={SELECT_CLASS}>
          <option value="entityName">按 Entity Name</option>
          <option value="entityRiskCode">按风险等级</option>
          <option value="nrdDate">按 NRD Date</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        方向
        <select name="order" defaultValue={defaultValues.order ?? "asc"} className={SELECT_CLASS}>
          <option value="asc">升序</option>
          <option value="desc">降序</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        每页
        <select name="pageSize" defaultValue={defaultValues.pageSize ?? "20"} className={SELECT_CLASS}>
          <option value="20">20 条</option>
          <option value="50">50 条</option>
          <option value="100">100 条</option>
        </select>
      </label>

      <button
        type="submit"
        className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        筛选
      </button>
      <Link
        href="/pending-review"
        className="h-9 rounded-md bg-white px-4 text-sm leading-9 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        重置
      </Link>
    </form>
  );
}
