"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type Deck = { id: string; title: string; subject_id: string | null; created_at: string; cardCount: number };
type Flashcard = { id: string; deck_id: string; front: string; back: string; position: number; created_at: string };
type Subject = { id: string; name: string };

function flashcardError() {
  return "Your flashcards are temporarily unavailable. Please try again shortly.";
}

export default function FlashcardsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckSubjectId, setDeckSubjectId] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);

  const loadDecks = useCallback(async (id: string) => {
    const [{ data: deckRows, error: deckError }, { data: cardRows, error: cardError }] = await Promise.all([
      supabase.from("flashcard_decks").select("id, title, subject_id, created_at").eq("user_id", id).order("updated_at", { ascending: false }),
      supabase.from("flashcards").select("deck_id").eq("user_id", id),
    ]);
    if (deckError || cardError) {
      setError(flashcardError());
      setDecks([]);
      return [] as Deck[];
    }
    const counts = new Map<string, number>();
    for (const row of cardRows ?? []) counts.set(row.deck_id, (counts.get(row.deck_id) ?? 0) + 1);
    const next = (deckRows ?? []).map((deck) => ({ ...deck, cardCount: counts.get(deck.id) ?? 0 })) as Deck[];
    setDecks(next);
    setError(null);
    return next;
  }, [supabase]);

  const loadCards = useCallback(async (deckId: string) => {
    const { data, error: queryError } = await supabase
      .from("flashcards")
      .select("id, deck_id, front, back, position, created_at")
      .eq("deck_id", deckId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (queryError) {
      setError(flashcardError());
      setCards([]);
      return;
    }
    setCards((data ?? []) as Flashcard[]);
    setStudyIndex(0);
    setRevealed(false);
    setError(null);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setError("Please sign in to use your flashcards.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const [deckRows, subjectResult] = await Promise.all([
        loadDecks(user.id),
        supabase.from("subjects").select("id, name").eq("user_id", user.id).order("name"),
      ]);
      if (!active) return;
      setSubjects((subjectResult.data ?? []) as Subject[]);
      if (!subjectResult.error && deckRows[0]) {
        setSelectedDeckId(deckRows[0].id);
        await loadCards(deckRows[0].id);
      }
      setLoading(false);
    }
    void start();
    return () => { active = false; };
  }, [loadCards, loadDecks, supabase]);

  async function createDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || saving) return;
    const title = deckTitle.trim();
    if (!title || title.length > 120) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: userId, title, subject_id: deckSubjectId || null })
      .select("id, title, subject_id, created_at")
      .single();
    if (insertError || !data) setError(flashcardError());
    else {
      setDecks((current) => [{ ...data, cardCount: 0 } as Deck, ...current]);
      setDeckTitle("");
      setSelectedDeckId(data.id);
      setCards([]);
      setRevealed(false);
    }
    setSaving(false);
  }

  async function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !selectedDeckId || saving) return;
    const cleanFront = front.trim();
    const cleanBack = back.trim();
    if (!cleanFront || !cleanBack || cleanFront.length > 10000 || cleanBack.length > 10000) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("flashcards")
      .insert({ user_id: userId, deck_id: selectedDeckId, front: cleanFront, back: cleanBack, position: cards.length })
      .select("id, deck_id, front, back, position, created_at")
      .single();
    if (insertError || !data) setError(flashcardError());
    else {
      setCards((current) => [...current, data as Flashcard]);
      setDecks((current) => current.map((deck) => deck.id === selectedDeckId ? { ...deck, cardCount: deck.cardCount + 1 } : deck));
      setFront("");
      setBack("");
      void supabase.from("flashcard_decks").update({ updated_at: new Date().toISOString() }).eq("id", selectedDeckId).eq("user_id", userId);
    }
    setSaving(false);
  }

  async function deleteCard(card: Flashcard) {
    if (!userId) return;
    const { error: deleteError } = await supabase.from("flashcards").delete().eq("id", card.id).eq("user_id", userId);
    if (deleteError) setError("Could not delete that flashcard.");
    else {
      setCards((current) => current.filter((item) => item.id !== card.id));
      setDecks((current) => current.map((deck) => deck.id === card.deck_id ? { ...deck, cardCount: Math.max(0, deck.cardCount - 1) } : deck));
      setStudyIndex((current) => Math.min(current, Math.max(0, cards.length - 2)));
      setRevealed(false);
    }
  }

  async function deleteDeck(deck: Deck) {
    if (!userId || !window.confirm(`Delete “${deck.title}” and its ${deck.cardCount} card(s)?`)) return;
    const { error: deleteError } = await supabase.from("flashcard_decks").delete().eq("id", deck.id).eq("user_id", userId);
    if (deleteError) setError("Could not delete that deck.");
    else {
      const next = decks.filter((item) => item.id !== deck.id);
      setDecks(next);
      if (selectedDeckId === deck.id) {
        setSelectedDeckId(null);
        setCards([]);
      }
    }
  }

  async function selectDeck(deckId: string) {
    setSelectedDeckId(deckId);
    await loadCards(deckId);
  }

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;
  const currentCard = cards[studyIndex];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Flashcards</h1>
          <p className="mt-1 text-sm text-zinc-400">Create private decks, add cards, and study them at your own pace.</p>
        </div>

        {error && <Card><p role="alert" className="text-sm text-amber-200">{error}</p></Card>}
        {loading ? <Card><p className="text-sm text-zinc-400">Loading your flashcards…</p></Card> : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
            <div className="flex flex-col gap-5">
              <Card>
                <h2 className="text-lg font-semibold text-white">Create a deck</h2>
                <form className="mt-4 space-y-4" onSubmit={(event) => void createDeck(event)}>
                  <Field label="Deck name" htmlFor="deck-title">
                    <Input id="deck-title" value={deckTitle} onChange={(event) => setDeckTitle(event.target.value)} maxLength={120} required placeholder="e.g. Biology: cell structure" />
                  </Field>
                  <Field label="Subject" htmlFor="deck-subject" hint="Optional. Link this deck to a subject.">
                    <Select id="deck-subject" value={deckSubjectId} onChange={(event) => setDeckSubjectId(event.target.value)}>
                      <option value="">No subject</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </Select>
                  </Field>
                  <Button type="submit" loading={saving}>Create deck</Button>
                </form>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-white">Your decks</h2>
                {decks.length ? <ul className="mt-4 space-y-2">
                  {decks.map((deck) => (
                    <li key={deck.id} className={`flex items-center gap-2 rounded-xl border p-3 ${deck.id === selectedDeckId ? "border-blue-400/40 bg-blue-500/10" : "border-white/8 bg-white/3"}`}>
                      <button type="button" onClick={() => void selectDeck(deck.id)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium text-zinc-100">{deck.title}</span>
                        <span className="mt-1 block text-xs text-zinc-500">{deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}{deck.subject_id ? ` · ${subjects.find((subject) => subject.id === deck.subject_id)?.name ?? "Subject"}` : ""}</span>
                      </button>
                      <Button variant="ghost" className="px-2 py-1 text-xs text-red-300" onClick={() => void deleteDeck(deck)}>Delete</Button>
                    </li>
                  ))}
                </ul> : <p className="mt-3 text-sm text-zinc-400">No decks yet. Create one to get started.</p>}
              </Card>
            </div>

            <div className="flex flex-col gap-5">
              {selectedDeck ? <>
                <Card>
                  <h2 className="text-lg font-semibold text-white">Add a card to {selectedDeck.title}</h2>
                  <form className="mt-4 space-y-4" onSubmit={(event) => void addCard(event)}>
                    <Field label="Front" htmlFor="flashcard-front" hint="The question or prompt">
                      <Textarea id="flashcard-front" rows={3} value={front} onChange={(event) => setFront(event.target.value)} maxLength={10000} required placeholder="What should you remember?" />
                    </Field>
                    <Field label="Back" htmlFor="flashcard-back" hint="The answer or explanation">
                      <Textarea id="flashcard-back" rows={3} value={back} onChange={(event) => setBack(event.target.value)} maxLength={10000} required placeholder="Write the answer in your own words…" />
                    </Field>
                    <Button type="submit" loading={saving}>Save flashcard</Button>
                  </form>
                </Card>

                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Study this deck</h2>
                      <p className="mt-1 text-sm text-zinc-400">Select a card, think through it, then reveal the answer.</p>
                    </div>
                    {cards.length > 0 && <span className="text-xs tabular-nums text-zinc-500">{studyIndex + 1} / {cards.length}</span>}
                  </div>
                  {currentCard ? <>
                    <button type="button" onClick={() => setRevealed((value) => !value)} className="mt-5 min-h-44 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-6 text-left text-lg leading-7 text-zinc-100 transition hover:border-white/20" aria-label={revealed ? "Hide answer" : "Reveal answer"}>
                      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">{revealed ? "Answer" : "Question · click to reveal"}</span>
                      <span className="whitespace-pre-wrap">{revealed ? currentCard.back : currentCard.front}</span>
                    </button>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Button variant="secondary" disabled={studyIndex === 0} onClick={() => { setStudyIndex((value) => Math.max(0, value - 1)); setRevealed(false); }}>Previous</Button>
                        <Button variant="secondary" disabled={studyIndex >= cards.length - 1} onClick={() => { setStudyIndex((value) => Math.min(cards.length - 1, value + 1)); setRevealed(false); }}>Next</Button>
                      </div>
                      <Button variant="ghost" className="text-red-300" onClick={() => void deleteCard(currentCard)}>Delete card</Button>
                    </div>
                  </> : <p className="mt-5 rounded-xl bg-white/3 p-5 text-sm text-zinc-400">This deck is empty. Add a card above, and it will appear here for study.</p>}
                </Card>
              </> : <Card className="min-h-48"><h2 className="text-lg font-semibold text-white">Choose a deck</h2><p className="mt-2 text-sm text-zinc-400">Create a deck or select one from your saved decks to add and study cards.</p></Card>}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
