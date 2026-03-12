import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeById } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SHOW_CALORIES } from '../config';
import CookMode from '../components/CookMode';
import type { CookedMeals } from '../types';
import { depletePantryForRecipe } from '../utils/pantryDepletion';

const UNSPLASH_BASE = 'https://images.unsplash.com/';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = id ? recipeById[id] : null;
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites-v1', []);
  const [notes, setNotes] = useLocalStorage<Record<string, string>>('recipe-notes-v1', {});
  const [cooked, setCooked] = useLocalStorage<CookedMeals>('cooked-v1', {});
  const [pantry, setPantry] = useLocalStorage<Record<string, boolean>>('pantry-v1', {});
  const [cooking, setCooking] = useState(false);

  // suppress unused lint — these are read by helpers
  void pantry;
  void cooked;

  if (!recipe) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="icon">🍽️</div>
          <h3>Recipe not found</h3>
          <p><button className="back-btn" onClick={() => navigate('/')}>← Back to Meal Bank</button></p>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.includes(recipe.id);
  const recipeNote = notes[recipe.id] || '';

  function toggleFav() {
    if (!recipe) return;
    setFavorites(prev =>
      prev.includes(recipe.id) ? prev.filter(f => f !== recipe.id) : [...prev, recipe.id]
    );
  }

  function handleNoteChange(value: string) {
    if (!recipe) return;
    setNotes(prev => {
      if (!value.trim()) {
        const next = { ...prev };
        delete next[recipe.id];
        return next;
      }
      return { ...prev, [recipe.id]: value };
    });
  }

  function handleCookDone() {
    if (!recipe) return;
    const today = new Date().toISOString().slice(0, 10);
    // Mark as cooked for today (use a generic key since it's not from planner)
    setCooked(prev => ({ ...prev, [`${today}:cook-mode-${recipe.id}`]: true }));
    // Deplete pantry
    setPantry(prev => depletePantryForRecipe(prev, recipe.ingredients));
    setCooking(false);
  }

  if (cooking) {
    return (
      <CookMode
        recipe={recipe}
        onExit={() => setCooking(false)}
        onDone={handleCookDone}
      />
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="recipe-detail-hero-wrap">
          <img
            className="recipe-detail-hero"
            src={`${UNSPLASH_BASE}${recipe.img}?w=1200&h=400&fit=crop&auto=format`}
            alt={recipe.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            className={`fav-btn detail-fav${isFavorite ? ' active' : ''}`}
            onClick={toggleFav}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <div className="recipe-detail-body">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

          <div className="recipe-title-row">
            <span className="recipe-id-badge">{recipe.id}</span>
            <h1 className="recipe-title">{recipe.name}</h1>
          </div>
          <div className="recipe-meta">⏱ {recipe.time} · {recipe.difficulty}</div>
          <p className="recipe-desc">{recipe.desc}</p>

          <button className="btn btn-primary cook-start-btn" onClick={() => setCooking(true)}>
            Start Cooking
          </button>

          <div className="portion-box">
            <strong>Portion guide: </strong>{recipe.portion}
          </div>

          {SHOW_CALORIES && recipe.calories && (
            <div className="portion-box" style={{ borderLeftColor: 'var(--orange)', background: '#FFF3EB' }}>
              <strong style={{ color: 'var(--orange)' }}>Calories: </strong>{recipe.calories}
            </div>
          )}

          <div className="section-label">Ingredients</div>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>

          <div className="section-label">Instructions</div>
          <ol className="step-list">
            {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>

          <div className="recipe-notes">
            <div className="recipe-note fiber">
              <span className="note-label">🌿 Fiber:</span>
              <span>{recipe.fiber}</span>
            </div>
            <div className="recipe-note shift">
              <span className="note-label">⏰ Shift tip:</span>
              <span>{recipe.shift}</span>
            </div>
            {recipe.repurpose && (
              <div className="recipe-note repurpose">
                <span className="note-label">♻️ Day 2:</span>
                <span>{recipe.repurpose}</span>
              </div>
            )}
          </div>

          <div className="user-notes-section">
            <div className="section-label">Your Notes</div>
            <textarea
              className="user-notes-textarea"
              placeholder="Add your notes for this recipe..."
              value={recipeNote}
              onChange={e => handleNoteChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
