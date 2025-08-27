import { Link, useLocation } from "react-router-dom";
import '../../styles/layout.css';

export default function Sidebar() {
  const location = useLocation(); // Получаем текущий путь

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">LOGO</div>
      <nav>
        <ul>
          <li>
            <Link
              to="/people"
              className={location.pathname === "/people" ? "active" : ""}
            >
              People
            </Link>
          </li>
          <li>
            <Link
              to="/person"
              className={location.pathname === "/person" ? "active" : ""}
            >
              Person
            </Link>
          </li>
          <li>
            <Link
              to="/forms"
              className={location.pathname === "/forms" ? "active" : ""}
            >
              Forms
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
