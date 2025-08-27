import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../apiConfig";
import '../styles/people.css';

type Person = {
  id: number;
  name: string;
  gender: string;
  dateOfBirth: string;
  isGravid: boolean;
};

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    dateOfBirth: "",
    isGravid: false,
  });

  // Получение списка людей
  useEffect(() => {
    let isMounted = true;

    const fetchPeople = async () => {
      const list: Person[] = [];
      let id = 1;

      while (true) {
        try {
          const res = await axios.get<Person>(`${API.BASE_URL}/people/${id}`);
          list.push(res.data);
          id++;
        } catch (err: any) {
          if (err.response?.status === 404) break;
          console.error(err);
          break;
        }
      }

      if (isMounted) {
        setPeople(list);
        setLoading(false);
      }
    };

    fetchPeople();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <p>Загрузка...</p>;

  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Создание/редактирование
  const handleSubmit = async () => {
    try {
      if (editingPerson) {
        await axios.patch(`${API.BASE_URL}/people/${editingPerson.id}`, formData);
      } else {
        await axios.post(`${API.BASE_URL}/people`, formData);
      }
      window.location.reload(); // Перезагрузка после изменения/создания
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении");
    }
  };

  const handleDelete = async (person: Person) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${person.name}?`)) return;
    try {
      await axios.delete(`${API.BASE_URL}/people/${person.id}`);
      setPeople(people.filter(p => p.id !== person.id));
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
    setFormData({
      name: "",
      gender: "male",
      dateOfBirth: "",
      isGravid: false,
    });
    setModalOpen(true);
  };

  return (
    <div className="people-container">
      <div className="people-header">
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="people-search"
        />
        <button onClick={openModalForCreate} className="people-add-btn">Create</button>
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
            {filteredPeople.map((p) => {
              const birth = new Date(p.dateOfBirth);
              const age = new Date().getFullYear() - birth.getFullYear();
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.dateOfBirth}</td>
                  <td>{age}</td>
                  <td>{p.gender}</td>
                  <td>{p.isGravid ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => openModalForEdit(p)} className="edit-btn">✎</button>
                    <button onClick={() => handleDelete(p)} className="delete-btn">🗑</button>
                  </td>
                </tr>
              );
            })}
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
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
            <label>
              Date of Birth:
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </label>
            <label>
              Gender:
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
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
                checked={formData.isGravid}
                onChange={e => setFormData({ ...formData, isGravid: e.target.checked })}
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
