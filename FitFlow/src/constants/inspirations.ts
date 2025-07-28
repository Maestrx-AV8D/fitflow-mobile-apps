export type Inspiration = {
  id?: string
  title?: string
  content: string
  author?: string | null
  cta: string
  icon?: string
}

export const allInspirations: Inspiration[] = [
  {
    id: '1',
    content: "Everybody is talented because everybody who is human has something to express.",
    author: "Brenda Ueland",
    cta: "Reflect on It",
    icon: "“"
  },
  {
    id: '2',
    content: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    cta: "Keep Going",
    icon: "🔥"
  },
  {
    id: '3',
    content: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    cta: "Make it Matter",
    icon: "🥊"
  },
  {
    id: '4',
    content: "What you do every day matters more than what you do once in a while.",
    author: "Gretchen Rubin",
    cta: "Build Your Streak",
    icon: "📅"
  },
  {
    id: '5',
    content: "Your only limit is your mind.",
    author: null,
    cta: "Push Yourself",
    icon: "🧠"
  },
  {
    id: '6',
    content: "Discipline is choosing between what you want now and what you want most.",
    author: null,
    cta: "Stay Focused",
    icon: "🎯"
  },
  {
    id: '7',
    content: "Sweat is just fat crying.",
    author: null,
    cta: "Laugh & Train",
    icon: "💦"
  },
  {
    id: '8',
    content: "A river cuts through rock, not because of its power, but because of its persistence.",
    author: null,
    cta: "Stay Consistent",
    icon: "🌊"
  },
];
