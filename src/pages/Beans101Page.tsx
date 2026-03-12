export default function Beans101Page() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Beans 101</h1>
        <p>Everything you need to know about using beans and lentils.</p>
      </div>

      <div className="beans-section">
        <h2>Canned vs. Dried</h2>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>
          Canned beans are perfectly fine. They're pre-cooked, ready to use, and there's no meaningful nutritional difference from dried.
          Always drain and rinse them to reduce sodium. All recipes in this app use canned for convenience.
        </p>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)', marginTop: 12 }}>
          Dried <strong>lentils</strong> are the exception — they cook in 20–30 minutes with no soaking required, making them
          nearly as convenient as canned and often cheaper.
        </p>
      </div>

      <div className="beans-section">
        <h2>Bean Types & Best Uses</h2>
        <div className="bean-type-grid">
          {[
            { name: 'Black Beans', desc: 'Hold shape well, earthy flavor. Perfect for tacos, burritos, chili, quesadillas.' },
            { name: 'White Beans (Cannellini)', desc: 'Creamy and mild. Perfect for soups, stews, spreads, and mixing with tuna.' },
            { name: 'Chickpeas (Garbanzo)', desc: 'Versatile and nutty. Great for salads, curries, roasted snacks, and hummus.' },
            { name: 'Kidney Beans', desc: 'Firm and hearty. The classic choice for chili and minestrone.' },
            { name: 'Red Lentils', desc: 'Dissolve when cooked — they disappear into sauces and soups. The "stealth fiber weapon."' },
            { name: 'Green/Brown Lentils', desc: 'Hold their shape. Great in soups, stews, salads, and grain bowls.' },
          ].map(b => (
            <div key={b.name} className="bean-type-card">
              <h4>{b.name}</h4>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="beans-section">
        <h2>About Gas</h2>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>
          Gas from beans is normal and <strong>temporary</strong>. Your gut bacteria adjust within 2–3 weeks of eating beans regularly.
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: '0.92rem', lineHeight: 2, color: 'var(--text)' }}>
          <li>Start with smaller portions and increase gradually</li>
          <li>Rinse canned beans very thoroughly</li>
          <li>Red lentils tend to cause the least issues</li>
          <li>Consistency helps — your body adapts faster if you eat beans regularly</li>
        </ul>
      </div>

      <div className="beans-section">
        <h2>Why Fiber Matters</h2>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>
          Soluble fiber (found in oats, beans, and lentils) dissolves in water to form a gel that slows digestion,
          stabilizes blood sugar, and feeds your gut bacteria. This is why high-fiber meals keep you full longer —
          especially important on long shifts.
        </p>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)', marginTop: 12 }}>
          Most people get 10–15g of fiber per day. The goal is 25–38g. This meal plan makes that easy without
          thinking about it.
        </p>
      </div>
    </div>
  );
}
