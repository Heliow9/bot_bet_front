import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

export default function ModelPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const response = await api.get("/dashboard/model-performance");
      setData(response.data);
    } catch (err) {
      console.error("Erro ao carregar model performance:", err);

      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar a performance do modelo.");
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

  const summary = data?.summary || {
    resolved_total: 0,
    hits: 0,
    misses: 0,
    accuracy: 0,
    profit: 0,
    stake: 0,
    roi: 0,
  };

  const byConfidence = data?.by_confidence || [];
  const byLeague = data?.by_league || [];

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Modelo"
          eyebrow="Performance e qualidade"
        />

        {loading ? (
          <div className="panel">
            <div className="table-empty">Carregando performance do modelo...</div>
          </div>
        ) : error ? (
          <div className="panel">
            <div className="table-empty">{error}</div>
          </div>
        ) : (
          <>
            <section className="stats-grid">
              <StatCard title="Jogos resolvidos" value={summary.resolved_total} />
              <StatCard title="Acertos" value={summary.hits} />
              <StatCard title="Erros" value={summary.misses} />
              <StatCard
                title="Acurácia geral"
                value={`${(Number(summary.accuracy || 0) * 100).toFixed(2)}%`}
              />
            </section>

            <section className="stats-grid">
              <StatCard
                title="Lucro total"
                value={formatMoney(summary.profit)}
              />
              <StatCard
                title="Stake total"
                value={formatMoney(summary.stake)}
              />
              <StatCard
                title="ROI geral"
                value={`${(Number(summary.roi || 0) * 100).toFixed(2)}%`}
              />
              <StatCard
                title="Leitura"
                value={buildPerformanceLabel(summary.roi)}
                subtitle="Baseado no retorno financeiro"
              />
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Performance por confiança</h2>
                  <p>
                    Veja como o modelo performa em alta, média e baixa confiança,
                    incluindo acurácia, lucro e ROI.
                  </p>
                </div>
              </div>

              <div className="confidence-grid">
                {byConfidence.length === 0 ? (
                  <div className="table-empty">
                    Ainda não há dados suficientes por confiança.
                  </div>
                ) : (
                  byConfidence.map((item) => (
                    <div
                      key={item.confidence}
                      className={`confidence-card confidence-card--${normalizeConfidence(
                        item.confidence
                      )}`}
                    >
                      <div className="confidence-card__top">
                        <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                          {capitalizeConfidence(item.confidence)}
                        </span>
                        <strong className="confidence-card__roi">
                          {(Number(item.roi || 0) * 100).toFixed(2)}%
                        </strong>
                      </div>

                      <div className="confidence-card__main">
                        <div className="confidence-card__metric">
                          <span>Acurácia</span>
                          <strong>{(Number(item.accuracy || 0) * 100).toFixed(2)}%</strong>
                        </div>

                        <div className="confidence-card__metric">
                          <span>Lucro</span>
                          <strong>{formatMoney(item.profit)}</strong>
                        </div>
                      </div>

                      <div className="confidence-card__footer">
                        <div>
                          <small>Total</small>
                          <strong>{item.total}</strong>
                        </div>
                        <div>
                          <small>Hits</small>
                          <strong>{item.hits}</strong>
                        </div>
                        <div>
                          <small>Misses</small>
                          <strong>{item.misses}</strong>
                        </div>
                        <div>
                          <small>Stake</small>
                          <strong>{formatMoney(item.stake)}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>Performance por liga</h2>
                  <p>
                    Compare acurácia, lucro e ROI por campeonato.
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Liga</th>
                      <th>Total</th>
                      <th>Acertos</th>
                      <th>Erros</th>
                      <th>Acurácia</th>
                      <th>Lucro</th>
                      <th>Stake</th>
                      <th>ROI</th>
                    </tr>
                  </thead>

                  <tbody>
                    {byLeague.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="table-empty">
                          Ainda não há dados suficientes por liga.
                        </td>
                      </tr>
                    ) : (
                      byLeague.map((item) => (
                        <tr key={item.league_name}>
                          <td>{item.league_name}</td>
                          <td>{item.total}</td>
                          <td>{item.hits}</td>
                          <td>{item.misses}</td>
                          <td>{(Number(item.accuracy || 0) * 100).toFixed(2)}%</td>
                          <td>{formatMoney(item.profit)}</td>
                          <td>{formatMoney(item.stake)}</td>
                          <td>
                            <span className={getRoiClass(item.roi)}>
                              {(Number(item.roi || 0) * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
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

function capitalizeConfidence(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("alta")) return "Alta";
  if (text.includes("média") || text.includes("media")) return "Média";
  return "Baixa";
}

function formatMoney(value) {
  const number = Number(value || 0);
  const signal = number > 0 ? "+" : "";
  return `${signal}${number.toFixed(2)}u`;
}

function buildPerformanceLabel(roi) {
  const value = Number(roi || 0);
  if (value > 0.1) return "Excelente";
  if (value > 0) return "Positivo";
  if (value === 0) return "Neutro";
  return "Negativo";
}

function getRoiClass(roi) {
  const value = Number(roi || 0);
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-neutral";
}