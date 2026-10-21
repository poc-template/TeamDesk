import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // 已登录就不再展示登录页
  if (await getCurrentUser()) {
    redirect("/top");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            U
          </span>
          <span className="text-lg font-semibold text-slate-900">UOB Service</span>
        </div>

        <Card>
          <CardHeader title="Sign in to UOB Service" description="Sign in with your email, or register a new account" />
          <CardContent>
            <AuthForm nextPath="/top" />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
        </p>
      </div>
    </div>
  );
}
