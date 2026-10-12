"use client";

import { memo } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { TutorAttachment } from "@/types/tutor";

type TutorMessageProps = {
  role: "user" | "assistant";
  content: string;
  attachments?: TutorAttachment[];
};

function formatMathDelimiters(text: string) {
  let formatted = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math: string) => `$$\n${math}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math: string) => `$${math}$`);

  const trimmed = formatted.trim();
  const hasMathDelimiter = /\$\$?|\\\[|\\\(/.test(trimmed);
  const isBareEquation = /\\(?:frac|sqrt|sum|int|lim|alpha|beta|theta|pi|cdot|times|left|right|overline|begin)\b/.test(trimmed)
    && /^[\\\w{}()[\]\s+\-*/=<>.,^|]+$/.test(trimmed);
  if (!hasMathDelimiter && isBareEquation) formatted = `$$\n${trimmed}\n$$`;
  return formatted;
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-semibold">{children}</h3>,
  h2: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-semibold">{children}</h3>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold">{children}</h3>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="pl-1">{children}</li>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="max-w-full overflow-x-auto rounded-lg bg-black/20 p-3 text-sm">{children}</pre>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="rounded bg-black/15 px-1 py-0.5 font-mono text-[0.92em]">{children}</code>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-2 border-current/30 pl-3 italic">{children}</blockquote>,
};

export const TutorMessage = memo(function TutorMessage({ role, content, attachments = [] }: TutorMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-sm bg-gradient-to-r from-blue-500 to-violet-500 text-white"
            : "rounded-bl-sm bg-white/5 text-zinc-100"
        }`}
      >
        {attachments.map((attachment) => (
          <div key={`${attachment.name}-${attachment.url}`} className="mb-3">
            {attachment.url ? (
              attachment.mimeType.startsWith("image/") ? (
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  width={640}
                  height={480}
                  unoptimized
                  className="max-h-80 w-auto max-w-full rounded-lg object-contain"
                />
              ) : (
                <audio controls preload="none" src={attachment.url} className="max-w-full" aria-label={`Voice recording: ${attachment.name}`} />
              )
            ) : (
              <p className="text-xs opacity-75">Attachment unavailable: {attachment.name}</p>
            )}
          </div>
        ))}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <div className="space-y-3 break-words [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
              {formatMathDelimiters(content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});
