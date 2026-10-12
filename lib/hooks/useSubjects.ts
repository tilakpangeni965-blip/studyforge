"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  created_at: string;
  updated_at: string;
};

type SubjectUpdates = Partial<Pick<Subject, "name" | "icon" | "color" | "progress">>;

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSubjects = useCallback(async (knownUserId?: string) => {
    const userId = knownUserId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subjects")
      .select("id, user_id, name, icon, color, progress, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load subjects:", error);
      setSubjects([]);
    } else {
      setSubjects((data ?? []) as Subject[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    let channel: RealtimeChannel | undefined;
    let refreshTimer: number | undefined;

    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (user) {
        channel = supabase
          .channel(`subjects-page:${user.id}:${crypto.randomUUID()}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "subjects", filter: `user_id=eq.${user.id}` }, () => {
            void fetchSubjects(user.id);
          })
          .subscribe();
        refreshTimer = window.setInterval(() => { void fetchSubjects(user.id); }, 15000);
      }

      await fetchSubjects(user?.id);
    }

    void start();
    return () => {
      active = false;
      if (refreshTimer !== undefined) window.clearInterval(refreshTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [fetchSubjects, supabase]);

  async function createSubject(name: string, icon: string, color: string) {
    const safeName = name.trim();
    if (!safeName || safeName.length > 100) return { error: "Subject names must be between 1 and 100 characters." };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in to create a subject." };

    const { data, error } = await supabase
      .from("subjects")
      .insert({ user_id: user.id, name: safeName, icon, color, progress: 0 })
      .select("id, user_id, name, icon, color, progress, created_at, updated_at")
      .single();
    if (error) return { error: error.message };

    setSubjects((previous) => [data as Subject, ...previous.filter((subject) => subject.id !== data.id)]);
    return { data: data as Subject };
  }

  async function updateSubject(id: string, updates: SubjectUpdates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in to update a subject." };

    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, user_id, name, icon, color, progress, created_at, updated_at")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Subject not found or you do not have access to it." };

    setSubjects((previous) => previous.map((subject) => subject.id === id ? data as Subject : subject));
    return { data: data as Subject };
  }

  async function deleteSubject(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in to delete a subject." };

    const { data, error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Subject not found or you do not have access to it." };

    setSubjects((previous) => previous.filter((subject) => subject.id !== id));
    return { success: true as const };
  }

  return { subjects, loading, createSubject, updateSubject, deleteSubject, refetch: fetchSubjects };
}
