"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type StudentSubject = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  created_at: string;
  updated_at: string;
};

export function useStudentSubjects() {
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let channel: RealtimeChannel | undefined;
    const supabase = createClient();

    async function load(userId?: string) {
      const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
      if (!resolvedUserId) {
        if (active) {
          setSubjects([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("subjects")
        .select("id, user_id, name, icon, color, progress, created_at, updated_at")
        .eq("user_id", resolvedUserId)
        .order("updated_at", { ascending: false });

      if (!active) return;
      if (error) {
        console.error("Could not load student subjects:", error);
        setSubjects([]);
      } else {
        setSubjects((data ?? []) as StudentSubject[]);
      }
      setLoading(false);
    }

    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        channel = supabase
          .channel(`student-subjects:${user.id}:${crypto.randomUUID()}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subjects", filter: `user_id=eq.${user.id}` },
            () => { void load(user.id); },
          )
          .subscribe();
      }
      await load(user?.id);
    }

    void start();
    const refresh = window.setInterval(() => { void load(); }, 15000);

    return () => {
      active = false;
      window.clearInterval(refresh);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return { subjects, loading };
}
