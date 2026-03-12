import { pantryCategories } from '../data/pantry';

// All pantry item names flattened for matching
const ALL_PANTRY_ITEMS = Object.values(pantryCategories).flat();

// Extract simple keywords from a pantry item name for fuzzy matching
// e.g. "Black beans (4-6 cans)" → ["black", "beans"]
function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parenthetical notes
    .replace(/[^a-z\s]/g, '') // remove non-alpha
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'for', 'the', 'buy'].includes(w));
}

// Check if a recipe ingredient matches a pantry item
function ingredientMatchesPantryItem(ingredient: string, pantryItem: string): boolean {
  const ingLower = ingredient.toLowerCase();
  const pantryKeywords = extractKeywords(pantryItem);

  // At least 1 significant keyword must match
  const matchCount = pantryKeywords.filter(kw => ingLower.includes(kw)).length;
  // Need at least 1 keyword match, and at least half of keywords should match
  return matchCount > 0 && matchCount >= Math.ceil(pantryKeywords.length / 2);
}

/**
 * Given current pantry state and a list of recipe ingredients,
 * returns updated pantry state with matching items unchecked (depleted).
 */
export function depletePantryForRecipe(
  pantryState: Record<string, boolean>,
  recipeIngredients: string[]
): Record<string, boolean> {
  const next = { ...pantryState };

  for (const ingredient of recipeIngredients) {
    for (const pantryItem of ALL_PANTRY_ITEMS) {
      if (next[pantryItem] && ingredientMatchesPantryItem(ingredient, pantryItem)) {
        next[pantryItem] = false; // depleted
      }
    }
  }

  return next;
}
