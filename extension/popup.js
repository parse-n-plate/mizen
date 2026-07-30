const APP_ORIGIN = "https://mizen.recipes";
const SAVE_ENDPOINT = `${APP_ORIGIN}/api/extension/save`;

const states = {
  loading: document.querySelector("#loading-state"),
  success: document.querySelector("#success-state"),
  error: document.querySelector("#error-state"),
};

const loadingTitle = document.querySelector("#loading-title");
const savedTitle = document.querySelector("#saved-title");
const errorHeading = document.querySelector("#error-heading");
const errorMessage = document.querySelector("#error-message");
const errorAction = document.querySelector("#error-action");
const openSavedButton = document.querySelector("#open-saved");

let savedPageUrl = null;
let errorActionHandler = saveActivePage;

function showState(name) {
  for (const [stateName, element] of Object.entries(states)) {
    element.hidden = stateName !== name;
  }
}

function isNormalWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function showError({ heading, message, actionLabel = "Try again", action = saveActivePage }) {
  errorHeading.textContent = heading;
  errorMessage.textContent = message;
  errorAction.textContent = actionLabel;
  errorActionHandler = action;
  showState("error");
}

async function openTab(url) {
  await chrome.tabs.create({ url });
  window.close();
}

async function saveActivePage() {
  showState("loading");
  loadingTitle.textContent = "Reading this page…";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !isNormalWebUrl(tab.url)) {
      showError({
        heading: "This page can’t be saved",
        message: "Open a recipe on a regular website, then try again.",
      });
      return;
    }

    const title = (tab.title?.trim() || new URL(tab.url).hostname).slice(0, 500);
    loadingTitle.textContent = title;

    const response = await fetch(SAVE_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url, title }),
    });

    let result = {};
    try {
      result = await response.json();
    } catch {
      // The status-specific fallback below is more useful than a JSON parse error.
    }

    if (response.status === 401 || result.code === "UNAUTHORIZED") {
      const signInUrl = result.signInUrl || `${APP_ORIGIN}/?signin=1`;
      showError({
        heading: "Sign in to save",
        message: "Open Mizen, sign in, then click the extension again.",
        actionLabel: "Sign in to Mizen",
        action: () => openTab(signInUrl),
      });
      return;
    }

    if (!response.ok || !result.savedPageUrl) {
      showError({
        heading: result.code === "PARSE_FAILED" ? "No recipe found" : "Couldn’t save this page",
        message: result.error || "Check your connection and try again.",
      });
      return;
    }

    savedPageUrl = result.savedPageUrl;
    savedTitle.textContent = result.title || title;
    showState("success");
  } catch {
    showError({
      heading: "Couldn’t reach Mizen",
      message: "Check your connection and try again.",
    });
  }
}

errorAction.addEventListener("click", () => errorActionHandler());
openSavedButton.addEventListener("click", () => {
  if (savedPageUrl?.startsWith(`${APP_ORIGIN}/`)) openTab(savedPageUrl);
});

saveActivePage();
