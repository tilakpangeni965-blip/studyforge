"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TutorComposer } from "./TutorComposer";
import { TutorMessage } from "./TutorMessage";
import {
  createTutorConversation,
  deleteTutorConversation,
  listTutorConversations,
  listTutorMessages,
  sendTutorMessage,
} from "@/app/tutor/actions";
import type { TutorConversation, TutorMessage as TutorMessageRecord } from "@/types/tutor";
import type { TutorAttachmentInput } from "@/types/tutor";
import { createClient } from "@/lib/supabase/client";

const attachmentBucket = "tutor-attachments";
const extensionForMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function useTutor() {
  const [conversations, setConversations] = useState<TutorConversation[]>([]);
  const [messages, setMessages] = useState<TutorMessageRecord[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "empty">("loading");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const messageRequest = useRef(0);

  const loadMessages = useCallback(async (conversationId: string) => {
    const requestId = ++messageRequest.current;
    try {
      const result = await listTutorMessages(conversationId);
      if (requestId !== messageRequest.current) return;
      if (result.error) {
        setError(result.error);
      } else {
        setMessages(result.messages);
      }
    } catch {
      if (requestId === messageRequest.current) {
        setError("Could not load conversation messages.");
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInitialConversation() {
      try {
        const result = await listTutorConversations();
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setConversations([]);
          setMessages([]);
          setStatus("empty");
          return;
        }

        setConversations(result.conversations);
        const firstConversation = result.conversations[0];
        setCurrentId(firstConversation?.id ?? null);
        if (firstConversation) {
          const messageResult = await listTutorMessages(firstConversation.id);
          if (!active) return;
          if (messageResult.error) setError(messageResult.error);
          else setMessages(messageResult.messages);
        } else {
          setMessages([]);
        }
        setStatus("idle");
      } catch {
        if (!active) return;
        setError("Could not load conversations.");
        setStatus("empty");
      }
    }

    void loadInitialConversation();
    return () => {
      active = false;
      messageRequest.current += 1;
    };
  }, []);

  const handleOpen = useCallback(
    async (conversationId: string) => {
      setCurrentId(conversationId);
      setError(null);
      await loadMessages(conversationId);
    },
    [loadMessages]
  );

  const handleNewThread = useCallback(async () => {
    const result = await createTutorConversation("New conversation");
    if (result.error) {
      setError(result.error);
    } else if (result.conversation) {
      setConversations((prev) => [result.conversation, ...prev]);
      setCurrentId(result.conversation.id);
      setMessages([]);
    }
  }, []);

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      setSubmitting(true);
      setError(null);
      const uploadedPaths: string[] = [];
      try {
        let targetId = currentId;
        if (!targetId) {
          const created = await createTutorConversation("New conversation");
          if (created.error || !created.conversation) {
            setError(created.error ?? "Could not create a conversation.");
            return false;
          }
          targetId = created.conversation.id;
          setConversations((prev) => [created.conversation!, ...prev]);
          setCurrentId(targetId);
        }

        const attachmentInputs: TutorAttachmentInput[] = [];
        if (files.length) {
          const supabase = createClient();
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            setError("Please sign in again before sending an attachment.");
            return false;
          }
          for (const file of files) {
            const rawMimeType = file.type.split(";")[0].trim().toLowerCase();
            const mimeType = rawMimeType;
            const extension = extensionForMimeType[mimeType];
            if (!extension) {
              setError("Use JPG, PNG or WebP images only.");
              return false;
            }
            const path = `${user.id}/${targetId}/${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabase.storage.from(attachmentBucket).upload(path, file, {
              cacheControl: "3600",
              contentType: mimeType,
              upsert: false,
            });
            if (uploadError) throw uploadError;
            uploadedPaths.push(path);
            attachmentInputs.push({ path, name: file.name, mimeType, size: file.size });
          }
        }

        const result = await sendTutorMessage(targetId, content, attachmentInputs);
        if (result.error) {
          setError(result.error);
          if (uploadedPaths.length) {
            await createClient().storage.from(attachmentBucket).remove(uploadedPaths);
          }
          return false;
        } else if (result.message) {
          setMessages((prev) => [...prev, ...(result.userMessage ? [result.userMessage] : []), result.message!]);
          return true;
        }
        return false;
      } catch (sendError) {
        console.error("Could not send tutor message:", sendError);
        if (uploadedPaths.length) {
          await createClient().storage.from(attachmentBucket).remove(uploadedPaths);
        }
        const detail = sendError instanceof Error ? sendError.message : "";
        setError(/bucket|storage|row.level|policy/i.test(detail)
          ? "Tutor attachments are not set up in Supabase yet. Apply the tutor media migration, then try again."
          : "Could not send your question. Please try again.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [currentId]
  );

  const handleDelete = useCallback(
    async (conversationId: string) => {
      const result = await deleteTutorConversation(conversationId);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
        setConversations(remaining);
        if (currentId === conversationId) {
          const next = remaining[0];
          setCurrentId(next?.id ?? null);
          if (next) await loadMessages(next.id);
          else setMessages([]);
        }
      }
    },
    [currentId, conversations, loadMessages]
  );

  return {
    conversations,
    messages,
    currentId,
    status,
    error,
    submitting,
    loadMessages,
    handleOpen,
    handleNewThread,
    handleSend,
    handleDelete,
  };
}

export function TutorThread() {
  const {
    conversations,
    messages,
    status,
    error,
    submitting,
    handleOpen,
    handleNewThread,
    handleSend,
    handleDelete,
  } = useTutor();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card className="bg-gradient-to-br from-[#151528] to-[#121217] border-white/8">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Your tutoring threads</h2>
            <p className="mt-1 text-sm text-zinc-400">Previous tutoring sessions.</p>
          </div>
          <Button onClick={handleNewThread} disabled={submitting}>New Thread</Button>
        </div>

        <div className="px-4 pb-4">
          {error && (
            <div role="alert" className="mb-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {status === "loading" ? (
            <div className="py-8 text-center text-sm text-zinc-400">Loading tutoring conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-400">
              No tutoring conversations yet. Start a thread to ask a question.
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/4 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{c.title}</p>
                      <p className="truncate text-xs text-zinc-400">
                        {new Date(c.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleOpen(c.id)}
                      >
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={submitting}
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {messages.length > 0 && (
        <Card className="bg-gradient-to-br from-[#151528] to-[#121217] border-white/8 p-4">
          <ul className="space-y-3">
            {messages.map((message) => (
              <TutorMessage key={message.id} role={message.role} content={message.content} attachments={message.attachments} />
            ))}
          </ul>
        </Card>
      )}

      <TutorComposer sendMessage={handleSend} submitting={submitting} />
    </div>
  );
}
