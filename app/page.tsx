"use client";
import { useEffect, useState } from "react";
import OnboardingChat from "./components/OnboardingChat";
import ExerciseCard from "./components/ExerciseCard";

export default function Home() {
  const [view, setView] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState("");
  const [reason, setReason] = useState("");

  async function call(url: string, body?: any, method = "POST") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return null; }
      return data;
    } catch {
      setError("We couldn't reach the app. Check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    call("/api/state", undefined, "GET").then((d) => d && setView(d));
  }, []);

  async function makePlan(answers: Record<string, string>, forceStandard = false) {
    const d = await call("/api/plan", { answers, forceStandard });
    if (!d) return;
    if (d.status === "blocked") setBlocked(d.message);
    else setView(d);
  }

  async function log(hit: boolean) { const d = await call("/api/log", { hit }); if (d) setView(d); }
  async function pretend() { const d = await call("/api/comeback", { reason, pretend: true }); if (d) setView(d); }
  async function startOver() { await call("/api/reset"); setBlocked(""); setReason(""); setView({ status: "none" }); }

  if (!view) return <main><h1>Spotter</h1><p className="sub">Loading…</p></main>;

  return (
    <main>
      <h1>Spotter</h1>
      <p className="sub">Your AI gym buddy. It tells you exactly what to do next.</p>

      {blocked && (
        <div className="blocked">
          <strong>A person needs to check this first</strong>
          <p>{blocked}</p>
          <button className="secondary" onClick={() => setBlocked("")}>Go back</button>
        </div>
      )}

      {!blocked && view.status === "none" && (
        <OnboardingChat onSubmit={makePlan} loading={loading} serverError={error} />
      )}

      {!blocked && view.status === "active" && (
        <>
          {view.fallback && !view.comeback && (
            <div className="warn">This is a <strong>standard starter plan</strong>. The AI's answer wasn't available or didn't pass our checks, so it isn't personalised.</div>
          )}
          {!view.fallback && !view.comeback && (
            <div className="card">
              <div className="small">Here's what I understood <span className="tag">written by AI</span></div>
              <p style={{ margin: "6px 0" }}>{view.summary}</p>
              <p style={{ margin: "6px 0" }}>{view.welcome}</p>
              <button className="link" onClick={startOver}>Not quite right? Start over</button>
            </div>
          )}
          {view.comeback && (
            <div className="card">
              <div className="small">Welcome back <span className="tag">{view.comeback.fallback ? "standard message" : "written by AI"}</span></div>
              <p style={{ margin: "6px 0" }}>{view.comeback.message}</p>
              <div className="email">
                <strong>📧 Email preview (not sent yet)</strong>
                <div>{view.comeback.email}</div>
              </div>
            </div>
          )}

          {error && <div className="error">{error}</div>}
          {view.card ? (
            <ExerciseCard card={view.card} loading={loading} onLog={log} />
          ) : (
            <div className="card">
              <div className="big">Session complete 🎉</div>
              <p>Nice work. Your weights for next time are updated automatically.</p>
            </div>
          )}

          <div className="card">
            <div className="small"><strong>Demo controls</strong></div>
            <input
              value={reason} placeholder="Why did you miss days? (optional, e.g. exams)"
              onChange={(e) => setReason(e.target.value)} style={{ marginTop: 8 }}
            />
            <div className="row">
              <button className="secondary" onClick={pretend} disabled={loading}>Pretend 3 days passed</button>
              <button className="secondary" onClick={startOver} disabled={loading}>Start over</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
