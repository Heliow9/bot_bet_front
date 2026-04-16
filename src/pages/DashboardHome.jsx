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
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [summaryRes, predictionsRes, modelStatusRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/predictions?limit=10"),
        api.get("/dashboard/model-status"),
      ]);

      setSummary(summaryRes.data);
      setPredictions(predictionsRes.data.items || []);
      setModelStatus(modelStatusRes.data || null);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
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

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Resumo geral</h2>
              <p>Visão consolidada de toda a base do sistema.</p>
            </div>
          </div>

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
            <StatCard title="Ao vivo" value={summary?.live_predictions ?? 0} />
            <StatCard
              title="Confiança alta"
              value={summary?.high_confidence_predictions ?? 0}
            />
            <StatCard title="Value bets" value={summary?.value_bets ?? 0} />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Financeiro geral</h2>
              <p>Resultados financeiros considerando stake fixa de 1 unidade.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Lucro acumulado"
              value={formatMoney(summary?.profit ?? 0)}
              subtitle={`${summary?.roi_items ?? 0} entradas com odd válida`}
            />
            <StatCard
              title="Stake total"
              value={formatMoney(summary?.stake ?? 0)}
            />
            <StatCard
              title="ROI"
              value={`${((summary?.roi ?? 0) * 100).toFixed(2)}%`}
            />
            <StatCard
              title="ROI válido"
              value={summary?.roi_items ?? 0}
              subtitle="Apostas consideradas no cálculo"
            />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Resumo de hoje</h2>
              <p>Baseado na data real de fechamento da previsão ({`checked_at`}).</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Resolvidas hoje"
              value={summary?.today_resolved_predictions ?? 0}
            />
            <StatCard title="Acertos hoje" value={summary?.today_hits ?? 0} />
            <StatCard title="Erros hoje" value={summary?.today_misses ?? 0} />
            <StatCard
              title="Acurácia hoje"
              value={`${((summary?.today_accuracy ?? 0) * 100).toFixed(2)}%`}
            />
            <StatCard title="Ao vivo hoje" value={summary?.today_live_predictions ?? 0} />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Financeiro de hoje</h2>
              <p>Lucro e ROI apenas das previsões resolvidas hoje.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Lucro hoje"
              value={formatMoney(summary?.today_profit ?? 0)}
              subtitle={`${summary?.today_roi_items ?? 0} entradas com odd válida`}
            />
            <StatCard
              title="Stake hoje"
              value={formatMoney(summary?.today_stake ?? 0)}
            />
            <StatCard
              title="ROI hoje"
              value={`${((summary?.today_roi ?? 0) * 100).toFixed(2)}%`}
            />
            <StatCard
              title="ROI válido hoje"
              value={summary?.today_roi_items ?? 0}
              subtitle="Apostas consideradas hoje"
            />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Saúde operacional</h2>
              <p>Leitura rápida do estado técnico das previsões monitoradas.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Jogos ao vivo"
              value={summary?.live_predictions ?? 0}
              subtitle="Previsões marcadas como live"
            />
            <StatCard
              title="Pendências"
              value={summary?.pending_predictions ?? 0}
              subtitle="Aguardando fechamento"
            />
            <StatCard
              title="Resolvidas hoje"
              value={summary?.today_resolved_predictions ?? 0}
              subtitle="Com resultado consolidado"
            />
            <StatCard
              title="Acertos hoje"
              value={summary?.today_hits ?? 0}
              subtitle="Desempenho do dia"
            />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Status do modelo</h2>
              <p>Acompanhamento da última versão treinada e da saúde do pipeline de ML.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Modelo carregado"
              value={modelStatus?.model_loaded ? "Sim" : "Não"}
              subtitle={modelStatus?.model_loaded ? "Pronto para inferência" : "Fallback heurístico"}
            />
            <StatCard
              title="Último treino"
              value={formatDateTime(modelStatus?.last_training_at)}
              subtitle="Baseado no arquivo do modelo"
            />
            <StatCard
              title="Dataset"
              value={modelStatus?.rows ?? 0}
              subtitle={`Treino: ${modelStatus?.train_rows ?? 0} • Teste: ${modelStatus?.test_rows ?? 0}`}
            />
            <StatCard
              title="Accuracy ML"
              value={formatPercent(modelStatus?.accuracy)}
              subtitle="Validação holdout"
            />
            <StatCard
              title="Log loss"
              value={formatDecimal(modelStatus?.log_loss)}
              subtitle="Quanto menor, melhor"
            />
            <StatCard
              title="Features"
              value={modelStatus?.features_count ?? 0}
              subtitle={formatClasses(modelStatus?.classes)}
            />
          </section>
        </section>

        <section className="quick-actions">
          <button className="action-card" onClick={() => navigate("/predictions")}>
            📊 Ver previsões
          </button>
          <button className="action-card" onClick={() => navigate("/results")}>
            🏁 Ver resultados
          </button>
          <button className="action-card" onClick={() => navigate("/market")}>
            💰 Mercado / CLV
          </button>
          <button className="action-card" onClick={() => navigate("/model")}>
            🤖 Status do modelo
          </button>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Últimas previsões</h2>
              <p>Entradas mais recentes registradas no sistema.</p>
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
                  <th>Status técnico</th>
                  <th>Última checagem</th>
                </tr>
              </thead>

              <tbody>
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty">
                      Nenhuma previsão encontrada no banco.
                    </td>
                  </tr>
                ) : (
                  predictions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.league_name}</td>

                      <td>
                        <div style={{ display: "grid", gap: "0.2rem" }}>
                          <strong>
                            {item.home_team} x {item.away_team}
                          </strong>

                          {(item.home_score !== null && item.home_score !== undefined) ||
                          (item.away_score !== null && item.away_score !== undefined) ? (
                            <small className="muted-text">
                              Placar: {item.home_score ?? "-"} x {item.away_score ?? "-"}
                            </small>
                          ) : (
                            <small className="muted-text">
                              {item.match_date} • {item.match_time}
                            </small>
                          )}
                        </div>
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
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "grid", gap: "0.2rem" }}>
                          {item.is_live ? (
                            <span className="pill pill--status-live">Ao vivo</span>
                          ) : (
                            <span className="pill pill--status-neutral">
                              {item.last_status_text || "Sem status"}
                            </span>
                          )}

                          <small className="muted-text">
                            Fonte: {item.result_source || "-"}
                          </small>
                        </div>
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

function formatStatus(value) {
  const text = String(value || "").toLowerCase();
  if (text === "hit") return "Hit";
  if (text === "miss") return "Miss";
  return "Pending";
}

function formatMoney(value) {
  const number = Number(value || 0);
  const signal = number > 0 ? "+" : "";
  return `${signal}${number.toFixed(2)}u`;
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${(number * 100).toFixed(2)}%`;
}

function formatDecimal(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toFixed(4);
}

function formatClasses(classes) {
  if (!Array.isArray(classes) || classes.length === 0) return "Sem classes";
  return `Classes: ${classes.join(" • ")}`;
}