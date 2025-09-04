const RAW = import.meta.env.VITE_API_BASE_URL || "";
const BASE_URL = RAW.replace(/\/+$/, "");

export const API = {
  BASE_URL,

  // справочники/формы
  INDICATORS: `${BASE_URL}/indicators`,
  INDICATOR_UNITS: `${BASE_URL}/indicators/units`,
  TRANSCRIPTS: `${BASE_URL}/transcripts`,
  REASONS: `${BASE_URL}/reasons`,
  GROUPS: `${BASE_URL}/groups`, // <-- добавлено

  // люди
  PEOPLE: `${BASE_URL}/people`,
  PERSON: (id: number | string) => `${BASE_URL}/people/${id}`,

  // сводная таблица анализов + POST измерения
  PERSON_MEASURES: (id: number | string) => `${BASE_URL}/people/${id}/measures`,
};
