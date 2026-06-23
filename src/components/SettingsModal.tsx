"use client";

import { type ChangeEvent, type ComponentType, type ReactNode, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseX, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UnitSystemSelect } from "@/components/ui/unit-system-select";
import { cn } from "@/lib/utils";
import { type Theme, getTheme, setTheme } from "@/lib/theme";
import {
  DIETARY_OPTIONS,
  type DietaryOption,
  type Substitution,
  type TemperatureUnit,
  type UnitSystem,
  clearDefaultServings,
  getDefaultServings,
  getDietaryProfile,
  getRoundAmounts,
  getSubstitutions,
  getTemperatureUnit,
  getUnitSystem,
  setDefaultServings,
  setDietaryProfile,
  setRoundAmounts,
  setSubstitutions,
  setTemperatureUnit,
  setUnitSystem,
} from "@/lib/preferences";
import { type NumberFormat, getNumberFormat, setNumberFormat } from "@/lib/numberFormat";
import { feedbackFeaturesEnabled } from "@/lib/features";
import { useRecipe } from "@/context/RecipeContext";
import { applySubstitutionsToGroups, countApplicableSubstitutions } from "@/lib/recipe-preferences";
import { toast } from "sonner";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import ChefHat from "@solar-icons/react/csr/food/ChefHat";
import CloseCircle from "@solar-icons/react/csr/ui/CloseCircle";
import InfoCircle from "@solar-icons/react/csr/ui/InfoCircle";
import Letter from "@solar-icons/react/csr/messages/Letter";
import Tuning2 from "@solar-icons/react/csr/settings/Tuning2";
import User from "@solar-icons/react/csr/users/User";

type Section = "account" | "preferences" | "cooking" | "about";

interface NavItem {
  id: Section;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "account", label: "Account", icon: User },
  { id: "preferences", label: "Preferences", icon: Tuning2 },
  { id: "cooking", label: "Cooking", icon: ChefHat },
  { id: "about", label: "About", icon: InfoCircle },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const UNIT_OPTIONS: { value: UnitSystem; label: string; meta: string }[] = [
  { value: "original", label: "Original", meta: "source" },
  { value: "metric", label: "Metric", meta: "g / ml" },
  { value: "imperial", label: "Imperial", meta: "oz / cup" },
];

