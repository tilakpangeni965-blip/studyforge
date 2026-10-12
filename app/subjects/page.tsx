"use client"

import { useState } from 'react'
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { CreateSubjectModal } from "@/components/subjects/CreateSubjectModal"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { useSubjects } from "@/lib/hooks/useSubjects"

export default function SubjectsPage() {
  const { subjects, loading, createSubject, deleteSubject } = useSubjects()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string; name: string } | null>(null)
  const { toast } = useToast()

  async function handleCreate(name: string, icon: string, color: string) {
    const result = await createSubject(name, icon, color)
    if (result.error) toast({ title: "Subject could not be created", description: result.error, variant: "error" })
    else toast({ title: "Subject created", variant: "success" })
    return !result.error
  }

  async function handleDelete() {
    if (!subjectToDelete) return
    const result = await deleteSubject(subjectToDelete.id)
    if (result.error) toast({ title: "Subject could not be deleted", description: result.error, variant: "error" })
    else toast({ title: "Subject deleted", description: "Notes linked to it are kept without a subject.", variant: "success" })
    setSubjectToDelete(null)
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Subjects
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your subjects and track progress across different courses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            + Add Subject
          </button>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-zinc-400">No subjects yet. Create your first subject to get started!</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                as="article"
                className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {subject.icon}
                  </span>
                  <div
                    className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${subject.color}`}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
                <div className="mt-auto">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>Progress</span>
                    <span className="font-medium text-zinc-300">
                      {subject.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={subject.progress}
                    label={`${subject.name} progress`}
                  />
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSubjectToDelete({ id: subject.id, name: subject.name })}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <CreateSubjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
        <Modal
          isOpen={Boolean(subjectToDelete)}
          onClose={() => setSubjectToDelete(null)}
          title="Delete this subject?"
          description="Any linked notes are kept, but their subject link will be removed."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSubjectToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => void handleDelete()}>Delete subject</Button>
            </div>
          }
        >
          <p className="text-sm text-zinc-300">{subjectToDelete?.name}</p>
        </Modal>
      </div>
    </AppShell>
  )
}
