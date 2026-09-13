import { RECIPES } from '@/game/core/catalog';
export const START_COINS=3000;
export const INVITER_BONUS=500;
export const INVITEE_BONUS=250;
export const SERVER_RECIPES=Object.fromEntries(RECIPES.map(r=>[r.id,r]));
export type ServerRecipeId=string;
export function normalizeUsername(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g,'');}
