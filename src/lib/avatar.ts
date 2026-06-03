const COLORS = [
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100",   text: "text-rose-600"   },
  { bg: "bg-amber-100",  text: "text-amber-600"  },
  { bg: "bg-teal-100",   text: "text-teal-600"   },
  { bg: "bg-sky-100",    text: "text-sky-600"    },
  { bg: "bg-pink-100",   text: "text-pink-600"   },
];

export function userColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}
