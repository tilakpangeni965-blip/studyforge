"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { OtherPreferences } from "@/components/settings/OtherPreferences";
import { getTutorConfiguration } from "@/app/tutor/actions";
import { changeAccountEmail, changeAccountPassword } from "@/app/settings/security-actions";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

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
  const [tutorConfig, setTutorConfig] = useState<{ enabled: boolean; primaryEnabled?: boolean; model: string | null; backupEnabled?: boolean; backupModel?: string | null } | null>(null);

  const savedName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.user_metadata?.first_name ?? "";
  const name = nameOverride ?? (typeof savedName === "string" ? savedName : "");

  useEffect(() => {
    let active = true;
    void getTutorConfiguration().then((result) => {
      if (!active) return;
      setTutorConfig({ enabled: result.enabled, model: result.model });
      if (result.error) setError(result.error);
    }).catch(() => {
      if (active) setError("Could not read the AI tutor configuration.");
    });
    return () => { active = false; };
  }, []);

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
      if (updateError) setError(updateError.message);
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
      setError(requestError instanceof Error ? requestError.message : "Could not send a verification code. Please try again.");
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
      setError(changeError instanceof Error ? changeError.message : "Could not change your email. Please try again.");
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
      setError(changeError instanceof Error ? changeError.message : "Could not change your password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your profile, security, and AI tutor privacy.</p>
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

        <Card>
          <h2 className="text-lg font-semibold text-white">AI Tutor</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {tutorConfig === null
              ? "Checking the server configuration…"
              : tutorConfig.enabled
                ? tutorConfig.primaryEnabled
                  ? `Tutor is available. DeepSeek (${tutorConfig.model}) is primary${tutorConfig.backupEnabled ? `; Gemini (${tutorConfig.backupModel}) is backup` : "; no backup is configured"}.`
                  : `Gemini (${tutorConfig.backupModel}) is available as the only configured tutor provider.`
                : "No AI provider is configured on this server yet."}
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            When you use the tutor, the StudyForge server sends your question, recent text messages from that thread, its subject name, and any attached image to DeepSeek. If DeepSeek fails and Gemini is configured, that same tutor request is also sent to Gemini as a backup. Google’s free Gemini tier may use submitted content to improve Google products; review Google’s data terms before enabling it. Voice input is paused. Images are stored in a private Supabase bucket so they can appear in your tutoring history. Your email, profile, and other threads are not included. Provider keys stay on the server; students do not need to install or download either AI.
          </p>
          <Link href="/tutor" className={`${buttonVariants({ variant: "secondary" })} mt-4`}>
            Open AI Tutor
          </Link>
        </Card>

        <OtherPreferences user={user} />
      </div>
    </AppShell>
  );
}
