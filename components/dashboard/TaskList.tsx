"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { tasks as initialTasks } from "@/lib/dashboard-data";

export function TaskList() {
  const [tasks, setTasks] = useState(initialTasks);

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  return (
    <Card aria-labelledby="tasks-heading">
      <h2 id="tasks-heading" className="text-base font-semibold text-white">
        Today&apos;s Tasks
      </h2>
      <p className="mt-1 text-sm text-zinc-400">A focused list for this session</p>

      <ul className="mt-5 space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-white/6 hover:bg-white/4">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent text-violet-500 accent-violet-500"
              />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-medium ${
                    task.completed
                      ? "text-zinc-500 line-through"
                      : "text-zinc-100"
                  }`}
                >
                  {task.title}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {task.subject}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
