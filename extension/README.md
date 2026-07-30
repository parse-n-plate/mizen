# Mizen Chrome extension MVP

This Manifest V3 extension saves the active recipe page directly to the signed-in user's Mizen cookbook.

## Load locally

1. Deploy the matching Mizen backend changes to `https://mizen.recipes`.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode.
4. Choose **Load unpacked** and select this `extension` directory.
5. Sign in to Mizen in the same Chrome profile.
6. Open a recipe page and click the Mizen toolbar action.

## Flow

The popup reads the active tab through the temporary `activeTab` permission and sends `{ url, title }` to `POST /api/extension/save`. The endpoint verifies the Mizen session, parses the URL, upserts the recipe by source URL, and returns the canonical saved recipe URL at `/r/{slug}`.

The extension intentionally requests no access to page contents, history, cookies, notifications, side panels, or screenshots. Host access is limited to `https://mizen.recipes/*` so authenticated requests can reuse the user's existing Mizen session.
