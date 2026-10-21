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
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const OGR_FLAGS = ["Y", "N"] as const;
const OGR_LABELS: Record<string, string> = {
  Y: "Yes",
  N: "No",
};

export function PendingReviewFilters({ defaultValues }: PendingReviewFiltersProps) {
  return (
    <form method="get" action="/pending-review" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Keyword
        <input
          type="search"
          name="keyword"
          defaultValue={defaultValues.keyword ?? ""}
          placeholder="Entity ID or name"
          className="h-9 w-56 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Risk Level
        <select name="riskCode" defaultValue={defaultValues.riskCode ?? ""} className={SELECT_CLASS}>
          <option value="">All</option>
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
          <option value="">All</option>
          {OGR_FLAGS.map((flag) => (
            <option key={flag} value={flag}>
              {OGR_LABELS[flag]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Sort
        <select name="sort" defaultValue={defaultValues.sort ?? "entityName"} className={SELECT_CLASS}>
          <option value="entityName">By Entity Name</option>
          <option value="entityRiskCode">By Risk Level</option>
          <option value="nrdDate">By NRD Date</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Order
        <select name="order" defaultValue={defaultValues.order ?? "asc"} className={SELECT_CLASS}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Per page
        <select name="pageSize" defaultValue={defaultValues.pageSize ?? "20"} className={SELECT_CLASS}>
          <option value="20">20 items</option>
          <option value="50">50 items</option>
          <option value="100">100 items</option>
        </select>
      </label>

      <button
        type="submit"
        className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        Filter
      </button>
      <Link
        href="/pending-review"
        className="h-9 rounded-md bg-white px-4 text-sm leading-9 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        Reset
      </Link>
    </form>
  );
}
