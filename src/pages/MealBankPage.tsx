import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { checkRecipeAgainstPantry } from '../utils/ingredientMatch';
import type { Recipe } from '../types';

const UNSPLASH_BASE = 'https://images.unsplash.com/';

function RecipeCard({
  recipe,
  isFavorite,
  hasNotes,
  onToggleFav,
  matchInfo,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  hasNotes: boolean;
  onToggleFav: () => void;
  matchInfo?: { matchedCount: number; totalIngredients: number; matchPercent: number; missingIngredients: string[] };
}) {
  const navigate = useNavigate();
  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
      <div className="recipe-card-img-wrap">
        <img
          className="recipe-card-img"
          src={`${UNSPLASH_BASE}${recipe.img}?w=400&h=200&fit=crop&auto=format`}
          alt={recipe.name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <button
          className={`fav-btn card-fav${isFavorite ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
        {hasNotes && <span className="card-notes-badge" title="Has notes">✎</span>}
      </div>
      <div className="recipe-card-body">
        <span className="recipe-id-badge">{recipe.id}</span>
        <div className="recipe-card-title">{recipe.name}</div>
        <div className="recipe-card-meta">
          <span>⏱ {recipe.time}</span>
          <span>· {recipe.difficulty}</span>
        </div>
        {matchInfo ? (
          <div className="match-badge-wrap">
            <div className={`match-badge${matchInfo.matchPercent === 100 ? ' full' : matchInfo.matchPercent >= 70 ? ' high' : ''}`}>
              {matchInfo.matchedCount}/{matchInfo.totalIngredients} ingredients stocked
            </div>
            {matchInfo.missingIngredients.length > 0 && matchInfo.missingIngredients.length <= 3 && (
              <div className="match-missing">
                Missing: {matchInfo.missingIngredients.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <div className="recipe-card-desc">{recipe.desc}</div>
        )}
      </div>
    </div>
  );
}

type FilterMode = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'favorites' | 'pantry';

export default function MealBankPage() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites-v1', []);
  const [notes] = useLocalStorage<Record<string, string>>('recipe-notes-v1', {});
  const [pantry] = useLocalStorage<Record<string, boolean>>('pantry-v1', {});

  function toggleFav(id: string) {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }

  const matchData = mode === 'pantry'
    ? Object.fromEntries(recipes.map(r => [r.id, checkRecipeAgainstPantry(r.ingredients, r.id, pantry)]))
    : {};

  const filtered = recipes
    .filter(r => {
      if (mode === 'favorites') return favorites.includes(r.id);
      if (mode === 'pantry') return true;
      if (mode !== 'all') return r.category === mode;
      return true;
    })
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.search.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
    });

  const sorted = mode === 'pantry'
    ? [...filtered].sort((a, b) => (matchData[b.id]?.matchPercent ?? 0) - (matchData[a.id]?.matchPercent ?? 0))
    : mode === 'all'
      ? [...filtered].sort((a, b) => {
          const af = favorites.includes(a.id) ? 1 : 0;
          const bf = favorites.includes(b.id) ? 1 : 0;
          return bf - af;
        })
      : filtered;

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
        <p>45 recipes — pick what sounds good.</p>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {([
          ['all', `All (${counts.all})`],
          ['breakfast', `Breakfast (${counts.breakfast})`],
          ['lunch', `Lunch (${counts.lunch})`],
          ['dinner', `Dinner (${counts.dinner})`],
          ['favorites', `♥ Faves${favorites.length > 0 ? ` (${favorites.length})` : ''}`],
          ['pantry', 'What Can I Make?'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn${mode === key ? ' active' : ''}`}
            onClick={() => setMode(key as FilterMode)}
          >
            {label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{mode === 'favorites' ? '♥' : mode === 'pantry' ? '🥫' : '🔍'}</div>
          <h3>{mode === 'favorites' ? 'No favorites yet' : mode === 'pantry' ? 'Stock your pantry first' : 'No recipes found'}</h3>
          <p>{mode === 'favorites' ? 'Tap the heart on any recipe to save it here.' : mode === 'pantry' ? 'Check off items in your pantry to see what you can make.' : 'Try a different search or category.'}</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {sorted.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              isFavorite={favorites.includes(r.id)}
              hasNotes={!!notes[r.id]}
              onToggleFav={() => toggleFav(r.id)}
              matchInfo={mode === 'pantry' ? matchData[r.id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
