"use client";

import { useRef, useState } from "react";
import { RecipeSection } from "@/components/shared/recipe-section";
import Alarm from "@solar-icons/react/csr/time/Alarm";
import { IngredientCheckbox } from "@/components/ui/ingredient-checkbox";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { usePrepCompletion } from "@/hooks/usePrepCompletion";
import { prepNoteKey, sortPrepNotes } from "@/lib/prep-notes";
import type { PrepNote } from "@/lib/types";

interface Props {
  notes: PrepNote[];
  recipeIdentity: string;
}

export function PrepNotesCard(props: Props) {
  const { user, loading } = useUser();
  if (!props.notes.length) return null;
  return (
    <PrepChecklist
      key={`${user?.id ?? "guest"}:${props.recipeIdentity}`}
      {...props}
      userId={user?.id}
      authLoading={loading}
    />
  );
}

function PrepChecklist({
  notes,
  recipeIdentity,
  userId,
  authLoading,
}: Props & { userId?: string; authLoading: boolean }) {
  const { completion, ready, saving, error, toggle, refresh } = usePrepCompletion(
    recipeIdentity,
    userId
  );
  const [expanded, setExpanded] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const previewRef = useRef<HTMLButtonElement>(null);
  const sorted = sortPrepNotes(notes);
  const remaining = sorted.filter((note) => completion[prepNoteKey(note)] !== true);
  const allDone = ready && remaining.length === 0;
  const open = expanded && (!allDone || showCompleted);
  const urgent = remaining[0];

  return (
    <RecipeSection
      title="Prep notes"
      count={sorted.length}
      open={open}
      triggerRef={previewRef}
      onOpenChange={(nextOpen) => {
        setExpanded(nextOpen);
        setShowCompleted(allDone);
      }}
      notice={
        error && (
          <div role="alert" className="px-3.5 pb-3 text-sm text-red-700 dark:text-red-300">
            {error}{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-inherit underline"
              onClick={() => void refresh()}
            >
              Retry
            </Button>
          </div>
        )
      }
      summary={
        !open && (
          <>
            {urgent?.phase === "advance" && (
              <Alarm size={16} className="mt-0.5 shrink-0" aria-label="Advance preparation" />
            )}
            <span>
              {allDone
                ? "All prep complete"
                : urgent
                  ? `${urgent.action}${urgent.timing ? ` · ${urgent.timing}` : ""}`
                  : "Before cooking"}
            </span>
          </>
        )
      }
    >
      <div className="pb-2 pt-4 md:px-3">
        <h3 className="sr-only font-sans">Before cooking</h3>
        <ul className="space-y-3">
          {sorted.map((note) => {
            const key = prepNoteKey(note);
            const checked = completion[key] === true;
            return (
              <li key={key}>
                <label className="flex items-start gap-2.5 text-sm text-stone-800 dark:text-stone-200">
                  <IngredientCheckbox
                    checked={checked}
                    disabled={!ready || authLoading || saving}
                    onChange={(event) => {
                      const completed = event.target.checked;
                      if (completed && remaining.length === 1) previewRef.current?.focus();
                      setShowCompleted(false);
                      void toggle(key, completed);
                    }}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className={checked ? "line-through opacity-60" : ""}>{note.action}</span>
                    {(note.phase === "advance" ||
                      note.timing ||
                      note.requirement === "recommended") && (
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-stone-500 dark:text-stone-400">
                        {note.phase === "advance" && (
                          <Alarm size={14} aria-label="Advance preparation" />
                        )}
                        {note.timing && <span>{note.timing}</span>}
                        {note.requirement === "recommended" && (
                          <span>{note.timing ? "· Optional" : "Optional"}</span>
                        )}
                      </span>
                    )}
                    {note.requirement === "required" && <span className="sr-only">Required</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </RecipeSection>
  );
}
