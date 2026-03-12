import { useState, useEffect, useCallback, useRef } from 'react';
import type { Recipe } from '../types';

interface CookModeProps {
  recipe: Recipe;
  onExit: () => void;
  onDone: () => void;
}

function parseTimerSeconds(text: string): number | null {
  // Match patterns like "5 min", "20 minutes", "15-18 min", "1 hour", "90 seconds"
  const minMatch = text.match(/(\d+)(?:\s*-\s*\d+)?\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const hourMatch = text.match(/(\d+)\s*hour/i);
  if (hourMatch) return parseInt(hourMatch[1]) * 3600;
  const secMatch = text.match(/(\d+)\s*sec/i);
  if (secMatch) return parseInt(secMatch[1]);
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TimerState {
  total: number;
  remaining: number;
  running: boolean;
  stepIndex: number;
}

export default function CookMode({ recipe, onExit, onDone }: CookModeProps) {
  const [step, setStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [timers, setTimers] = useState<TimerState[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const total = recipe.steps.length;

  // Wake lock
  useEffect(() => {
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch { /* ignore */ }
    }
    acquire();
    return () => {
      wakeLockRef.current?.release();
    };
  }, []);

  // Timer tick
  useEffect(() => {
    const id = setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (!t.running || t.remaining <= 0) return t;
        const next = t.remaining - 1;
        if (next <= 0) {
          // Play a sound cue by using the Audio API
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } catch { /* no audio */ }
        }
        return { ...t, remaining: next, running: next > 0 };
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function startTimer(stepIdx: number, seconds: number) {
    // Don't duplicate
    if (timers.some(t => t.stepIndex === stepIdx)) return;
    setTimers(prev => [...prev, { total: seconds, remaining: seconds, running: true, stepIndex: stepIdx }]);
  }

  const goNext = useCallback(() => {
    if (step < total - 1) setStep(s => s + 1);
  }, [step, total]);

  const goPrev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  // Touch swipe support
  const touchStartX = useRef(0);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onExit]);

  const currentStep = recipe.steps[step];
  const timerSeconds = parseTimerSeconds(currentStep);
  const activeTimers = timers.filter(t => t.remaining > 0);
  const isLast = step === total - 1;

  return (
    <div className="cook-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Top bar */}
      <div className="cook-top-bar">
        <button className="cook-exit-btn" onClick={onExit}>&#10005; Exit</button>
        <span className="cook-step-counter">Step {step + 1} of {total}</span>
        <button
          className={`cook-ing-toggle ${showIngredients ? 'active' : ''}`}
          onClick={() => setShowIngredients(v => !v)}
        >
          Ingredients
        </button>
      </div>

      {/* Progress */}
      <div className="cook-progress">
        <div className="cook-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      {/* Active timers strip */}
      {activeTimers.length > 0 && (
        <div className="cook-timers-strip">
          {activeTimers.map(t => (
            <div key={t.stepIndex} className={`cook-timer-pill${t.remaining <= 10 ? ' urgent' : ''}`}>
              Step {t.stepIndex + 1}: {formatTime(t.remaining)}
            </div>
          ))}
        </div>
      )}

      {/* Ingredients panel */}
      {showIngredients && (
        <div className="cook-ingredients-panel">
          <h4>Ingredients</h4>
          <ul>
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </div>
      )}

      {/* Main step */}
      <div className="cook-main">
        <p className="cook-step-text">{currentStep}</p>

        {timerSeconds && !timers.some(t => t.stepIndex === step) && (
          <button
            className="btn btn-primary cook-timer-btn"
            onClick={() => startTimer(step, timerSeconds)}
          >
            Start {formatTime(timerSeconds)} timer
          </button>
        )}
        {timers.some(t => t.stepIndex === step && t.remaining > 0) && (
          <div className="cook-active-timer">
            {formatTime(timers.find(t => t.stepIndex === step)!.remaining)}
          </div>
        )}
        {timers.some(t => t.stepIndex === step && t.remaining <= 0) && (
          <div className="cook-timer-done">Timer done!</div>
        )}
      </div>

      {/* Navigation */}
      <div className="cook-nav">
        <button
          className="cook-nav-btn"
          onClick={goPrev}
          disabled={step === 0}
        >
          &#8249; Prev
        </button>

        {isLast ? (
          <button className="btn btn-primary cook-done-btn" onClick={onDone}>
            Done — Mark as Cooked
          </button>
        ) : (
          <button className="cook-nav-btn" onClick={goNext}>
            Next &#8250;
          </button>
        )}
      </div>
    </div>
  );
}
