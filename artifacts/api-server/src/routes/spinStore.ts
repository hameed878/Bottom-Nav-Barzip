export type SpinResult = "10" | "50" | "100" | "try-again";

export interface SpinRecord {
  id: string;
  userId: number;
  result: SpinResult;
  cost: number;
  won: number;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: Date;
}

const store = new Map<number, SpinRecord[]>();

export function addSpinRecord(record: SpinRecord): void {
  const existing = store.get(record.userId) ?? [];
  store.set(record.userId, [record, ...existing].slice(0, 100));
}

export function getSpinHistory(userId: number): SpinRecord[] {
  return store.get(userId) ?? [];
}
