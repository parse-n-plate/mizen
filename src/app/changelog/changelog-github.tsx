"use client";

import { useEffect, useState } from "react";

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    committer: {
      date: string;
    };
  };
};

type ChangelogEntry = {
  commitUrl: string;
  date: string;
  dateTime: string;
  month: string;
  pr: number;
  prUrl: string;
  title: string;
};

type HistorySection = {
  label: string;
  entries: ChangelogEntry[];
};

type ChangelogGitHubProps = {
  appVersion: string;
};

type ChangelogState =
  | { status: "loading"; entries: ChangelogEntry[] }
  | { status: "loaded"; entries: ChangelogEntry[] }
  | { status: "error"; entries: ChangelogEntry[] };

const repo = "parse-n-plate/mizen";
const githubApiBase = `https://api.github.com/repos/${repo}`;
const githubWebBase = `https://github.com/${repo}`;

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Honolulu",
    ...options,
  }).format(date);
}

function cleanTitle(title: string) {
  const withoutPr = title.replace(/\s*\(#\d+\)\s*$/, "").trim();
  const withoutConventionalPrefix = withoutPr.replace(/^[a-z]+(?:\([^)]+\))?:\s+/i, "");

  if (!withoutConventionalPrefix) return withoutPr;

  return withoutConventionalPrefix[0].toUpperCase() + withoutConventionalPrefix.slice(1);
}

function parseCommit(commit: GitHubCommit): ChangelogEntry | null {
  const lines = commit.commit.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  const prMatch = firstLine.match(/#(\d+)/);

  if (!prMatch) return null;

  const pr = Number(prMatch[1]);
  const titleLine = firstLine.startsWith("Merge pull request") ? lines[1] : firstLine;
  const committedAt = new Date(commit.commit.committer.date);

  return {
    commitUrl: commit.html_url,
    date: formatDate(committedAt, { month: "short", day: "numeric" }),
    dateTime: commit.commit.committer.date,
    month: formatDate(committedAt, { month: "long", year: "numeric" }),
    pr,
    prUrl: `${githubWebBase}/pull/${pr}`,
    title: cleanTitle(titleLine ?? firstLine),
  };
}

async function fetchGitHubCommits(page: number, signal: AbortSignal): Promise<GitHubCommit[]> {
  const response = await fetch(`${githubApiBase}/commits?sha=main&per_page=100&page=${page}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`GitHub commits request failed with ${response.status}`);
  }

  return response.json() as Promise<GitHubCommit[]>;
}

async function getChangelogEntries(signal: AbortSignal) {
  const pages = await Promise.all([1, 2, 3].map((page) => fetchGitHubCommits(page, signal)));
  const seen = new Set<number>();
  const entries: ChangelogEntry[] = [];

  for (const commit of pages.flat()) {
    const entry = parseCommit(commit);
    if (!entry || seen.has(entry.pr)) continue;

    seen.add(entry.pr);
    entries.push(entry);
  }

  return entries;
}

function groupByMonth(entries: ChangelogEntry[]): HistorySection[] {
  const sections: HistorySection[] = [];

  for (const entry of entries) {
    const section = sections.find((item) => item.label === entry.month);

    if (section) {
      section.entries.push(entry);
    } else {
      sections.push({ label: entry.month, entries: [entry] });
    }
  }

  return sections;
}

function PrPill({ entry }: { entry: ChangelogEntry }) {
  return (
    <a
      href={entry.prUrl}
      className="justify-self-start rounded-full border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs font-semibold leading-none text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-100 sm:justify-self-end"
    >
      #{entry.pr}
    </a>
  );
}

function ChangelogLoading() {
  return (
    <section className="border-t border-stone-200 py-10 dark:border-stone-800">
      <p className="font-sans text-sm leading-6 text-stone-500 dark:text-stone-400">
        Loading GitHub changelog...
      </p>
    </section>
  );
}

export function ChangelogGitHub({ appVersion }: ChangelogGitHubProps) {
  const [state, setState] = useState<ChangelogState>({ status: "loading", entries: [] });

  useEffect(() => {
    const controller = new AbortController();

    getChangelogEntries(controller.signal)
      .then((entries) => {
        setState({ status: "loaded", entries });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error(error);
        setState({ status: "error", entries: [] });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <ChangelogLoading />;
  }

  if (state.status === "error" || state.entries.length === 0) {
    return (
      <section className="border-t border-stone-200 py-10 dark:border-stone-800">
        <p className="font-sans text-sm leading-6 text-stone-500 dark:text-stone-400">
          GitHub changelog entries could not be loaded right now.
        </p>
      </section>
    );
  }

  const latestEntries = state.entries.slice(0, 3);
  const historySections = groupByMonth(state.entries);

  return (
    <>
      <section className="border-t border-stone-200 dark:border-stone-800">
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {latestEntries.map((entry, index) => (
            <article
              key={entry.pr}
              className="grid gap-5 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10 md:py-10"
            >
              <div className="flex flex-wrap items-center gap-2 self-start md:flex-col md:items-start">
                <time
                  dateTime={entry.dateTime}
                  className="font-sans text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  {entry.date}
                </time>
                {index === 0 && (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 font-sans text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    v{appVersion}
                  </span>
                )}
              </div>

              <div className="max-w-2xl">
                <h2 className="font-serif text-2xl font-semibold leading-tight text-stone-950 dark:text-stone-50">
                  {entry.title}
                </h2>
                <p className="mt-3 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
                  Merged from GitHub pull request #{entry.pr}.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <a
                    href={entry.prUrl}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-100"
                  >
                    PR #{entry.pr}
                  </a>
                  <a
                    href={entry.commitUrl}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-100"
                  >
                    Commit
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 py-10 dark:border-stone-800 lg:py-12">
        <div className="flex flex-col gap-8">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl font-semibold leading-tight text-stone-950 dark:text-stone-50">
              Full history
            </h2>
            <p className="mt-2 font-sans text-sm leading-6 text-stone-500 dark:text-stone-400">
              PR-backed changes from the repository history.
            </p>
          </div>

          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {historySections.map((section) => (
              <section key={section.label} className="py-6 first:pt-0 last:pb-0">
                <h3 className="font-sans text-sm font-semibold text-stone-500 dark:text-stone-400">
                  {section.label}
                </h3>
                <ol className="mt-4 space-y-3">
                  {section.entries.map((entry) => (
                    <li
                      key={`${section.label}-${entry.pr}`}
                      className="grid gap-2 font-sans text-sm leading-6 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    >
                      <time
                        dateTime={entry.dateTime}
                        className="text-stone-400 dark:text-stone-500"
                      >
                        {entry.date}
                      </time>
                      <span className="text-stone-700 dark:text-stone-300">{entry.title}</span>
                      <PrPill entry={entry} />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
