const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const API = {
  BASE_URL,
  INDICATORS: `${BASE_URL}/indicators`,
  INDICATOR_UNITS: `${BASE_URL}/indicators/units`,
  TRANSCRIPTS: `${BASE_URL}/transcripts`,
  REASONS: `${BASE_URL}/reasons`,
  PEOPLE: `${BASE_URL}/people`,
};
