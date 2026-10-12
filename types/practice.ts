export type PracticeQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type PracticeDifficulty = "beginner" | "intermediate" | "advanced";

export type PracticeQuestionView = Pick<PracticeQuestion, "prompt" | "options">;

export type PracticeSubject = {
  id: string;
  name: string;
};

export type PracticeQuizSummary = {
  id: string;
  subjectId: string | null;
  subjectName: string | null;
  title: string;
  topic: string;
  difficulty: PracticeDifficulty;
  questions: PracticeQuestionView[];
  createdAt: string;
  bestScore: number | null;
  bestTotal: number | null;
  attemptCount: number;
};

export type PracticeAttemptResult = {
  score: number;
  total: number;
  feedback: Array<{
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
};
