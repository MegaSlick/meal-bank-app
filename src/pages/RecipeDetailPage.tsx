import { useParams, useNavigate } from 'react-router-dom';
import { recipeById } from '../data/recipes';

const UNSPLASH_BASE = 'https://images.unsplash.com/';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = id ? recipeById[id] : null;

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

  return (
    <div className="page">
      <div className="card">
        <img
          className="recipe-detail-hero"
          src={`${UNSPLASH_BASE}${recipe.img}?w=1200&h=400&fit=crop&auto=format`}
          alt={recipe.name}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="recipe-detail-body">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

          <div className="recipe-title-row">
            <span className="recipe-id-badge">{recipe.id}</span>
            <h1 className="recipe-title">{recipe.name}</h1>
          </div>
          <div className="recipe-meta">⏱ {recipe.time} · {recipe.difficulty}</div>
          <p className="recipe-desc">{recipe.desc}</p>

          <div className="portion-box">
            <strong>Portion guide: </strong>{recipe.portion}
          </div>

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
        </div>
      </div>
    </div>
  );
}
