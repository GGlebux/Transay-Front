import { NavLink, useLocation } from "react-router-dom";
import "../../styles/layout.css";

export default function Sidebar() {
  const location = useLocation();
  const isForms = location.pathname.startsWith("/forms");

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">LOGO</div>

      <nav>
        <ul>
          <li>
            <NavLink to="/people" className={({ isActive }) => (isActive ? "active" : "")}>
              People
            </NavLink>
          </li>

          <li>
            <NavLink to="/person" className={({ isActive }) => (isActive ? "active" : "")}>
              Person
            </NavLink>
          </li>

          {/* Родительский пункт */}
          <li>
            <NavLink
              to="/forms/trans_indicat"
              className={() => (isForms ? "active" : "")}
            >
              Forms
            </NavLink>

            {/* Подпункты */}
            <ul className="submenu">
              <li>
                <NavLink
                  to="/forms/trans_indicat"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Trans_Indicat
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/forms/units_reasons"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Units_Reasons
                </NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
