"use client";

import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { OtherPreferences } from "@/components/settings/OtherPreferences";
import { changeAccountEmail, changeAccountPassword } from "@/app/settings/security-actions";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/errors";

export default function SettingsPage() {
  const { user } = useAuth();
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [passwordCode, setPasswordCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [sendingPasswordCode, setSendingPasswordCode] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.user_metadata?.first_name ?? "";
  const name = nameOverride ?? (typeof savedName === "string" ? savedName : "");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name before saving.");
      return;
    }

    setSavingProfile(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ data: { full_name: trimmedName } });
      if (updateError) setError(friendlyAuthError(updateError, "update account"));
      else setMessage("Your profile name was updated.");
    } catch {
      setError("Could not update your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function sendVerificationCode(kind: "email" | "password") {
    setMessage(null);
    setError(null);
    const setLoading = kind === "email" ? setSendingEmailCode : setSendingPasswordCode;
    setLoading(true);
    try {
      const { error: requestError } = await createClient().auth.reauthenticate();
      if (requestError) throw requestError;
      if (kind === "email") {
        setEmailCodeSent(true);
        setEmailCode("");
      } else {
        setPasswordCodeSent(true);
        setPasswordCode("");
      }
      setMessage(`A one-time verification code was sent to ${user?.email ?? "your account email"}.`);
    } catch (requestError) {
      setError(friendlyAuthError(requestError, "update account"));
    } finally {
      setLoading(false);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSavingEmail(true);
    try {
      const result = await changeAccountEmail(newEmail, emailCode);
      if (result.error) setError(result.error);
      else {
        setNewEmail("");
        setEmailCode("");
        setEmailCodeSent(false);
        setMessage("Email change started. Follow the confirmation email from Supabase to finish updating your address.");
      }
    } catch (changeError) {
      setError(friendlyAuthError(changeError, "update account"));
    } finally {
      setSavingEmail(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSavingPassword(true);
    try {
      const result = await changeAccountPassword(currentPassword, newPassword, confirmPassword, passwordCode);
      if (result.error) setError(result.error);
      else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordCode("");
        setPasswordCodeSent(false);
        setMessage("Your password was changed.");
      }
    } catch (changeError) {
      setError(friendlyAuthError(changeError, "update account"));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your profile and account security.</p>
        </div>

        {(message || error) && (
          <p role={error ? "alert" : "status"} className={error ? "text-sm text-red-400" : "text-sm text-emerald-400"}>
            {error ?? message}
          </p>
        )}

        <Card>
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="mt-1 text-sm text-zinc-400">Your name appears in your dashboard greeting.</p>
          <form className="mt-5 max-w-lg space-y-4" onSubmit={saveProfile}>
            <Field label="Name" htmlFor="profile-name">
              <Input id="profile-name" autoComplete="name" value={name} onChange={(event) => setNameOverride(event.target.value)} />
            </Field>
            <Button type="submit" loading={savingProfile}>Save profile</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Email verification</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            StudyForge sends a one-time code to the current sign-in email before sensitive account changes. If your account uses Gmail, the code arrives in that Gmail inbox. This uses Supabase email reauthentication, not an authenticator app or QR code.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Email address</h2>
          <p className="mt-1 text-sm text-zinc-400">Current email: {user?.email ?? "Not signed in"}. The new address may also need confirmation.</p>
          <form className="mt-5 flex max-w-lg flex-col items-start gap-4" onSubmit={changeEmail}>
            <Field label="New email" htmlFor="new-email">
              <Input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
            </Field>
            {!emailCodeSent ? (
              <Button type="button" variant="secondary" loading={sendingEmailCode} disabled={!user?.email} onClick={() => void sendVerificationCode("email")}>
                Send code to current email
              </Button>
            ) : (
              <>
                <Field label="Email verification code" htmlFor="email-reauth-code" hint={`Enter the code sent to ${user?.email ?? "your current email"}.`}>
                  <Input id="email-reauth-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value)} required />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="secondary" loading={savingEmail}>Verify code and change email</Button>
                  <Button type="button" variant="ghost" loading={sendingEmailCode} onClick={() => void sendVerificationCode("email")}>Resend code</Button>
                </div>
              </>
            )}
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Password</h2>
          <p className="mt-1 text-sm text-zinc-400">Enter your current password, choose and confirm a new password, then verify the code sent to your current email.</p>
          <form className="mt-5 flex max-w-lg flex-col items-start gap-4" onSubmit={changePassword}>
            <Field label="Current password" htmlFor="current-password">
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </Field>
            <Field label="New password" htmlFor="new-password" hint="Use at least 8 characters.">
              <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm-password">
              <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </Field>
            {!passwordCodeSent ? (
              <Button type="button" variant="secondary" loading={sendingPasswordCode} disabled={!user?.email} onClick={() => void sendVerificationCode("password")}>
                Send code to current email
              </Button>
            ) : (
              <>
                <Field label="Email verification code" htmlFor="password-reauth-code" hint={`Enter the code sent to ${user?.email ?? "your current email"}.`}>
                  <Input id="password-reauth-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={passwordCode} onChange={(event) => setPasswordCode(event.target.value)} required />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="secondary" loading={savingPassword}>Verify code and change password</Button>
                  <Button type="button" variant="ghost" loading={sendingPasswordCode} onClick={() => void sendVerificationCode("password")}>Resend code</Button>
                </div>
              </>
            )}
          </form>
        </Card>

        <OtherPreferences user={user} />
      </div>
    </AppShell>
  );
}
