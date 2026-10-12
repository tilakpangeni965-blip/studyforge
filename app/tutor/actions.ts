"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkTutorRateLimit } from "@/lib/tutor/rate-limit";
import { generateTutorReply } from "@/lib/tutor/assistant";
import { getDeepSeekModel } from "@/lib/ai/deepseek";
import { getGeminiModel } from "@/lib/ai/gemini";
import type { TutorAttachmentInput, TutorConversation, TutorMessage, TutorSession } from "@/types/tutor";

const MAX_HISTORY_MESSAGES = 60;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const ATTACHMENT_BUCKET = "tutor-attachments";
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "";
}

function mediaMigrationMissing(error: unknown) {
  return /column.*attachments|attachments.*column|bucket.*not found/i.test(errorMessage(error));
}

async function makeSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot write cookies; server actions can.
        }
      },
    },
  });
}

async function requireUser(): Promise<TutorSession> {
  try {
    const supabase = await makeSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return {
        user: { id: "", email: null, userMetadata: null },
        error: "Please sign in to use the tutor.",
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        userMetadata: user.user_metadata as Record<string, string | null> | null,
      },
    };
  } catch (error) {
    console.error("[tutor] authentication lookup failed", error);
    return {
      user: { id: "", email: null, userMetadata: null },
      error: "Could not verify your sign-in. Please try again.",
    };
  }
}

function mapMessages(rows: unknown[] | null): TutorMessage[] {
  return (rows ?? []).map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.id),
      conversationId: String(row.conversation_id),
      userId: String(row.user_id),
      role: row.role === "assistant" ? "assistant" : "user",
      content: String(row.content ?? ""),
      attachments: Array.isArray(row.attachments)
        ? row.attachments.flatMap((value) => {
            if (!value || typeof value !== "object") return [];
            const attachment = value as Record<string, unknown>;
            if (typeof attachment.name !== "string" || typeof attachment.mimeType !== "string" || typeof attachment.size !== "number" || typeof attachment.path !== "string") return [];
            return [{ path: attachment.path, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size, url: null }];
          })
        : [],
      model: typeof row.model === "string" ? row.model : null,
      createdAt: String(row.created_at),
    };
  });
}

async function signMessageAttachments(supabase: Awaited<ReturnType<typeof makeSupabaseClient>>, messages: TutorMessage[]) {
  return Promise.all(messages.map(async (message) => {
    const rowAttachments = message.attachments;
    if (!rowAttachments.length) return message;
    const attachments = await Promise.all(rowAttachments.map(async (attachment) => {
      const path = attachment.path;
      if (typeof path !== "string" || !path.startsWith(`${message.userId}/`)) return attachment;
      const { data: signed } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 60 * 60);
      return { ...attachment, url: signed?.signedUrl ?? null };
    }));
    return { ...message, attachments };
  }));
}

function mapConversations(rows: unknown[] | null): TutorConversation[] {
  return (rows ?? []).map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      subjectId: typeof row.subject_id === "string" ? row.subject_id : null,
      title: String(row.title ?? "New conversation"),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  });
}

