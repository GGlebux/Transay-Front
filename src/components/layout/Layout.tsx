import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <Header />
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
}
