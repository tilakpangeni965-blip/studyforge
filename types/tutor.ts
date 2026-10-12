export type TutorMessage = {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  attachments: TutorAttachment[];
  model?: string | null;
  createdAt: string;
};

export type TutorAttachment = {
  path?: string;
  name: string;
  mimeType: string;
  size: number;
  url: string | null;
};

export type TutorAttachmentInput = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

export type TutorConversation = {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type TutorSession = {
  user: { id: string; email: string | null; userMetadata: Record<string, string | null> | null };
  error?: string;
};