export async function listTutorConversations() {
  const session = await requireUser();
  if (session.error) return { session, conversations: [], error: session.error };

  try {
    const supabase = await makeSupabaseClient();
    const { data, error } = await supabase
      .from("tutor_conversations")
      .select("id, user_id, subject_id, title, created_at, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { session, conversations: mapConversations(data), error: undefined };
  } catch (error) {
    console.error("[tutor] list conversations failed", error);
    return { session, conversations: [], error: "Could not load conversations." };
  }
}

export async function getTutorConfiguration() {
  const session = await requireUser();
  if (session.error) {
    return { enabled: false, model: null, error: session.error };
  }

  return {
    enabled: Boolean(process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY),
    primaryEnabled: Boolean(process.env.DEEPSEEK_API_KEY),
    model: getDeepSeekModel(),
    backupEnabled: Boolean(process.env.GEMINI_API_KEY),
    backupModel: process.env.GEMINI_API_KEY ? getGeminiModel() : null,
    error: undefined,
  };
}

export async function listTutorMessages(conversationId: string) {
  const session = await requireUser();
  if (session.error) return { session, messages: [], error: session.error };

  try {
    const supabase = await makeSupabaseClient();
    const { data, error } = await supabase
      .from("tutor_messages")
      .select("id, conversation_id, user_id, role, content, model, attachments, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const messages = await signMessageAttachments(supabase, mapMessages(data));
    return { session, messages, error: undefined };
  } catch (error) {
    console.error("[tutor] list messages failed", error);
    return {
      session,
      messages: [],
      error: mediaMigrationMissing(error)
        ? "The tutor media database migration has not been applied yet. Apply migration 0004, then reload the conversation."
        : "Could not load conversation messages.",
    };
  }
}

export async function createTutorConversation(title: string) {
  const session = await requireUser();
  if (session.error) return { session, conversation: null, error: session.error };

  try {
    const supabase = await makeSupabaseClient();
    const safeTitle = (title.trim() || "New conversation").slice(0, 200);
    const { data, error } = await supabase
      .from("tutor_conversations")
      .insert({ user_id: session.user.id, title: safeTitle })
      .select("id, user_id, subject_id, title, created_at, updated_at")
      .single();
    if (error) throw error;
    return { session, conversation: mapConversations([data])[0], error: undefined };
  } catch (error) {
    console.error("[tutor] create conversation failed", error);
    return { session, conversation: null, error: "Could not create a new conversation." };
  }
}

export async function sendTutorMessage(conversationId: string, content: string, attachmentInputs: TutorAttachmentInput[] = []) {
  const session = await requireUser();
  if (session.error) return { session, message: null, error: session.error };

  const text = content.trim();
  if (!text && attachmentInputs.length === 0) return { session, message: null, error: "Type a question or attach an image." };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { session, message: null, error: `Please keep your question under ${MAX_MESSAGE_LENGTH} characters.` };
  }

  try {
    const supabase = await makeSupabaseClient();
    const { data: conversation, error: conversationError } = await supabase
      .from("tutor_conversations")
      .select("id, subject_id")
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .single();
    if (conversationError || !conversation) {
      return { session, message: null, error: "That conversation no longer exists or you do not have access to it." };
    }

    if (attachmentInputs.length > 1) {
      return { session, message: null, error: "Attach no more than one image per message." };
    }
    const media: Array<{ mimeType: string; data: string }> = [];
    const safeAttachments: Array<{ path: string; name: string; mimeType: string; size: number }> = [];
    for (const attachment of attachmentInputs) {
      const name = attachment.name.trim().replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 200);
      if (!name || !ALLOWED_ATTACHMENT_TYPES.has(attachment.mimeType) || !Number.isInteger(attachment.size) || attachment.size < 1 || attachment.size > MAX_ATTACHMENT_SIZE) {
        return { session, message: null, error: "That file type or size is not supported. Use a PNG, JPG, or WebP image up to 8 MB." };
      }
      if (!attachment.path.startsWith(`${session.user.id}/${conversationId}/`) || attachment.path.includes("..")) {
        return { session, message: null, error: "That attachment is not available in this conversation." };
      }
      const { data: file, error: downloadError } = await supabase.storage.from(ATTACHMENT_BUCKET).download(attachment.path);
      if (downloadError || !file || file.size !== attachment.size || file.size > MAX_ATTACHMENT_SIZE || file.type !== attachment.mimeType) {
        return { session, message: null, error: "Could not read that attachment. Please attach it again." };
      }
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      media.push({ mimeType: attachment.mimeType, data });
      safeAttachments.push({ path: attachment.path, name, mimeType: attachment.mimeType, size: attachment.size });
    }

    const rate = await checkTutorRateLimit(supabase, session.user.id);
    if (!rate.ok) {
      return {
        session,
        message: null,
        error: `Rate limit exceeded. Try again in ${Math.ceil((rate.resetInMs ?? 1000) / 1000)} seconds.`,
      };
    }

    const { data: rows, error: historyError } = await supabase
      .from("tutor_messages")
      .select("id, conversation_id, user_id, role, content, model, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    if (historyError) throw historyError;

    const history = mapMessages(rows).slice(-MAX_HISTORY_MESSAGES);
    let subjectName: string | null = null;
    if (conversation.subject_id) {
      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", conversation.subject_id)
        .eq("user_id", session.user.id)
        .maybeSingle();
      subjectName = subject?.name ?? null;
    }

    const promptText = text || "Please explain what is shown in the attached image and help me understand it.";
    const reply = await generateTutorReply({ studentQuestion: promptText, history, subject: subjectName, media });
    const { data: userRow, error: userInsertError } = await supabase
      .from("tutor_messages")
      .insert({ conversation_id: conversationId, user_id: session.user.id, role: "user", content: promptText, attachments: safeAttachments })
      .select("id, conversation_id, user_id, role, content, model, attachments, created_at")
      .single();
    if (userInsertError) throw userInsertError;

    const { data: assistantRow, error: assistantInsertError } = await supabase
      .from("tutor_messages")
      .insert({ conversation_id: conversationId, user_id: session.user.id, role: "assistant", content: reply.answer, model: reply.model })
      .select("id, conversation_id, user_id, role, content, model, attachments, created_at")
      .single();
    if (assistantInsertError) throw assistantInsertError;

    const [assistantMessage] = mapMessages([assistantRow]);
    const [userMessage] = await signMessageAttachments(supabase, mapMessages([userRow]));
    return { session, message: assistantMessage, userMessage, error: undefined };
  } catch (error) {
    console.error("[tutor] send message failed", error);
    return {
      session,
      message: null,
      error: mediaMigrationMissing(error)
        ? "The tutor media database migration has not been applied yet. Apply migration 0004, then try again."
        : "The tutor could not answer right now. Check the AI and database configuration, then try again.",
    };
  }
}

export async function deleteTutorConversation(conversationId: string) {
  const session = await requireUser();
  if (session.error) return { session, success: false, error: session.error };

  try {
    const supabase = await makeSupabaseClient();
    const { data: messageRows } = await supabase
      .from("tutor_messages")
      .select("attachments")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id);
    const attachmentPaths = (messageRows ?? []).flatMap((row) =>
      Array.isArray(row.attachments)
        ? row.attachments.flatMap((attachment) => {
            if (!attachment || typeof attachment !== "object") return [];
            const path = (attachment as Record<string, unknown>).path;
            return typeof path === "string" && path.startsWith(`${session.user.id}/${conversationId}/`) ? [path] : [];
          })
        : []
    );
    const { data, error } = await supabase
      .from("tutor_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { session, success: false, error: "That conversation does not exist or is not yours." };
    if (attachmentPaths.length) {
      const { error: cleanupError } = await supabase.storage.from(ATTACHMENT_BUCKET).remove(attachmentPaths);
      if (cleanupError) console.error("[tutor] deleted conversation attachments could not be cleaned up", cleanupError);
    }
    return { session, success: true, error: undefined };
  } catch (error) {
    console.error("[tutor] delete conversation failed", error);
    return { session, success: false, error: "Could not delete that conversation." };
  }
}

export async function regenerateTutorAnswer(conversationId: string, messageId: string) {
  const session = await requireUser();
  if (session.error) return { session, error: session.error };

  try {
    const supabase = await makeSupabaseClient();
    const { data: rows, error } = await supabase
      .from("tutor_messages")
      .select("id, conversation_id, user_id, role, content, model, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const history = mapMessages(rows);
    const answerIndex = history.findIndex((message) => message.id === messageId && message.role === "assistant");
    if (answerIndex < 0) return { session, error: "That answer cannot be regenerated." };
    const questionIndex = history.slice(0, answerIndex).findLastIndex((message) => message.role === "user");
    if (questionIndex < 0) return { session, error: "The original question could not be found." };

    const question = history[questionIndex];
    const conversationHistory = history.slice(0, questionIndex).slice(-MAX_HISTORY_MESSAGES);
    const { data: conversation, error: conversationError } = await supabase
      .from("tutor_conversations")
      .select("subject_id")
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .single();
    if (conversationError) throw conversationError;

    const rate = await checkTutorRateLimit(supabase, session.user.id);
    if (!rate.ok) return { session, error: `Rate limit exceeded. Try again in ${Math.ceil((rate.resetInMs ?? 1000) / 1000)} seconds.` };

    let subjectName: string | null = null;
    if (conversation.subject_id) {
      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", conversation.subject_id)
        .eq("user_id", session.user.id)
        .maybeSingle();
      subjectName = subject?.name ?? null;
    }
    const reply = await generateTutorReply({
      studentQuestion: question.content,
      history: conversationHistory,
      subject: subjectName,
    });
    const { data, error: insertError } = await supabase
      .from("tutor_messages")
      .insert({ conversation_id: conversationId, user_id: session.user.id, role: "assistant", content: reply.answer, model: reply.model })
      .select("id, conversation_id, user_id, role, content, model, created_at")
      .single();
    if (insertError) throw insertError;
    return { session, message: mapMessages([data])[0], error: undefined };
  } catch (error) {
    console.error("[tutor] regenerate answer failed", error);
    return { session, error: "The tutor could not regenerate that answer right now." };
  }
}
