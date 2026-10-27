"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresIn = searchParams.get("expires_in") || "1800";

    if (!accessToken || !refreshToken) {
      setError("OAuth authentication failed. Missing tokens.");
      return;
    }

    fetch("/api/auth/oauth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: parseInt(expiresIn, 10),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to complete OAuth login");
        }
        router.replace("/home");
        router.refresh();
      })
      .catch((err) => setError(err.message));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
          <p className="font-medium">Authentication failed</p>
          <p className="mt-1 text-sm">{error}</p>
          <a href="/login" className="mt-3 inline-block text-sm font-medium text-brand-600">
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">Loading...</p>}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
