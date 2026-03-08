export type EmailAuthMode = "login" | "signup";

type AuthErrorLike = {
  message: string;
} | null;

type AuthUserLike = {
  identities?: unknown[] | null;
} | null;

type EmailAuthResponseLike = {
  error: AuthErrorLike;
  user?: AuthUserLike;
};

export const EXISTING_ACCOUNT_MESSAGE =
  "An account with this email already exists. Please sign in instead.";

export const INVALID_LOGIN_MESSAGE =
  "We couldn't sign you in with that email and password. Check your credentials, reset your password, or create an account.";

export const EMAIL_CONFIRMATION_MESSAGE =
  "Check your email for a confirmation link. It may take a minute to arrive.";

export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Please confirm your email before signing in. Check your inbox for the confirmation link.";

export function resolveEmailAuthFeedback(
  mode: EmailAuthMode,
  response: EmailAuthResponseLike
): {
  shouldClose: boolean;
  confirmationSent: boolean;
  error: string | null;
  message: string | null;
} {
  if (mode === "login") {
    if (!response.error) {
      return {
        shouldClose: true,
        confirmationSent: false,
        error: null,
        message: null,
      };
    }

    return {
      shouldClose: false,
      confirmationSent: false,
      error: normalizeLoginErrorMessage(response.error.message),
      message: null,
    };
  }

  if (response.error) {
    return {
      shouldClose: false,
      confirmationSent: false,
      error: isExistingAccountError(response.error.message)
        ? EXISTING_ACCOUNT_MESSAGE
        : response.error.message,
      message: null,
    };
  }

  if (isObfuscatedExistingUser(response.user)) {
    return {
      shouldClose: false,
      confirmationSent: false,
      error: EXISTING_ACCOUNT_MESSAGE,
      message: null,
    };
  }

  return {
    shouldClose: false,
    confirmationSent: true,
    error: null,
    message: EMAIL_CONFIRMATION_MESSAGE,
  };
}

function normalizeLoginErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return INVALID_LOGIN_MESSAGE;
  }

  if (normalized.includes("email not confirmed")) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }

  return message;
}

function isExistingAccountError(message: string) {
  return message.trim().toLowerCase().includes("user already registered");
}

function isObfuscatedExistingUser(user?: AuthUserLike) {
  return Boolean(user && (!user.identities || user.identities.length === 0));
}
