export interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  time: string;
  difficulty: 'Easy' | 'Medium';
  img: string;
  search: string;
  desc: string;
  portion: string;
  ingredients: string[];
  steps: string[];
  fiber: string;
  shift: string;
  repurpose?: string;
  calories?: string;
}

export interface Snack {
  name: string;
  note: string;
}

export interface PantryItem {
  name: string;
  category: string;
  inStock: boolean;
}

export interface PlannedMeal {
  recipeId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

export interface WeekPlan {
  [dateKey: string]: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  fromRecipe?: string;
}

// Keys are "YYYY-MM-DD:breakfast" | "YYYY-MM-DD:lunch" | "YYYY-MM-DD:dinner"
export type CookedMeals = Record<string, boolean>;
