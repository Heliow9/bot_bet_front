import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

export default function PredictionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const response = await api.get("/dashboard/predictions/pending?limit=50");
      setItems(response.data.items || []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar as previsões pendentes.");
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
          title="Previsões pendentes"
          eyebrow="Operação diária"
        />

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Jogos pendentes</h2>
              <p>Partidas ainda não resolvidas registradas no sistema.</p>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">Carregando previsões...</div>
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
                    <th>Probabilidades</th>
                    <th>Confiança</th>
                    <th>Status</th>
                    <th>Status técnico</th>
                    <th>Última checagem</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty">
                        Nenhuma previsão pendente encontrada.
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

                        <td>
                          {Math.round(item.prob_home * 100)}% •{" "}
                          {Math.round(item.prob_draw * 100)}% •{" "}
                          {Math.round(item.prob_away * 100)}%
                        </td>

                        <td>
                          <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                            {item.confidence}
                          </span>
                        </td>

                        <td>
                          <span className="pill pill--status-pending">
                            Pending
                          </span>
                        </td>

                        <td>
                          {item.is_live ? (
                            <span className="pill pill--status-live">Ao vivo</span>
                          ) : (
                            <span className="pill pill--status-neutral">
                              {item.last_status_text || "Aguardando"}
                            </span>
                          )}
                        </td>

                        <td>
                          <small className="muted-text">
                            {formatDateTime(item.last_checked_at)}
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

function normalizeConfidence(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("alta")) return "high";
  if (text.includes("média") || text.includes("media")) return "medium";
  return "low";
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