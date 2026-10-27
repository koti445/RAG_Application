import { EnterpriseShell } from "@/components/enterprise/EnterpriseShell";
import { requireUser } from "@/lib/auth/get-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <EnterpriseShell user={user}>{children}</EnterpriseShell>;
}
