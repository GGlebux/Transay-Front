import { useState, useEffect, useMemo } from "react";
import type { FormEvent } from "react";

import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "../apiConfig";
import { FloatingTextInput, FloatingSelect } from "../components/Trans_Indicat/FloatingTextField";
import "../styles/person.css";

/* ---------- Типы под ответ /people/:id/measures ---------- */
type Reason = { id: number; name: string };
type Measure = {
  id: number;
  minValue: number | null;
  currentValue: number | string;
  maxValue: number | null;
  regDate: string; // YYYY-MM-DD
  units: string;
  status: "ok" | "raise" | "fall";
  reasons: Reason[];
};
type Meta = { indicatorName: string; measures: Measure[] };
type GroupBlock = { groupName: string; dates: string[]; metas: Meta[] };

/* ---------- Типы под /groups (справочник для формы) ---------- */
type GroupResp = {
  id: number;
  groupName: string;
  indicators: { name: string; units: string[] }[];
};

type IndicatorOption = {
  key: string;           // уникальный ключ "groupName||name"
  label: string;         // "<Группа> · <Индикатор>"
  name: string;          // само имя индикатора (для POST: "name")
  units: string[];       // список единиц (для селекта)
};

type PersonInfo = { id: number; name: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------- Безопасный разворот обёрток ---------- */
const unwrap = (x: any) =>
  x && typeof x === "object" && !Array.isArray(x)
    ? x.data ?? x.items ?? x.results ?? x.list ?? x.content ?? x
    : x;

export default function Person() {
  const { id } = useParams<{ id: string }>();
  const personId = id!;

  const [person, setPerson] = useState<PersonInfo | null>(null);
  const [blocks, setBlocks] = useState<GroupBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Пагинация по группам (одна таблица)
  const [groupIndex, setGroupIndex] = useState(0);

  // Пагинация по столбцам
  const [currentPage, setCurrentPage] = useState(0);
  const [columnsPerPage] = useState(8);

  // Верхняя форма (добавление нового измерения)
  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);
  const [indicatorKey, setIndicatorKey] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  // ---- Drag & Drop для редактирования/удаления ----
  const [showDropZones, setShowDropZones] = useState(false);
  const [dropTarget, setDropTarget] = useState<null | "edit" | "delete">(null);
  const [dragging, setDragging] = useState<null | {
    measureId: number;
    name: string;
    units: string;
    currentValue: string | number;
    regDate: string;
  }>(null);

  // ------ Инфо-панель (оверлей сверху) ------
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoData, setInfoData] = useState<{
    indicatorName: string;
    value: string | number;
    units?: string;
    min: number | null;
    max: number | null;
    reasons: Reason[];
    date: string;
  } | null>(null);

  const openInfo = (
    cell: { v: string | number; units?: string; min: number | null; max: number | null; reasons: Reason[] },
    indicatorName: string,
    dateISO: string
  ) => {
    setInfoData({
      indicatorName,
      value: cell.v,
      units: cell.units,
      min: cell.min,
      max: cell.max,
      reasons: cell.reasons ?? [],
      date: dateISO,
    });
    setInfoOpen(true);
  };

  const closeInfo = () => {
    setInfoOpen(false);
    setInfoData(null);
  };

  // закрытие по Esc
  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeInfo();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoOpen]);


  // Модалка редактирования
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMeasureId, setEditingMeasureId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editDate, setEditDate] = useState<string>(todayISO());
  const [editUnits, setEditUnits] = useState<string>("");
  const [editName, setEditName] = useState<string>("");

  // Загрузка ФИО, таблицы и СПРАВОЧНИКА ИНДИКАТОРОВ (из /groups)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, measures, groupsRes] = await Promise.all([
          axios.get(API.PERSON(personId)),
          axios.get(API.PERSON_MEASURES(personId)),
          axios.get(API.GROUPS),
        ]);
        if (!alive) return;

        // ---- ФИО ----
        const pU = unwrap(p.data);
        if (pU && typeof pU === "object") {
          setPerson({
            id: Number(pU.id ?? personId),
            name: String(pU.name ?? `Person #${personId}`),
          });
        } else {
          setPerson({ id: Number(personId), name: `Person #${personId}` });
        }

        // ---- Blocks из /people/:id/measures ----
        const raw = unwrap(measures.data);
        const arr: GroupBlock[] = Array.isArray(raw) ? raw : [];
        setBlocks(arr);

        // ---- Индикаторы из /groups ----
        const gRaw = unwrap(groupsRes.data) as GroupResp[];
        const opts: IndicatorOption[] = Array.isArray(gRaw)
          ? gRaw.flatMap((g: GroupResp) =>
            (g?.indicators ?? []).map((it) => ({
              key: `${g.groupName}||${it.name}`,
              label: `${g.groupName} · ${it.name}`,
              name: it.name,
              units: Array.isArray(it.units) ? it.units.filter(Boolean) : [],
            }))
          )
          : [];
        opts.sort((a, b) => a.label.localeCompare(b.label, "ru"));
        setIndicatorOptions(opts);

        // Автоподбор первого индикатора и его первой единицы
        if (!indicatorKey && opts.length) {
          setIndicatorKey(opts[0].key);
          setUnit(opts[0].units[0] ?? "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [personId]);

  // Следим, чтобы индекс группы был валиден при обновлении blocks
  useEffect(() => {
    setGroupIndex((i) => Math.min(Math.max(0, i), blocks.length - 1));
  }, [blocks.length]);

  // Текущая группа и её даты
  const current = blocks[groupIndex] || { groupName: "", dates: [], metas: [] };
  const groupDates = useMemo(() => [...(current.dates ?? [])].sort(), [current.dates]);

  // Карта значений только для текущей группы (ключ: indicatorName|date)
  // Храним id, значение, статус, units и name (для PATCH/DELETE)
  const valueMap = useMemo(() => {
    const m = new Map<string, { id?: number; v: string | number; status: Measure["status"]; units?: string; name: string; min: number | null; max: number | null; reasons: Reason[]; }>();
    for (const meta of current.metas ?? []) {
      for (const meas of meta.measures ?? []) {
        m.set(`${meta.indicatorName}||${meas.regDate}`, {
          id: meas.id,
          v: meas.currentValue,
          status: meas.status,
          units: meas.units,
          name: meta.indicatorName,
          min: meas.minValue ?? null,
          max: meas.maxValue ?? null,
          reasons: Array.isArray(meas.reasons) ? meas.reasons : [],
        });
      }
    }
    return m;
  }, [current]);

  // При смене индикатора в форме — обновить доступные units
  const selectedIndicator = useMemo(
    () => indicatorOptions.find((o) => o.key === indicatorKey),
    [indicatorOptions, indicatorKey]
  );
  useEffect(() => {
    if (selectedIndicator) {
      if (!selectedIndicator.units.includes(unit)) {
        setUnit(selectedIndicator.units[0] ?? "");
      }
    } else {
      setUnit("");
    }
  }, [selectedIndicator]); // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранить новое измерение (верхняя форма)
  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator) return alert("Выберите индикатор");
    if (!unit) return alert("Выберите единицы измерения");
    if (!value || !date) return alert("Заполните значение и дату");

    setSaving(true);
    try {
      const payload = {
        name: selectedIndicator.name,
        units: unit,
        currentValue: Number(value),
        regDate: date, // YYYY-MM-DD
      };

      await axios.post(API.PERSON_MEASURES(personId), payload);

      // Перезагружаем блоки
      const ms = await axios.get(API.PERSON_MEASURES(personId));
      const arr: GroupBlock[] = Array.isArray(unwrap(ms.data)) ? unwrap(ms.data) : [];
      setBlocks(arr);
      setValue("");
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения измерения");
    } finally {
      setSaving(false);
    }
  };

  // Пагинация по столбцам
  const columnsForPage = useMemo(() => {
    return groupDates.slice(currentPage * columnsPerPage, (currentPage + 1) * columnsPerPage);
  }, [groupDates, currentPage]);
  const totalPages = Math.ceil(groupDates.length / columnsPerPage);
  const goToPreviousPage = () => currentPage > 0 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1);

  // ---------- Drag & Drop handlers ----------
  const handleCellDragStart = (cell: { id?: number; name: string; units?: string; v: string | number }, regDate: string) => {
    if (!cell?.id) return; // пустая ячейка — не тащим
    setDragging({
      measureId: cell.id,
      name: cell.name,
      units: cell.units || "",
      currentValue: cell.v,
      regDate,
    });
    setShowDropZones(true);
  };

  const handleCellDragEnd = () => {
    setShowDropZones(false);
    setDropTarget(null);
    setDragging(null);
  };

  const handleZoneDragOver = (e: React.DragEvent, target: "edit" | "delete") => {
    e.preventDefault();
    setDropTarget(target);
  };

  const handleZoneDrop = async (target: "edit" | "delete") => {
    if (!dragging) return;
    setShowDropZones(false);

    if (target === "delete") {
      if (!window.confirm("Удалить это измерение?")) {
        setDragging(null);
        setDropTarget(null);
        return;
      }
      try {
        await axios.delete(`${API.PERSON_MEASURES(personId)}/${dragging.measureId}`);
        // обновить таблицу
        const ms = await axios.get(API.PERSON_MEASURES(personId));
        const arr: GroupBlock[] = Array.isArray(unwrap(ms.data)) ? unwrap(ms.data) : [];
        setBlocks(arr);
      } catch (err) {
        console.error(err);
        alert("Ошибка при удалении измерения");
      } finally {
        setDragging(null);
        setDropTarget(null);
      }
      return;
    }

    // target === 'edit' — откроем модалку с предзаполнением
    setEditingMeasureId(dragging.measureId);
    setEditValue(String(dragging.currentValue ?? ""));
    setEditDate(dragging.regDate);
    setEditUnits(dragging.units || "");
    setEditName(dragging.name);
    setEditModalOpen(true);

    setDragging(null);
    setDropTarget(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingMeasureId == null) return;

    if (!editName || !editUnits) {
      alert("Укажите имя индикатора и единицы измерения");
      return;
    }

    try {
      const payload = {
        name: editName,           // <--- имя из модалки
        units: editUnits,         // <--- единицы из модалки
        currentValue: Number(editValue),
        regDate: editDate,
      };

      await axios.patch(`${API.PERSON_MEASURES(personId)}/${editingMeasureId}`, payload);

      setEditModalOpen(false);
      setEditingMeasureId(null);

      // перезагрузка таблицы
      const ms = await axios.get(API.PERSON_MEASURES(personId));
      const arr: GroupBlock[] = Array.isArray(unwrap(ms.data)) ? unwrap(ms.data) : [];
      setBlocks(arr);
    } catch (err) {
      console.error(err);
      alert("Ошибка при редактировании измерения");
    }
  };


  if (loading) return <p>Загрузка...</p>;

  // простые стили для зон сброса (можете перенести в person.css)
  // инфо-оверлей
  const infoOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 9998,
  };

  const infoCardStyle: React.CSSProperties = {
    position: "fixed",
    top: 40,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    width: 560,
    maxWidth: "90vw",
    background: "white",
    borderRadius: 14,
    boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
    padding: 16,
  };

  const infoTitleStyle: React.CSSProperties = {
    margin: 0,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 700,
  };

  const infoRowStyle: React.CSSProperties = { margin: "6px 0" };
  const infoReasonsListStyle: React.CSSProperties = { margin: "6px 0 0 18px" };
  const infoCloseBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    right: 10,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
  };

  const zoneBase: React.CSSProperties = {
    position: "fixed",
    top: "60%",
    transform: "translateY(-50%)",
    zIndex: 9999,
    padding: "14px 16px",
    border: "2px dashed #c8c8c8",
    borderRadius: 12,
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontWeight: 600,
    userSelect: "none",
    opacity: 0.95,
  };
  const zoneLeft: React.CSSProperties = { ...zoneBase, left: 250 };
  const zoneRight: React.CSSProperties = { ...zoneBase, right: 5 };
  const zoneActive: React.CSSProperties = { borderColor: "#007bff", boxShadow: "0 0 0 4px rgba(0,123,255,0.15)" };

  return (
    <div className="person-page">
      <div className="person-header">
        <Link to="/people" className="back-link">← Назад к списку</Link>
        <h1>{person?.name ?? `Person #${personId}`}</h1>
      </div>

      {/* Верхняя строка ввода (добавление) */}
      <form className="form-card person-input-row" onSubmit={onSave}>
        <FloatingSelect
          id="indicator"
          label="Выберите индикатор"
          value={indicatorKey}
          onChange={(e) => setIndicatorKey(e.target.value)}
          options={indicatorOptions.map((o) => ({ value: o.key, label: o.label }))}
        />
        <FloatingSelect
          id="units"
          label="Единицы"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={(selectedIndicator?.units ?? []).map((u) => ({ value: u, label: u }))}
        />
        <FloatingTextInput
          id="value"
          type="number"
          label="Значение"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <FloatingTextInput
          id="date"
          type="date"
          label="Дата анализа"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>

      {/* Панель навигации по группам */}
      <div className="form-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "nowrap" }}>
          <select
            value={groupIndex}
            onChange={(e) => setGroupIndex(Number(e.target.value))}
            style={{ padding: "0.5rem", borderRadius: 8 }}
          >
            {blocks.map((g, i) => (
              <option key={g.groupName || i} value={i}>
                {g.groupName || `Группа ${i + 1}`}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: "auto", opacity: 0.7 }}>
            Страница {blocks.length ? groupIndex + 1 : 0} / {blocks.length}
          </span>
        </div>
      </div>

      {/* Таблица текущей группы */}
      <div className="table-wrapper">
        <table className="person-grid">
          <thead>
            <tr>
              <th className="sticky-col">{current.groupName || "Индикатор"}</th>
              {columnsForPage.map((d) => (
                <th key={d}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.metas.map((meta) => (
              <tr key={meta.indicatorName}>
                <td className="sticky-col">{meta.indicatorName}</td>
                {columnsForPage.map((d) => {
                  const cell = valueMap.get(`${meta.indicatorName}||${d}`);
                  const cls =
                    cell?.status === "ok"
                      ? "cell-ok" // зелёный
                      : cell?.status === "raise" || cell?.status === "fall"
                        ? "cell-raise" // красный
                        : "";

                  // только непустые ячейки делаем draggable
                  const isDraggable = Boolean(cell?.id);

                  return (
                    <td
                      key={d}
                      className={cls}
                      draggable={isDraggable}
                      onDragStart={() => cell && handleCellDragStart(cell, d)}
                      onDragEnd={handleCellDragEnd}
                      onClick={() => cell && openInfo(
                        // @ts-ignore — мы ниже уже записываем min/max/units/reasons в valueMap
                        { v: cell.v, units: cell.units, min: cell.min, max: cell.max, reasons: cell.reasons },
                        meta.indicatorName,
                        d
                      )}
                      title={
                        isDraggable
                          ? `1) Перетащите в лева для редактирования ✎
2) В права для удаления 🗑
3) По клику покажет подробную информацию ! `
                          : "Клик — подробная информация"
                      }
                      style={isDraggable ? { cursor: "grab" } : undefined}
                    >
                      <span style={{ pointerEvents: "none" }}>
                        {cell?.v ?? ""}
                        {cell?.status === "raise" && " ↑"}
                        {cell?.status === "fall" && " ↓"}
                      </span>
                    </td>

                  );
                })}
              </tr>
            ))}
            {current.metas.length === 0 && (
              <tr>
                <td
                  colSpan={1 + columnsForPage.length}
                  style={{ textAlign: "center", color: "#777" }}
                >
                  Нет показателей в группе
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="pagination-container">
        <button
          className="pagination-button"
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
        >
          Назад
        </button>

        <span className="pagination-text">
          Страница {currentPage + 1} из {totalPages}
        </span>

        <button
          className="pagination-button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
        >
          Вперед
        </button>
      </div>

      {/* Инфо-панель (оверлей сверху) */}
      {infoOpen && infoData && (
        <>
          <div style={infoOverlayStyle} onClick={closeInfo} />
          <div style={infoCardStyle} role="dialog" aria-modal="true">
            <button aria-label="Закрыть" style={infoCloseBtnStyle} onClick={closeInfo}>×</button>
            <h3 style={infoTitleStyle}>Информация</h3>

            <div style={infoRowStyle}><b>Индикатор:</b> {infoData.indicatorName}</div>
            <div style={infoRowStyle}><b>Дата:</b> {infoData.date}</div>
            <div style={infoRowStyle}>
              <b>Значение:</b> {infoData.value} {infoData.units}
            </div>
            {infoData.min != null && (
              <div style={infoRowStyle}><b>Мин значение:</b> {infoData.min} {infoData.units}</div>
            )}
            {infoData.max != null && (
              <div style={infoRowStyle}><b>Макс значение:</b> {infoData.max} {infoData.units}</div>
            )}

            {infoData.reasons?.length ? (
              <div style={{ marginTop: 8 }}>
                <b>Причины:</b>
                <ul style={infoReasonsListStyle}>
                  {infoData.reasons.map((r) => (
                    <li key={r.id}>{r.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </>
      )}


      {/* Зоны сброса для DnD */}
      {showDropZones && (
        <>
          <div
            style={{ ...zoneLeft, ...(dropTarget === "edit" ? zoneActive : {}) }}
            onDragOver={(e) => handleZoneDragOver(e, "edit")}
            onDrop={() => handleZoneDrop("edit")}
          >
            ✎ Редактировать
          </div>
          <div
            style={{ ...zoneRight, ...(dropTarget === "delete" ? zoneActive : {}) }}
            onDragOver={(e) => handleZoneDragOver(e, "delete")}
            onDrop={() => handleZoneDrop("delete")}
          >
            🗑 Удалить
          </div>
        </>
      )}

      {/* Модалка редактирования */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleEditSubmit}>
              <h3 style={{ marginTop: 0 }}>Редактировать</h3>

              {/* Имя индикатора только для показа */}
              <div style={{ marginBottom: 8, fontWeight: 600, opacity: 0.8 }}>
                Индикатор: {editName}
              </div>

              <FloatingTextInput
                id="editValue"
                type="number"
                label="Значение"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />

              <FloatingTextInput
                id="editDate"
                type="date"
                label="Дата анализа"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />

              <FloatingTextInput
                id="editUnits"
                type="text"
                label="Единицы"
                value={editUnits}
                onChange={(e) => setEditUnits(e.target.value)}
              />

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => setEditModalOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

