import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";

export default function ModelPage() {
  const navigate = useNavigate();

  const [performanceData, setPerformanceData] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");

      const [performanceRes, modelStatusRes] = await Promise.allSettled([
        api.get("/dashboard/model-performance"),
        api.get("/dashboard/model-status"),
      ]);

      if (performanceRes.status === "fulfilled") {
        setPerformanceData(performanceRes.value.data);
      }

      if (modelStatusRes.status === "fulfilled") {
        setModelStatus(modelStatusRes.value.data);
      } else {
        console.error("Falha ao carregar status do modelo:", modelStatusRes.reason);
      }

      if (performanceRes.status !== "fulfilled" && modelStatusRes.status !== "fulfilled") {
        throw modelStatusRes.reason || performanceRes.reason;
      }
    } catch (err) {
      console.error("Erro ao carregar página do modelo:", err);

      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar as informações principais do modelo.");
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

  const summary = performanceData?.summary || {
    resolved_total: 0,
    hits: 0,
    misses: 0,
    accuracy: 0,
    profit: 0,
    stake: 0,
    roi: 0,
  };

  const byConfidence = performanceData?.by_confidence || [];
  const byLeague = performanceData?.by_league || [];
  const byMarket = performanceData?.by_market || [];
  const historicalReliability = performanceData?.historical_reliability || modelStatus?.historical_reliability || null;
  const features = modelStatus?.features || [];

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
            <section className="panel panel--spaced model-page-shell">
              <div className="panel__header">
                <div>
                  <h2>Status do modelo</h2>
                  <p>Saúde da versão treinada e disponibilidade para inferência.</p>
                </div>
              </div>

              <section className="stats-grid stats-grid--mobile-stack">
                <StatCard
                  title="Modelo carregado"
                  value={modelStatus?.model_loaded ? "Sim" : "Não"}
                  subtitle={
                    modelStatus?.model_loaded
                      ? "Pronto para predição"
                      : "Fallback heurístico ativo"
                  }
                />
                <StatCard
                  title="Último treino"
                  value={formatDateTime(modelStatus?.last_training_at)}
                  subtitle="Timestamp do arquivo salvo"
                />
                <StatCard
                  title="Linhas do dataset"
                  value={modelStatus?.rows ?? 0}
                  subtitle={`Treino: ${modelStatus?.train_rows ?? 0} • Teste: ${modelStatus?.test_rows ?? 0}`}
                />
                <StatCard
                  title="Accuracy treino"
                  value={formatPercent(modelStatus?.accuracy)}
                  subtitle="Validação holdout"
                />
                <StatCard
                  title="Peso real do ML"
                  value={formatPercent(modelStatus?.effective_ml_weight)}
                  subtitle={modelStatus?.effective_ml_weight > 0 ? "ML entra no blend" : "Fallback heurístico domina"}
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

<<<<<<< HEAD

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Leitura histórica</h2>
                  <p>Resumo da confiabilidade real usada para calibrar a seleção dos mercados.</p>
                </div>
              </div>

              <section className="stats-grid stats-grid--mobile-stack">
                <StatCard
                  title="Status histórico"
                  value={historicalReliability?.label || "Base insuficiente"}
                  subtitle={`Nível: ${historicalReliability?.level || "low"}`}
                />
                <StatCard
                  title="Base resolvida"
                  value={historicalReliability?.resolved_total ?? 0}
                  subtitle="Usada para microajustes"
                />
                <StatCard
                  title="Accuracy histórica"
                  value={formatPercent(historicalReliability?.accuracy)}
                  subtitle="Resultados reais consolidados"
                />
              </section>
            </section>

=======
>>>>>>> 7183c46c4effe5b92bd6aee44ced5c5ce6ff2257
            <section className="stats-grid stats-grid--mobile-stack">
              <StatCard title="Jogos resolvidos" value={summary.resolved_total} />
              <StatCard title="Acertos" value={summary.hits} />
              <StatCard title="Erros" value={summary.misses} />
              <StatCard
                title="Acurácia geral"
                value={`${(Number(summary.accuracy || 0) * 100).toFixed(2)}%`}
              />
            </section>

            <section className="stats-grid stats-grid--mobile-stack">
              <StatCard title="Lucro total" value={formatMoney(summary.profit)} />
              <StatCard title="Stake total" value={formatMoney(summary.stake)} />
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
                    Compare alta, média e baixa confiança em acurácia, lucro e ROI.
                  </p>
                </div>
              </div>

              <div className="confidence-grid confidence-grid--mobile">
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


            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Performance por mercado</h2>
                  <p>Compara 1x2 e dupla hipótese em volume, acurácia e ROI.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mercado</th>
                      <th>Total</th>
                      <th>Hits</th>
                      <th>Misses</th>
                      <th>Acurácia</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMarket.length === 0 ? (
                      <tr>
                        <td colSpan="6">Ainda não há base resolvida por mercado.</td>
                      </tr>
                    ) : (
                      byMarket.map((item) => (
                        <tr key={item.market_type}>
                          <td>{item.market_type === "double_chance" ? "Dupla hipótese" : "1x2"}</td>
                          <td>{item.total}</td>
                          <td>{item.hits}</td>
                          <td>{item.misses}</td>
                          <td>{formatPercent(item.accuracy)}</td>
                          <td>{formatPercent(item.roi)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Classes e distribuição</h2>
                  <p>Resumo das classes aprendidas e da distribuição do dataset.</p>
                </div>
              </div>

              <section className="stats-grid stats-grid--mobile-stack">
                <StatCard
                  title="Classes"
                  value={Array.isArray(modelStatus?.classes) ? modelStatus.classes.length : 0}
                  subtitle={formatClasses(modelStatus?.classes)}
                />
                <StatCard
                  title="Casa (1)"
                  value={modelStatus?.class_distribution?.["1"] ?? 0}
                />
                <StatCard
                  title="Empate (X)"
                  value={modelStatus?.class_distribution?.["X"] ?? 0}
                />
                <StatCard
                  title="Fora (2)"
                  value={modelStatus?.class_distribution?.["2"] ?? 0}
                />
              </section>
            </section>

            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>Performance por liga</h2>
                  <p>Compare acurácia, lucro e ROI por campeonato.</p>
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

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Features do modelo</h2>
                  <p>Colunas usadas na última versão treinada.</p>
                </div>
              </div>

              {features.length === 0 ? (
                <div className="table-empty">Nenhuma feature registrada no modelo.</div>
              ) : (
                <div className="features-cloud">
                  {features.map((feature) => (
                    <span key={feature} className="pill pill--status-neutral feature-chip">
                      {feature}
                    </span>
                  ))}
                </div>
              )}
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

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR", {
      timeZone: "America/Recife",
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
  return classes.join(" • ");
}