import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">⚽</span>
        <div>
          <strong>ApostaGanha</strong>
          <small>Painel inteligente</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/dashboard" className={({ isActive }) => navClass(isActive)}>
          Dashboard
        </NavLink>

        <NavLink to="/predictions" className={({ isActive }) => navClass(isActive)}>
          Previsões
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => navClass(isActive)}>
          Resultados
        </NavLink>

        <NavLink to="/market" className={({ isActive }) => navClass(isActive)}>
          Mercado / CLV
        </NavLink>

        <NavLink to="/model" className={({ isActive }) => navClass(isActive)}>
          Modelo
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => navClass(isActive)}>
          Configurações
        </NavLink>
      </nav>
    </aside>
  );
}

function navClass(isActive) {
  return isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";
}