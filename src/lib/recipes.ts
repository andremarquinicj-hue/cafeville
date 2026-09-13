export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  revenue: number;
  xp: number;
  seconds: number;
  level: number;
};

export const recipes: Recipe[] = [
  { id: "espresso", name: "Café Espresso", emoji: "☕", cost: 15, revenue: 40, xp: 5, seconds: 15, level: 1 },
  { id: "pao_queijo", name: "Pão de Queijo", emoji: "🧀", cost: 35, revenue: 90, xp: 12, seconds: 30, level: 1 },
  { id: "brigadeiro", name: "Brigadeiro", emoji: "🍫", cost: 55, revenue: 160, xp: 20, seconds: 60, level: 2 },
  { id: "pizza_marguerita", name: "Pizza Marguerita", emoji: "🍕", cost: 100, revenue: 300, xp: 45, seconds: 120, level: 3 },
];
