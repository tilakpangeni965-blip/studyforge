"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useSubjects } from "@/lib/hooks/useSubjects";
import { createClient } from "@/lib/supabase/client";
import { friendlyDatabaseError } from "@/lib/supabase/errors";

type Note = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY_DRAFT = { title: "", content: "", subjectId: "", pinned: false };

export default function NotesPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const { subjects } = useSubjects();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const active = useRef(true);

  const refresh = useCallback(async (knownUserId?: string) => {
    const userId = knownUserId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("id, user_id, subject_id, title, content, pinned, created_at, updated_at")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(500);

    if (!active.current) return;
    if (error) {
      console.error("Could not load notes:", error);
      toast({ title: "Notes could not be loaded", description: "Please try again shortly.", variant: "error" });
    } else {
      setNotes((data ?? []) as Note[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    active.current = true;
    let channel: RealtimeChannel | undefined;
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    async function startRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active.current || !user) {
        await refresh(user?.id);
        return;
      }

      channel = supabase
        .channel(`student-notes:${user.id}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${user.id}` }, () => {
          void refresh(user.id);
        })
        .subscribe();
      await refresh(user.id);
    }
    void startRealtime();
    return () => {
      active.current = false;
      window.clearInterval(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh, supabase]);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return notes;
    return notes.filter((note) => `${note.title}\n${note.content}`.toLocaleLowerCase().includes(query));
  }, [notes, search]);

  function openCreate() {
    setEditingNote(null);
    setDraft(EMPTY_DRAFT);
    setModalOpen(true);
  }

  function openEdit(note: Note) {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content, subjectId: note.subject_id ?? "", pinned: note.pinned });
    setModalOpen(true);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    setSaving(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setSaving(false);
      toast({ title: "Please sign in again", variant: "error" });
      return;
    }

    const values = {
      title,
      content: draft.content,
      subject_id: draft.subjectId || null,
      pinned: draft.pinned,
    };
    const result = editingNote
      ? await supabase.from("notes").update(values).eq("id", editingNote.id).eq("user_id", user.id).select("id").maybeSingle()
      : await supabase.from("notes").insert({ ...values, user_id: user.id }).select("id").single();

    setSaving(false);
    if (result.error || !result.data) {
      toast({ title: "Note could not be saved", description: result.error ? friendlyDatabaseError(result.error, "Please try saving your note again.") : "No note was updated. Refresh the page and try again.", variant: "error" });
      return;
    }
    setModalOpen(false);
    toast({ title: editingNote ? "Note updated" : "Note created", variant: "success" });
    await refresh();
  }

  async function togglePinned(note: Note) {
    setBusyNoteId(note.id);
    const { error } = await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", note.id).eq("user_id", note.user_id);
    setBusyNoteId(null);
    if (error) toast({ title: "Could not update note", description: friendlyDatabaseError(error, "Please try updating your note again."), variant: "error" });
    else await refresh();
  }

  async function deleteNote() {
    if (!deletingNote) return;
    const note = deletingNote;
    setBusyNoteId(note.id);
    const { error } = await supabase.from("notes").delete().eq("id", note.id).eq("user_id", note.user_id);
    setBusyNoteId(null);
    setDeletingNote(null);
    if (error) toast({ title: "Note could not be deleted", description: friendlyDatabaseError(error, "Please try deleting your note again."), variant: "error" });
    else {
      toast({ title: "Note deleted", variant: "success" });
      await refresh();
    }
  }

  const subjectName = (subjectId: string | null) => subjects.find((subject) => subject.id === subjectId)?.name ?? "Unlinked note";

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Notes</h1>
            <p className="mt-1 text-sm text-zinc-400">Private notes saved to your StudyForge account.</p>
          </div>
          <Button onClick={openCreate}>+ New Note</Button>
        </div>

        <Input aria-label="Search notes" placeholder="Search your notes…" value={search} onChange={(event) => setSearch(event.target.value)} />

        {loading ? (
          <p className="py-10 text-center text-sm text-zinc-400">Loading your notes…</p>
        ) : visibleNotes.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <h2 className="font-medium text-white">{notes.length ? "No notes match that search" : "No notes yet"}</h2>
              <p className="mt-2 text-sm text-zinc-400">{notes.length ? "Try a different word." : "Create a note to keep your study materials in one place."}</p>
              {!notes.length && <Button className="mt-4" onClick={openCreate}>Create your first note</Button>}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleNotes.map((note) => (
              <Card key={note.id} as="article" className="flex min-h-52 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold text-white">{note.title}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{subjectName(note.subject_id)} · Updated {new Date(note.updated_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" disabled={busyNoteId === note.id} onClick={() => void togglePinned(note)} aria-label={note.pinned ? "Unpin note" : "Pin note"}>
                    {note.pinned ? "Pinned" : "Pin"}
                  </Button>
                </div>
                <p className="mt-4 line-clamp-5 whitespace-pre-wrap break-words text-sm text-zinc-300">{note.content || "No note content yet."}</p>
                <div className="mt-auto flex justify-end gap-2 pt-5">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(note)}>Edit</Button>
                  <Button size="sm" variant="danger" disabled={busyNoteId === note.id} onClick={() => setDeletingNote(note)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingNote ? "Edit note" : "New note"} description="Notes are private to your signed-in account." footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="note-form" loading={saving}>{editingNote ? "Save changes" : "Save note"}</Button>
        </div>
      }>
        <form id="note-form" className="space-y-4" onSubmit={saveNote}>
          <Field label="Title" htmlFor="note-title">
            <Input id="note-title" maxLength={200} required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Subject" htmlFor="note-subject" hint="Optional">
            <Select id="note-subject" value={draft.subjectId} onChange={(event) => setDraft((current) => ({ ...current, subjectId: event.target.value }))}>
              <option value="">No subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </Select>
          </Field>
          <Field label="Note" htmlFor="note-content">
            <Textarea id="note-content" maxLength={50000} rows={8} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))} />
            Pin this note
          </label>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deletingNote)} onClose={() => setDeletingNote(null)} title="Delete this note?" description="This permanently removes the note from your account." footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeletingNote(null)}>Cancel</Button>
          <Button variant="danger" loading={Boolean(deletingNote && busyNoteId === deletingNote.id)} onClick={() => void deleteNote()}>Delete note</Button>
        </div>
      }>
        <p className="text-sm text-zinc-300">{deletingNote?.title}</p>
      </Modal>
    </AppShell>
  );
}
