"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

type ComposerProps = {
  sendMessage: (content: string, files: File[]) => Promise<boolean>;
  submitting: boolean;
};

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function TutorComposer({ sendMessage, submitting }: ComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const acceptFile = useCallback((file?: File) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setLocalError("Images must be 8 MB or smaller.");
      return;
    }
    if (!imageTypes.has(file.type)) {
      setLocalError("Use a JPG, PNG, or WebP image.");
      return;
    }
    setLocalError(null);
    setAttachment(file);
  }, []);

  const submit = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || submitting) return;
    const sent = await sendMessage(trimmed, attachment ? [attachment] : []);
    if (sent) {
      setText("");
      setAttachment(null);
      setLocalError(null);
    }
  }, [text, attachment, submitting, sendMessage]);

  return (
    <Card className="border-white/8 bg-gradient-to-br from-[#151528] to-[#121217]">
      <form role="form" aria-label="Tutor message input" onSubmit={submit} className="flex flex-col gap-3 p-4">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your question here..."
          aria-label="Your question"
          disabled={submitting}
          className="resize-y"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl border border-hairline-strong bg-surface-raised px-3 text-xs font-medium text-ink hover:bg-surface-hover">
            Add image
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose an image" disabled={submitting} onChange={(event) => { acceptFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
          </label>
          {attachment && (
            <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
              <span className="max-w-52 truncate">{attachment.name}</span>
              <button type="button" className="text-zinc-400 underline hover:text-white" onClick={() => setAttachment(null)} disabled={submitting}>Remove</button>
            </span>
          )}
          <Button type="submit" className="ml-auto" loading={submitting} disabled={(!text.trim() && !attachment) || submitting}>
            {submitting ? <Spinner className="h-4 w-4" label={null} /> : "Send"}
          </Button>
        </div>
        {localError && <p role="alert" className="text-sm text-red-400">{localError}</p>}
        <p className="text-xs leading-5 text-zinc-500">Text and image questions are answered by DeepSeek. Voice input is paused. Images are limited to 8 MB.</p>
      </form>
      {!text.trim() && !attachment && !submitting && <div className="px-4 pb-4 text-sm text-zinc-400">Ask a question to start a tutoring session.</div>}
    </Card>
  );
}
