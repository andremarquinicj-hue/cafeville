export const START_COINS = 3000;
export const INVITER_BONUS = 500;
export const INVITEE_BONUS = 250;

export const SERVER_RECIPES = {
  espresso: { name: "Café Espresso", cost: 15, revenue: 40, xp: 5, seconds: 15 },
  pao_queijo: { name: "Pão de Queijo", cost: 35, revenue: 90, xp: 12, seconds: 30 },
  brigadeiro: { name: "Brigadeiro", cost: 55, revenue: 160, xp: 20, seconds: 60 },
  pizza_marguerita: { name: "Pizza Marguerita", cost: 100, revenue: 300, xp: 45, seconds: 120 },
} as const;

export type ServerRecipeId = keyof typeof SERVER_RECIPES;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
