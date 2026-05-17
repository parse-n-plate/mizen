"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { type NumberFormat, getNumberFormat, setNumberFormat } from "@/lib/numberFormat";
import {
  type TemperatureUnit,
  type UnitSystem,
  getRoundAmounts,
  getTemperatureUnit,
  getUnitSystem,
  setRoundAmounts,
  setTemperatureUnit,
  setUnitSystem,
} from "@/lib/preferences";
import { type Theme, getTheme, setTheme } from "@/lib/theme";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const UNIT_OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

const TEMP_OPTIONS: { value: TemperatureUnit; label: string }[] = [
  { value: "f", label: "°F" },
  { value: "c", label: "°C" },
];

const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: "fractions", label: "⅓" },
  { value: "decimals", label: "0.33" },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-100 py-4 last:border-b-0 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[13px] font-medium text-stone-800 dark:text-stone-100">
          {label}
        </p>
        <p className="mt-1 font-sans text-[13px] text-stone-500 dark:text-stone-400 text-pretty">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function ProfileSettingsPanel() {
  const [themeValue, setThemeValue] = useState<Theme>(getTheme);
  const [unitSystem, setUnitSystemValue] = useState<UnitSystem>(getUnitSystem);
  const [temperatureUnit, setTemperatureUnitValue] = useState<TemperatureUnit>(getTemperatureUnit);
  const [numberFormat, setNumberFormatValue] = useState<NumberFormat>(getNumberFormat);
  const [roundAmounts, setRoundAmountsValue] = useState(getRoundAmounts);

  return (
    <section className="mt-10 rounded-[1.75rem] border border-stone-200 bg-white/75 p-5 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/70">
      <div className="mb-2">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
          Settings
        </h2>
        <p className="mt-1 font-sans text-sm text-stone-500 dark:text-stone-400">
          Adjust the basics for how recipes display while you cook.
        </p>
      </div>

      <SettingRow label="Theme" description="Choose light, dark, or follow your system setting.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={themeValue}
          onValueChange={(value) => {
            if (!value) return;
            const next = value as Theme;
            setThemeValue(next);
            setTheme(next);
          }}
          className="rounded-lg"
        >
          {THEME_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto px-3 py-1 font-sans text-[13px] data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow
        label="Unit system"
        description="Switch recipe amounts between original, metric, and imperial."
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={unitSystem}
          onValueChange={(value) => {
            if (!value) return;
            const next = value as UnitSystem;
            setUnitSystemValue(next);
            setUnitSystem(next);
          }}
          className="rounded-lg"
        >
          {UNIT_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto px-3 py-1 font-sans text-[13px] data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow
        label="Temperature"
        description="Convert recipe temperatures to your preferred scale."
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={temperatureUnit}
          onValueChange={(value) => {
            if (!value) return;
            const next = value as TemperatureUnit;
            setTemperatureUnitValue(next);
            setTemperatureUnit(next);
          }}
          className="rounded-lg"
        >
          {TEMP_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto px-3 py-1 font-sans text-[13px] data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow label="Numbers" description="Show ingredient amounts as fractions or decimals.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={numberFormat}
          onValueChange={(value) => {
            if (!value) return;
            const next = value as NumberFormat;
            setNumberFormatValue(next);
            setNumberFormat(next);
          }}
          className="rounded-lg"
        >
          {NUMBER_FORMAT_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto px-3 py-1 font-sans text-[13px] data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow
        label="Round amounts"
        description="Prefer friendlier fractions after scaling ingredients."
      >
        <Switch
          checked={roundAmounts}
          onCheckedChange={(checked) => {
            setRoundAmountsValue(checked);
            setRoundAmounts(checked);
          }}
        />
      </SettingRow>
    </section>
  );
}
