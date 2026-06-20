import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Clock3,
  Copy,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Settings,
  Search,
  TextCursorInput,
  User,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BRAND_COLOR_TOKENS, MODE_COLOR_TOKENS, SEMANTIC_COLOR_TOKENS } from "./color-token-data";
import { ColorTokenList, ModeColorTokenList } from "./color-swatches";
import { CopyPageButton } from "./copy-page-button";
import {
  CustomIconographyDesignSystemExample,
  DialogDesignSystemExample,
  DrawerDesignSystemExample,
  IconographyDesignSystemExample,
  RecipeTabsDesignSystemExample,
  ToastDesignSystemExample,
} from "./interactive-examples";
import {
  DESIGN_SYSTEM_GROUPS,
  type DesignSystemSlug,
  getAdjacentDesignSystemSlugs,
  getDesignSystemPath,
} from "./nav";

type DesignSystemSection = {
  title: string;
  body: ReactNode;
};

export type DesignSystemDoc = {
  slug: DesignSystemSlug;
  title: string;
  description: string;
  sections: DesignSystemSection[];
};

const titleBySlug = Object.fromEntries(
  DESIGN_SYSTEM_GROUPS.flatMap((group) => group.items.map((item) => [item.slug, item.title]))
) as Record<DesignSystemSlug, string>;

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[13px] text-stone-700 dark:bg-stone-800 dark:text-stone-200">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50 p-4 font-mono text-[13px] leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
      <code>{children}</code>
    </pre>
  );
}

function GuidanceList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-[15px] leading-7 text-stone-600 dark:text-stone-400"
        >
          <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Example({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      {children}
    </div>
  );
}

function RecipeRowExample() {
  return (
    <button className="group flex w-full items-center justify-between rounded-xl border border-stone-100 bg-white px-4 py-3 text-left transition-colors hover:border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-800">
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-semibold">Crisp Tomato Toast</p>
        <p className="mt-0.5 font-sans text-xs text-stone-400 dark:text-stone-500">
          mizen.recipes · Jun 5
        </p>
      </div>
      <Heart className="ml-3 h-4 w-4 shrink-0 text-stone-300 group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400" />
    </button>
  );
}

function SmartInputExample() {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input className="pl-9" placeholder="Search or paste a recipe URL" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          <LinkIcon className="h-3 w-3" />
          URL
        </Badge>
        <Badge variant="outline">
          <ImageIcon className="h-3 w-3" />
          Image
        </Badge>
        <Badge variant="outline">
          <TextCursorInput className="h-3 w-3" />
          Text
        </Badge>
      </div>
    </div>
  );
}

function CommandPaletteExample() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-sm">
      <Command>
        <CommandInput placeholder="Search or paste a URL" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Add Recipe">
            <CommandItem value="add recipe via url">
              <LinkIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Add via URL</p>
                <p className="text-xs text-muted-foreground">Paste a recipe link</p>
              </div>
            </CommandItem>
            <CommandItem value="add recipe via image">
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Add via Image</p>
                <p className="text-xs text-muted-foreground">Upload a recipe photo</p>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            <CommandItem value="cookbook saved recipes">
              <BookOpen className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Cookbook</p>
                <p className="text-xs text-muted-foreground">Saved recipes</p>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-2">
          <kbd className="rounded border border-border bg-muted px-2 py-1 font-sans text-xs text-muted-foreground">
            Esc
          </kbd>
          <span className="font-sans text-xs text-muted-foreground">to close</span>
        </div>
      </Command>
    </div>
  );
}

