function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");

    if (!raw || raw === "undefined" || raw === "null") {
      return {};
    }

    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function Topbar({ onLogout, title = "Dashboard ApostaGanha", eyebrow = "Painel administrativo" }) {
  const user = getStoredUser();

  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">{eyebrow}</p>
        <h1 className="topbar__title">{title}</h1>
      </div>

      <div className="topbar__right">
        <div className="user-box">
          <span className="user-avatar">
            {(user.name || "A").charAt(0).toUpperCase()}
          </span>

          <div className="user-box__meta">
            <strong>{user.name || "Administrador"}</strong>
            <small>{user.email || "admin@aposta.com"}</small>
          </div>
        </div>

        <button className="button button--ghost" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}