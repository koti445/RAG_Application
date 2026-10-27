import Link from "next/link";
import {
  BookOpen,
  FlaskConical,
  FolderKanban,
  MessageSquare,
  Network,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireUser } from "@/lib/auth/get-user";

const quickLinks = [
  { label: "Knowledge Bases", href: "/knowledge", icon: BookOpen, desc: "Manage documents & indexes" },
  { label: "RAG", href: "/rag", icon: Network, desc: "Design, configure & validate pipelines" },
  { label: "Playground", href: "/playground", icon: MessageSquare, desc: "Test & compare variants" },
  { label: "Evaluation", href: "/evaluation", icon: FlaskConical, desc: "Batch quality metrics" },
];

export default async function HomePage() {
  const user = await requireUser();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-content-primary">
          Welcome back, {user.full_name || user.email.split("@")[0]}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Design, configure, and evaluate your RAG pipelines from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Projects" value={0} icon={FolderKanban} trend="Create your first project" />
        <MetricCard label="Knowledge Bases" value={0} icon={BookOpen} />
        <MetricCard label="Documents" value={0} icon={BookOpen} />
        <MetricCard label="Pipeline Runs" value={0} icon={TrendingUp} trend="Last 7 days" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="enterprise-panel group p-4 transition-colors hover:border-accent/30 hover:bg-surface-hover"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted group-hover:bg-accent/20">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <h3 className="mt-3 font-medium text-content-primary">{link.label}</h3>
                <p className="mt-1 text-xs text-content-muted">{link.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="enterprise-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-content-secondary">Signed in as</p>
            <p className="font-medium text-content-primary">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="accent">{user.auth_provider}</Badge>
            {user.email_verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
