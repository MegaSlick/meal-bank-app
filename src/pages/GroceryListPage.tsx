import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { recipes } from '../data/recipes';
import { pantryCategories } from '../data/pantry';
import type { GroceryItem, WeekPlan } from '../types';

const GROCERY_CATEGORIES = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Canned & Pantry', 'Grains & Bread', 'Frozen', 'Spices', 'Other'];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function categorizePantryItem(itemName: string): string {
  const lower = itemName.toLowerCase();
  for (const [cat, items] of Object.entries(pantryCategories)) {
    if (items.some(i => i.toLowerCase().includes(lower.split(' ')[0]))) {
      if (cat === 'Canned Goods') return 'Canned & Pantry';
      if (cat === 'Grains & Pasta') return 'Grains & Bread';
      if (cat === 'Spices & Seasonings') return 'Spices';
      if (cat === 'Oils & Sauces') return 'Canned & Pantry';
      if (cat === 'Fridge Staples') return 'Dairy & Eggs';
      if (cat === 'Freezer Staples') return 'Frozen';
      if (cat === 'Produce (buy weekly)') return 'Produce';
    }
  }
  return 'Other';
}

export default function GroceryListPage() {
  const [items, setItems] = useLocalStorage<GroceryItem[]>('grocerylist-v1', []);
  const [plan] = useLocalStorage<WeekPlan>('mealplan-v1', {});
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [showChecked, setShowChecked] = useState(true);

  function addItem() {
    const name = newItem.trim();
    if (!name) return;
    setItems(prev => [...prev, { id: generateId(), name, category: newCategory, checked: false }]);
    setNewItem('');
  }

  function toggleItem(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearChecked() {
    setItems(prev => prev.filter(i => !i.checked));
  }

  function clearAll() {
    if (window.confirm('Clear entire grocery list?')) setItems([]);
  }

  function importFromPlan() {
    const recipeIds = new Set<string>();
    Object.values(plan).forEach(day => {
      ['breakfast', 'lunch', 'dinner'].forEach(mt => {
        const id = (day as Record<string, string | undefined>)[mt];
        if (id) recipeIds.add(id);
      });
    });

    if (recipeIds.size === 0) {
      alert('No meals planned yet. Add meals to the planner first.');
      return;
    }

    const existingNames = new Set(items.map(i => i.name.toLowerCase()));
    const toAdd: GroceryItem[] = [];

    recipeIds.forEach(rid => {
      const recipe = recipes.find(r => r.id === rid);
      if (!recipe) return;
      recipe.ingredients.forEach(ing => {
        if (!existingNames.has(ing.toLowerCase())) {
          existingNames.add(ing.toLowerCase());
          toAdd.push({
            id: generateId(),
            name: ing,
            category: categorizePantryItem(ing),
            checked: false,
            fromRecipe: recipe.name,
          });
        }
      });
    });

    if (toAdd.length === 0) {
      alert('All ingredients from planned meals are already on your list.');
      return;
    }

    setItems(prev => [...prev, ...toAdd]);
  }

  const visibleItems = showChecked ? items : items.filter(i => !i.checked);

  const grouped = GROCERY_CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const catItems = visibleItems.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  // Items with unknown category
  const otherCat = visibleItems.filter(i => !GROCERY_CATEGORIES.includes(i.category));
  if (otherCat.length > 0) grouped['Other'] = [...(grouped['Other'] || []), ...otherCat];

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Grocery List</h1>
        <p>Add items manually or import from your meal plan.</p>
      </div>

      {totalCount > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{checkedCount}</span>
            <span className="stat-label">Got it</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalCount - checkedCount}</span>
            <span className="stat-label">Need it</span>
          </div>
          <div className="stat-item" style={{ flex: 1, alignItems: 'flex-start' }}>
            <div className="progress-bar-wrap" style={{ width: '100%' }}>
              <div className="progress-bar-fill" style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }} />
            </div>
            <span className="stat-label">{totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}% done</span>
          </div>
        </div>
      )}

      <div className="grocery-actions">
        <button className="btn btn-primary" onClick={importFromPlan}>
          📅 Import from Plan
        </button>
        {checkedCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={clearChecked}>
            Remove checked ({checkedCount})
          </button>
        )}
        {totalCount > 0 && (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setShowChecked(s => !s)}>
              {showChecked ? 'Hide' : 'Show'} checked
            </button>
            <button className="btn btn-danger btn-sm" onClick={clearAll}>
              Clear all
            </button>
          </>
        )}
      </div>

      <div className="add-item-form">
        <input
          className="add-item-input"
          placeholder="Add item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <select
          className="category-select"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        >
          {GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={addItem}>Add</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Your list is empty</h3>
          <p>Add items above or import ingredients from your meal plan.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="grocery-section">
            <div className="grocery-section-header">{cat}</div>
            {catItems.map(item => (
              <div key={item.id} className={`grocery-item${item.checked ? ' checked' : ''}`}>
                <button
                  className={`grocery-checkbox${item.checked ? ' checked' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.checked ? '✓' : ''}
                </button>
                <span className="grocery-item-name">{item.name}</span>
                {item.fromRecipe && (
                  <span className="grocery-item-source">{item.fromRecipe}</span>
                )}
                <button className="grocery-delete-btn" onClick={() => deleteItem(item.id)}>✕</button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
