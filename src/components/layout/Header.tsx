import "../../styles/layout.css";
import Dialog from "../../assets/Dialog.svg";

export default function Header() {
  return (
    <header className="header">
      <div className="header__search">
        
      </div>
      <div className="header__right">
        <img src={Dialog} alt="" />
        <span className="header__user" title="Профиль"> Имя Пользователя</span>
      </div>
    </header>
  );
}
