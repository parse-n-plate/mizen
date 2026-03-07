import { describe, expect, it } from "vitest";
import {
  EMAIL_CONFIRMATION_MESSAGE,
  EMAIL_NOT_CONFIRMED_MESSAGE,
  EXISTING_ACCOUNT_MESSAGE,
  INVALID_LOGIN_MESSAGE,
  resolveEmailAuthFeedback,
} from "../auth-feedback";

describe("resolveEmailAuthFeedback", () => {
  it("maps invalid login credentials to a generic sign-in recovery message", () => {
    expect(
      resolveEmailAuthFeedback("login", {
        error: { message: "Invalid login credentials" },
      })
    ).toEqual({
      shouldClose: false,
      confirmationSent: false,
      error: INVALID_LOGIN_MESSAGE,
      message: null,
    });
  });

  it("keeps email confirmation guidance explicit on login", () => {
    expect(
      resolveEmailAuthFeedback("login", {
        error: { message: "Email not confirmed" },
      })
    ).toEqual({
      shouldClose: false,
      confirmationSent: false,
      error: EMAIL_NOT_CONFIRMED_MESSAGE,
      message: null,
    });
  });

  it("closes the modal after a successful login", () => {
    expect(
      resolveEmailAuthFeedback("login", {
        error: null,
      })
    ).toEqual({
      shouldClose: true,
      confirmationSent: false,
      error: null,
      message: null,
    });
  });

  it("maps explicit existing-account signup errors to sign-in guidance", () => {
    expect(
      resolveEmailAuthFeedback("signup", {
        error: { message: "User already registered" },
      })
    ).toEqual({
      shouldClose: false,
      confirmationSent: false,
      error: EXISTING_ACCOUNT_MESSAGE,
      message: null,
    });
  });

  it("treats signups with no identities as an existing account", () => {
    expect(
      resolveEmailAuthFeedback("signup", {
        error: null,
        user: { identities: [] },
      })
    ).toEqual({
      shouldClose: false,
      confirmationSent: false,
      error: EXISTING_ACCOUNT_MESSAGE,
      message: null,
    });
  });

  it("shows confirmation guidance for a new signup", () => {
    expect(
      resolveEmailAuthFeedback("signup", {
        error: null,
        user: { identities: [{}] },
      })
    ).toEqual({
      shouldClose: false,
      confirmationSent: true,
      error: null,
      message: EMAIL_CONFIRMATION_MESSAGE,
    });
  });
});
