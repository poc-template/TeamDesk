import Link from "next/link";
import { buildQuery } from "@/lib/web/query";
import type { PendingReviewItem } from "@/lib/domain/types";

/**
 * 审核入口：跳转到审核画面，通过查询串携带一览选中行的数据，
 * 供审核画面回显 Entity ID / Entity Name / Risk Code / NRD Date。
 * back 为当前一览的完整筛选地址，审核画面据此还原筛选条件回跳。
 */
export function ReviewButton({ item, back }: { item: PendingReviewItem; back?: string }) {
  const href = `/pending-review/review${buildQuery({
    entityId: item.entityId,
    entityName: item.entityName,
    riskCode: item.entityRiskCode,
    nrdDate: item.nrdDate,
    back,
  })}`;

  // OGR Flag 为 N 的数据不可审核，按钮置为非活性
  if (item.ogrFlag?.toUpperCase() === "N") {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-md bg-slate-200 px-3 py-1 text-xs font-medium text-slate-400"
      >
        审核
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="inline-block rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
    >
      审核
    </Link>
  );
}
