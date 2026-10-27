"use client";

import { useEffect, useState } from "react";
import { backendApi, type OAuthProvider } from "@/lib/api/backend";

const PROVIDER_STYLES: Record<string, string> = {
  google: "border-slate-300 hover:bg-slate-50",
  github: "border-slate-800 bg-slate-900 text-white hover:bg-slate-800",
  microsoft: "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
};

const PROVIDER_ICONS: Record<string, string> = {
  google: "G",
  github: "GH",
  microsoft: "MS",
};

export function OAuthButtons() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    backendApi.getOAuthProviders().then((res) => {
      setProviders(res.providers.filter((p) => p.enabled));
    }).catch(() => setProviders([]));
  }, []);

  if (providers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="grid gap-3">
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={backendApi.getOAuthUrl(provider.id)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${PROVIDER_STYLES[provider.id] || "border-slate-300 hover:bg-slate-50"}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold">
              {PROVIDER_ICONS[provider.id] || provider.name[0]}
            </span>
            Continue with {provider.name}
          </a>
        ))}
      </div>
    </div>
  );
}
