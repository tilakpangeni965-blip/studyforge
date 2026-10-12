type SupabaseErrorShape = { code?: unknown; message?: unknown; error_description?: unknown };

function errorParts(error: unknown) {
  if (!error || typeof error !== "object") return { code: "", message: String(error ?? "") };
  const value = error as SupabaseErrorShape;
  return {
    code: typeof value.code === "string" ? value.code : "",
    message: typeof value.message === "string"
      ? value.message
      : typeof value.error_description === "string" ? value.error_description : "",
  };
}

export function friendlyDatabaseError(error: unknown, fallback = "That change could not be saved. Please try again.") {
  const { code, message } = errorParts(error);
  const detail = `${code} ${message}`.toLowerCase();

  if (/bucket not found|storage.*not configured/.test(detail)) {
    return "File storage is not ready yet. Please contact StudyForge support.";
  }
  if (code === "23503" || /foreign key constraint/.test(detail)) {
    return "Some linked information is no longer available. Refresh the page and try again.";
  }
  if (code === "23505" || /duplicate key|already exists/.test(detail)) {
    return "That item already exists. Check your list and try again.";
  }
  if (code === "23502" || /not-null constraint/.test(detail)) {
    return "Please fill in all required information and try again.";
  }
  if (code === "23514" || /check constraint/.test(detail)) {
    return "Some information is not valid. Check it and try again.";
  }
  if (code === "42501" || /row-level security|permission denied|unauthorized/.test(detail)) {
    return "Please sign in again, then try that action once more.";
  }
  if (/failed to fetch|network|timed out|timeout/.test(detail)) {
    return "Check your internet connection and try again.";
  }
  if (/schema cache|could not find the table|relation .* does not exist/.test(detail)) {
    return "This feature is not ready yet. Please try again later.";
  }
  return fallback;
}

export function friendlyAuthError(error: unknown, action: "sign in" | "sign up" | "reset password" | "update account" = "update account") {
  const { code, message } = errorParts(error);
  const detail = `${code} ${message}`.toLowerCase();

  if (/already registered|user already exists|email already exists/.test(detail)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/invalid login credentials|invalid email or password/.test(detail)) {
    return "The email or password doesn’t match an account. Check both and try again.";
  }
  if (/invalid email|email address is invalid/.test(detail)) {
    return "Enter a valid email address.";
  }
  if (/password.*(weak|at least|characters)|weak password/.test(detail)) {
    return "Choose a stronger password that meets the password requirements.";
  }
  if (/email not confirmed/.test(detail)) {
    return "Please confirm your email using the link we sent before signing in.";
  }
  if (/rate limit|too many requests/.test(detail)) {
    return "Too many attempts. Please wait a little and try again.";
  }
  if (/expired|invalid.*(token|otp)|token.*(expired|invalid)/.test(detail)) {
    return "That link or code has expired. Request a new one and try again.";
  }
  if (/foreign key constraint|23503|database error saving new user/.test(detail)) {
    return action === "sign up"
      ? "We couldn’t finish setting up your account. Please try again; if this keeps happening, contact StudyForge support."
      : "Your account could not be updated. Please try again.";
  }
  if (/failed to fetch|network|timed out|timeout/.test(detail)) {
    return "Check your internet connection and try again.";
  }
  const fallback: Record<typeof action, string> = {
    "sign in": "We couldn’t sign you in right now. Please try again.",
    "sign up": "We couldn’t create your account right now. Please try again.",
    "reset password": "We couldn’t reset your password. Request a new link and try again.",
    "update account": "We couldn’t update your account. Please try again.",
  };
  return fallback[action];
}
