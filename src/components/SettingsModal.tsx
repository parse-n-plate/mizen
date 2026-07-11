"use client";

import { type ChangeEvent, type ComponentType, type ReactNode, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UnitSystemSelect } from "@/components/ui/unit-system-select";
import { cn } from "@/lib/utils";
import { type Theme, getTheme, setTheme } from "@/lib/theme";
import { appVersion } from "@/lib/app-version";
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
import AltArrowRight from "@solar-icons/react/csr/arrows/AltArrowRight";
import ChefHat from "@solar-icons/react/csr/food/ChefHat";
import CloseCircle from "@solar-icons/react/csr/ui/CloseCircle";
import InfoCircle from "@solar-icons/react/csr/ui/InfoCircle";
import Letter from "@solar-icons/react/csr/messages/Letter";
import Tuning2 from "@solar-icons/react/csr/settings/Tuning2";
import User from "@solar-icons/react/csr/users/User";
import { X } from "lucide-react";

type Section = "account" | "preferences" | "cooking" | "about";

interface NavItem {
  id: Section;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "cooking", label: "Cooking", icon: ChefHat },
  { id: "preferences", label: "Preferences", icon: Tuning2 },
  { id: "account", label: "Account", icon: User },
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
  const [active, setActive] = useState<Section>("cooking");

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActive("cooking");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 max-sm:fixed max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:bg-stone-50 dark:max-sm:bg-[#0B0A0A] sm:max-w-[760px]"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <div className="relative hidden h-[min(86dvh,680px)] flex-col sm:flex">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10"
              aria-label="Close settings"
            >
              <X className="size-5" strokeWidth={2} />
            </Button>
          </DialogClose>
          <DesktopSettingsContent
            active={active}
            onActiveChange={setActive}
            name={name}
            email={user?.email}
            avatarUrl={user?.user_metadata?.avatar_url}
            onSignOut={handleSignOut}
          />
        </div>
        <MobileSettingsContent email={user?.email} onSignOut={handleSignOut} />
      </DialogContent>
    </Dialog>
  );
}

type DesktopSettingsContentProps = {
  active: Section;
  onActiveChange: (section: Section) => void;
  name: string;
  email?: string;
  avatarUrl?: string;
  onSignOut: () => void | Promise<void>;
};

