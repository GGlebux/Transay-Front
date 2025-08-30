import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../apiConfig";
import "../styles/people.css";

type Person = {
  id: number;
  name: string;
  gender: "male" | "female" | "both";
  dateOfBirth: string; // ISO YYYY-MM-DD
  isGravid: boolean;
};

/* ---------- Helpers: normalize any backend shape ---------- */

function str(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  return String(val);
}

function extractName(raw: unknown): string {
  const s = str(raw).trim();
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const j = JSON.parse(s);
      if (j && typeof j.name === "string") return j.name;
    } catch {}
  }
  return s;
}

function toPerson(x: any, i: number): Person {
  const genderRaw = str(x?.gender).toLowerCase();
  const gender: Person["gender"] =
    genderRaw === "female" ? "female" : genderRaw === "both" ? "both" : "male";

  return {
    id: Number(x?.id ?? i + 1),
    name: extractName(x?.name ?? x?.fullName ?? x?.title ?? ""),
    gender,
    dateOfBirth: str(x?.dateOfBirth ?? x?.dob ?? ""),
    isGravid: Boolean(x?.isGravid) && gender === "female",
  };
}

function unwrapListLike(payload: any): any {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    // самые частые ключи-обёртки
    return (
      payload.people ??
      payload.items ??
      payload.data ??
      payload.results ??
      payload.list ??
      payload.content ??
      payload
    );
  }
  return payload;
}

function toPeople(payload: any): Person[] {
  // если пришла строка — попытаться распарсить
  if (typeof payload === "string") {
    try {
      return toPeople(JSON.parse(payload));
    } catch {
      return [];
    }
  }

  const unwrapped = unwrapListLike(payload);

  if (Array.isArray(unwrapped)) {
    if (unwrapped.length === 0) return [];
    // если вдруг массив строк — превратим в людей с именем
    if (typeof unwrapped[0] === "string") {
      return (unwrapped as string[]).map((name, i) =>
        toPerson({ id: i + 1, name }, i)
      );
    }
    return (unwrapped as any[]).map(toPerson);
  }

  // одиночный объект -> массив из одного элемента
  if (unwrapped && typeof unwrapped === "object") {
    return [toPerson(unwrapped, 0)];
  }

  return [];
}

/* --------------------------------------------------------- */

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState<Omit<Person, "id">>({
    name: "",
    gender: "male",
    dateOfBirth: "",
    isGravid: false,
  });

  const calcAge = (dob: string) => {
    if (!dob) return "";
    const b = new Date(dob);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
  };

  const reload = async () => {
    try {
      const { data } = await axios.get(API.PEOPLE);
      setPeople(toPeople(data));
    } catch (e) {
      console.error(e);
      setPeople([]); // не даём упасть на filter()
      alert("Ошибка загрузки списка людей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>Загрузка...</p>;

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      name: formData.name.trim(),
      isGravid: formData.gender === "female" ? formData.isGravid : false,
    };

    try {
      if (editingPerson) {
        const { data } = await axios.patch(`${API.PEOPLE}/${editingPerson.id}`, payload);
        const updated = toPeople(data);
        if (updated.length === 1) {
          const u = updated[0];
          setPeople((prev) => prev.map((p) => (p.id === u.id ? u : p)));
        } else {
          // если бек вернул не то — просто перезагрузим список
          await reload();
        }
      } else {
        const { data } = await axios.post(API.PEOPLE, payload);
        const created = toPeople(data);
        if (created.length === 1) {
          setPeople((prev) => [created[0], ...prev]);
        } else {
          await reload();
        }
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении");
    }
  };

  const handleDelete = async (person: Person) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${person.name}?`)) return;
    try {
      await axios.delete(`${API.PEOPLE}/${person.id}`);
      setPeople((prev) => prev.filter((p) => p.id !== person.id));
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении");
    }
  };

  const openModalForEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      gender: person.gender,
      dateOfBirth: person.dateOfBirth,
      isGravid: person.isGravid,
    });
    setModalOpen(true);
  };

  const openModalForCreate = () => {
    setEditingPerson(null);
    setFormData({ name: "", gender: "male", dateOfBirth: "", isGravid: false });
    setModalOpen(true);
  };

  return (
    <div className="people-container">
      <div className="people-header">
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="people-search"
        />
        <button onClick={openModalForCreate} className="people-add-btn">
          Create
        </button>
      </div>

      <div className="table-wrapper">
        <table className="people-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Is Gravid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.dateOfBirth}</td>
                <td>{calcAge(p.dateOfBirth)}</td>
                <td>{p.gender}</td>
                <td>{p.isGravid ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => openModalForEdit(p)} className="edit-btn">
                    ✎
                  </button>
                  <button onClick={() => handleDelete(p)} className="delete-btn">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {filteredPeople.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#777" }}>
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{editingPerson ? "Редактировать человека" : "Создать человека"}</h3>

            <label>
              Name:
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>

            <label>
              Date of Birth:
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </label>

            <label>
              Gender:
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as Person["gender"] })
                }
              >
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="both">both</option>
              </select>
            </label>

            <label>
              Is Gravid:
              <input
                type="checkbox"
                checked={formData.gender === "female" && formData.isGravid}
                onChange={(e) => setFormData({ ...formData, isGravid: e.target.checked })}
                disabled={formData.gender !== "female"}
                title={formData.gender !== "female" ? "Доступно только для female" : ""}
              />
            </label>

            <div className="modal-actions">
              <button onClick={handleSubmit}>Сохранить</button>
              <button onClick={() => setModalOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
