import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

export default function DashboardHome() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [summaryRes, predictionsRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/predictions?limit=10"),
      ]);

      setSummary(summaryRes.data);
      setPredictions(predictionsRes.data.items || []);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-loading">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar onLogout={handleLogout} />

        <section className="stats-grid">
          <StatCard title="Previsões" value={summary?.total_predictions ?? 0} />
          <StatCard title="Resolvidas" value={summary?.resolved_predictions ?? 0} />
          <StatCard title="Acertos" value={summary?.hits ?? 0} />
          <StatCard title="Erros" value={summary?.misses ?? 0} />
          <StatCard
            title="Acurácia"
            value={`${((summary?.accuracy ?? 0) * 100).toFixed(2)}%`}
          />
          <StatCard title="Pendentes" value={summary?.pending_predictions ?? 0} />
          <StatCard
            title="Confiança alta"
            value={summary?.high_confidence_predictions ?? 0}
          />
          <StatCard title="Value bets" value={summary?.value_bets ?? 0} />
        </section>

        <section className="quick-actions">
          <button className="action-card" onClick={() => navigate("/predictions")}>
            📊 Ver previsões
          </button>
          <button className="action-card" onClick={() => navigate("/results")}>
            🏁 Ver resultados
          </button>
           <button className="action-card" onClick={() => navigate("/market")}>💰 Mercado / CLV</button>
           <button className="action-card" onClick={() => navigate("/model")}>🤖 Status do modelo</button>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Últimas previsões</h2>
              <p>Resumo rápido das entradas mais recentes registradas no sistema.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Liga</th>
                  <th>Jogo</th>
                  <th>Pick</th>
                  <th>Confiança</th>
                  <th>Modelo</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">
                      Nenhuma previsão encontrada no banco.
                    </td>
                  </tr>
                ) : (
                  predictions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.league_name}</td>
                      <td>
                        {item.home_team} x {item.away_team}
                      </td>
                      <td>{item.pick}</td>
                      <td>
                        <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                          {item.confidence}
                        </span>
                      </td>
                      <td>{item.model_source || "-"}</td>
                      <td>
                        <span className={`pill pill--status-${normalizeStatus(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

function normalizeStatus(value) {
  const text = String(value || "").toLowerCase();
  if (text === "hit") return "hit";
  if (text === "miss") return "miss";
  return "pending";
}