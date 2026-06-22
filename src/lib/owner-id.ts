const OWNER_ID_KEY = "tp_owner_id";

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function getOwnerId(): string {
  try {
    const existing = localStorage.getItem(OWNER_ID_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(OWNER_ID_KEY, id);
    return id;
  } catch {
    return generateId();
  }
}
