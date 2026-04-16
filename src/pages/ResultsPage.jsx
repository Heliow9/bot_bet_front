import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

export default function ResultsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const response = await api.get("/dashboard/predictions/resolved?limit=50");
      setItems(response.data.items || []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar os resultados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Resultados"
          eyebrow="Histórico e performance"
        />

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Jogos resolvidos</h2>
              <p>Histórico de acertos e erros do sistema.</p>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">Carregando resultados...</div>
          ) : error ? (
            <div className="table-empty">{error}</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Liga</th>
                    <th>Jogo</th>
                    <th>Pick</th>
                    <th>Resultado</th>
                    <th>Placar</th>
                    <th>Status</th>
                    <th>Status técnico</th>
                    <th>Última checagem</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty">
                        Nenhum resultado resolvido encontrado.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.league_name}</td>

                        <td>
                          <strong>
                            {item.home_team} x {item.away_team}
                          </strong>
                        </td>

                        <td>{item.pick}</td>

                        <td>{item.result || "-"}</td>

                        <td>
                          {item.home_score ?? "-"} x {item.away_score ?? "-"}
                        </td>

                        <td>
                          <span className={`pill pill--status-${normalizeStatus(item.status)}`}>
                            {formatStatus(item.status)}
                          </span>
                        </td>

                        <td>
                          {item.is_live ? (
                            <span className="pill pill--status-live">Ao vivo</span>
                          ) : (
                            <span className="pill pill--status-neutral">
                              {item.last_status_text || "Finalizado"}
                            </span>
                          )}
                        </td>

                        <td>
                          <small className="muted-text">
                            {formatDateTime(item.last_checked_at || item.checked_at)}
                          </small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function normalizeStatus(value) {
  const text = String(value || "").toLowerCase();
  if (text === "hit") return "hit";
  if (text === "miss") return "miss";
  return "pending";
}

function formatStatus(value) {
  const text = String(value || "").toLowerCase();
  if (text === "hit") return "Hit";
  if (text === "miss") return "Miss";
  return "Pending";
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}