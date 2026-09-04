import type { Receipt } from '@/types';

const STORAGE_KEY = 'snapnsort_records';

export function loadRecords(): Receipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: Receipt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage may be full (large image data) — fail silently
  }
}

export function addRecord(record: Receipt): Receipt[] {
  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  return records;
}

export function deleteRecord(id: string): Receipt[] {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
  return records;
}

export function getRecord(id: string): Receipt | undefined {
  return loadRecords().find((r) => r.id === id);
}