const TEMP_OPTIONS: { value: TemperatureUnit; label: string }[] = [
  { value: "f", label: "°F" },
  { value: "c", label: "°C" },
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, signOut } = useUser();
  const [active, setActive] = useState<Section>("account");

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActive("account");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <div className="flex h-[min(86dvh,680px)] flex-col">
          <div className="flex items-start justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-4 dark:border-stone-800 dark:bg-stone-900/80 sm:px-5">
            <div className="min-w-0">
              <p className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 text-balance">
                Settings
              </p>
              <p className="mt-1 font-sans text-sm text-stone-500 dark:text-stone-400 text-pretty">
                Changes are saved automatically and apply across your recipes right away.
              </p>
            </div>

            <DialogCloseX className="shrink-0" label="Close settings" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <nav className="border-b border-stone-200 bg-[var(--color-cream)]/70 px-2 py-2 dark:border-stone-800 dark:bg-[var(--color-background-cream)]/60 sm:w-[220px] sm:shrink-0 sm:border-b-0 sm:border-r sm:px-3 sm:py-3">
              <div className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className={cn(
                        "inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors sm:w-full",
                        isActive
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {active === "account" && (
                <AccountSection
                  name={name}
                  email={user?.email}
                  avatarUrl={user?.user_metadata?.avatar_url}
                  onSignOut={handleSignOut}
                />
              )}
              {active === "preferences" && <PreferencesSection />}
              {active === "cooking" && <CookingSection />}
              {active === "about" && <AboutSection />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 text-balance">
        {title}
      </h3>
      <p className="mt-1 font-sans text-sm text-stone-500 dark:text-stone-400 text-pretty">
        {description}
      </p>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-100 py-4 last:border-b-0 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[13px] font-medium text-stone-800 dark:text-stone-100">
          {label}
        </p>
        {description && (
          <p className="mt-1 font-sans text-[13px] text-stone-500 dark:text-stone-400 text-pretty">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AccountSection({
  name,
  email,
  avatarUrl,
  onSignOut,
}: {
  name: string;
  email?: string;
  avatarUrl?: string;
  onSignOut: () => void;
}) {
  return (
    <div>
      <SectionHeader
        title="Account"
        description="Manage the account you use to save recipes and keep your cooking history in sync."
      />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
        <Avatar size="lg">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-stone-200 font-sans font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-200">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-medium text-stone-900 dark:text-stone-100">
            {name}
          </p>
          {email && (
            <p className="truncate font-sans text-sm text-stone-500 dark:text-stone-400">{email}</p>
          )}
        </div>
      </div>

      <SettingRow label="Email" description="Your sign-in email address.">
        <span className="font-sans text-[13px] text-stone-500 dark:text-stone-400">
          {email || "No email on file"}
        </span>
      </SettingRow>

      <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onSignOut} className="w-full sm:w-auto">
          Sign out
        </Button>
        <a
          href="mailto:support@mizen.app?subject=Delete my account"
          className="font-sans text-sm text-stone-500 transition-colors hover:text-red-500 dark:text-stone-400 dark:hover:text-red-400"
        >
          Delete account
        </a>
      </div>
    </div>
  );
}

const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: "fractions", label: "⅓" },
  { value: "decimals", label: "0.33" },
];

function PreferencesSection() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const handleThemeChange = (value: string) => {
    if (!value) return;

    const nextTheme = value as Theme;
    setThemeState(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div>
      <SectionHeader
        title="Preferences"
        description="Adjust the app itself, including the color theme used throughout Mizen."
      />

      <SettingRow label="Theme" description="Choose light, dark, or follow your system setting.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={theme}
          onValueChange={handleThemeChange}
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
    </div>
  );
}

function CookingSection() {
  const { recipe, setRecipe } = useRecipe();
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(getUnitSystem);
  const [tempUnit, setTempUnitState] = useState<TemperatureUnit>(getTemperatureUnit);
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>(getNumberFormat);
  const [roundAmounts, setRoundAmountsState] = useState(getRoundAmounts);
  const [savedDefaultServings, setSavedDefaultServingsState] = useState(getDefaultServings);
  const [defaultServingsInput, setDefaultServingsInput] = useState(() => {
    const val = getDefaultServings();
    return val !== null ? String(val) : "";
  });
  const [defaultServingsError, setDefaultServingsError] = useState<string | null>(null);
  const [dietaryProfile, setDietaryProfileState] = useState<DietaryOption[]>(getDietaryProfile);
  const [substitutions, setSubstitutionsState] = useState<Substitution[]>(getSubstitutions);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const applicableCount = useMemo(
    () => (recipe ? countApplicableSubstitutions(recipe.ingredients, substitutions) : 0),
    [recipe, substitutions]
  );

  const handleApplySubstitutions = () => {
    if (!recipe) return;
    const updatedGroups = applySubstitutionsToGroups(recipe.ingredients, substitutions);
    setRecipe({ ...recipe, ingredients: updatedGroups });
    setShowApplyConfirm(false);
    toast.success("Substitutions applied to recipe");
  };

  const commitDefaultServings = () => {
    if (defaultServingsInput.trim() === "") {
      clearDefaultServings();
      setSavedDefaultServingsState(null);
      setDefaultServingsInput("");
      setDefaultServingsError(null);
      return;
    }

    const parsed = Number.parseInt(defaultServingsInput, 10);

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 99) {
      setDefaultServingsError("Enter a number from 1 to 99.");
      return;
    }

    setDefaultServings(parsed);
    setSavedDefaultServingsState(parsed);
    setDefaultServingsInput(String(parsed));
    setDefaultServingsError(null);
  };

  const handleDefaultServingsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (!/^\d*$/.test(nextValue)) return;

    setDefaultServingsInput(nextValue);
    if (defaultServingsError) {
      setDefaultServingsError(null);
    }
  };

  const handleUnitChange = (value: string) => {
    if (!value) return;

    const next = value as UnitSystem;
    setUnitSystemState(next);
    setUnitSystem(next);
  };

  const handleTempChange = (value: string) => {
    if (!value) return;

    const next = value as TemperatureUnit;
    setTempUnitState(next);
    setTemperatureUnit(next);
  };

  const handleNumberFormatChange = (f: NumberFormat) => {
    setNumberFormatState(f);
    setNumberFormat(f);
  };

  const handleRoundAmountsChange = (checked: boolean) => {
    setRoundAmountsState(checked);
    setRoundAmounts(checked);
  };

  const toggleDiet = (diet: DietaryOption) => {
    const next = dietaryProfile.includes(diet)
      ? dietaryProfile.filter((current) => current !== diet)
      : [...dietaryProfile, diet];

    setDietaryProfileState(next);
    setDietaryProfile(next);
  };

  const updateSubstitution = (index: number, field: "from" | "to", value: string) => {
    const next = substitutions.map((substitution, substitutionIndex) =>
      substitutionIndex === index ? { ...substitution, [field]: value } : substitution
    );

    setSubstitutionsState(next);
    setSubstitutions(next);
  };

  const removeSubstitution = (index: number) => {
    const next = substitutions.filter((_, substitutionIndex) => substitutionIndex !== index);
    setSubstitutionsState(next);
    setSubstitutions(next);
  };

  const addSubstitution = () => {
    setSubstitutionsState((current) => [...current, { from: "", to: "" }]);
  };

  return (
    <div>
      <SectionHeader
        title="Cooking"
        description="Set how recipes should display and adapt while you cook."
      />

      <SettingRow
        label="Unit system"
        description="Ingredient amounts switch between the original recipe, metric, or imperial units."
      >
        <UnitSystemSelect
          value={unitSystem}
          options={UNIT_OPTIONS}
          onValueChange={handleUnitChange}
        />
      </SettingRow>

      <SettingRow
        label="Temperature"
        description="Recipe instructions convert oven and cooking temperatures to your preferred scale."
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={tempUnit}
          onValueChange={handleTempChange}
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

      <SettingRow label="Numbers" description="Show amounts as fractions or decimals.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={numberFormat}
          onValueChange={(v) => {
            if (v) handleNumberFormatChange(v as NumberFormat);
          }}
          className="rounded-lg"
        >
          {NUMBER_FORMAT_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="h-auto px-3 py-1 font-sans text-[13px] data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow
        label="Round amounts"
        description="Scale ingredients to friendlier fractions when recipe math gets awkward."
      >
        <Switch checked={roundAmounts} onCheckedChange={handleRoundAmountsChange} />
      </SettingRow>

      <div className="border-b border-stone-100 py-4 dark:border-stone-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[13px] font-medium text-stone-800 dark:text-stone-100">
              Default servings
            </p>
            <p className="mt-1 font-sans text-[13px] text-stone-500 dark:text-stone-400 text-pretty">
              Override the recipe&apos;s serving size. Leave empty to use each recipe&apos;s
              original.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={defaultServingsInput}
              placeholder="Off"
              onChange={handleDefaultServingsChange}
              onBlur={commitDefaultServings}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitDefaultServings();
                }
              }}
              aria-invalid={defaultServingsError ? "true" : "false"}
              aria-label="Default servings"
              className="h-9 w-20 text-center font-sans text-[13px]"
            />
            <Badge variant="secondary" className="font-sans text-[12px] tabular-nums">
              {savedDefaultServings !== null ? `Saved: ${savedDefaultServings}` : "Not set"}
            </Badge>
          </div>
        </div>

        {defaultServingsError && (
          <p className="mt-2 font-sans text-[12px] text-red-500">{defaultServingsError}</p>
        )}
      </div>

      <div className="border-b border-stone-100 py-4 dark:border-stone-800">
        <p className="font-sans text-[13px] font-medium text-stone-800 dark:text-stone-100">
          Dietary profile
        </p>
        <p className="mt-1 font-sans text-[13px] text-stone-500 dark:text-stone-400 text-pretty">
          Ingredients that conflict with these choices are called out directly in the prep list.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((diet) => {
            const isActive = dietaryProfile.includes(diet);

            return (
              <button
                key={diet}
                type="button"
                onClick={() => toggleDiet(diet)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-sans text-[13px] transition-colors",
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                    : "border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-100"
                )}
              >
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-4">
        <p className="font-sans text-[13px] font-medium text-stone-800 dark:text-stone-100">
          My substitutions
        </p>
        <p className="mt-1 font-sans text-[13px] text-stone-500 dark:text-stone-400 text-pretty">
          Add your own ingredient swaps. We match them against ingredient names in the prep list.
        </p>

        {substitutions.length > 0 ? (
          <div className="mt-3 space-y-2">
            {substitutions.map((substitution, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={substitution.from}
                  onChange={(event) => updateSubstitution(index, "from", event.target.value)}
                  placeholder="From"
                  className="h-9 flex-1 font-sans text-[13px]"
                />
                <span className="shrink-0 font-sans text-xs text-stone-400 dark:text-stone-500">
                  →
                </span>
                <Input
                  value={substitution.to}
                  onChange={(event) => updateSubstitution(index, "to", event.target.value)}
                  placeholder="To"
                  className="h-9 flex-1 font-sans text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => removeSubstitution(index)}
                  className="shrink-0 text-stone-300 transition-colors hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400"
                  aria-label="Remove substitution"
                >
                  <CloseCircle className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 text-pretty">
              No personal substitutions yet.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={addSubstitution}
          className="mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <AddCircle className="size-4" />
          Add substitution
        </button>

        {recipe && substitutions.length > 0 && (
          <div className="mt-4">
            {showApplyConfirm ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="font-sans text-[13px] text-amber-800 dark:text-amber-200 text-pretty">
                  This will permanently rename {applicableCount} ingredient
                  {applicableCount !== 1 ? "s" : ""} in the current recipe. This cannot be undone.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowApplyConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={applicableCount === 0}
                    onClick={handleApplySubstitutions}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={applicableCount === 0}
                onClick={() => setShowApplyConfirm(true)}
                className="font-sans text-[13px]"
              >
                Apply to current recipe
                {applicableCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {applicableCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div>
      <SectionHeader
        title="About"
        description="Reference links and product details for the current build of Mizen."
      />

      <SettingRow label="Version" description="Current app release.">
        <Badge variant="secondary" className="font-sans text-[13px] tabular-nums">
          v0.1.0
        </Badge>
      </SettingRow>

      {feedbackFeaturesEnabled && (
        <SettingRow label="Send feedback" description="Questions, bugs, or product ideas.">
          <a
            href="mailto:feedback@mizen.app"
            className="inline-flex items-center gap-1.5 font-sans text-[13px] text-stone-500 transition-colors hover:text-[var(--color-blue)] dark:text-stone-400 dark:hover:text-[var(--color-blue)]"
          >
            <Letter className="size-4" />
            Email us
          </a>
        </SettingRow>
      )}

      <SettingRow label="Privacy Policy" description="See how account and recipe data are handled.">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-[13px] text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          View
        </a>
      </SettingRow>

      <SettingRow
        label="Terms of Service"
        description="Review the product terms for using the app."
      >
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-[13px] text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          View
        </a>
      </SettingRow>
    </div>
  );
}
