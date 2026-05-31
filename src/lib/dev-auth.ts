const truthy = (value: string | undefined) => value === "1" || value === "true";

export function isDevSignInEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.APP_ENV === "staging" ||
    process.env.NEXT_PUBLIC_APP_ENV === "staging" ||
    truthy(process.env.ENABLE_DEV_SIGNIN) ||
    truthy(process.env.NEXT_PUBLIC_ENABLE_DEV_SIGNIN)
  );
}
