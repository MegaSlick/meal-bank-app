import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WeekPlan } from '../types';

const UNSPLASH_BASE = 'https://images.unsplash.com/';

function getWeekDates(startOffset: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + startOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isToday(d: Date): boolean {
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

interface PickerModal {
  dateKey: string;
  mealType: typeof MEAL_TYPES[number];
}

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plan, setPlan] = useLocalStorage<WeekPlan>('mealplan-v1', {});
  const [picker, setPicker] = useState<PickerModal | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const navigate = useNavigate();

  const weekDates = getWeekDates(weekOffset);

  const weekLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const sameMonth = first.getMonth() === last.getMonth();
    return sameMonth
      ? `${first.toLocaleDateString('en', { month: 'long', day: 'numeric' })} – ${last.getDate()}, ${last.getFullYear()}`
      : `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  function setMeal(dk: string, mealType: typeof MEAL_TYPES[number], recipeId: string | undefined) {
    setPlan(prev => ({
      ...prev,
      [dk]: { ...prev[dk], [mealType]: recipeId },
    }));
  }

  function openPicker(dk: string, mealType: typeof MEAL_TYPES[number]) {
    setPickerSearch('');
    setPicker({ dateKey: dk, mealType });
  }

  const filteredRecipes = pickerSearch
    ? recipes.filter(r =>
        r.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        r.category.includes(pickerSearch.toLowerCase())
      )
    : picker
      ? recipes.filter(r => r.category === picker.mealType)
      : recipes;

  // Count planned meals this week
  const plannedCount = weekDates.reduce((acc, d) => {
    const dk = dateKey(d);
    const day = plan[dk] || {};
    return acc + MEAL_TYPES.filter(m => day[m]).length;
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Meal Planner</h1>
        <p>Plan your week. Click + to assign a recipe to any meal slot.</p>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{plannedCount}</span>
          <span className="stat-label">Planned</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{21 - plannedCount}</span>
          <span className="stat-label">Empty</span>
        </div>
        <div className="stat-item" style={{ flex: 1, alignItems: 'flex-start' }}>
          <div className="progress-bar-wrap" style={{ width: '100%' }}>
            <div className="progress-bar-fill" style={{ width: `${(plannedCount / 21) * 100}%` }} />
          </div>
          <span className="stat-label">{Math.round((plannedCount / 21) * 100)}% of week planned</span>
        </div>
      </div>

      <div className="week-nav">
        <button className="icon-btn" onClick={() => setWeekOffset(o => o - 1)}>‹</button>
        <h2>{weekLabel}</h2>
        <button className="icon-btn" onClick={() => setWeekOffset(o => o + 1)}>›</button>
      </div>

      <div className="week-grid">
        {weekDates.map((d, i) => {
          const dk = dateKey(d);
          const day = plan[dk] || {};
          return (
            <div key={dk} className={`day-card${isToday(d) ? ' today' : ''}`}>
              <div className="day-header">
                <div className="day-name">{DAYS_SHORT[i]}</div>
                <div className="day-date">{d.getDate()}</div>
              </div>
              {MEAL_TYPES.map(mt => {
                const rid = day[mt];
                const recipe = rid ? recipes.find(r => r.id === rid) : null;
                return (
                  <div key={mt} className="meal-slot">
                    <div className="meal-slot-label">{mt}</div>
                    <div className="meal-slot-content">
                      {recipe ? (
                        <>
                          <span
                            className="planned-meal"
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                            title={recipe.name}
                          >
                            {recipe.name}
                          </span>
                          <button
                            className="remove-meal-btn"
                            onClick={() => setMeal(dk, mt, undefined)}
                            title="Remove"
                          >✕</button>
                        </>
                      ) : (
                        <>
                          <span className="meal-slot-empty">—</span>
                          <button
                            className="add-meal-btn"
                            onClick={() => openPicker(dk, mt)}
                            title="Add meal"
                          >+</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pick a {picker.mealType} recipe</h3>
              <button className="modal-close" onClick={() => setPicker(null)}>✕</button>
            </div>
            <div className="modal-search">
              <input
                autoFocus
                placeholder="Search..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
              />
            </div>
            <div className="modal-list">
              {filteredRecipes.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--subtext)' }}>
                  No recipes found
                </div>
              )}
              {filteredRecipes.map(r => (
                <div
                  key={r.id}
                  className="modal-recipe-item"
                  onClick={() => {
                    setMeal(picker.dateKey, picker.mealType, r.id);
                    setPicker(null);
                  }}
                >
                  <img
                    className="modal-recipe-img"
                    src={`${UNSPLASH_BASE}${r.img}?w=100&h=100&fit=crop&auto=format`}
                    alt={r.name}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="modal-recipe-info">
                    <div className="modal-recipe-name">{r.name}</div>
                    <div className="modal-recipe-meta">{r.id} · {r.time} · {r.difficulty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
