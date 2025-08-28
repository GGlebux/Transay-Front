import { useEffect, useRef, useState } from "react";

type Reason = { id: number; name: string };

export function MultiSelectWithSearch({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Reason[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="multi-select text-field__input " ref={ref}>
      <label className="multi-select__label" htmlFor="multi-select-input">
        {label}
      </label>
      <input
        id="multi-select-input"
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true); // открыть дропдаун при вводе
        }}
        onFocus={() => setOpen(true)} // открыть при фокусе
        className="multi-select__input"
      />
      {open && (
        <div className="multi-select__dropdown">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <label key={opt.id} className="multi-select__option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleSelect(opt.id)}
                />
                {opt.name}
              </label>
            ))
          ) : (
            <div className="multi-select__no-options">Ничего не найдено</div>
          )}
        </div>
      )}
    </div>
  );
}
