import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { API } from "../../apiConfig";
import { FloatingTextInput } from "../../components/Trans_Indicat/FloatingTextField";

type Named = { id: number; name: string };

/** Попытка достать обычное имя из строки, куда могли положить JSON вида {"name":"..."} */
function extractName(raw: unknown): string {
  if (typeof raw === "string") {
    // Уже нормальная строка
    if (!(raw.startsWith("{") && raw.endsWith("}"))) return raw;
    // Попробуем распарсить JSON-строку
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === "string") return parsed.name;
    } catch { /* ignore */ }
    return raw;
  }
  if (raw == null) return "";
  return String(raw);
}

/** Унификация ответа API: поддержим string[] и [{id,name}] и "кривые" строки */
function normalize(payload: unknown): Named[] {
  if (!Array.isArray(payload)) return [];
  if (payload.length === 0) return [];

  // Вариант string[]
  if (typeof payload[0] === "string") {
    return (payload as string[]).map((n, i) => ({ id: i + 1, name: extractName(n) }));
  }

  // Вариант [{id,name}]
  return (payload as any[]).map((it, i) => ({
    id: Number(it?.id ?? i + 1),
    name: extractName(it?.name),
  }));
}

/** Надёжная отправка: сперва {name}, при ошибке — "raw string" */
async function postNameWithFallback(endpoint: string, value: string) {
  // 1) Пробуем корректный контракт
  try {
    return await axios.post(endpoint, { name: value.trim() });
  } catch (e) {
    // 2) Если бэк сериализует весь body -> попробуем передать сырую строку
    return await axios.post(endpoint, JSON.stringify(value.trim()), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default function Units_Reasons() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <UnitsBlock />
      <ReasonsBlock />
    </div>
  );
}

function UnitsBlock() {
  const [items, setItems] = useState<Named[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    const res = await axios.get(API.INDICATOR_UNITS);
    setItems(normalize(res.data).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => { load().catch(console.error); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      await postNameWithFallback(API.INDICATOR_UNITS, value);
      setValue("");
      await load();
      alert("Unit создан");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number, name: string) => {
    if (!Number.isFinite(id)) {
      alert("Невозможно удалить: сервер не вернул id.");
      return;
    }
    if (!window.confirm(`Удалить unit «${name}»?`)) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API.INDICATOR_UNITS}/${id}`);
      setItems((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <form className="form-card" onSubmit={create}>
      <h2>Units</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <FloatingTextInput
            id="unit-input"
            label="Новый unit"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "..." : "Создать"}
          </button>
        </div>
      </div>

      <div className="tag-container" style={{ marginTop: 12 }}>
        {items.map((u) => (
          <span key={u.id} className="tag">
            {u.name}
            <button
              type="button"
              aria-label={`Удалить ${u.name}`}
              title="Удалить"
              onClick={() => remove(u.id, u.name)}
              disabled={deletingId === u.id}
            >
              {deletingId === u.id ? "…" : "×"}
            </button>
          </span>
        ))}
      </div>
    </form>
  );
}

function ReasonsBlock() {
  const [items, setItems] = useState<Named[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    const res = await axios.get(API.REASONS);
    setItems(normalize(res.data).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => { load().catch(console.error); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      await postNameWithFallback(API.REASONS, value);
      setValue("");
      await load();
      alert("Reason создан");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number, name: string) => {
    if (!Number.isFinite(id)) {
      alert("Невозможно удалить: сервер не вернул id.");
      return;
    }
    if (!window.confirm(`Удалить причину «${name}»?`)) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API.REASONS}/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <form className="form-card" onSubmit={create}>
      <h2>Reasons</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <FloatingTextInput
            id="reason-input"
            label="Новая причина"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "..." : "Создать"}
          </button>
        </div>
      </div>

      <div className="tag-container" style={{ marginTop: 12 }}>
        {items.map((r) => (
          <span key={r.id} className="tag">
            {r.name}
            <button
              type="button"
              aria-label={`Удалить ${r.name}`}
              title="Удалить"
              onClick={() => remove(r.id, r.name)}
              disabled={deletingId === r.id}
            >
              {deletingId === r.id ? "…" : "×"}
            </button>
          </span>
        ))}
      </div>
    </form>
  );
}
