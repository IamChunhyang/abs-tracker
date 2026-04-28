"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Period } from "@/lib/types";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

interface PeriodSelectorProps {
  value: Period;
  onChange: (value: Period) => void;
  periods?: Period[];
}

const ALL_PERIODS: Period[] = ["1d", "7d", "14d", "30d"];

export function PeriodSelector({ value, onChange, periods = ALL_PERIODS }: PeriodSelectorProps) {
  const { lang } = useLang();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className="w-[140px] h-[48px] bg-gray-800 border-gray-700">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {periods.map((p) => (
          <SelectItem key={p} value={p}>{t(`period.${p}`, lang)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
