const truthy = (value: string | undefined) => value === "1" || value === "true";

const isGageParseNPlatePreview = () => {
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "";

  return (
    vercelEnv === "preview" &&
    vercelUrl.startsWith("parse-n-plate-") &&
    vercelUrl.endsWith("-gages-projects-6a9ee19d.vercel.app")
  );
};

export function isDevSignInEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.APP_ENV === "staging" ||
    process.env.NEXT_PUBLIC_APP_ENV === "staging" ||
    truthy(process.env.ENABLE_DEV_SIGNIN) ||
    truthy(process.env.NEXT_PUBLIC_ENABLE_DEV_SIGNIN) ||
    isGageParseNPlatePreview()
  );
}
