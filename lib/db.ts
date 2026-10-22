import fs from "fs";
import path from "path";

// Simple file store for the demo: one test user, no login.
// (On Vercel the disk is temporary, so for a real launch this becomes Postgres.)
const FILE = process.env.VERCEL
  ? "/tmp/spotter-db.json"
  : path.join(process.cwd(), "data", "db.json");

export type Log = { exerciseId: string; kg: number; hit: boolean; at: number };

export type Comeback = {
  ids: string[];
  message: string;
  email: string;
  fallback: boolean;
  cursor: number;
};

export type User = {
  answers: Record<string, string>;
  summary: string;
  welcome: string;
  fallback: boolean;
  days: string[][];
  weights: Record<string, number>;
  cursor: number;
  createdAt: number;
  logs: Log[];
  comeback: Comeback | null;
};

export function readUser(): User | null {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")).user ?? null;
  } catch {
    return null;
  }
}

export function writeUser(user: User | null) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ user }, null, 2));
}
