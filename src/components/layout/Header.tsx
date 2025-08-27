import "../../styles/layout.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header__search">
        <input type="text" placeholder="Поиск..." />
      </div>
      <div className="header__right">
        <span className="header__bell">🔔</span>
        <span className="header__user">👤 Имя Пользователя</span>
      </div>
    </header>
  );
}
