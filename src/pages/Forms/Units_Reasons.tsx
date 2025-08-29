import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { API } from "../../apiConfig";
import { FloatingTextInput } from "../../components/Trans_Indicat/FloatingTextField";

type Named = { id: number; name: string };

/** Достаём нормальное имя из строки, куда могли положить JSON {"name":"..."} */
function extractName(raw: unknown): string {
  if (typeof raw === "string") {
    if (!(raw.startsWith("{") && raw.endsWith("}"))) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === "string") return parsed.name;
    } catch {}
    return raw;
  }
  if (raw == null) return "";
  return String(raw);
}

/** Поддержим string[] и [{id,name}] и "кривые" строки */
function normalize(payload: unknown): Named[] {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  if (typeof payload[0] === "string") {
    return (payload as string[]).map((n, i) => ({ id: i + 1, name: extractName(n) }));
  }
  return (payload as any[]).map((it, i) => ({
    id: Number(it?.id ?? i + 1),
    name: extractName(it?.name),
  }));
}

/** Всегда отправляем PLAIN TEXT, чтобы в БД не попадало {"name":"..."} */
function postPlain(endpoint: string, value: string) {
  return axios.post(endpoint, value.trim(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    // на всякий: запрещаем axios превращать строку в JSON
    transformRequest: [(data) => data],
  });
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
      await postPlain(API.INDICATOR_UNITS, value);
      setValue("");
      await load();
      alert("Unit создан");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка");
    } finally { setLoading(false); }
  };

  const remove = async (id: number, name: string) => {
    if (!Number.isFinite(id)) return alert("Невозможно удалить: сервер не вернул id.");
    if (!window.confirm(`Удалить unit «${name}»?`)) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API.INDICATOR_UNITS}/${id}`);
      setItems((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка удаления");
    } finally { setDeletingId(null); }
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
          <button type="submit" disabled={loading}>{loading ? "..." : "Создать"}</button>
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
      await postPlain(API.REASONS, value);
      setValue("");
      await load();
      alert("Reason создан");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка");
    } finally { setLoading(false); }
  };

  const remove = async (id: number, name: string) => {
    if (!Number.isFinite(id)) return alert("Невозможно удалить: сервер не вернул id.");
    if (!window.confirm(`Удалить причину «${name}»?`)) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API.REASONS}/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Ошибка удаления");
    } finally { setDeletingId(null); }
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
          <button type="submit" disabled={loading}>{loading ? "..." : "Создать"}</button>
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
