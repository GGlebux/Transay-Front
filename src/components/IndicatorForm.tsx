import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FloatingTextInput, FloatingSelect } from "./FloatingTextField";
import { API } from "../apiConfig"; // импорт API

const genders = ["male", "female", "both"];

type Props = { engName: string; setEngName: (v: string) => void };
type Units = string[];

export default function IndicatorForm({ engName, setEngName }: Props) {
  const [rusName, setRusName] = useState("");
  const [unit, setUnit] = useState("");
  const [gender, setGender] = useState("");
  const [gravid, setGravid] = useState(false);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [units, setUnits] = useState<Units>([]);
  const [minAge, setMinAge] = useState({ years: "", months: "", days: "" });
  const [maxAge, setMaxAge] = useState({ years: "", months: "", days: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get<Units>(API.INDICATOR_UNITS)
      .then((res) => setUnits(res.data.sort()))
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setUnit("");
    setGender("");
    setGravid(false);
    setMinValue("");
    setMaxValue("");
    setMinAge({ years: "", months: "", days: "" });
    setMaxAge({ years: "", months: "", days: "" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !engName.trim() ||
      !rusName.trim() ||
      !unit.trim() ||
      !gender.trim() ||
      minValue === "" ||
      maxValue === ""
    ) {
      alert("Заполните все обязательные поля!");
      return;
    }
    setLoading(true);

    try {
      await axios.post(API.INDICATORS, {
        engName,
        rusName,
        gender,
        isGravid: gravid,
        minAge: {
          years: Number(minAge.years || 0),
          months: Number(minAge.months || 0),
          days: Number(minAge.days || 0),
        },
        maxAge: {
          years: Number(maxAge.years || 0),
          months: Number(maxAge.months || 0),
          days: Number(maxAge.days || 0),
        },
        minValue: Number(minValue),
        maxValue: Number(maxValue),
        units: unit,
      });
      alert("Данные успешно отправлены!");
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Неизвестная ошибка";
      alert(`Ошибка при отправке данных: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Индикатор</h2>

      <FloatingTextInput
        id="ind-eng"
        label="Англ название"
        value={engName}
        onChange={(e) => {
          const filteredValue = e.target.value.replace(/[а-яёА-ЯЁ]/g, "");
          setEngName(filteredValue);
        }}
      />

      <FloatingTextInput
  id="ind-rus"
  label="Рус название"
  value={rusName}
  onChange={(e) => {
    // Убираем только латиницу, оставляем кириллицу, пробелы и любые спецсимволы
    const filtered = e.target.value.replace(/[a-zA-Z]/g, "");
    setRusName(filtered);
  }}
/>


      <FloatingSelect
        id="ind-unit"
        label="Единицы измерения"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        options={units.map((u) => ({ value: u, label: u }))}
      />

      <FloatingSelect
        id="ind-gender"
        label="Гендер"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        options={genders.map((g) => ({ value: g, label: g }))}
      />

      <div className="checkbox">
        <label htmlFor="ind-gravid">Беременна</label>
        <input
          id="ind-gravid"
          type="checkbox"
          checked={gravid}
          onChange={(e) => setGravid(e.target.checked)}
        />
      </div>

      <label className="form-label">Минимальный возраст</label>
      <div className="age-input-group">
        <FloatingTextInput
          id="min-age-years"
          label="Годы"
          type="number"
          value={minAge.years}
          onChange={(e) => setMinAge({ ...minAge, years: e.target.value })}
        />
        <FloatingTextInput
          id="min-age-months"
          label="Месяцы"
          type="number"
          value={minAge.months}
          onChange={(e) => setMinAge({ ...minAge, months: e.target.value })}
        />
        <FloatingTextInput
          id="min-age-days"
          label="Дни"
          type="number"
          value={minAge.days}
          onChange={(e) => setMinAge({ ...minAge, days: e.target.value })}
        />
      </div>

      <label className="form-label">Максимальный возраст</label>
      <div className="age-input-group">
        <FloatingTextInput
          id="max-age-years"
          label="Годы"
          type="number"
          value={maxAge.years}
          onChange={(e) => setMaxAge({ ...maxAge, years: e.target.value })}
        />
        <FloatingTextInput
          id="max-age-months"
          label="Месяцы"
          type="number"
          value={maxAge.months}
          onChange={(e) => setMaxAge({ ...maxAge, months: e.target.value })}
        />
        <FloatingTextInput
          id="max-age-days"
          label="Дни"
          type="number"
          value={maxAge.days}
          onChange={(e) => setMaxAge({ ...maxAge, days: e.target.value })}
        />
      </div>

      <FloatingTextInput
        id="min-value"
        label="Минимальное значение"
        type="number"
        value={minValue}
        onChange={(e) => setMinValue(e.target.value)}
      />

      <FloatingTextInput
        id="max-value"
        label="Максимальное значение"
        type="number"
        value={maxValue}
        onChange={(e) => setMaxValue(e.target.value)}
      />

      <div className="btn-container">
        <button
          type="button"
          className="btn-clear"
          onClick={resetForm}
          disabled={loading} // чтобы очистка тоже не ломала во время запроса
        >
          Очистить
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </form>
  );
}
