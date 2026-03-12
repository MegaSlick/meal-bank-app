import { useState, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function AccessGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useLocalStorage('access-v1', false);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  if (granted) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim().toLowerCase() === 'tyrel') {
      setGranted(true);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 2000);
    }
  }

  return (
    <div className="access-gate">
      <div className="access-card">
        <h1>The Meal Bank</h1>
        <p>Before we get started...</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="access-q">Who made this?</label>
          <input
            id="access-q"
            type="text"
            autoFocus
            autoComplete="off"
            value={answer}
            onChange={e => { setAnswer(e.target.value); setWrong(false); }}
            placeholder="First name"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Let me in
          </button>
        </form>
        {wrong && <p className="access-wrong">Hmm, that's not right</p>}
      </div>
    </div>
  );
}
