import { useState, useEffect, useMemo, useRef } from "react";
import type { FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "../apiConfig";
import { FloatingTextInput, FloatingSelect } from "../components/Trans_Indicat/FloatingTextField";
import "../styles/person.css";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";




/* ---------- Типы ---------- */
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

type GroupResp = {
  id: number;
  groupName: string;
  indicators: { name: string; units: string[] }[];
};

type IndicatorOption = {
  key: string;       // "groupName||name"
  label: string;     // показываем ТОЛЬКО название индикатора (без имени группы)
  name: string;      // имя индикатора (для POST/PATCH)
  units: string[];   // единицы
  groupName: string; // для фильтрации по группе
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

  // все группы из справочника
  const [allGroups, setAllGroups] = useState<GroupResp[]>([]);
  // "виртуально" добавленные пользователем группы (без данных из /measures)
  const [extraGroups, setExtraGroups] = useState<string[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Пагинация по группам
  const [groupIndex, setGroupIndex] = useState(0);

  // Пагинация по столбцам
  const [currentPage, setCurrentPage] = useState(0);
  const [columnsPerPage] = useState(8);

  // Форма добавления измерения
  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);
  const [indicatorKey, setIndicatorKey] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  

useEffect(() => {
  if (id) {
    localStorage.setItem("lastPersonId", id);
  }
}, [id]);

const [decryptDate, setDecryptDate] = useState("");
const [decryptData, setDecryptData] = useState<any | null>(null);
const [loadingDecrypt, setLoadingDecrypt] = useState(false);

const handleDecrypt = async () => {
  if (!decryptDate) return;
  setLoadingDecrypt(true);
  try {
    const { data } = await axios.get(
      `${API.PEOPLE}/${personId}/measures/decrypt?date=${decryptDate}`
    );
    setDecryptData(data);
  } catch (e) {
    console.error(e);
    alert("Ошибка при загрузке расшифровки");
  } finally {
    setLoadingDecrypt(false);
  }
};

const COLORS = ["#0b74ff", "#ff7300", "#82ca9d", "#ff4560", "#775dd0"];

  // ------ Инфо-панель (оверлей сверху) ------
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoData, setInfoData] = useState<{
    id?: number;
    indicatorName: string;
    value: string | number;
    units?: string;
    min: number | null;
    max: number | null;
    reasons: Reason[];
    date: string;
  } | null>(null);

  const openInfo = (
    cell: { id?: number; v: string | number; units?: string; min: number | null; max: number | null; reasons: Reason[] },
    indicatorName: string,
    dateISO: string
  ) => {
    setInfoData({
      id: cell.id,
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
  const closeInfo = () => { setInfoOpen(false); setInfoData(null); };
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




  // Загрузка данных
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

        // ФИО
        const pU = unwrap(p.data);
        setPerson(
          pU && typeof pU === "object"
            ? { id: Number(pU.id ?? personId), name: String(pU.name ?? `Person #${personId}`) }
            : { id: Number(personId), name: `Person #${personId}` }
        );

        // Blocks из /people/:id/measures
        const raw = unwrap(measures.data);
        setBlocks(Array.isArray(raw) ? raw : []);

        // Справочник групп и индикаторов
        const gRaw = unwrap(groupsRes.data) as GroupResp[];
        const groupsArr: GroupResp[] = Array.isArray(gRaw) ? gRaw : [];
        setAllGroups(groupsArr);

        // Генерация опций: label — только имя индикатора (без группы)
        const opts: IndicatorOption[] = groupsArr.flatMap((g) =>
          (g?.indicators ?? []).map((it) => ({
            key: `${g.groupName}||${it.name}`,
            label: it.name, // <= убираем повтор названия группы
            name: it.name,
            units: Array.isArray(it.units) ? it.units.filter(Boolean) : [],
            groupName: g.groupName,
          }))
        );
        // Сортируем по имени индикатора (локаль RU подходит для кириллицы/латиницы)
        opts.sort((a, b) => a.label.localeCompare(b.label, "ru"));
        setIndicatorOptions(opts);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [personId]);

  // Группы, которых нет в видимых (blocks + extra)
  const existingGroupNames = useMemo(() => {
    const s = new Set<string>();
    for (const b of blocks) s.add(b.groupName);
    for (const g of extraGroups) s.add(g);
    return s;
  }, [blocks, extraGroups]);

  const missingGroups = useMemo(
    () => allGroups.filter(g => !existingGroupNames.has(g.groupName)),
    [allGroups, existingGroupNames]
  );

  // Массив отображаемых групп: blocks + виртуальные пустые
  const displayGroups: GroupBlock[] = useMemo(() => {
    const arr: GroupBlock[] = [...blocks];
    for (const gname of extraGroups) {
      if (!arr.find(a => a.groupName === gname)) {
        arr.push({ groupName: gname, dates: [], metas: [] });
      }
    }
    return arr;
  }, [blocks, extraGroups]);

  // Следим, чтобы индекс группы был валиден
  useEffect(() => {
    setGroupIndex(i => Math.min(Math.max(0, i), displayGroups.length - 1));
  }, [displayGroups.length]);

  // Текущая группа и её даты
  const current = displayGroups[groupIndex] || { groupName: "", dates: [], metas: [] };
  const groupDates = useMemo(() => [...(current.dates ?? [])].sort(), [current.dates]);
  const currentGroupName = current.groupName || "";

  // опции индикаторов только текущей группы
  const optionsForCurrentGroup = useMemo(
    () => indicatorOptions.filter(o => o.groupName === currentGroupName),
    [indicatorOptions, currentGroupName]
  );

  // если сменили группу — подберём первый индикатор в форме
  useEffect(() => {
    if (optionsForCurrentGroup.length === 0) return;
    if (!indicatorKey || !optionsForCurrentGroup.some(o => o.key === indicatorKey)) {
      const first = optionsForCurrentGroup[0];
      setIndicatorKey(first.key);
      setUnit(first.units[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupName, optionsForCurrentGroup]);

  // Карта значений только для текущей группы (ключ: indicatorName|date)
  const valueMap = useMemo(() => {
    const m = new Map<string, {
      id?: number;
      v: string | number;
      status: Measure["status"];
      units?: string;
      name: string;
      min: number | null;
      max: number | null;
      reasons: Reason[];
    }>();
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

  // выбранный индикатор (по ключу)
  const selectedIndicator = useMemo(
    () => indicatorOptions.find((o) => o.key === indicatorKey),
    [indicatorOptions, indicatorKey]
  );

  // синхронизируем unit с выбранным индикатором
  useEffect(() => {
    if (selectedIndicator) {
      if (!selectedIndicator.units.includes(unit)) {
        setUnit(selectedIndicator.units[0] ?? "");
      }
    } else {
      setUnit("");
    }
  }, [selectedIndicator]);

  // Сохранить новое измерение
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
        regDate: date,
      };
      await axios.post(API.PERSON_MEASURES(personId), payload);

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

  const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};


  // Пагинация по столбцам
  const columnsForPage = useMemo(() => {
    return groupDates.slice(currentPage * columnsPerPage, (currentPage + 1) * columnsPerPage);
  }, [groupDates, currentPage]);
  const totalPages = Math.ceil(groupDates.length / columnsPerPage);
  const goToPreviousPage = () => currentPage > 0 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1);

  // --- Хуки для ленты групп (ДОЛЖНЫ БЫТЬ ДО ЛЮБОГО return) ---
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateTabsScrollState = () => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  const scrollTabsBy = (px: number) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: px, behavior: "smooth" });
  };
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateTabsScrollState();
    const onScroll = () => updateTabsScrollState();
    const ro = new ResizeObserver(updateTabsScrollState);
    el.addEventListener("scroll", onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);
  // --- конец блока ленты групп ---

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingMeasureId == null) return;
    if (!editName || !editUnits) {
      alert("Укажите имя индикатора и единицы измерения");
      return;
    }
    try {
      const payload = {
        name: editName,
        units: editUnits,
        currentValue: Number(editValue),
        regDate: editDate,
      };
      await axios.patch(`${API.PERSON_MEASURES(personId)}/${editingMeasureId}`, payload);
      setEditModalOpen(false);
      setEditingMeasureId(null);
      const ms = await axios.get(API.PERSON_MEASURES(personId));
      const arr: GroupBlock[] = Array.isArray(unwrap(ms.data)) ? unwrap(ms.data) : [];
      setBlocks(arr);
    } catch (err) {
      console.error(err);
      alert("Ошибка при редактировании измерения");
    }
  };

  if (loading) {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Загрузка...</p>
    </div>
  );
}

  return (
    <div className="person-page">

      {/* Лента групп с обрезанием и стрелками */}
      <div className="tabs-bar-wrap">
        {canScrollLeft && (
          <button type="button" className="chevron chevron-left" aria-label="Листать влево" onClick={() => scrollTabsBy(-240)}>➤</button>
        )}
        <div className="tabs-viewport">
          <div className="tabs-row" ref={tabsRef}>
            {missingGroups.length > 0 && (
              <button
                type="button"
                className="plus-btn"
                onClick={() => setShowAddGroup(true)}
                title="Добавить группу"
              >
                +
              </button>
            )}
            {displayGroups.map((g, i) => (
              <button
                key={g.groupName || i}
                type="button"
                className={`tab-btn ${i === groupIndex ? "active" : ""}`}
                onClick={() => setGroupIndex(i)}
                title={g.groupName}
              >
                {g.groupName || `Группа ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
        {canScrollRight && (
          <button type="button" className="chevron chevron-right" aria-label="Листать вправо" onClick={() => scrollTabsBy(240)}>➤</button>
        )}
      </div>

      {/* Верхняя строка ввода (добавление) – список индикаторов только текущей группы */}
      <form className="form-card person-input-row" onSubmit={onSave}>
        <FloatingSelect
          id="indicator"
          label="Выберите индикатор"
          value={indicatorKey}
          onChange={(e) => setIndicatorKey(e.target.value)}
          options={optionsForCurrentGroup.map((o) => ({ value: o.key, label: o.label }))} /* ← без имени группы */
        />
        <FloatingTextInput
          id="value"
          type="number"
          label="Значение"
          value={value} 
          onChange={(e) => setValue(e.target.value)}
        />
        <FloatingSelect
          id="units"
          label="Единицы"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={(indicatorOptions.find(o => o.key === indicatorKey)?.units ?? []).map((u) => ({ value: u, label: u }))}
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

      {/* Таблица текущей группы */}
      <div className="table-wrapper">
        <table className="person-grid">
          <thead>
            <tr>
              <th className="sticky-col">{current.groupName || "Индикатор"}</th>
              {columnsForPage.map((d) => (
                <th key={d}>{formatDate(d)}</th>
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
                      ? "cell-ok"
                      : cell?.status === "raise" || cell?.status === "fall"
                        ? "cell-raise"
                        : "";

                  return (
                    <td
                      key={d}
                      className={cls}
                      onClick={() =>
                        cell &&
                        openInfo(
                          { id: cell.id, v: cell.v, units: cell.units, min: cell.min, max: cell.max, reasons: cell.reasons },
                          meta.indicatorName,
                          d
                        )
                      }
                      title="Клик — подробная информация"
                    >
                      <span>
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
                <td colSpan={1 + columnsForPage.length} className="no-data">
                  Нет показателей в группе
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="pagination-container">
        <button className="pagination-button" onClick={goToPreviousPage} disabled={currentPage === 0}>
          Назад
        </button>
        <span className="pagination-text">Страница {currentPage + 1} из {totalPages}</span>
        <button className="pagination-button" onClick={goToNextPage} disabled={currentPage === totalPages - 1}>
          Вперед
        </button>
      </div>
      <div className="decrypt-section">
  <h3>Расшифровка по дате</h3>
  <div className="decrypt-controls">
    <input
      type="date"
      value={decryptDate}
      onChange={(e) => setDecryptDate(e.target.value)}
    />
    <button onClick={handleDecrypt} disabled={loadingDecrypt}>
      {loadingDecrypt ? "Загрузка..." : "Расшифровать"}
    </button>
  </div>

  {decryptData && (
    <div className="decrypt-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={Object.entries(decryptData).map(([key, val]: any) => ({
              name: key,
              value: val.percentage,
            }))}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {Object.entries(decryptData).map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</div>


      {/* Инфо-панель (с редактированием и удалением) */}
      {infoOpen && infoData && (
        <>
          <div className="info-overlay" onClick={closeInfo} />
          <div className="info-card" role="dialog" aria-modal="true">
            <button aria-label="Закрыть" className="info-close" onClick={closeInfo}>×</button>
            <h3 className="info-title">Информация</h3>
            <div className="info-row"><b>Индикатор:</b> {infoData.indicatorName}</div>
            <div className="info-row"><b>Дата:</b> {formatDate(infoData.date)}</div>
            <div className="info-row"><b>Значение:</b> {infoData.value} {infoData.units}</div>
            
            {infoData.min != null && <div className="info-row"><b>Мин значение:</b> {infoData.min} {infoData.units}</div>}
            {infoData.max != null && <div className="info-row"><b>Макс значение:</b> {infoData.max} {infoData.units}</div>}
            {infoData.reasons?.length ? (
              <div className="info-reasons">
                <b>Причины:</b>
                <ul>
                  {infoData.reasons.map((r) => <li key={r.id}>{r.name}</li>)}
                </ul>
              </div>
            ) : null}

            {infoData.id && (
              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeasureId(infoData.id!);
                    setEditValue(String(infoData.value ?? ""));
                    setEditDate(infoData.date);
                    setEditUnits(infoData.units || "");
                    setEditName(infoData.indicatorName);
                    setEditModalOpen(true);
                    setInfoOpen(false);
                  }}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Удалить это измерение?")) return;
                    try {
                      await axios.delete(`${API.PERSON_MEASURES(personId)}/${infoData.id}`);
                      const ms = await axios.get(API.PERSON_MEASURES(personId));
                      const arr: GroupBlock[] = Array.isArray(unwrap(ms.data)) ? unwrap(ms.data) : [];
                      setBlocks(arr);
                      closeInfo();
                    } catch (err) {
                      console.error(err);
                      alert("Ошибка при удалении измерения");
                    }
                  }}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Модалка: добавить группу в ленту */}
      {showAddGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Добавить группу</h3>
            {missingGroups.length === 0 ? (
              <p>Все группы уже добавлены.</p>
            ) : (
              <div className="modal-group-list">
                {missingGroups.map((g) => (
                  <button
                    key={g.groupName}
                    onClick={() => {
                      setExtraGroups(prev => {
                        const next = [...prev, g.groupName];
                        setShowAddGroup(false);
                        // после применения состояния — вычислим индекс и выберем вкладку
                        setTimeout(() => {
                          const allNames = [
                            ...blocks.map(b => b.groupName),
                            ...next,
                          ];
                          const idx = allNames.findIndex(n => n === g.groupName);
                          setGroupIndex(idx >= 0 ? idx : 0);
                        }, 0);
                        return next;
                      });
                    }}
                  >
                    {g.groupName}
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowAddGroup(false)}>Закрыть</button>
            </div>
          </div>
        </div>  
      )}


      {/* Модалка редактирования */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form className="form-redact" onSubmit={handleEditSubmit}>
              <h3 className="modal-title">Редактировать</h3>
              <div className="modal-subtitle">Индикатор: {editName}</div>
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
              <FloatingSelect
                id="editUnits"
                label="Единицы"
                value={editUnits}
                onChange={(e) => setEditUnits(e.target.value)}
                options={
                  (indicatorOptions.find(o => o.name === editName)?.units ?? [])
                    .map((u) => ({ value: u, label: u }))
                }
              />

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => setEditModalOpen(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
