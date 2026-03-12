import { snacks } from '../data/snacks';

export default function SnacksPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Free Snacks</h1>
        <p>These are always available — no measuring, no limits. Eat when you're hungry.</p>
      </div>
      <div className="snack-grid">
        {snacks.map((snack, i) => (
          <div key={i} className="snack-card">
            <h4>{snack.name}</h4>
            <p>{snack.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
