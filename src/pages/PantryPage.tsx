import { useLocalStorage } from '../hooks/useLocalStorage';
import { pantryCategories } from '../data/pantry';

type PantryState = Record<string, boolean>;

function buildDefaultState(): PantryState {
  const state: PantryState = {};
  Object.values(pantryCategories).flat().forEach(item => {
    state[item] = false;
  });
  return state;
}

export default function PantryPage() {
  const [pantry, setPantry] = useLocalStorage<PantryState>('pantry-v1', buildDefaultState());

  function toggle(item: string) {
    setPantry(prev => ({ ...prev, [item]: !prev[item] }));
  }

  function resetAll() {
    if (window.confirm('Reset all pantry items to not-stocked?')) {
      setPantry(buildDefaultState());
    }
  }

  function checkAll() {
    const next: PantryState = {};
    Object.values(pantryCategories).flat().forEach(item => { next[item] = true; });
    setPantry(next);
  }

  const total = Object.values(pantryCategories).flat().length;
  const inStock = Object.values(pantry).filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pantry Inventory</h1>
        <p>Track what you have stocked. Check items off as you stock up.</p>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{inStock}</span>
          <span className="stat-label">In Stock</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{total - inStock}</span>
          <span className="stat-label">Need</span>
        </div>
        <div className="stat-item" style={{ flex: 1, alignItems: 'flex-start' }}>
          <div className="progress-bar-wrap" style={{ width: '100%' }}>
            <div className="progress-bar-fill" style={{ width: `${Math.round((inStock / total) * 100)}%` }} />
          </div>
          <span className="stat-label">{Math.round((inStock / total) * 100)}% stocked</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={checkAll}>Check all</button>
          <button className="btn btn-danger btn-sm" onClick={resetAll}>Reset</button>
        </div>
      </div>

      <div className="pantry-grid">
        {Object.entries(pantryCategories).map(([cat, catItems]) => {
          const catInStock = catItems.filter(item => pantry[item]).length;
          return (
            <div key={cat} className="pantry-category-card">
              <div className="pantry-category-header">
                <span className="pantry-category-title">{cat}</span>
                <span className="pantry-category-count">{catInStock}/{catItems.length}</span>
              </div>
              {catItems.map(item => (
                <div
                  key={item}
                  className={`pantry-item${pantry[item] ? ' in-stock' : ''}`}
                  onClick={() => toggle(item)}
                >
                  <div className={`pantry-item-check${pantry[item] ? ' in-stock' : ''}`}>
                    {pantry[item] ? '✓' : ''}
                  </div>
                  <span className="pantry-item-name">{item}</span>
                </div>
              ))}
              <div className="progress-bar-wrap" style={{ marginTop: 12 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${catItems.length > 0 ? (catInStock / catItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
