import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function getToken(): Promise<string> {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return getIdToken(auth.currentUser);
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export type LogCreatePayload = {
  date: string;
  is_holiday: boolean;
  mood_morning: number;
  mood_after_work: number | null;
  fatigue: number;
  comment: string | null;
  work_content: string | null;
  work_start: string | null;
  work_end: string | null;
  gym: boolean;
};

export type LogUpdatePayload = Partial<Omit<LogCreatePayload, "date" | "is_holiday">>;

export type LogRecord = LogCreatePayload & {
  id: string;
  user_id: string;
  overtime_minutes: number | null;
  overtime_score: number | null;
  created_at: string;
  updated_at: string;
};

export async function createLog(payload: LogCreatePayload): Promise<LogRecord> {
  const res = await fetchWithAuth("/logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create log: ${res.status}`);
  return res.json();
}

export async function updateLog(id: string, payload: LogUpdatePayload): Promise<LogRecord> {
  const res = await fetchWithAuth(`/logs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update log: ${res.status}`);
  return res.json();
}

export async function listLogs(): Promise<LogRecord[]> {
  const res = await fetchWithAuth("/logs");
  if (!res.ok) throw new Error(`Failed to list logs: ${res.status}`);
  return res.json();
}