function DesktopSettingsContent({
  active,
  onActiveChange,
  name,
  email,
  avatarUrl,
  onSignOut,
}: DesktopSettingsContentProps) {
  return (
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
                onClick={() => onActiveChange(item.id)}
                className={cn(
                  "inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors sm:w-full",
                  isActive
                    ? "bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100"
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

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {active === "account" && (
          <AccountSection name={name} email={email} avatarUrl={avatarUrl} onSignOut={onSignOut} />
        )}
        {active === "preferences" && <PreferencesSection />}
        {active === "cooking" && <CookingSection />}
        {active === "about" && <AboutSection />}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useUser();
  const [active, setActive] = useState<Section>("account");
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  const handleSignOut = async () => {
    await signOut();
    window.location.assign("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:px-6 sm:py-8">
      <div className="mx-auto hidden min-h-[min(86dvh,680px)] max-w-[760px] overflow-hidden rounded-xl border border-stone-200 bg-white sm:flex dark:border-stone-800 dark:bg-stone-900">
        <DesktopSettingsContent
          active={active}
          onActiveChange={setActive}
          name={name}
          email={user?.email}
          avatarUrl={user?.user_metadata?.avatar_url}
          onSignOut={handleSignOut}
        />
      </div>
      <div className="sm:hidden">
        <MobileSettingsContent email={user?.email} onSignOut={handleSignOut} />
      </div>
    </div>
  );
}

const MOBILE_SETTING_TEXT =
  "font-sans text-[13px] font-medium leading-[18px] text-stone-900 dark:text-[#FAFAF9]";

export function MobileSettingsContent({
  email,
  onSignOut,
}: {
  email?: string;
  onSignOut?: () => void;
}) {
  const { recipe, setRecipe } = useRecipe();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(getUnitSystem);
  const [tempUnit, setTempUnitState] = useState<TemperatureUnit>(getTemperatureUnit);
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>(getNumberFormat);
  const [roundAmounts, setRoundAmountsState] = useState(getRoundAmounts);
  const [defaultServingsInput, setDefaultServingsInput] = useState(() => {
    const value = getDefaultServings();
    return value !== null ? String(value) : "";
  });
  const [defaultServingsError, setDefaultServingsError] = useState<string | null>(null);
  const [dietaryProfile, setDietaryProfileState] = useState<DietaryOption[]>(getDietaryProfile);
  const [substitutions, setSubstitutionsState] = useState<Substitution[]>(getSubstitutions);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const applicableCount = useMemo(
    () => (recipe ? countApplicableSubstitutions(recipe.ingredients, substitutions) : 0),
    [recipe, substitutions]
  );

  const handleThemeChange = (value: string) => {
    const nextTheme = value as Theme;
    setThemeState(nextTheme);
    setTheme(nextTheme);
  };

  const handleUnitChange = (value: string) => {
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

  const handleNumberFormatChange = (value: string) => {
    if (!value) return;

    const next = value as NumberFormat;
    setNumberFormatState(next);
    setNumberFormat(next);
  };

  const handleRoundAmountsChange = (checked: boolean) => {
    setRoundAmountsState(checked);
    setRoundAmounts(checked);
  };

  const commitDefaultServings = () => {
    if (defaultServingsInput.trim() === "") {
      clearDefaultServings();
      setDefaultServingsError(null);
      return;
    }

    const parsed = Number.parseInt(defaultServingsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 99) {
      setDefaultServingsError("Enter a number from 1 to 99.");
      return;
    }

    setDefaultServings(parsed);
    setDefaultServingsInput(String(parsed));
    setDefaultServingsError(null);
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
    const next = [...substitutions, { from: "", to: "" }];
    setSubstitutionsState(next);
    setSubstitutions(next);
  };

  const applySubstitutions = () => {
    if (!recipe) return;
    setRecipe({
      ...recipe,
      ingredients: applySubstitutionsToGroups(recipe.ingredients, substitutions),
    });
    setShowApplyConfirm(false);
    toast.success("Substitutions applied to recipe");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-stone-50 px-6 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+32px)] text-stone-950 dark:bg-[#0B0A0A] dark:text-[#FAFAF9] sm:hidden">
      <h1 className="font-serif text-3xl font-bold text-stone-950 dark:text-[#FAFAF9]">Settings</h1>

      <div className="mt-5 flex flex-col gap-4">
        <MobileSettingsGroup title="General">
          <MobileSettingsRow label="Theme">
            <MobileSelect
              value={theme}
              onChange={handleThemeChange}
              options={THEME_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </MobileSettingsRow>
        </MobileSettingsGroup>

        <MobileSettingsGroup title="Recipe">
          <MobileSettingsRow label="Unit system">
            <MobileSelect
              value={unitSystem}
              onChange={handleUnitChange}
              options={UNIT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </MobileSettingsRow>
          <MobileSettingsRow label="Temperature">
            <MobileSegmentedControl
              value={tempUnit}
              onValueChange={handleTempChange}
              options={TEMP_OPTIONS}
              ariaLabel="Temperature unit"
            />
          </MobileSettingsRow>
          <MobileSettingsRow label="Numbers">
            <MobileSegmentedControl
              value={numberFormat}
              onValueChange={handleNumberFormatChange}
              options={NUMBER_FORMAT_OPTIONS}
              ariaLabel="Number format"
            />
          </MobileSettingsRow>
          <MobileSettingsRow label="Round amounts">
            <Switch
              checked={roundAmounts}
              onCheckedChange={handleRoundAmountsChange}
              aria-label="Round amounts"
              className="h-[18px] w-8 border-0 bg-stone-300 shadow-none data-[state=checked]:bg-[#18A1F7] dark:bg-[#3A3633] [&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[14px]"
            />
          </MobileSettingsRow>
        </MobileSettingsGroup>

        <MobileSettingsGroup title="Cooking preferences">
          <MobileSettingsRow label="Default servings">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={defaultServingsInput}
              placeholder="Off"
              onChange={(event) => {
                if (/^\d*$/.test(event.target.value)) setDefaultServingsInput(event.target.value);
              }}
              onBlur={commitDefaultServings}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitDefaultServings();
                }
              }}
              aria-invalid={defaultServingsError ? "true" : "false"}
              aria-label="Default servings"
              className="h-8 w-14 text-center font-sans text-[13px]"
            />
          </MobileSettingsRow>

          <MobileSettingsDisclosure
            label="Dietary profile"
            value={dietaryProfile.length ? `${dietaryProfile.length} selected` : "None"}
          >
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
                        : "border-stone-200 text-stone-600 dark:border-[#3A3633] dark:text-[#A8A29E]"
                    )}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>
          </MobileSettingsDisclosure>

          <MobileSettingsDisclosure
            label="My substitutions"
            value={substitutions.length ? `${substitutions.length} saved` : "None"}
          >
            {substitutions.map((substitution, index) => (
              <div key={index} className="mt-3 flex items-center gap-2">
                <Input
                  value={substitution.from}
                  onChange={(event) => updateSubstitution(index, "from", event.target.value)}
                  placeholder="From"
                  className="h-8 min-w-0 flex-1 font-sans text-[13px]"
                />
                <AltArrowRight aria-hidden className="size-4 shrink-0 text-stone-400" />
                <Input
                  value={substitution.to}
                  onChange={(event) => updateSubstitution(index, "to", event.target.value)}
                  placeholder="To"
                  className="h-8 min-w-0 flex-1 font-sans text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => removeSubstitution(index)}
                  aria-label="Remove substitution"
                  className="shrink-0 text-stone-400 dark:text-[#A8A29E]"
                >
                  <CloseCircle className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSubstitution}
              className="mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-stone-600 dark:text-[#A8A29E]"
            >
              <AddCircle className="size-4" />
              Add substitution
            </button>
            {recipe && substitutions.length > 0 && (
              <div className="mt-3 border-t border-stone-200 pt-3 dark:border-[#3A3633]">
                {showApplyConfirm ? (
                  <div>
                    <p className="font-sans text-xs leading-4 text-stone-500 dark:text-[#A8A29E]">
                      Apply to {applicableCount} matching ingredient
                      {applicableCount === 1 ? "" : "s"} in this recipe?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowApplyConfirm(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={applicableCount === 0}
                        onClick={applySubstitutions}
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
                  >
                    Apply to current recipe
                  </Button>
                )}
              </div>
            )}
          </MobileSettingsDisclosure>
        </MobileSettingsGroup>

        <MobileSettingsGroup title="Account">
          <MobileSettingsRow label="Email">
            <span className="max-w-32 truncate text-right text-stone-500 dark:text-[#A8A29E]">
              {email || "No email on file"}
            </span>
          </MobileSettingsRow>
          <div className="flex items-center justify-between gap-3 px-3.5 py-3.5">
            <a
              href="mailto:support@mizen.app?subject=Delete my account"
              className="font-sans text-[13px] text-stone-500 dark:text-[#A8A29E]"
            >
              Delete account
            </a>
            {onSignOut ? (
              <Button variant="outline" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            ) : (
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            )}
          </div>
        </MobileSettingsGroup>

        <MobileSettingsGroup title="About">
          <MobileSettingsRow label="Version">
            <span className="text-stone-500 dark:text-[#A8A29E]">v{appVersion}</span>
          </MobileSettingsRow>
          {feedbackFeaturesEnabled && (
            <MobileSettingsLink href="mailto:feedback@mizen.app" label="Send feedback" />
          )}
          <MobileSettingsLink href="/privacy" label="Privacy policy" />
          <MobileSettingsLink href="/terms" label="Terms of service" />
        </MobileSettingsGroup>
      </div>
    </div>
  );
}

function MobileSettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-sans text-[13px] font-semibold leading-[18px] text-stone-500 dark:text-[#A8A29E]">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-[#3A3633] dark:bg-[#1C1918]">
        {children}
      </div>
    </section>
  );
}

function MobileSettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[50px] items-center gap-3 border-b border-stone-200 px-3.5 last:border-b-0 dark:border-[#3A3633]">
      <span className={cn(MOBILE_SETTING_TEXT, "min-w-0 flex-1 truncate")}>{label}</span>
      <div className="flex shrink-0 items-center justify-end font-sans text-[13px] leading-4">
        {children}
      </div>
    </div>
  );
}

function MobileSettingsDisclosure({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <details className="border-b border-stone-200 last:border-b-0 dark:border-[#3A3633]">
      <summary className="flex min-h-[50px] cursor-pointer list-none items-center gap-3 px-3.5 [&::-webkit-details-marker]:hidden">
        <span className={cn(MOBILE_SETTING_TEXT, "min-w-0 flex-1 truncate")}>{label}</span>
        <span className="flex items-center gap-1 text-stone-500 dark:text-[#A8A29E]">
          <span className="font-sans text-[13px] leading-4">{value}</span>
          <AltArrowRight aria-hidden className="size-5" />
        </span>
      </summary>
      <div className="border-t border-stone-200 px-3.5 pb-3.5 pt-3 dark:border-[#3A3633]">
        {children}
      </div>
    </details>
  );
}

function MobileSettingsLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("/");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="flex min-h-[50px] items-center justify-between border-t border-stone-200 px-3.5 font-sans text-[13px] font-medium text-stone-900 dark:border-[#3A3633] dark:text-[#FAFAF9]"
    >
      {label}
      <AltArrowRight aria-hidden className="size-5 text-stone-500 dark:text-[#A8A29E]" />
    </a>
  );
}

function MobileSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative flex items-center text-stone-500 dark:text-[#A8A29E]">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-28 appearance-none bg-transparent pr-7 text-right font-sans text-[13px] leading-4 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <AltArrowRight aria-hidden className="pointer-events-none absolute right-0 size-5" />
    </label>
  );
}

function MobileSegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
}: {
  value: T;
  onValueChange: (value: string) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      className="gap-0 overflow-hidden rounded-[10px] border border-stone-200 dark:border-[#3A3633]"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-[32px] rounded-none border-0 px-3 font-sans text-[13px] font-medium leading-[18px] text-stone-500 data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:text-[#A8A29E] dark:data-[state=on]:bg-[#FAFAF9] dark:data-[state=on]:text-[#292524]"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-2 border-b border-stone-200 pb-4 dark:border-stone-800">
      <h3 className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>
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
      <SectionHeader title="Account" />

      <div className="flex items-center gap-3 border-b border-stone-100 py-4 dark:border-stone-800">
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

      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
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
      <SectionHeader title="Preferences" />

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
      <SectionHeader title="Cooking" />

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
      <SectionHeader title="About" />

      <SettingRow label="Version" description="Current app release.">
        <Badge variant="secondary" className="font-sans text-[13px] tabular-nums">
          v{appVersion}
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
