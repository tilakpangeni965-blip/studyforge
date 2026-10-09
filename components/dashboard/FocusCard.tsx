"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

type TimerState = "idle" | "running" | "paused";

export function FocusCard() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [state, setState] = useState<TimerState>("idle");

  useEffect(() => {
    if (state !== "running") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState("idle");
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  function handleStart() {
    setState("running");
  }

  function handlePause() {
    setState("paused");
  }

  function handleReset() {
    setState("idle");
    setTimeLeft(25 * 60);
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217]">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-zinc-400">Focus session</p>
      <h2 className="mt-2 text-base font-semibold text-white">Pomodoro</h2>
      <p className="mt-8 text-center font-mono text-5xl font-semibold tracking-tight text-white sm:text-6xl">
        {displayTime}
      </p>
      <p className="mt-3 text-center text-sm text-zinc-400">
        {state === "running" ? "Stay focused!" : state === "paused" ? "Paused" : "One deep work block"}
      </p>
      <div className="mt-8 flex gap-2">
        {state === "running" ? (
          <button
            type="button"
            onClick={handlePause}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            {state === "paused" ? "Resume" : "Start"}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </Card>
  );
}
