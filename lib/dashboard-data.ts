export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/subjects", label: "Subjects", icon: "📚" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/flashcards", label: "Flashcards", icon: "🧠" },
  { href: "/practice", label: "Practice", icon: "🧪" },
  { href: "/focus", label: "Focus", icon: "⏱" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/tutor", label: "AI Tutor", icon: "🤖" },
];

export const settingsNav: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: "⚙",
};