const DOCS: Record<DesignSystemSlug, DesignSystemDoc> = {
  overview: {
    slug: "overview",
    title: "Mizen design system",
    description:
      "A small documentation space for the tokens, primitives, and product patterns used by the Mizen web app.",
    sections: [
      {
        title: "Source of truth",
        body: (
          <div className="space-y-4">
            <p>
              Mizen uses the same approach as shadcn/ui: components live in the codebase, use a
              shared composable interface, and are customized to match the product. The docs should
              explain that local system instead of introducing a separate marketing-style design.
            </p>
            <GuidanceList
              items={[
                "Use `src/app/globals.css` for color, radius, typography, and motion variables.",
                "Use `src/components/ui/*` primitives before writing custom controls.",
                "Use product components as examples when documenting Mizen-specific patterns.",
              ]}
            />
          </div>
        ),
      },
      {
        title: "Page structure",
        body: (
          <div className="space-y-4">
            <p>
              Each topic is a separate page. The sidebar provides navigation, and the content column
              stays narrow enough to read like documentation.
            </p>
            <CodeBlock>{`/design-system
/design-system/tokens
/design-system/typography
/design-system/iconography
/design-system/buttons
/design-system/feedback`}</CodeBlock>
          </div>
        ),
      },
      {
        title: "Design principles",
        body: (
          <GuidanceList
            items={[
              "Keep the surface quiet so recipes remain the focus.",
              "Favor compact controls and predictable spacing for repeated app work.",
              "Use polish where it clarifies state, progress, or action.",
            ]}
          />
        ),
      },
    ],
  },
  tokens: {
    slug: "tokens",
    title: "Tokens",
    description:
      "The CSS variables and theme aliases that connect Mizen's custom palette to shadcn-style primitives.",
    sections: [
      {
        title: "Color tokens",
        body: <ColorTokenList colors={BRAND_COLOR_TOKENS} />,
      },
      {
        title: "Light and dark mode",
        body: <ModeColorTokenList colors={MODE_COLOR_TOKENS} />,
      },
      {
        title: "Semantic shadcn aliases",
        body: (
          <div className="space-y-4">
            <p>
              The UI primitives are driven by semantic shadcn tokens. Use these for component APIs
              and Tailwind utilities like <Code>bg-background</Code>, <Code>text-foreground</Code>,{" "}
              <Code>border-border</Code>, and <Code>ring-ring</Code>.
            </p>
            <ModeColorTokenList colors={SEMANTIC_COLOR_TOKENS} />
            <CodeBlock>{`@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-mizen-blue: var(--color-blue);
}`}</CodeBlock>
          </div>
        ),
      },
      {
        title: "Usage guidance",
        body: (
          <GuidanceList
            items={[
              "Use token variables for foundational color instead of page-specific hex values.",
              "Use stone neutrals for most text, borders, and surfaces.",
              "Limit blue to action, focus, and selected state so it remains meaningful.",
            ]}
          />
        ),
      },
    ],
  },
  typography: {
    slug: "typography",
    title: "Typography",
    description:
      "Mizen uses Domine for recipe identity and Albert Sans for the operational app interface.",
    sections: [
      {
        title: "Families",
        body: (
          <div className="space-y-4">
            <Example>
              <p className="font-serif text-4xl font-bold leading-tight tracking-tight">
                Domine carries recipe titles.
              </p>
              <p className="mt-3 font-sans text-sm leading-6 text-stone-500 dark:text-stone-400">
                Albert Sans carries controls, metadata, navigation, and repeated app text.
              </p>
            </Example>
            <p>
              These are registered in <Code>globals.css</Code> and loaded through the root layout.
              Keep that path intact so Tailwind utilities, shadcn primitives, and product components
              stay aligned.
            </p>
          </div>
        ),
      },
      {
        title: "Hierarchy",
        body: (
          <GuidanceList
            items={[
              "Use `font-serif` for page titles, recipe names, brand labels, and editorial headings.",
              "Use `font-sans` for controls, metadata rows, tabs, body text, and helper copy.",
              "Keep interface headings smaller than recipe/page headings.",
              "Avoid negative letter spacing except where the existing page title treatment already uses it.",
            ]}
          />
        ),
      },
      {
        title: "Examples",
        body: (
          <div className="space-y-4">
            <Example>
              <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight">
                Kimchi Ragu
              </h3>
              <p className="mt-2 font-sans text-sm text-stone-500 dark:text-stone-400">
                justonecookbook.com · Total 45 min · Serves 4
              </p>
            </Example>
            <CodeBlock>{`<h1 className="font-serif text-3xl font-bold tracking-tight">
  {recipe.title}
</h1>
<p className="font-sans text-sm text-stone-500">
  {source} · {time}
</p>`}</CodeBlock>
          </div>
        ),
      },
    ],
  },
  spacing: {
    slug: "spacing",
    title: "Spacing",
    description:
      "Mizen uses compact spacing for app controls and more open rhythm for readable recipe content.",
    sections: [
      {
        title: "Density",
        body: (
          <GuidanceList
            items={[
              "Use `gap-1` to `gap-3` for control groups and compact nav.",
              "Use `gap-4` to `gap-6` for cards, recipe lists, and page sections.",
              "Use larger top margins only between major document sections.",
            ]}
          />
        ),
      },
      {
        title: "Radius",
        body: (
          <div className="space-y-4">
            <p>
              The base radius is <Code>--radius: 0.625rem</Code>. Buttons and inputs use rounded-md
              by default through the shadcn primitives. Product rows and content cards commonly use
              rounded-xl.
            </p>
            <Example>
              <div className="space-y-3">
                <div className="rounded-md border border-stone-200 p-3 text-sm dark:border-stone-800">
                  rounded-md: buttons and inputs
                </div>
                <div className="rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-800">
                  rounded-xl: recipe rows and cards
                </div>
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "Document rhythm",
        body: (
          <p>
            Design-system docs should stay single-column. If a topic needs more depth, add another
            stacked section or a dedicated page rather than making a dense two-column content area.
          </p>
        ),
      },
    ],
  },
  iconography: {
    slug: "iconography",
    title: "Iconography",
    description:
      "Mizen uses compact icons to label repeated app actions without adding extra instructional copy.",
    sections: [
      {
        title: "Source",
        body: (
          <div className="space-y-4">
            <p>
              Use Solar icons for product UI and design-system navigation. Import only the icon
              needed by the component so each surface keeps a clear local dependency.
            </p>
            <CodeBlock>{`import Ruler from "@solar-icons/react/csr/tools/Ruler";
import Flag from "@solar-icons/react/csr/ui/Flag";`}</CodeBlock>
            <p>
              Lucide icons still appear in older shadcn primitives and small docs examples. Prefer
              Solar for new Mizen-specific product controls unless the primitive already owns a
              Lucide icon.
            </p>
          </div>
        ),
      },
      {
        title: "Product examples",
        body: (
          <Example>
            <IconographyDesignSystemExample />
          </Example>
        ),
      },
      {
        title: "Custom iconography",
        body: (
          <div className="space-y-4">
            <p>
              Some product surfaces use custom art instead of library icons. The Prep and Cook tab
              icons are custom assets because they carry recipe-specific identity and need to feel
              distinct from generic controls.
            </p>
            <Example>
              <CustomIconographyDesignSystemExample />
            </Example>
            <GuidanceList
              items={[
                "Keep custom icons reserved for product concepts that need stronger identity than a stock symbol.",
                "Store custom tab icons in `public/assets` and reuse the same asset everywhere that concept appears.",
                "Render paired custom icons at matching dimensions so tab labels keep a stable baseline.",
                "Keep decorative tab icons empty-alt because the text label already names the action.",
              ]}
            />
            <CodeBlock>{`<Image
  src="/assets/icon-prep.png"
  alt=""
  width={24}
  height={24}
  className="tab-icon-prep h-6 w-6"
/>`}</CodeBlock>
          </div>
        ),
      },
      {
        title: "Sizing",
        body: (
          <GuidanceList
            items={[
              "Use 16px icons in compact icon buttons, menus, and dense nav.",
              "Use 18px icons when the icon sits beside body copy or labels.",
              "Use 24px icons only for product tabs, empty states, or larger anchored controls.",
              "Keep icon buttons at stable dimensions such as `size-8`, `size-9`, or `size-10`.",
            ]}
          />
        ),
      },
      {
        title: "Color",
        body: (
          <GuidanceList
            items={[
              "Use `currentColor` by default so icons inherit the control state.",
              "Use muted stone colors for inactive icons.",
              "Use `--color-blue` only for selected, active, or meaningful adjusted states.",
              "Keep destructive icon color tied to destructive actions, not general warnings.",
            ]}
          />
        ),
      },
      {
        title: "Accessibility",
        body: (
          <div className="space-y-4">
            <GuidanceList
              items={[
                "Hide decorative icons with an empty alt or `aria-hidden` when paired with text.",
                "Give icon-only buttons an `aria-label` that names the action.",
                "Do not rely on icon shape alone for critical status.",
              ]}
            />
            <CodeBlock>{`<Button size="icon-sm" aria-label="Copy recipe">
  <SolarCopy size={16} />
</Button>`}</CodeBlock>
          </div>
        ),
      },
    ],
  },
  buttons: {
    slug: "buttons",
    title: "Buttons",
    description:
      "Buttons use the local shadcn primitive, Mizen variants, and small tactile states.",
    sections: [
      {
        title: "Primitive",
        body: (
          <div className="space-y-4">
            <p>
              Use <Code>Button</Code> from <Code>@/components/ui/button</Code>. It owns sizing,
              focus rings, disabled state, icon spacing, and the Mizen <Code>primary-blue</Code>{" "}
              variant.
            </p>
            <Example>
              <div className="flex flex-wrap gap-3">
                <Button className="press-scale">
                  <Plus className="h-4 w-4" />
                  Add Recipe
                </Button>
                <Button variant="primary-blue" className="press-scale">
                  Save recipe
                </Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="ghost">Preview</Button>
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use one primary action per surface.",
              "Use `primary-blue` for app actions that need Mizen brand emphasis.",
              "Use `outline` or `ghost` for secondary actions.",
              "Use `destructive` only for delete or irreversible actions.",
              "Add `press-scale` to tactile app actions unless the component already handles motion.",
            ]}
          />
        ),
      },
      {
        title: "Implementation",
        body: (
          <CodeBlock>{`import { Button } from "@/components/ui/button";

<Button variant="primary-blue" size="sm" className="press-scale">
  Save recipe
</Button>`}</CodeBlock>
        ),
      },
    ],
  },
  cards: {
    slug: "cards",
    title: "Cards",
    description:
      "Cards frame related information, settings groups, notices, and examples without becoming page layout decoration.",
    sections: [
      {
        title: "Primitive",
        body: (
          <div className="space-y-4">
            <p>
              Use <Code>Card</Code> for a real contained object: a settings group, release notice,
              example, or compact summary. Avoid nesting cards inside cards.
            </p>
            <Card>
              <CardHeader>
                <CardTitle>Unit preferences</CardTitle>
                <CardDescription>Default display and rounding behavior.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Keep card content focused on one decision or one object.
                </p>
              </CardContent>
            </Card>
          </div>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use cards for repeated items, modals, and framed tools.",
              "Use page whitespace for document sections instead of wrapping every section in a card.",
              "Keep radius and padding consistent with the local primitive.",
            ]}
          />
        ),
      },
    ],
  },
  badges: {
    slug: "badges",
    title: "Badges",
    description:
      "Badges label compact status, version, count, source, and metadata without creating a second button style.",
    sections: [
      {
        title: "Variants",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="flex flex-wrap gap-2">
                <Badge>Saved</Badge>
                <Badge variant="secondary">v0.1.0</Badge>
                <Badge variant="outline">Recipe URL</Badge>
                <Badge variant="destructive">Issue</Badge>
              </div>
            </Example>
            <p>
              Mizen uses badges in settings, release notices, and import state labels. Keep badge
              text short enough to scan in dense surfaces.
            </p>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use badges for labels, not actions.",
              "Prefer `secondary` or `outline` for ordinary metadata.",
              "Use destructive badges only for warning or failure state.",
            ]}
          />
        ),
      },
    ],
  },
  "selection-controls": {
    slug: "selection-controls",
    title: "Selection controls",
    description:
      "Checkboxes, switches, toggles, and toggle groups cover Mizen settings and preference controls.",
    sections: [
      {
        title: "Controls",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox defaultChecked />
                  Include substitutions
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  Round ingredient amounts
                  <Switch defaultChecked />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Toggle defaultPressed>US</Toggle>
                  <Toggle>Metric</Toggle>
                </div>
                <ToggleGroup type="single" defaultValue="balanced">
                  <ToggleGroupItem value="minimal">Minimal</ToggleGroupItem>
                  <ToggleGroupItem value="balanced">Balanced</ToggleGroupItem>
                  <ToggleGroupItem value="detailed">Detailed</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "When to use each",
        body: (
          <GuidanceList
            items={[
              "Use switches for persistent on/off preferences.",
              "Use checkboxes for included/excluded options in a task.",
              "Use toggle groups for mutually exclusive compact choices.",
              "Use the custom unit-system select for unit conversion menus and settings.",
            ]}
          />
        ),
      },
    ],
  },
  tabs: {
    slug: "tabs",
    title: "Tabs",
    description:
      "Tabs switch between related views without leaving the current recipe or settings context.",
    sections: [
      {
        title: "Primitive",
        body: (
          <div className="space-y-4">
            <Example>
              <Tabs defaultValue="prep">
                <TabsList>
                  <TabsTrigger value="prep">Prep</TabsTrigger>
                  <TabsTrigger value="cook">Cook</TabsTrigger>
                </TabsList>
              </Tabs>
            </Example>
            <p>
              Recipe tabs use custom folder-tab styling on top of the primitive. The primitive
              should still own keyboard behavior and active state.
            </p>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use tabs for sibling views with similar weight.",
              "Do not use tabs for linear steps or one-time actions.",
              "Keep labels short enough for mobile and folder-tab surfaces.",
            ]}
          />
        ),
      },
    ],
  },
  menus: {
    slug: "menus",
    title: "Menus",
    description:
      "Dropdown menus collect secondary actions, unit conversion choices, and account actions.",
    sections: [
      {
        title: "Dropdown menu",
        body: (
          <div className="space-y-4">
            <Example>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Copy recipe</DropdownMenuItem>
                  <DropdownMenuItem>Share link</DropdownMenuItem>
                  <DropdownMenuItem className="text-[var(--color-red)]">
                    Delete recipe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Example>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use menus for secondary actions, not the primary task.",
              "Keep destructive actions separated or visually distinct.",
              "Prefer radio menu items when the menu changes a persistent mode.",
            ]}
          />
        ),
      },
    ],
  },
  "command-palette": {
    slug: "command-palette",
    title: "Command palette",
    description:
      "Command palettes combine search, navigation, and high-frequency app actions in one keyboard-first surface.",
    sections: [
      {
        title: "Palette",
        body: (
          <div className="space-y-4">
            <Example>
              <CommandPaletteExample />
            </Example>
            <p>
              The app command-K surface uses <Code>CommandDialog</Code>, <Code>CommandInput</Code>,{" "}
              <Code>CommandList</Code>, <Code>CommandGroup</Code>, and <Code>CommandItem</Code> from{" "}
              <Code>src/components/ui/command.tsx</Code>.
            </p>
          </div>
        ),
      },
      {
        title: "Command lists",
        body: (
          <GuidanceList
            items={[
              "Use command lists when the user can search across mixed actions, destinations, and recipes.",
              "Group results by intent: add actions first, navigation second, recipe results after.",
              "Keep rows compact with one leading icon, one primary label, and optional muted metadata.",
              "Use `CommandEmpty` for no-result states so empty search feedback stays consistent.",
            ]}
          />
        ),
      },
      {
        title: "Sizing",
        body: (
          <GuidanceList
            items={[
              "Use `max-w-[52rem]` for the desktop command dialog.",
              "Use a full-screen command surface below the `md` breakpoint.",
              "Keep the input at `h-14` and the default list capped at `max-h-[360px]` unless the flow needs full-height mobile scrolling.",
              "Use `border-border`, `bg-popover`, `text-popover-foreground`, `bg-accent`, and `text-muted-foreground` for command surfaces.",
            ]}
          />
        ),
      },
      {
        title: "Implementation",
        body: (
          <CodeBlock>{`<CommandDialog
  open={open}
  onOpenChange={setOpen}
  title="Search recipes"
  description="Find recipes, add recipes, and navigate Mizen"
  className="max-w-[52rem] gap-0 rounded-xl border-border bg-popover text-popover-foreground"
>
  <CommandInput placeholder="Search or paste a URL" />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Add Recipe">
      <CommandItem value="add recipe via url">Add via URL</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>`}</CodeBlock>
        ),
      },
    ],
  },
  dialogs: {
    slug: "dialogs",
    title: "Dialogs",
    description:
      "Dialogs focus desktop users on auth, settings, release notices, feedback, and reporting flows.",
    sections: [
      {
        title: "Interactive preview",
        body: (
          <Example>
            <div className="space-y-4">
              <DialogDesignSystemExample />
              <p>
                This preview uses <Code>Dialog</Code>, <Code>DialogTrigger</Code>,{" "}
                <Code>DialogContent</Code>, and <Code>DialogFooter</Code> from{" "}
                <Code>src/components/ui/dialog.tsx</Code>.
              </p>
            </div>
          </Example>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use dialogs for focused flows that need completion before returning to the page.",
              "Use clear titles and concise descriptions.",
              "Keep footer actions predictable: secondary first, primary last.",
              "Use drawer variants for mobile when the same flow needs a bottom-sheet shape.",
            ]}
          />
        ),
      },
      {
        title: "Mizen examples",
        body: (
          <p>
            Current dialog surfaces include auth, beta access, settings, feedback, recipe reporting,
            waitlist previews, and release notices.
          </p>
        ),
      },
    ],
  },
  drawers: {
    slug: "drawers",
    title: "Drawers",
    description: "Drawers are the mobile-first counterpart to dialogs for bottom-sheet workflows.",
    sections: [
      {
        title: "Interactive preview",
        body: (
          <Example>
            <div className="space-y-4">
              <DrawerDesignSystemExample />
              <p>
                This preview uses <Code>Drawer</Code>, <Code>DrawerTrigger</Code>,{" "}
                <Code>DrawerContent</Code>, <Code>DrawerHeader</Code>, and <Code>DrawerFooter</Code>{" "}
                from <Code>src/components/ui/drawer.tsx</Code>.
              </p>
            </div>
          </Example>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use drawers on mobile for auth, unit conversion, previews, and focused settings choices.",
              "Keep the sheet height bounded when content can scroll.",
              "Keep titles visible and action placement consistent.",
            ]}
          />
        ),
      },
      {
        title: "Dialog pairing",
        body: (
          <p>
            If a flow exists on both desktop and mobile, share the content model and only change the
            container. This keeps auth, text previews, and unit selection consistent.
          </p>
        ),
      },
    ],
  },
  tooltips: {
    slug: "tooltips",
    title: "Tooltips",
    description:
      "Tooltips name compact icon actions without adding permanent helper text to dense recipe surfaces.",
    sections: [
      {
        title: "Example",
        body: (
          <div className="space-y-4">
            <Example>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Copy recipe">
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy recipe</TooltipContent>
              </Tooltip>
            </Example>
            <p>
              The root layout already wraps the app in <Code>TooltipProvider</Code>.
            </p>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use tooltips for icon-only actions.",
              "Do not hide critical instructions inside a tooltip.",
              "Keep tooltip copy short and command-oriented.",
            ]}
          />
        ),
      },
    ],
  },
  toasts: {
    slug: "toasts",
    title: "Toasts",
    description:
      "Toasts confirm lightweight outcomes such as saved recipes, copied links, failed parsing, and submitted feedback.",
    sections: [
      {
        title: "Interactive preview",
        body: (
          <Example>
            <div className="space-y-4">
              <ToastDesignSystemExample />
              <p>
                These triggers call <Code>toast.success</Code>, <Code>toast.warning</Code>, and{" "}
                <Code>toast.error</Code>. The shared <Code>Toaster</Code> lives in the app root.
              </p>
            </div>
          </Example>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use success toasts after save, copy, report, and feedback submission.",
              "Use warning toasts for recoverable parsing concerns.",
              "Use error toasts for failed network or parsing actions.",
              "Avoid toast-only state for anything the user must revisit later.",
            ]}
          />
        ),
      },
      {
        title: "Implementation",
        body: (
          <CodeBlock>{`import { toast } from "sonner";

toast.success("Recipe saved");
toast.error("Failed to parse recipe");`}</CodeBlock>
        ),
      },
    ],
  },
  avatars: {
    slug: "avatars",
    title: "Avatars",
    description:
      "Avatars identify users and shared recipes in navigation, settings, and account surfaces.",
    sections: [
      {
        title: "Example",
        body: (
          <Example>
            <AvatarGroup>
              <Avatar size="lg">
                <AvatarFallback>GM</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>MM</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+2</AvatarGroupCount>
            </AvatarGroup>
          </Example>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use initials fallback when no image is available.",
              "Keep recipe author avatars small in nav and list contexts.",
              "Use the built-in `sm`, `default`, and `lg` sizes instead of ad-hoc sizing.",
            ]}
          />
        ),
      },
    ],
  },
  loading: {
    slug: "loading",
    title: "Loading",
    description:
      "Loading states should keep layout stable while parsing, saving, authenticating, or fetching recipes.",
    sections: [
      {
        title: "Examples",
        body: (
          <Example>
            <div className="flex flex-wrap items-center gap-4">
              <Button disabled>
                <Spinner />
                Parsing
              </Button>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cookbook
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div className="h-full w-2/3 rounded-full bg-[var(--color-blue)]" />
              </div>
            </div>
          </Example>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Disable actions that are already in progress.",
              "Keep row/card dimensions stable during loading.",
              "Use progress only when there is a meaningful process state.",
            ]}
          />
        ),
      },
    ],
  },
  separators: {
    slug: "separators",
    title: "Separators",
    description: "Separators divide related groups without creating heavy card boundaries.",
    sections: [
      {
        title: "Example",
        body: (
          <Example>
            <div className="space-y-4">
              <p className="text-sm">Recipe details</p>
              <Separator />
              <p className="text-sm text-stone-500 dark:text-stone-400">Source and settings</p>
            </div>
          </Example>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use separators inside dialogs, settings panels, and docs navigation.",
              "Do not use separators to compensate for unclear hierarchy.",
              "Prefer whitespace when the relationship is already obvious.",
            ]}
          />
        ),
      },
    ],
  },
  "recipe-cards": {
    slug: "recipe-cards",
    title: "Recipe cards",
    description:
      "Recipe cards and rows prioritize scanability, truncation, and source context over decorative framing.",
    sections: [
      {
        title: "Cookbook row",
        body: (
          <div className="space-y-4">
            <Example>
              <RecipeRowExample />
            </Example>
            <p>
              Cookbook rows use <Code>rounded-xl</Code>, very quiet borders, a serif title, and
              small muted metadata. Hover states should only lift the border and surface slightly.
            </p>
          </div>
        ),
      },
      {
        title: "Content rules",
        body: (
          <GuidanceList
            items={[
              "Recipe title is the first readable element.",
              "Source domain and date are secondary metadata.",
              "Action icons are quiet until hover or active state.",
              "Long titles truncate rather than wrapping into unstable rows.",
            ]}
          />
        ),
      },
      {
        title: "Do not over-frame",
        body: (
          <p>
            Avoid nested cards and large image-first layouts for dense cookbook lists. Use larger
            image treatment only where browsing or recognition matters more than repeated scanning.
          </p>
        ),
      },
    ],
  },
  "recipe-header": {
    slug: "recipe-header",
    title: "Recipe header",
    description:
      "The recipe header introduces the recipe, source, summary, timing, servings, and save state.",
    sections: [
      {
        title: "Anatomy",
        body: (
          <Example>
            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight">
                Kimchi Ragu
              </h3>
              <p className="max-w-xl text-lg leading-relaxed text-stone-500 dark:text-stone-400">
                A rich, spicy sauce built for weeknight pasta.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-stone-500 dark:text-stone-400">
                <span>Bon Appetit</span>
                <span>Total 45 min</span>
                <span>Serves 4</span>
              </div>
            </div>
          </Example>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use the recipe title as the dominant element.",
              "Keep metadata in a compact muted row.",
              "Show source attribution when available.",
              "Do not place persistent instructional copy in the header.",
            ]}
          />
        ),
      },
    ],
  },
  "recipe-tabs": {
    slug: "recipe-tabs",
    title: "Recipe tabs",
    description:
      "Recipe tabs separate prep and cook views while preserving a stable recipe workspace.",
    sections: [
      {
        title: "Folder tabs",
        body: (
          <div className="space-y-4">
            <Example>
              <RecipeTabsDesignSystemExample />
            </Example>
            <p>
              Desktop recipe tabs use controlled product buttons from{" "}
              <Code>RecipeDesktopTabsBar</Code> with custom folder-tab classes from{" "}
              <Code>globals.css</Code>. The mobile recipe tab surface uses the shared tab primitive.
            </p>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use tabs for Prep and Cook, not for every possible recipe section.",
              "Keep tab labels short.",
              "Preserve scroll and state when switching views.",
            ]}
          />
        ),
      },
    ],
  },
  "recipe-actions": {
    slug: "recipe-actions",
    title: "Recipe actions",
    description:
      "Recipe actions include save, copy, share, unit conversion, report, and delete controls.",
    sections: [
      {
        title: "Action set",
        body: (
          <Example>
            <div className="flex flex-wrap gap-2">
              <Button size="icon-sm" variant="outline" aria-label="Save recipe">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="Copy recipe">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </Example>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use icon buttons for frequent compact actions with tooltips.",
              "Move less common actions into menus.",
              "Use destructive styling only for deletion.",
              "Confirm success with toasts when the page does not visibly change.",
            ]}
          />
        ),
      },
    ],
  },
  ingredients: {
    slug: "ingredients",
    title: "Ingredients",
    description:
      "Ingredient lists support scanning, search, unit conversion, and changed amount indicators.",
    sections: [
      {
        title: "List behavior",
        body: (
          <GuidanceList
            items={[
              "Group ingredients when the recipe provides meaningful groups.",
              "Keep amount, unit, and ingredient text aligned for scanning.",
              "Highlight converted or scaled amounts with existing diff styles.",
              "Use search as a utility action, not a permanent visual focus.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="space-y-3 text-sm">
              {["2 tbsp olive oil", "1 onion, diced", "1 cup kimchi", "12 oz pasta"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 border-b border-stone-100 pb-2 last:border-0 dark:border-stone-800"
                >
                  <span>{item}</span>
                  <Badge variant="outline">Prep</Badge>
                </div>
              ))}
            </div>
          </Example>
        ),
      },
    ],
  },
  steps: {
    slug: "steps",
    title: "Steps",
    description:
      "Step lists make recipe instructions easy to follow without adding unnecessary controls.",
    sections: [
      {
        title: "Instruction rhythm",
        body: (
          <GuidanceList
            items={[
              "Give each step a clear title when available.",
              "Keep details readable with comfortable line-height.",
              "Use timers or search actions as quiet supporting controls.",
              "Do not change layout height when optional actions appear.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium dark:bg-stone-800">
                  1
                </span>
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">Crisp aromatics</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Cook onion and garlic until softened.
                  </p>
                </div>
              </li>
            </ol>
          </Example>
        ),
      },
    ],
  },
  equipment: {
    slug: "equipment",
    title: "Equipment",
    description:
      "Equipment lists show tools needed for a recipe and reference where each tool appears in the steps.",
    sections: [
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Show equipment only when it helps prep or cooking confidence.",
              "Use step references as secondary metadata.",
              "Use tooltips for compact step tags when space is tight.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Large skillet</span>
                <Badge variant="outline">Steps 1, 2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pasta pot</span>
                <Badge variant="outline">Step 3</Badge>
              </div>
            </div>
          </Example>
        ),
      },
    ],
  },
  servings: {
    slug: "servings",
    title: "Servings",
    description:
      "Serving controls scale recipe amounts while keeping the original recipe understandable.",
    sections: [
      {
        title: "Behavior",
        body: (
          <GuidanceList
            items={[
              "Show the current serving count in recipe metadata.",
              "Use blue only when servings differ from the original.",
              "Keep original amounts recoverable.",
              "Use compact desktop controls and drawer-based mobile controls.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <button className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-[var(--color-blue)] hover:bg-[var(--color-blue)]/8">
              <User className="h-4 w-4" />
              Serves <span className="font-medium">6</span>
            </button>
          </Example>
        ),
      },
    ],
  },
  search: {
    slug: "search",
    title: "Search",
    description:
      "Search is both the primary import surface and an in-recipe utility for ingredients and steps.",
    sections: [
      {
        title: "Smart bar",
        body: (
          <div className="space-y-4">
            <Example>
              <SmartInputExample />
            </Example>
            <p>
              The home smart bar accepts URLs, images, and pasted recipe text. In recipe views,
              search becomes a small contextual utility.
            </p>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use placeholder text to describe what the field accepts.",
              "Show detected input as chips before parsing.",
              "Keep contextual recipe search compact and scoped.",
            ]}
          />
        ),
      },
    ],
  },
  settings: {
    slug: "settings",
    title: "Settings",
    description: "Settings surfaces manage account, unit, dietary, and formatting preferences.",
    sections: [
      {
        title: "Settings groups",
        body: (
          <GuidanceList
            items={[
              "Group preferences by the decision they support.",
              "Use toggles and switches for fast repeated settings.",
              "Keep save/apply actions close to the settings they affect.",
              "Use badges for counts and compact status.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-stone-400" />
                <p className="font-medium">Recipe preferences</p>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                Round amounts
                <Switch defaultChecked />
              </label>
            </div>
          </Example>
        ),
      },
    ],
  },
  auth: {
    slug: "auth",
    title: "Auth",
    description:
      "Auth surfaces support sign in, beta access, password reset, and temporary unavailable states.",
    sections: [
      {
        title: "Containers",
        body: (
          <GuidanceList
            items={[
              "Use dialogs on desktop and drawers on mobile for auth flows.",
              "Keep form errors close to the relevant field.",
              "Use spinner states inside buttons during submission.",
              "Use beta copy sparingly and keep the primary path clear.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="space-y-3">
              <Input placeholder="Email" type="email" />
              <Button className="w-full">Continue</Button>
            </div>
          </Example>
        ),
      },
    ],
  },
  media: {
    slug: "media",
    title: "Media",
    description:
      "Media components handle recipe images, handwritten recipe photos, previews, and lightbox zoom.",
    sections: [
      {
        title: "Lightbox behavior",
        body: (
          <GuidanceList
            items={[
              "Use lightbox previews for recipe photos and onboarding screenshots.",
              "Keep alt text specific when the image conveys recipe content.",
              "Avoid dark or cropped media when the user needs to inspect the actual recipe.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="flex h-32 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 dark:border-stone-800 dark:bg-stone-950">
              <ImageIcon className="h-8 w-8" />
            </div>
          </Example>
        ),
      },
    ],
  },
  "release-notices": {
    slug: "release-notices",
    title: "Release notices",
    description:
      "Release notices introduce meaningful app changes without interrupting the main recipe workflow.",
    sections: [
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use compact notices in the app shell when a user is signed in.",
              "Use dialogs for longer release details.",
              "Include version badges only when they help users orient to the change.",
            ]}
          />
        ),
      },
      {
        title: "Example",
        body: (
          <Example>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
              <div>
                <p className="text-sm font-medium">New import improvements</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Better pasted recipe parsing.
                </p>
              </div>
              <Badge variant="secondary">v0.1</Badge>
            </div>
          </Example>
        ),
      },
    ],
  },
  "splash-screen": {
    slug: "splash-screen",
    title: "Splash screen",
    description:
      "The splash screen handles core app entry and loading transitions without showing incomplete state.",
    sections: [
      {
        title: "Behavior",
        body: (
          <GuidanceList
            items={[
              "Show the splash only for authenticated core-app loading.",
              "Respect reduced motion where possible.",
              "Keep imagery tied to Mizen food assets.",
              "Remove early splash state as soon as the app is ready.",
            ]}
          />
        ),
      },
      {
        title: "Implementation notes",
        body: (
          <p>
            The root layout includes an early HTML splash to avoid a blank frame before React
            hydrates. The app shell controls whether the interactive splash remains visible.
          </p>
        ),
      },
    ],
  },
  inputs: {
    slug: "inputs",
    title: "Inputs",
    description:
      "Inputs are quiet until focused and support Mizen’s URL, image, and pasted-text recipe import model.",
    sections: [
      {
        title: "Base input",
        body: (
          <div className="space-y-4">
            <Example>
              <SmartInputExample />
            </Example>
            <p>
              Use the shadcn <Code>Input</Code> primitive for text fields. It gives consistent
              border, ring, placeholder, disabled, and invalid-state handling.
            </p>
          </div>
        ),
      },
      {
        title: "Long-form text",
        body: (
          <div className="space-y-4">
            <Textarea placeholder="Paste a recipe here..." />
            <p>
              Use <Code>Textarea</Code> for pasted recipes, notes, and feedback details. Keep helper
              text short and close to the field it supports.
            </p>
          </div>
        ),
      },
      {
        title: "Import states",
        body: (
          <GuidanceList
            items={[
              "URL state should show the domain or dish name when detected.",
              "Image state should show the file or thumbnail context before parsing.",
              "Text state should acknowledge pasted recipe content without displaying the full text inline.",
              "Loading state should use progress and spinner patterns already defined in `globals.css`.",
            ]}
          />
        ),
      },
    ],
  },
  navigation: {
    slug: "navigation",
    title: "Navigation",
    description:
      "Navigation is compact, persistent where useful, and quiet enough to keep the recipe surface primary.",
    sections: [
      {
        title: "App sidebar",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="w-full max-w-[240px] space-y-1">
                {["Home", "Cookbook", "Gage's Recipe", "Michelle's Recipe"].map((item, index) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                      index === 0
                        ? "bg-stone-200/60 text-stone-900 dark:bg-stone-700/35 dark:text-stone-100"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Example>
            <p>
              The main app sidebar uses compact rows, rounded-lg active states, and muted inactive
              labels. It should not compete visually with recipe content.
            </p>
          </div>
        ),
      },
      {
        title: "Docs navigation",
        body: (
          <p>
            The design-system docs follow the shadcn docs model: sidebar groups on desktop, focused
            page content, and simple top-level actions. Mobile keeps the content first.
          </p>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use links for navigation and buttons for commands.",
              "Keep active states subtle and based on stone surfaces.",
              "Use icon-only controls only when the icon is familiar or has accessible labeling.",
            ]}
          />
        ),
      },
    ],
  },
  "import-flow": {
    slug: "import-flow",
    title: "Import flow",
    description:
      "The import flow turns URLs, images, and pasted recipe text into a consistent recipe format.",
    sections: [
      {
        title: "Supported sources",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="space-y-3">
                {[
                  ["Recipe URL", "Paste a link from a recipe site.", LinkIcon],
                  ["Image", "Upload a recipe photo or screenshot.", ImageIcon],
                  [
                    "Text",
                    "Paste a generated or handwritten recipe transcription.",
                    TextCursorInput,
                  ],
                ].map(([label, description, Icon]) => (
                  <div
                    key={label as string}
                    className="flex gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {label as string}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {description as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "State progression",
        body: (
          <GuidanceList
            items={[
              "Idle: placeholder describes acceptable input.",
              "Detected: show a compact chip for URL, image, or text.",
              "Parsing: show progress and keep the primary action disabled.",
              "Complete: route to the recipe view with the parsed result.",
              "Failed: explain the failure and keep the original input recoverable.",
            ]}
          />
        ),
      },
      {
        title: "Copy",
        body: (
          <p>
            Use direct labels such as “Paste a link” or “Upload an image.” Avoid long instructional
            copy in the app surface. Save deeper explanations for docs or onboarding.
          </p>
        ),
      },
    ],
  },
  "recipe-view": {
    slug: "recipe-view",
    title: "Recipe view",
    description:
      "The recipe view is where Mizen’s typography, metadata, tabs, and cooking workflow come together.",
    sections: [
      {
        title: "Header",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight">
                  Kimchi Ragu
                </h3>
                <p className="max-w-xl text-lg leading-relaxed text-stone-500 dark:text-stone-400">
                  A rich, spicy sauce built for weeknight pasta.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" /> Total 45 min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Serves 4
                  </span>
                </div>
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "Content order",
        body: (
          <GuidanceList
            items={[
              "Title and summary come first.",
              "Source, time, and servings sit in one compact metadata row.",
              "Ingredients and steps are separated into predictable views.",
              "Serving adjustments use blue only when the recipe has been changed.",
            ]}
          />
        ),
      },
      {
        title: "Interaction",
        body: (
          <p>
            Keep cooking interactions direct. A user should be able to scan ingredients, advance
            through steps, adjust servings, and return to the cookbook without reading instructions.
          </p>
        ),
      },
    ],
  },
  cookbook: {
    slug: "cookbook",
    title: "Cookbook",
    description:
      "The cookbook is a scanning surface for saved recipes, recent imports, and source context.",
    sections: [
      {
        title: "List behavior",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="space-y-2">
                <RecipeRowExample />
                <RecipeRowExample />
                <RecipeRowExample />
              </div>
            </Example>
            <p>
              The list should feel stable. Avoid hover states that shift layout, change row height,
              or expose controls in a way that reflows text.
            </p>
          </div>
        ),
      },
      {
        title: "Metadata",
        body: (
          <GuidanceList
            items={[
              "Show source domain when available.",
              "Show saved or imported date in short form.",
              "Use muted metadata and preserve title contrast.",
              "Use counts in side navigation only when they help orientation.",
            ]}
          />
        ),
      },
      {
        title: "Empty state",
        body: (
          <p>
            Empty cookbook states should point to the import action. Keep the copy short and use the
            standard button treatment.
          </p>
        ),
      },
    ],
  },
  feedback: {
    slug: "feedback",
    title: "Feedback",
    description:
      "Feedback surfaces collect useful product signals without adding noise to normal cooking workflows.",
    sections: [
      {
        title: "Developer availability",
        body: (
          <div className="space-y-4">
            <p>
              The design-system route is public and remains available locally. Developer-only
              feedback tools still mount from the app shell when <Code>NODE_ENV</Code> is{" "}
              <Code>development</Code> and <Code>developerFeedbackToolsEnabled</Code> is enabled.
            </p>
            <CodeBlock>{`process.env.NODE_ENV === "development" &&
  developerFeedbackToolsEnabled`}</CodeBlock>
          </div>
        ),
      },
      {
        title: "Feedback content",
        body: (
          <GuidanceList
            items={[
              "Capture the page or recipe context when possible.",
              "Ask for the shortest useful description of the issue.",
              "Avoid blocking recipe tasks with feedback prompts.",
              "Use toasts for lightweight confirmation after submission.",
            ]}
          />
        ),
      },
      {
        title: "Error reporting",
        body: (
          <Example>
            <div className="flex gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-red)]" />
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Recipe import failed
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
                  Keep the input recoverable, explain what failed, and give the user a direct retry
                  path.
                </p>
              </div>
            </div>
          </Example>
        ),
      },
    ],
  },
};

export function getDesignSystemDoc(slug: DesignSystemSlug) {
  return DOCS[slug];
}

export function getDesignSystemTitle(slug: DesignSystemSlug) {
  return titleBySlug[slug];
}

export function DesignSystemDocPage({ doc }: { doc: DesignSystemDoc }) {
  const { previous, next } = getAdjacentDesignSystemSlugs(doc.slug);

  return (
    <article className="pb-16">
      <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-serif text-[38px] font-bold leading-tight tracking-tight text-stone-950 dark:text-stone-50 sm:text-[48px]">
            {doc.title}
          </h1>
          <CopyPageButton />
        </div>
        <p className="mt-4 max-w-[680px] text-[17px] leading-8 text-stone-500 dark:text-stone-400">
          {doc.description}
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {doc.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold leading-8 text-stone-950 dark:text-stone-50">
              {section.title}
            </h2>
            <div className="space-y-4 text-[15px] leading-7 text-stone-600 dark:text-stone-400">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <Separator className="my-10" />

      <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <Button asChild variant="outline">
            <Link href={getDesignSystemPath(previous)}>
              Previous: {getDesignSystemTitle(previous)}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild>
            <Link href={getDesignSystemPath(next)}>Next: {getDesignSystemTitle(next)}</Link>
          </Button>
        )}
      </nav>
    </article>
  );
}
