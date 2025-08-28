import { NavLink, Outlet } from "react-router-dom";

export default function FormsIndex() {
  return (
    <div className="container">
      <div>
        <NavLink to="trans_indicat" className={({isActive}) => isActive ? "tab active" : "tab"}>
          
        </NavLink>
        <NavLink to="units_reasons" className={({isActive}) => isActive ? "tab active" : "tab"}>
          
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
