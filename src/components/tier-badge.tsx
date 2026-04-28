"use client";

import { Badge } from "@/components/ui/badge";

const tierStyles: Record<string, string> = {
  Obsidian: "bg-purple-600/20 text-purple-300 border-purple-500/50",
  Diamond: "bg-cyan-600/20 text-cyan-300 border-cyan-500/50",
  Platinum: "bg-gray-500/20 text-gray-300 border-gray-400/50",
  Gold: "bg-yellow-600/20 text-yellow-300 border-yellow-500/50",
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <Badge variant="outline" className={tierStyles[tier] || "bg-gray-800 text-gray-400"}>
      {tier}
    </Badge>
  );
}
