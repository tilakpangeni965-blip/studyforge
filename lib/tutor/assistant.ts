import type { TutorMessage } from "@/types/tutor";
import { generateWithDeepSeek, getDeepSeekModel, imageDataUrl, type DeepSeekMessage } from "@/lib/ai/deepseek";

const tutorInstructions = `You are StudyForge, a patient and encouraging AI tutor. Help students understand concepts by explaining clearly, asking useful questions, and showing steps when appropriate. Adapt to the subject and conversation context. If uncertain, say so. Do not claim to be the student's teacher or to know facts about them beyond the context provided. Format mathematics for the student to read: use $...$ for inline equations and $$...$$ on separate lines for display equations. Never leave LaTeX commands such as \\frac or \\sqrt unwrapped in prose, and do not put equations in code fences. Explain the steps in plain language around the rendered equations.`;

export async function generateTutorReply({
  studentQuestion,
  history,
  subject,
  media,
}: {
  studentQuestion: string;
  history: Array<Pick<TutorMessage, "role" | "content">>;
  subject?: string | null;
  media?: Array<{ mimeType: string; data: string }>;
}) {
  const image = media?.find((attachment) => attachment.mimeType.startsWith("image/"));

  const messages: DeepSeekMessage[] = [
    { role: "system", content: tutorInstructions },
    ...history.slice(-30).map((message) => ({
      role: message.role === "assistant" ? "assistant" as const : "user" as const,
      content: message.content.slice(-4000),
    })),
  ];
  const currentText = `${subject ? `Subject: ${subject}\n` : ""}Student question: ${studentQuestion}`;
  messages.push(image
    ? {
        role: "user",
        content: [
          { type: "text", text: `${currentText}\nPlease analyze the attached image as part of the question.` },
          { type: "image_url", image_url: { url: imageDataUrl(image.mimeType, image.data), detail: "auto" } },
        ],
      }
    : { role: "user", content: currentText });

  const answer = await generateWithDeepSeek(messages, { maxTokens: 2048 });
  return { answer, model: getDeepSeekModel(), explanationSteps: [], clarificationQuestion: "" };
}
