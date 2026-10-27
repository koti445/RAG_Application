import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/api/backend";

/**
 * Resolve the current user via the BFF route handler.
 * Cookie reads/writes stay in Route Handlers — Server Components must not mutate cookies.
 */
async function fetchUser(): Promise<User | null> {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  if (!cookie) return null;

  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/auth/me`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { user: User };
  return data.user;
}

/** Cached per request — layout + page share one auth lookup. */
export const getUser = cache(fetchUser);

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
