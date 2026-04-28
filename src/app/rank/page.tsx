import { redirect } from "next/navigation";

export default async function RankRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string }>;
}) {
  const params = await searchParams;
  const parts: string[] = [];
  if (params.q) parts.push(`q=${encodeURIComponent(params.q)}`);
  if (params.period) parts.push(`period=${params.period}`);
  const qs = parts.length > 0 ? `?${parts.join("&")}` : "";
  redirect(`/tiers${qs}`);
}
