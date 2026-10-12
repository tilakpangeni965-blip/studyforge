"use server";

import { createClient } from "@/lib/supabase/server";

type CredentialUpdate = { email: string; nonce: string } | { password: string; current_password: string; nonce: string };

async function updateCredential(update: CredentialUpdate) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: "Please sign in again before changing account security." };

    const { error } = await supabase.auth.updateUser(update);
    if (error) return { error: error.message };
    return { success: true };
  } catch {
    return { error: "Could not update your account. Please try again." };
  }
}

export async function changeAccountEmail(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: "Enter a valid email address." };
  }
  if (!/^\d{6}$/.test(code.trim())) return { error: "Enter the six-digit code sent to your current email." };
  return updateCredential({ email: normalizedEmail, nonce: code.trim() });
}

export async function changeAccountPassword(currentPassword: string, password: string, confirmPassword: string, code: string) {
  if (!currentPassword) return { error: "Enter your current password." };
  if (password.length < 8) return { error: "Choose a password with at least 8 characters." };
  if (password !== confirmPassword) return { error: "The new passwords do not match." };
  if (!/^\d{6}$/.test(code.trim())) return { error: "Enter the six-digit code sent to your current email." };
  return updateCredential({ password, current_password: currentPassword, nonce: code.trim() });
}
