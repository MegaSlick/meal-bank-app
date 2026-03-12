import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { depletePantryForRecipe } from '../utils/pantryDepletion';
import type { WeekPlan, CookedMeals } from '../types';

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

function generateICS(weekDates: Date[], plan: WeekPlan): string {
  const MEAL_TIMES: Record<string, { startHour: number; endHour: number }> = {
    breakfast: { startHour: 7, endHour: 8 },
    lunch: { startHour: 12, endHour: 13 },
    dinner: { startHour: 18, endHour: 19 },
  };

  function toICSDate(date: Date, hour: number): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}T${String(hour).padStart(2, '0')}0000`;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Meal Bank//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const d of weekDates) {
    const dk = dateKey(d);
    const day = plan[dk];
    if (!day) continue;

    for (const [mealType, times] of Object.entries(MEAL_TIMES)) {
      const recipeId = day[mealType as keyof typeof day];
      if (!recipeId) continue;
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) continue;

      const desc = [
        recipe.desc,
        '',
        'Ingredients:',
        ...recipe.ingredients.map(i => `- ${i}`),
        '',
        `Portion: ${recipe.portion}`,
      ].join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `DTSTART:${toICSDate(d, times.startHour)}`,
        `DTEND:${toICSDate(d, times.endHour)}`,
        `SUMMARY:${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${recipe.name}`,
        `DESCRIPTION:${desc}`,
        `UID:${dk}-${mealType}@mealbank`,
        'END:VEVENT',
      );
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadICS(weekDates: Date[], plan: WeekPlan) {
  const ics = generateICS(weekDates, plan);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const first = weekDates[0];
  const last = weekDates[6];
  a.download = `meal-plan-${dateKey(first)}-to-${dateKey(last)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const [cooked, setCooked] = useLocalStorage<CookedMeals>('cooked-v1', {});
  const [pantry, setPantry] = useLocalStorage<Record<string, boolean>>('pantry-v1', {});
  const [picker, setPicker] = useState<PickerModal | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const navigate = useNavigate();

  // suppress unused lint — pantry is read by depletePantryForRecipe
  void pantry;

  const weekDates = getWeekDates(weekOffset);

  const weekLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const sameMonth = first.getMonth() === last.getMonth();
    return sameMonth
      ? `${first.toLocaleDateString('en', { month: 'long', day: 'numeric' })} - ${last.getDate()}, ${last.getFullYear()}`
      : `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  function setMeal(dk: string, mealType: typeof MEAL_TYPES[number], recipeId: string | undefined) {
    setPlan(prev => ({
      ...prev,
      [dk]: { ...prev[dk], [mealType]: recipeId },
    }));
    if (!recipeId) {
      const key = `${dk}:${mealType}`;
      setCooked(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleCooked(dk: string, mealType: typeof MEAL_TYPES[number], recipeId: string) {
    const key = `${dk}:${mealType}`;
    const wasCooked = cooked[key];

    if (!wasCooked) {
      setCooked(prev => ({ ...prev, [key]: true }));
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        setPantry(prev => depletePantryForRecipe(prev, recipe.ingredients));
      }
    } else {
      setCooked(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
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

  const plannedCount = weekDates.reduce((acc, d) => {
    const dk = dateKey(d);
    const day = plan[dk] || {};
    return acc + MEAL_TYPES.filter(m => day[m]).length;
  }, 0);

  const cookedCount = weekDates.reduce((acc, d) => {
    const dk = dateKey(d);
    return acc + MEAL_TYPES.filter(m => cooked[`${dk}:${m}`]).length;
  }, 0);

  const hasAnyPlanned = plannedCount > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Meal Planner</h1>
        <p>Plan your week. Mark meals as cooked to update your pantry automatically.</p>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{plannedCount}</span>
          <span className="stat-label">Planned</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{cookedCount}</span>
          <span className="stat-label">Cooked</span>
        </div>
        <div className="stat-item" style={{ flex: 1, alignItems: 'flex-start' }}>
          <div className="progress-bar-wrap" style={{ width: '100%' }}>
            <div className="progress-bar-fill" style={{ width: `${(plannedCount / 21) * 100}%` }} />
          </div>
          <span className="stat-label">{Math.round((plannedCount / 21) * 100)}% of week planned</span>
        </div>
      </div>

      <div className="grocery-actions" style={{ marginBottom: 20 }}>
        {hasAnyPlanned && (
          <button className="btn btn-outline" onClick={() => downloadICS(weekDates, plan)}>
            📅 Export to Calendar (.ics)
          </button>
        )}
        <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(0)}>
          Today
        </button>
      </div>

      <div className="week-nav">
        <button className="icon-btn" onClick={() => setWeekOffset(o => o - 1)}>&#8249;</button>
        <h2>{weekLabel}</h2>
        <button className="icon-btn" onClick={() => setWeekOffset(o => o + 1)}>&#8250;</button>
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
                const isCooked = cooked[`${dk}:${mt}`];
                return (
                  <div key={mt} className={`meal-slot${isCooked ? ' cooked' : ''}`}>
                    <div className="meal-slot-label">{mt}</div>
                    <div className="meal-slot-content">
                      {recipe ? (
                        <>
                          <button
                            className={`cook-btn${isCooked ? ' cooked' : ''}`}
                            onClick={() => toggleCooked(dk, mt, recipe.id)}
                            title={isCooked ? 'Cooked! Click to undo' : 'Mark as cooked'}
                          >
                            {isCooked ? '✓' : '○'}
                          </button>
                          <span
                            className={`planned-meal${isCooked ? ' cooked' : ''}`}
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                            title={recipe.name}
                          >
                            {recipe.name}
                          </span>
                          <button
                            className="remove-meal-btn"
                            onClick={() => setMeal(dk, mt, undefined)}
                            title="Remove"
                          >&#10005;</button>
                        </>
                      ) : (
                        <>
                          <span className="meal-slot-empty">-</span>
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
              <button className="modal-close" onClick={() => setPicker(null)}>&#10005;</button>
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
                    <div className="modal-recipe-meta">{r.id} - {r.time} - {r.difficulty}</div>
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
