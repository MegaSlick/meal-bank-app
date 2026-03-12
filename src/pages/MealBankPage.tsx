import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import type { Recipe } from '../types';

const UNSPLASH_BASE = 'https://images.unsplash.com/';

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
      <img
        className="recipe-card-img"
        src={`${UNSPLASH_BASE}${recipe.img}?w=400&h=200&fit=crop&auto=format`}
        alt={recipe.name}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="recipe-card-body">
        <span className="recipe-id-badge">{recipe.id}</span>
        <div className="recipe-card-title">{recipe.name}</div>
        <div className="recipe-card-meta">
          <span>⏱ {recipe.time}</span>
          <span>· {recipe.difficulty}</span>
        </div>
        <div className="recipe-card-desc">{recipe.desc}</div>
      </div>
    </div>
  );
}

export default function MealBankPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');

  const filtered = recipes.filter(r => {
    const matchCat = category === 'all' || r.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.search.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const counts = {
    all: recipes.length,
    breakfast: recipes.filter(r => r.category === 'breakfast').length,
    lunch: recipes.filter(r => r.category === 'lunch').length,
    dinner: recipes.filter(r => r.category === 'dinner').length,
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>The Meal Bank</h1>
        <p>45 recipes — breakfast, lunch, and dinner. Pick what sounds good.</p>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(['all', 'breakfast', 'lunch', 'dinner'] as const).map(cat => (
          <button
            key={cat}
            className={`filter-btn${category === cat ? ' active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? `All (${counts.all})` : `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${counts[cat]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No recipes found</h3>
          <p>Try a different search or category.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
