// Unit Configuration
import { Target, Telescope, Bird, Leaf, Flame, Droplets, Folder } from 'lucide-react';

export const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", bg: "bg-gradient-to-br from-red-600 to-red-500", icon: Target },
  { key: "Discovery", label: "Discovery", bg: "bg-gradient-to-br from-indigo-500 to-purple-600", icon: Telescope },
  { key: "Freedom", label: "Freedom", bg: "bg-gradient-to-br from-teal-500 to-lime-500", icon: Bird },
  { key: "Harmony", label: "Harmony", bg: "bg-gradient-to-br from-emerald-600 to-green-400", icon: Leaf },
  { key: "Integrity", label: "Integrity", bg: "bg-gradient-to-br from-orange-400 to-red-400", icon: Flame },
  { key: "Serenity", label: "Serenity", bg: "bg-gradient-to-br from-sky-400 to-cyan-300", icon: Droplets }
];

export const OTHER_THEME = { key: "Other", label: "Other / Unassigned", bg: "bg-gradient-to-br from-gray-400 to-slate-700", icon: Folder };