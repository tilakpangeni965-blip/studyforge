"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type TimerState = "idle" | "running" | "paused" | "complete";
const SESSION_SECONDS = 25 * 60;

export function FocusCard() {
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [state, setState] = useState<TimerState>("idle");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state !== "running" || endsAt === null) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setState("complete");
        setEndsAt(null);
        toast({ title: "Focus session complete", description: "Take a short break before your next session.", variant: "success" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, endsAt, toast]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  function handleStart() {
    const remaining = state === "idle" || state === "complete" ? SESSION_SECONDS : timeLeft;
    setTimeLeft(remaining);
    setEndsAt(Date.now() + remaining * 1000);
    setState("running");
  }

  function handlePause() {
    if (endsAt !== null) {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      setEndsAt(null);
      if (remaining === 0) {
        setState("complete");
        toast({ title: "Focus session complete", description: "Take a short break before your next session.", variant: "success" });
        return;
      }
    }
    setState("paused");
  }

  function handleReset() {
    setState("idle");
    setEndsAt(null);
    setTimeLeft(SESSION_SECONDS);
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217] transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_18px_50px_rgba(99,102,241,0.16)] motion-reduce:transform-none">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-zinc-400">Focus session</p>
      <h2 className="mt-2 text-base font-semibold text-white">Pomodoro</h2>
      <p className="mt-8 text-center font-mono text-5xl font-semibold tracking-tight text-white transition duration-300 hover:scale-[1.03] hover:text-blue-100 sm:text-6xl motion-reduce:transform-none">
        {displayTime}
      </p>
      <p className="mt-3 text-center text-sm text-zinc-400">
        {state === "running" ? "Stay focused!" : state === "paused" ? "Paused" : state === "complete" ? "Session complete — take a short break" : "One deep work block"}
      </p>
      <div className="mt-8 flex gap-2">
        {state === "running" ? (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-[0_8px_20px_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:translate-y-0 motion-reduce:transform-none"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(99,102,241,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:translate-y-0 motion-reduce:transform-none"
          >
            {state === "paused" ? "Resume" : state === "complete" ? "Start another" : "Start"}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:translate-y-0 motion-reduce:transform-none"
        >
          Reset
        </button>
      </div>
    </Card>
  );
}
