"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import { Accordion } from "@base-ui/react/accordion";
import styles from "./faq.module.css";

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
    id: "access",
    question: "How can I try Mizen?",
    answer: (
      <>
        Mizen is currently in closed beta. Join the{" "}
        <Link href="/links" className={answerLink}>
          waitlist
        </Link>{" "}
        for access, or sign in if you already have an account.
      </>
    ),
  },
  {
    id: "import",
    question: "How do I add a recipe?",
    answer: (
      <>
        Paste a recipe URL, upload a recipe photo, or paste recipe text, including a recipe from
        ChatGPT. Review the result, then tap the heart to save it to your cookbook. The{" "}
        <Link href="/get-started" className={answerLink}>
          getting started guide
        </Link>{" "}
        walks through each step.
      </>
    ),
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer: (
      <>
        You need to sign in to save recipes to your cookbook. You can read the getting started
        guide, updates, FAQ, privacy policy, and terms without signing in.
      </>
    ),
  },
  {
    id: "servings",
    question: "Can I change the number of servings?",
    answer: (
      <>
        Yes. Use the servings control on a recipe to adjust the ingredient amounts. Check the
        quantities as you cook, since some recipes do not scale evenly.
      </>
    ),
  },
  {
    id: "sources",
    question: "Can Mizen import every recipe website?",
    answer: (
      <>
        Some websites may block access or format their recipes in ways Mizen cannot read. If a link
        does not work, try pasting the recipe text or uploading a photo instead.
      </>
    ),
  },
  {
    id: "accuracy",
    question: "What if an imported recipe looks wrong?",
    answer: (
      <>
        Compare the ingredients, quantities, and steps with the original recipe before cooking. If
        something is missing or incorrect, send us the source and describe what went wrong so we can
        investigate.
      </>
    ),
  },
  {
    id: "feedback",
    question: "How do I report a problem or share feedback?",
    answer: (
      <>
        Join our{" "}
        <a href="https://discord.gg/Pt4t8K8h9" className={answerLink}>
          Discord
        </a>{" "}
        or email{" "}
        <a href="mailto:hello@mizen.recipes" className={answerLink}>
          hello@mizen.recipes
        </a>
        . Tell us what you were trying to do and what happened.
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
