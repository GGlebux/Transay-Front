import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FloatingTextInput, FloatingSelect } from "./FloatingTextField";
import { API } from "../apiConfig"; // импорт API

export default function TranscriptForm({
  engName,
  setEngName,
}: {
  engName: string;
  setEngName: (v: string) => void;
}) {
  const [allReasons, setAllReasons] = useState<{ id: number; name: string }[]>(
    []
  );
  const [raiseReasons, setRaiseReasons] = useState<
    { id: number; name: string }[]
  >([]);
  const [lowerReasons, setLowerReasons] = useState<
    { id: number; name: string }[]
  >([]);
  const [gender, setGender] = useState("");

  useEffect(() => {
    axios
      .get<{ id: number; name: string }[]>(API.REASONS)
      .then((res) =>
        setAllReasons(res.data.sort((a, b) => a.name.localeCompare(b.name)))
      )
      .catch(console.error);
  }, []);

  const handleSelect = (type: "raise" | "lower", id: number) => {
    const r = allReasons.find((r) => r.id === id);
    if (!r) return;
    const list = type === "raise" ? raiseReasons : lowerReasons;
    const setter = type === "raise" ? setRaiseReasons : setLowerReasons;
    if (!list.some((x) => x.id === id)) setter([...list, r]);
  };

  const handleRemove = (type: "raise" | "lower", id: number) => {
    const list = type === "raise" ? raiseReasons : lowerReasons;
    const setter = type === "raise" ? setRaiseReasons : setLowerReasons;
    setter(list.filter((r) => r.id !== id));
  };

  const resetForm = () => {
    setEngName("");
    setGender("");
    setRaiseReasons([]);
    setLowerReasons([]);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    axios
      .post(API.TRANSCRIPTS, {
        name: engName,
        gender,
        fallsIds: lowerReasons.map((r) => r.id),
        raisesIds: raiseReasons.map((r) => r.id),
      })
      .then(() => alert("Данные успешно отправлены!"))
      .catch(console.error);
  };

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <h2>Транскрипция</h2>
      <FloatingTextInput
        id="trans-name"
        label="Англ название"
        value={engName}
        onChange={(e) => {
          const filteredValue = e.target.value.replace(/[а-яёА-ЯЁ]/g, "");
          setEngName(filteredValue);
        }}
      />

      <FloatingSelect
        id="gender"
        label="Гендер"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        options={[
          { value: "male", label: "male" },
          { value: "female", label: "female" },
          { value: "both", label: "both" },
        ]}
      />

      <FloatingSelect
        id="raise-select"
        label="Причины повышения"
        value=""
        onChange={(e) => handleSelect("raise", Number(e.target.value))}
        options={allReasons.map((r) => ({
          value: String(r.id),
          label: r.name,
        }))}
      />
      <div className="tag-container">
        {raiseReasons.map((r) => (
          <span key={r.id} className="tag">
            {r.name}
            <button type="button" onClick={() => handleRemove("raise", r.id)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <FloatingSelect
        id="lower-select"
        label="Причины понижения"
        value=""
        onChange={(e) => handleSelect("lower", Number(e.target.value))}
        options={allReasons.map((r) => ({
          value: String(r.id),
          label: r.name,
        }))}
      />
      <div className="tag-container">
        {lowerReasons.map((r) => (
          <span key={r.id} className="tag">
            {r.name}
            <button type="button" onClick={() => handleRemove("lower", r.id)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="btn-container">
        <button type="button" className="btn-clear" onClick={resetForm}>
          Очистить
        </button>
        <button type="submit">Отправить</button>
      </div>
    </form>
  );
}
