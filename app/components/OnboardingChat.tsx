"use client";
import { useState } from "react";
import { validateAnswer, type AnswerKey } from "@/lib/safety";

const QUESTIONS: { key: AnswerKey; text: string; hint: string }[] = [
  { key: "goal", text: "Hi, I'm Spotter, your gym buddy. What's your main goal?", hint: "e.g. get stronger, lose some fat, feel fit" },
  { key: "days", text: "How many days a week can you come to the gym?", hint: "a number from 1 to 7" },
  { key: "age", text: "How old are you?", hint: "a number, like 24" },
  { key: "gym", text: "Which gym do you go to?", hint: "e.g. Anytime Fitness" },
  { key: "nervous", text: "What makes you nervous about the gym? Say it however you like.", hint: "e.g. I'm scared and don't know the machines" },
];

export default function OnboardingChat({
  onSubmit, loading, serverError,
}: {
  onSubmit: (answers: Record<string, string>, forceStandard?: boolean) => void;
  loading: boolean;
  serverError: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState("");
  const [badTries, setBadTries] = useState(0);
  const step = Object.keys(answers).length;
  const done = step >= QUESTIONS.length;

  function next() {
    const q = QUESTIONS[step];
    const err = validateAnswer(q.key, value);
    if (err) {
      setProblem(err);
      setBadTries((n) => n + 1);
      return;
    }
    const updated = { ...answers, [q.key]: value.trim() };
    setAnswers(updated);
    setValue("");
    setProblem("");
    setBadTries(0);
    if (Object.keys(updated).length >= QUESTIONS.length) onSubmit(updated);
  }

  return (
    <div className="card">
      {QUESTIONS.slice(0, Math.min(step + 1, QUESTIONS.length)).map((q, i) => (
        <div key={q.key}>
          <div className="bubble">{q.text}</div>
          {answers[q.key] && <div className="bubble me">{answers[q.key]}</div>}
          {i === step && !done && problem && <div className="warn">{problem}</div>}
        </div>
      ))}
      {done && <p className="small">{loading ? "Building your plan… this takes a few seconds." : ""}</p>}
      {serverError && <div className="error">{serverError}</div>}
      {!done && (
        <>
          <input
            autoFocus
            value={value}
            placeholder={QUESTIONS[step].hint}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
          />
          <div className="row">
            <button onClick={next}>Send</button>
          </div>
          {badTries >= 2 && step >= 0 && Object.keys(answers).length === QUESTIONS.length - 1 && (
            <p className="small">Stuck? <button className="link" onClick={() => onSubmit({ ...answers, nervous: "not sure yet" }, true)}>Use a standard beginner plan</button></p>
          )}
        </>
      )}
      {done && serverError && (
        <div className="row">
          <button onClick={() => onSubmit(answers)} disabled={loading}>Try again</button>
          <button className="secondary" onClick={() => onSubmit(answers, true)} disabled={loading}>Use a standard plan</button>
        </div>
      )}
    </div>
  );
}
