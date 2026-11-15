import type { Metadata } from "next";
import { ServingsRulerInput } from "@/components/ServingsRulerInput";

export const metadata: Metadata = {
  title: "UI SDK servings prototype",
  robots: { index: false, follow: false },
};

export default function UiSdkServingsPrototypePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6">
        <ServingsRulerInput originalServings={4} />
      </div>
    </main>
  );
}
