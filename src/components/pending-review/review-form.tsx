"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RISK_GRADES, type RiskGrade } from "@/lib/domain/types";
import { apiSend, toErrorMessage } from "@/lib/web/api-client";

/** 一览跳转过来时携带的实体信息 */
export interface ReviewItem {
  entityId: string;
  entityName: string;
  riskCode: string;
  nrdDate: string;
}

const RISK_LABELS: Record<RiskGrade, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700";
const SELECT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500";

/** NRD Date 回显：无法解析时原样展示，空值显示占位符 */
function displayDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function ReviewForm({ item, back }: { item: ReviewItem; back?: string }) {
  const router = useRouter();
  // 回跳一览的目标地址：优先用一览带过来的筛选地址，缺失时退回默认一览
  const listUrl = back || "/pending-review";
  // 默认选中一览带过来的风险等级；不在可选范围内时回退到 MEDIUM
  const initialGrade: RiskGrade = (RISK_GRADES as readonly string[]).includes(item.riskCode)
    ? (item.riskCode as RiskGrade)
    : "MEDIUM";
  const [riskGrade, setRiskGrade] = useState<RiskGrade>(initialGrade);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await apiSend("/api/pending-review/approve", "POST", {
        entityId: item.entityId,
        riskGrade,
      });
      // 审核成功：按原筛选条件跳回一览并刷新，让服务端组件重新取数
      router.push(listUrl);
      router.refresh();
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Entity ID</span>
        <input value={item.entityId || "—"} readOnly className={FIELD_CLASS} />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Entity Name</span>
        <input value={item.entityName || "—"} readOnly className={FIELD_CLASS} />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">NRD Date</span>
        <input value={displayDate(item.nrdDate)} readOnly className={FIELD_CLASS} />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Risk Code</span>
        <select
          value={riskGrade}
          onChange={(event) => setRiskGrade(event.target.value as RiskGrade)}
          className={SELECT_CLASS}
        >
          {RISK_GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {grade} ({RISK_LABELS[grade]})
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-2 pt-2">
        <Button disabled={submitting || !item.entityId} onClick={submit}>
          {submitting ? "Reviewing…" : "Review"}
        </Button>
        <Button variant="secondary" onClick={() => router.push(listUrl)}>
          Back
        </Button>
      </div>
    </div>
  );
}
