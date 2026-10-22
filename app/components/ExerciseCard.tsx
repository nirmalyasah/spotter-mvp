"use client";

export type Card = {
  id: string; name: string; machine: string; setup: string[]; kg: number;
  sets: number; reps: number; restSec: number; position: number; total: number;
};

export default function ExerciseCard({
  card, loading, onLog,
}: { card: Card; loading: boolean; onLog: (hit: boolean) => void }) {
  return (
    <div className="card">
      <span className="tag">Exercise {card.position} of {card.total}</span>
      <div className="big">{card.name}</div>
      <div><strong>Machine:</strong> {card.machine}</div>
      <div className="big">{card.kg} kg · {card.sets} × {card.reps}</div>
      <div className="small">Rest about {card.restSec} seconds between sets.</div>
      <p style={{ marginBottom: 0 }}><strong>How to set it up</strong></p>
      <ol>{card.setup.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <p className="small">⚠️ Setup not yet verified by gym staff. If something feels wrong or painful, stop and ask someone at the gym.</p>
      <div className="row">
        <button onClick={() => onLog(true)} disabled={loading}>Done ✓ (all reps)</button>
        <button className="secondary" onClick={() => onLog(false)} disabled={loading}>Couldn't finish</button>
      </div>
    </div>
  );
}
