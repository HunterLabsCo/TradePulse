const KEY = "tp_referral";
export function getReferral(): string | null { return localStorage.getItem(KEY); }
export function setReferral(ref: string): void { localStorage.setItem(KEY, ref.toLowerCase()); }
