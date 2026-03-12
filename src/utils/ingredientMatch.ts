import { pantryCategories } from '../data/pantry';

const ALL_PANTRY_ITEMS = Object.values(pantryCategories).flat();

function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'for', 'the', 'buy', 'optional', 'canned', 'fresh', 'frozen', 'dried'].includes(w));
}

export function ingredientMatchesPantryItem(ingredient: string, pantryItem: string): boolean {
  const ingLower = ingredient.toLowerCase();
  const pantryKeywords = extractKeywords(pantryItem);
  if (pantryKeywords.length === 0) return false;
  const matchCount = pantryKeywords.filter(kw => ingLower.includes(kw)).length;
  return matchCount > 0 && matchCount >= Math.ceil(pantryKeywords.length / 2);
}

export function getMatchedPantryItems(ingredient: string): string[] {
  return ALL_PANTRY_ITEMS.filter(pi => ingredientMatchesPantryItem(ingredient, pi));
}

export interface RecipeMatchResult {
  recipeId: string;
  totalIngredients: number;
  matchedCount: number;
  matchPercent: number;
  missingIngredients: string[];
}

export function checkRecipeAgainstPantry(
  recipeIngredients: string[],
  recipeId: string,
  pantryState: Record<string, boolean>
): RecipeMatchResult {
  let matchedCount = 0;
  const missing: string[] = [];

  for (const ing of recipeIngredients) {
    const matches = ALL_PANTRY_ITEMS.filter(
      pi => pantryState[pi] && ingredientMatchesPantryItem(ing, pi)
    );
    if (matches.length > 0) {
      matchedCount++;
    } else {
      missing.push(ing);
    }
  }

  return {
    recipeId,
    totalIngredients: recipeIngredients.length,
    matchedCount,
    matchPercent: recipeIngredients.length > 0
      ? Math.round((matchedCount / recipeIngredients.length) * 100)
      : 0,
    missingIngredients: missing,
  };
}
