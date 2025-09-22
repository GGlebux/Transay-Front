import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/layout.css";
import Users from "../../assets/Users.png";
import User from "../../assets/User.png";
import Forms from "../../assets/Forms.svg";
import Arrow from "../../assets/Arrow.svg";

export default function Sidebar() {
  const location = useLocation();
  const isForms = location.pathname.startsWith("/forms");
  const [isFormsOpen, setIsFormsOpen] = useState(isForms);

  // state для хранения актуального id
  const [lastPersonId, setLastPersonId] = useState(
    localStorage.getItem("lastPersonId") || "1"
  );

  // следим за изменением location — читаем новое значение из localStorage
  useEffect(() => {
    const id = localStorage.getItem("lastPersonId") || "1";
    setLastPersonId(id);
  }, [location]);

  return (
    <aside className="sidebar">
      <div className="sidebar__logo nunito">TRANSAY</div>

      <nav>
        <ul>
          <li>
            <NavLink
              to="/people"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <img src={Users} alt="" /> Люди
            </NavLink>
          </li>

          <li>
            <NavLink
              to={`/person/${lastPersonId}`}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <img src={User} alt="" /> Человек
            </NavLink>
          </li>

          <li>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setIsFormsOpen(!isFormsOpen)}
            >
              <img src={Forms} alt="" /> Формы
              <img
                src={Arrow}
                alt="Arrow"
                className={`arrow-icon ${isFormsOpen ? "rotated" : ""}`}
              />
            </button>

            <ul className={`submenu ${isFormsOpen ? "open" : ""}`}>
              <li>
                <NavLink
                  to="/forms/trans_indicat"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Транс-Индикат
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/forms/units_reasons"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Измер-Причины
                </NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
