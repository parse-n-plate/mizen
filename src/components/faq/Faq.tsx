"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import { Accordion } from "@base-ui/react/accordion";
import styles from "./faq.module.css";
import { SUNSET_NOTE_HREF } from "@/lib/sunset";

const answerLink =
  "underline underline-offset-4 hover:text-stone-900 dark:hover:text-stone-100 transition-none";
const questions = [
  {
    id: "about",
    question: "What is Mizen?",
    answer: (
      <>
        Mizen is a recipe app for saving recipes and coming back to them later. It brings recipes
        from different sources into a consistent format with ingredients and cooking steps.
      </>
    ),
  },
  {
    id: "sunset",
    question: "Is Mizen shutting down?",
    answer: (
      <>
        Yes, Mizen is sunsetting.{" "}
        <Link href={SUNSET_NOTE_HREF} className={answerLink}>
          Read the note
        </Link>{" "}
        for the details.
      </>
    ),
  },
  {
    id: "signups",
    question: "Can I still sign up or join the waitlist?",
    answer: (
      <>
        No. Mizen is no longer accepting new signups or waitlist requests, and the waitlist is
        closed.
      </>
    ),
  },
  {
    id: "recipes",
    question: "I\u2019m in the beta. Can I still get to my recipes?",
    answer: (
      <>
        For now, yes. Sign in with the email address on your invite and save the recipes you want to
        keep using the Copy or Print button on each recipe. The site may go offline, and we
        can&rsquo;t promise how long it will stay up.
      </>
    ),
  },
];

// Adapted from Negi Studio's FAQ: https://github.com/gageminamoto/negi-studio-site/tree/main/components/faq
export function Faq() {
  const [openValue, setOpenValue] = useState<string[]>([]);
  const [instant, setInstant] = useState(false);
  const openedByFind = useRef<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !openedByFind.current) return;
      const value = openedByFind.current;
      setInstant(true);
      setOpenValue((current) => (current.length === 1 && current[0] === value ? [] : current));
      openedByFind.current = null;
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return (
    <Accordion.Root
      hiddenUntilFound
      value={openValue}
      onValueChange={(next, details) => {
        if (details.reason === "none") {
          setInstant(true);
          openedByFind.current = next[0] ?? null;
        } else if (details.reason === "trigger-press") {
          openedByFind.current = null;
        }
        setOpenValue(next);
      }}
    >
      {questions.map((item) => (
        <Accordion.Item
          key={item.id}
          value={item.id}
          className={styles.item}
          data-instant={instant}
        >
          <Accordion.Header render={<h2 />} className={styles.question}>
            <Accordion.Trigger
              className={styles.summary}
              onClick={(event) => setInstant(event.detail === 0)}
            >
              <span>{item.question}</span>
              <AltArrowDown aria-hidden="true" className={styles.icon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.answer}>
            <div className={styles.answerInner}>
              <p className={styles.answerContent}>{item.answer}</p>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
