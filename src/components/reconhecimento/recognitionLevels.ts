export interface RecognitionLevel {
  id: string;
  name: string;
  description: string;
  requirement: string;
  points: number;
  /** Tailwind gradient classes for the placeholder visual */
  gradient: string;
  /** Accent color for badge/glow */
  accent: string;
  /** URL of the generated 3D award image */
  imageUrl?: string;
}

export const recognitionLevels: RecognitionLevel[] = [
  {
    id: "bronze",
    name: "Member Bronze",
    description: "Adicione 3 pessoas",
    requirement: "3 pessoas",
    points: 100,
    gradient: "from-amber-700 via-amber-600 to-amber-800",
    accent: "bg-amber-600",
  },
  {
    id: "silver",
    name: "Member Silver",
    description: "Acumule R$ 10 mil em resultados",
    requirement: "R$ 10 mil",
    points: 500,
    gradient: "from-slate-400 via-slate-300 to-slate-500",
    accent: "bg-slate-400",
  },
  {
    id: "gold",
    name: "Member Gold",
    description: "Acumule R$ 50 mil em resultados",
    requirement: "R$ 50 mil",
    points: 1000,
    gradient: "from-yellow-500 via-yellow-400 to-yellow-600",
    accent: "bg-yellow-500",
  },
  {
    id: "black",
    name: "Member Black",
    description: "Acumule R$ 100 mil em resultados",
    requirement: "R$ 100 mil",
    points: 2500,
    gradient: "from-zinc-800 via-zinc-700 to-zinc-900",
    accent: "bg-zinc-700",
  },
  {
    id: "elite",
    name: "Member Elite",
    description: "Acumule R$ 500 mil em resultados",
    requirement: "R$ 500 mil",
    points: 5000,
    gradient: "from-yellow-400 via-amber-300 to-yellow-500",
    accent: "bg-gradient-to-r from-yellow-400 to-amber-500",
  },
];
