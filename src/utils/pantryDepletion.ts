import { pantryCategories } from '../data/pantry';
import { ingredientMatchesPantryItem } from './ingredientMatch';

const ALL_PANTRY_ITEMS = Object.values(pantryCategories).flat();

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
        next[pantryItem] = false;
      }
    }
  }

  return next;
}

/**
 * Returns a list of pantry items that would be depleted by a recipe's ingredients.
 */
export function getDepletedItems(
  pantryState: Record<string, boolean>,
  recipeIngredients: string[]
): string[] {
  const depleted: string[] = [];
  for (const ingredient of recipeIngredients) {
    for (const pantryItem of ALL_PANTRY_ITEMS) {
      if (pantryState[pantryItem] && ingredientMatchesPantryItem(ingredient, pantryItem)) {
        if (!depleted.includes(pantryItem)) depleted.push(pantryItem);
      }
    }
  }
  return depleted;
}
