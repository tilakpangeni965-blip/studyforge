"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type CreateSubjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string) => Promise<boolean>;
};

const ICONS = ["📚", "⚛️", "🧪", "📐", "💻", "🎨", "🎵", "🌍", "📖", "✏️"];
const COLORS = [
  "from-blue-500 to-violet-500",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-yellow-600",
];

export function CreateSubjectModal({ isOpen, onClose, onCreate }: CreateSubjectModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📚");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || loading) return;
    setLoading(true);
    try {
      const created = await onCreate(trimmedName, icon, color);
      if (!created) return;
      setName("");
      setIcon("📚");
      setColor(COLORS[0]);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create subject"
      description="Add a course to track your actual study progress."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="create-subject-form" loading={loading}>Create subject</Button>
        </div>
      }
    >
      <form id="create-subject-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Subject name" htmlFor="subject-name">
          <Input id="subject-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder="e.g. Physics" />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-300">Choose an icon</legend>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map((value) => (
              <button key={value} type="button" aria-label={`Choose ${value} icon`} aria-pressed={icon === value} onClick={() => setIcon(value)} className={`rounded-lg p-2 text-2xl transition-colors ${icon === value ? "bg-white/10 ring-1 ring-white/30" : "hover:bg-white/5"}`}>
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-300">Choose a color</legend>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((value, index) => (
              <button key={value} type="button" aria-label={`Choose color ${index + 1}`} aria-pressed={color === value} onClick={() => setColor(value)} className={`h-9 rounded-lg bg-gradient-to-r transition-all ${value} ${color === value ? "ring-2 ring-white/70" : "hover:ring-1 hover:ring-white/30"}`} />
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
