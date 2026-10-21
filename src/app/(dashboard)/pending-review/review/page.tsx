import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReviewForm } from "@/components/pending-review/review-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function readParam(params: SearchParams, key: string): string {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? "";
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const item = {
    entityId: readParam(params, "entityId"),
    entityName: readParam(params, "entityName"),
    riskCode: readParam(params, "riskCode"),
    nrdDate: readParam(params, "nrdDate"),
  };
  // 一览带过来的完整筛选地址（已含查询串），回跳时原样使用以保留筛选条件
  const back = readParam(params, "back");

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-500">Pending Review / Review</div>
      <Card>
        <CardHeader
          title="Review"
          description="Confirm the entity details and select a risk grade, then click Review to submit the result"
        />
        <CardContent>
          <ReviewForm item={item} back={back} />
        </CardContent>
      </Card>
    </div>
  );
}
