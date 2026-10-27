import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="hidden w-1/2 flex-col justify-between bg-surface-raised p-12 lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-white">R</div>
            <span className="text-xl font-semibold text-content-primary">RAG Platform</span>
          </div>
          <p className="mt-8 max-w-md text-lg text-content-secondary">
            Enterprise platform to design, configure, ingest, and evaluate RAG pipelines with visual workflows and A/B testing.
          </p>
        </div>
        <p className="text-sm text-content-muted">© {new Date().getFullYear()} RAG Platform</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-bold text-white text-sm">R</div>
              <span className="text-lg font-semibold text-content-primary">RAG Platform</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-content-primary">{title}</h1>
          <p className="mt-2 text-sm text-content-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-content-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
