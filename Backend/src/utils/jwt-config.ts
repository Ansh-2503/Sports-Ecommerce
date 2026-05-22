/**
 * Central JWT secret resolution. Production must define secrets in env.
 */
export function getJwtSecrets(): { access: string; refresh: string } {
  const access = process.env.JWT_SECRET?.trim();
  const refresh = process.env.JWT_REFRESH_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!access || !refresh) {
      throw new Error(
        "JWT_SECRET and JWT_REFRESH_SECRET are required in production"
      );
    }
    return { access, refresh };
  }

  return {
    access: access || "dev-only-change-me-access",
    refresh: refresh || "dev-only-change-me-refresh",
  };
}
