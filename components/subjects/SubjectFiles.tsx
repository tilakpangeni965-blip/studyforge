"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type SubjectFile = {
  id: string;
  path: string;
  name: string;
  mime_type: string;
  size: number;
  created_at: string;
};

const BUCKET = "subject-files";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function safeFileName(name: string) {
  return name.trim().replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 200);
}

export function SubjectFiles({ subjectId, userId }: { subjectId: string; userId: string }) {
  const supabase = createClient();
  const [files, setFiles] = useState<SubjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("subject_files")
      .select("id, path, name, mime_type, size, created_at")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError("Subject files are temporarily unavailable. Please try again shortly.");
    } else {
      setFiles((data ?? []) as SubjectFile[]);
      setError(null);
    }
    setLoading(false);
  }, [subjectId, supabase]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void refresh(); }, 0);
    const channel: RealtimeChannel = supabase
      .channel(`subject-files:${userId}:${subjectId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subject_files", filter: `subject_id=eq.${subjectId}` }, () => { void refresh(); })
      .subscribe();
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh, subjectId, supabase, userId]);

  async function upload(file: File | undefined) {
    if (!file || uploading) return;
    const name = safeFileName(file.name);
    const type = file.type || "application/octet-stream";
    if (!name || !ALLOWED_TYPES.has(type) || file.size < 1 || file.size > MAX_BYTES) {
      setError("Use a PDF, text, CSV, Office document, or JPG/PNG/WebP image up to 20 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    const path = `${userId}/${subjectId}/${crypto.randomUUID()}-${name}`;
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("subject_files").insert({
        user_id: userId,
        subject_id: subjectId,
        path,
        name,
        mime_type: type,
        size: file.size,
      });
      if (insertError) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insertError;
      }
      await refresh();
    } catch (uploadFailure) {
      const detail = uploadFailure instanceof Error ? uploadFailure.message : "";
      setError(/bucket not found/i.test(detail)
        ? "File uploads are temporarily unavailable. Please try again shortly."
        : "That file could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function openFile(file: SubjectFile) {
    const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 60 * 5, { download: file.name });
    if (urlError || !data?.signedUrl) {
      setError("Could not create a secure download link for that file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeFile(file: SubjectFile) {
    if (busyId) return;
    setBusyId(file.id);
    setError(null);
    const { error: rowError } = await supabase.from("subject_files").delete().eq("id", file.id).eq("user_id", userId);
    if (rowError) {
      setError("Could not remove that file from your subject.");
      setBusyId(null);
      return;
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.path]);
    if (storageError) setError("The file was removed from your list, but its stored copy could not be cleaned up.");
    setBusyId(null);
  }

  return (
    <section className="mt-5 border-t border-white/8 pt-4" aria-label="Subject files">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Course files</h4>
          <p className="mt-1 text-xs text-zinc-500">Private files for this subject · 20 MB max each</p>
        </div>
        <label className={`inline-flex cursor-pointer items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? "Uploading…" : "Upload file"}
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.txt,.md,.csv,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void upload(file); }}
          />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {loading ? <p className="mt-3 text-xs text-zinc-500">Loading files…</p> : files.length ? (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-lg bg-black/15 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}</p>
              </div>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => void openFile(file)}>Open</Button>
              <Button variant="ghost" className="px-2 py-1 text-xs text-red-300" loading={busyId === file.id} onClick={() => void removeFile(file)}>Delete</Button>
            </li>
          ))}
        </ul>
      ) : !error && <p className="mt-3 text-xs text-zinc-500">No files added to this subject yet.</p>}
    </section>
  );
}
