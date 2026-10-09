export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type StatItem = {
  id: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
};

export type SubjectItem = {
  id: string;
  name: string;
  topic: string;
  progress: number;
  accent: string;
  icon: string;
};

export type TaskItem = {
  id: string;
  title: string;
  subject: string;
  completed: boolean;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/subjects", label: "Subjects", icon: "📚" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/flashcards", label: "Flashcards", icon: "🧠" },
  { href: "/practice", label: "Practice", icon: "🧪" },
  { href: "/focus", label: "Focus", icon: "⏱" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/ai-tutor", label: "AI Tutor", icon: "🤖" },
];

export const settingsNav: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: "⚙",
};

export const currentUser = {
  name: "Tilak",
  role: "Grade 12 · Science",
  initials: "T",
};

export const stats: StatItem[] = [
  {
    id: "streak",
    icon: "🔥",
    label: "Current Streak",
    value: "7 days",
    hint: "Keep it going",
  },
  {
    id: "focus",
    icon: "⏱",
    label: "Focus Time",
    value: "2h 35m",
    hint: "Today",
  },
  {
    id: "questions",
    icon: "🧠",
    label: "Questions Solved",
    value: "128",
    hint: "This week",
  },
  {
    id: "goal",
    icon: "🎯",
    label: "Weekly Goal",
    value: "78%",
    hint: "10h of 13h",
  },
];

export const weeklyProgress = {
  percent: 78,
  hoursDone: 10.2,
  hoursGoal: 13,
  sessions: 6,
};

export const subjects: SubjectItem[] = [
  {
    id: "physics",
    name: "Physics",
    topic: "Chapter 5 · Laws of Motion",
    progress: 72,
    accent: "from-sky-500/80 to-blue-600/80",
    icon: "⚛️",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    topic: "Chemical Equilibrium",
    progress: 64,
    accent: "from-violet-500/80 to-fuchsia-600/80",
    icon: "🧪",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    topic: "Limits and Continuity",
    progress: 81,
    accent: "from-indigo-500/80 to-blue-500/80",
    icon: "📐",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    topic: "Data Structures",
    progress: 45,
    accent: "from-emerald-500/80 to-teal-600/80",
    icon: "💻",
  },
];

export const tasks: TaskItem[] = [
  {
    id: "task-1",
    title: "Complete Physics numerical problems",
    subject: "Physics",
    completed: false,
  },
  {
    id: "task-2",
    title: "Revise Chemical Equilibrium",
    subject: "Chemistry",
    completed: false,
  },
  {
    id: "task-3",
    title: "Practice differentiation",
    subject: "Mathematics",
    completed: false,
  },
  {
    id: "task-4",
    title: "Review Computer Science notes",
    subject: "Computer Science",
    completed: false,
  },
];
