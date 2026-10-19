import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewButton } from "@/components/pending-review/review-button";
import { PendingReviewFilters } from "@/components/pending-review/pending-review-filters";
import type { PendingReviewItem } from "@/lib/domain/types";
import { getServices } from "@/lib/services/container";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function readParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() !== "" ? raw : undefined;
}

/** 风险等级标签样式 */
function RiskBadge({ code }: { code: string }) {
  const colorMap: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-green-100 text-green-700",
  };
  const cls = colorMap[code] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {code}
    </span>
  );
}

/** OGR 标记标签样式 */
function OgrBadge({ flag }: { flag: string }) {
  const isYes = flag?.toUpperCase() === "Y";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        isYes ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {flag ?? "—"}
    </span>
  );
}

/** 格式化日期 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default async function PendingReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const services = getServices();

  const keyword = readParam(params, "keyword");
  const riskCode = readParam(params, "riskCode");
  // OGR Flag：首次加载（参数不存在）默认 Y；用户选了"全部"时参数为空字符串，保持空
  const ogrFlagRaw = params["ogrFlag"];
  const ogrFlagRawStr = Array.isArray(ogrFlagRaw) ? ogrFlagRaw[0] : ogrFlagRaw;
  const ogrFlag = ogrFlagRawStr !== undefined ? (ogrFlagRawStr || "") : "Y";
  const sortParam = readParam(params, "sort");
  const sort: "entityName" | "entityRiskCode" | "nrdDate" =
    sortParam === "entityName" || sortParam === "entityRiskCode" || sortParam === "nrdDate"
      ? sortParam
      : "entityName";
  const order: "asc" | "desc" = readParam(params, "order") === "desc" ? "desc" : "asc";
  const pageSizeRaw = Number(readParam(params, "pageSize") ?? "20");
  const page = Number(readParam(params, "page") ?? "1");
  const pageSize = [20, 50, 100].includes(pageSizeRaw) ? pageSizeRaw : 20;

  let pendingReviewList: PendingReviewItem[] = [];
  try {
    const entityResult = await services.remoteEntity.getEntityList({
      page: 1,
      pageSize: 100,
      // 只有 Y 或 N 才传递给 API，空值不作为检索条件
      ogrFlag: ogrFlag === "Y" || ogrFlag === "N" ? ogrFlag : undefined,
    });
    pendingReviewList = entityResult.pendingReviewList;
  } catch (error) {
    console.warn("远程实体接口调用失败:", error);
  }

  // 关键词筛选：匹配 entityId 或 entityName
  let filtered = pendingReviewList;
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.entityId?.toLowerCase().includes(kw) ||
        item.entityName?.toLowerCase().includes(kw),
    );
  }

  // 风险等级筛选
  if (riskCode) {
    filtered = filtered.filter((item) => item.entityRiskCode === riskCode);
  }

  // 排序
  const riskOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sort === "entityName") {
      cmp = (a.entityName ?? "").localeCompare(b.entityName ?? "");
    } else if (sort === "entityRiskCode") {
      cmp = (riskOrder[a.entityRiskCode ?? ""] ?? 99) - (riskOrder[b.entityRiskCode ?? ""] ?? 99);
    } else if (sort === "nrdDate") {
      cmp = (a.nrdDate ?? "").localeCompare(b.nrdDate ?? "");
    }
    return order === "desc" ? -cmp : cmp;
  });

  // 分页
  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paged = filtered.slice(startIndex, startIndex + pageSize);

  // 回跳一览的地址：携带当前生效的筛选条件，供审核画面「返回/审核成功」后原样还原。
  // 用 URLSearchParams 以保留 ogrFlag 的空串（"全部"），避免被 buildQuery 丢弃。
  const backParams = new URLSearchParams();
  if (keyword) backParams.set("keyword", keyword);
  if (riskCode) backParams.set("riskCode", riskCode);
  backParams.set("ogrFlag", ogrFlag);
  backParams.set("sort", sort);
  backParams.set("order", order);
  backParams.set("pageSize", String(pageSize));
  backParams.set("page", String(page));
  const backUrl = `/pending-review?${backParams.toString()}`;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="筛选条件" description="组合条件后点击筛选，条件会写进地址栏便于分享" />
        <CardContent>
          <PendingReviewFilters
            defaultValues={{ keyword, riskCode, ogrFlag, sort, order, pageSize: String(pageSize) }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={`待审查一览（${total}）`} />
        <CardContent>
          {paged.length === 0 ? (
            <EmptyState
              title="暂无待审查项目"
              description="当前没有需要审核的实体，请稍后再查看"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Entity ID</th>
                    <th className="px-3 py-2 font-medium">Entity Name</th>
                    <th className="px-3 py-2 font-medium">Risk Code</th>
                    <th className="px-3 py-2 font-medium">NRD Date</th>
                    <th className="px-3 py-2 font-medium">OGR Flag</th>
                    <th className="px-5 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((item, index) => (
                    <tr key={item.entityId ?? index} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {item.entityId ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.entityName ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge code={item.entityRiskCode ?? ""} />
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDate(item.nrdDate)}
                      </td>
                      <td className="px-3 py-3">
                        <OgrBadge flag={item.ogrFlag ?? ""} />
                      </td>
                      <td className="px-5 py-3">
                        <ReviewButton item={item} back={backUrl} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/pending-review"
          filters={{ keyword, riskCode, ogrFlag, sort, order, pageSize: String(pageSize) }}
        />
      </Card>
    </div>
  );
}
