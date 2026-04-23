import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { DASHBOARD_POLL_INTERVAL_MS } from "../api";
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

  async function loadData({ silent = false } = {}) {
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
    } finally {
      if (!silent) setLoading(false);
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

  const hero = useMemo(() => {
    return {
      profit: Number(summary?.profit ?? 0),
      roi: Number(summary?.roi ?? 0),
      accuracy: Number(summary?.accuracy ?? 0),
      pending: Number(summary?.pending_predictions ?? 0),
      live: Number(summary?.live_predictions ?? 0),
      todayResolved: Number(summary?.today_resolved_predictions ?? 0),
      totalPredictions: Number(summary?.total_predictions ?? 0),
      resolvedPredictions: Number(summary?.resolved_predictions ?? 0),
      valueBets: Number(summary?.value_bets ?? 0),
      highConfidence: Number(summary?.high_confidence_predictions ?? 0),
    };
  }, [summary]);

  const marketBreakdown = useMemo(() => {
    const total = predictions.length || 0;

    const oneXTwo = predictions.filter(
      (item) => normalizeMarketType(item.market_type) === "1x2"
    ).length;

    const doubleChance = predictions.filter(
      (item) => normalizeMarketType(item.market_type) === "double_chance"
    ).length;

    return {
      total,
      oneXTwo,
      doubleChance,
      oneXTwoRate: total ? oneXTwo / total : 0,
      doubleChanceRate: total ? doubleChance / total : 0,
    };
  }, [predictions]);

  const executiveInsight = useMemo(() => {
    const roi = Number(summary?.roi ?? 0);
    const acc = Number(summary?.accuracy ?? 0);
    const todayRoi = Number(summary?.today_roi ?? 0);
    const modelAcc = Number(modelStatus?.accuracy ?? 0);
    const pending = Number(summary?.pending_predictions ?? 0);
    const live = Number(summary?.live_predictions ?? 0);
    const dcCount = predictions.filter(
      (item) => normalizeMarketType(item.market_type) === "double_chance"
    ).length;

    if (roi > 0 && acc >= 0.55 && modelAcc >= 0.55) {
      return {
        tone: "good",
        title: "Operação saudável",
        text: `A operação está positiva, com ROI geral em ${formatPercent(
          roi
        )} e acurácia em ${formatPercent(
          acc
        )}. O modelo também está em boa condição para suportar entradas com maior confiança.`,
      };
    }

    if (todayRoi < 0 || acc < 0.5) {
      return {
        tone: "warning",
        title: "Atenção ao desempenho",
        text: `Os indicadores pedem cautela. O desempenho do dia e/ou a acurácia geral sugerem reduzir agressividade nas entradas e monitorar principalmente picks de confiança média.`,
      };
    }

    if (pending > 20 || live > 10) {
      return {
        tone: "info",
        title: "Carga operacional elevada",
        text: `Existe uma quantidade relevante de previsões pendentes e jogos ao vivo monitorados. Vale acompanhar a fila de resolução para evitar atraso na leitura de resultado.`,
      };
    }

    if (dcCount > 0) {
      return {
        tone: "neutral",
        title: "Mercados mistos em uso",
        text: `O sistema já está trabalhando com 1X2 e dupla hipótese. Vale acompanhar quais mercados estão entregando melhor combinação entre acurácia, ROI e edge.`,
      };
    }

    return {
      tone: "neutral",
      title: "Operação estável",
      text: `O painel mostra operação estável neste momento. O ideal é acompanhar lucro, ROI e qualidade do modelo em conjunto antes de aumentar exposição.`,
    };
  }, [summary, modelStatus, predictions]);

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

        <section className="hero-overview">
          <div className={`hero-primary-card ${getToneClassFromProfit(hero.profit)}`}>
            <div className="hero-primary-card__label">Lucro acumulado</div>
            <div className="hero-primary-card__value">{formatMoney(hero.profit)}</div>
            <div className="hero-primary-card__meta">
              <span>Stake total: {formatMoney(summary?.stake ?? 0)}</span>
              <span>{summary?.roi_items ?? 0} entradas válidas no ROI</span>
            </div>
          </div>

          <div className="hero-secondary-grid">
            <div className={`hero-mini-card ${getToneClassFromRoi(hero.roi)}`}>
              <span className="hero-mini-card__label">ROI</span>
              <strong className="hero-mini-card__value">{formatPercent(hero.roi)}</strong>
              <small className="hero-mini-card__sub">Retorno consolidado</small>
            </div>

            <div className={`hero-mini-card ${getToneClassFromAccuracy(hero.accuracy)}`}>
              <span className="hero-mini-card__label">Acurácia</span>
              <strong className="hero-mini-card__value">{formatPercent(hero.accuracy)}</strong>
              <small className="hero-mini-card__sub">Base resolvida</small>
            </div>

            <div className="hero-mini-card">
              <span className="hero-mini-card__label">Pendentes</span>
              <strong className="hero-mini-card__value">{hero.pending}</strong>
              <small className="hero-mini-card__sub">Aguardando fechamento</small>
            </div>

            <div className="hero-mini-card">
              <span className="hero-mini-card__label">Ao vivo</span>
              <strong className="hero-mini-card__value">{hero.live}</strong>
              <small className="hero-mini-card__sub">Monitoradas em live</small>
            </div>
          </div>
        </section>

        <section className={`executive-insight executive-insight--${executiveInsight.tone}`}>
          <div className="executive-insight__icon">
            {executiveInsight.tone === "good"
              ? "📈"
              : executiveInsight.tone === "warning"
              ? "⚠️"
              : executiveInsight.tone === "info"
              ? "🛰️"
              : "🧠"}
          </div>

          <div className="executive-insight__content">
            <strong>{executiveInsight.title}</strong>
            <p>{executiveInsight.text}</p>
          </div>
        </section>

        <section className="context-strip">
          <div className="context-chip">
            <span className="context-chip__label">Resolvidas hoje</span>
            <strong>{hero.todayResolved}</strong>
          </div>

          <div className="context-chip">
            <span className="context-chip__label">Lucro hoje</span>
            <strong className={getValueTextClass(summary?.today_profit)}>
              {formatMoney(summary?.today_profit ?? 0)}
            </strong>
          </div>

          <div className="context-chip">
            <span className="context-chip__label">ROI hoje</span>
            <strong className={getValueTextClass(summary?.today_roi, true)}>
              {formatPercent(summary?.today_roi ?? 0)}
            </strong>
          </div>

          <div className="context-chip">
            <span className="context-chip__label">Modelo carregado</span>
            <strong>{modelStatus?.model_loaded ? "Sim" : "Não"}</strong>
          </div>

          <div className="context-chip">
            <span className="context-chip__label">Último treino</span>
            <strong>{formatDateTime(modelStatus?.last_training_at)}</strong>
          </div>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Resumo geral</h2>
              <p>Visão consolidada de toda a base do sistema.</p>
            </div>
          </div>

          <section className="stats-grid stats-grid--dense">
            <MetricCard title="Previsões" value={summary?.total_predictions ?? 0} />
            <MetricCard title="Resolvidas" value={summary?.resolved_predictions ?? 0} />
            <MetricCard title="Acertos" value={summary?.hits ?? 0} tone="good" />
            <MetricCard title="Erros" value={summary?.misses ?? 0} tone="bad" />
            <MetricCard
              title="Acurácia"
              value={formatPercent(summary?.accuracy ?? 0)}
              tone={getMetricToneByPercentage(summary?.accuracy)}
            />
            <MetricCard title="Pendentes" value={summary?.pending_predictions ?? 0} tone="mid" />
            <MetricCard title="Ao vivo" value={summary?.live_predictions ?? 0} tone="info" />
            <MetricCard
              title="Confiança alta"
              value={summary?.high_confidence_predictions ?? 0}
              tone="good"
            />
            <MetricCard title="Value bets" value={summary?.value_bets ?? 0} tone="accent" />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Leitura por mercado</h2>
              <p>Distribuição recente entre 1X2 e dupla hipótese.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Mercado 1X2"
              value={marketBreakdown.oneXTwo}
              subtitle={`${formatPercent(marketBreakdown.oneXTwoRate)} das previsões listadas`}
            />
            <StatCard
              title="Dupla hipótese"
              value={marketBreakdown.doubleChance}
              subtitle={`${formatPercent(
                marketBreakdown.doubleChanceRate
              )} das previsões listadas`}
            />
            <StatCard
              title="Value bets"
              value={hero.valueBets}
              subtitle="Entradas com valor detectado"
            />
            <StatCard
              title="Confiança alta"
              value={hero.highConfidence}
              subtitle="Base geral do sistema"
            />
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
            <StatCard title="Stake total" value={formatMoney(summary?.stake ?? 0)} />
            <StatCard title="ROI" value={formatPercent(summary?.roi ?? 0)} />
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
              <h2>Baixas do dia</h2>
              <p>Baseado no momento em que o sistema consolidou o resultado.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard title="Resolvidas hoje" value={summary?.today_resolved_predictions ?? 0} />
            <StatCard title="Acertos hoje" value={summary?.today_hits ?? 0} />
            <StatCard title="Erros hoje" value={summary?.today_misses ?? 0} />
            <StatCard
              title="Acurácia hoje"
              value={formatPercent(summary?.today_accuracy ?? 0)}
            />
            <StatCard title="Ao vivo hoje" value={summary?.today_live_predictions ?? 0} />
          </section>
        </section>

        <section className="panel panel--spaced">
          <div className="panel__header">
            <div>
              <h2>Financeiro das baixas do dia</h2>
              <p>Lucro e ROI das previsões consolidadas hoje pelo sistema.</p>
            </div>
          </div>

          <section className="stats-grid">
            <StatCard
              title="Lucro hoje"
              value={formatMoney(summary?.today_profit ?? 0)}
              subtitle={`${summary?.today_roi_items ?? 0} entradas com odd válida`}
            />
            <StatCard title="Stake hoje" value={formatMoney(summary?.today_stake ?? 0)} />
            <StatCard title="ROI hoje" value={formatPercent(summary?.today_roi ?? 0)} />
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
              subtitle="Consolidadas pelo sistema"
            />
            <StatCard
              title="Acertos hoje"
              value={summary?.today_hits ?? 0}
              subtitle="Desempenho das baixas do dia"
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
              subtitle={
                modelStatus?.model_loaded ? "Pronto para inferência" : "Fallback heurístico"
              }
            />
            <StatCard
              title="Último treino"
              value={formatDateTime(modelStatus?.last_training_at)}
              subtitle="Baseado no arquivo do modelo"
            />
            <StatCard
              title="Dataset"
              value={modelStatus?.rows ?? 0}
              subtitle={`Treino: ${modelStatus?.train_rows ?? 0} • Teste: ${
                modelStatus?.test_rows ?? 0
              }`}
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

          <div className="model-detail-grid">
            <div className="model-detail-card">
              <span className="model-detail-card__label">Leitura rápida</span>
              <strong className={getValueTextClass(modelStatus?.accuracy, true)}>
                {Number(modelStatus?.accuracy ?? 0) >= 0.6
                  ? "Modelo forte"
                  : Number(modelStatus?.accuracy ?? 0) >= 0.52
                  ? "Modelo aceitável"
                  : "Modelo fraco"}
              </strong>
              <small>Baseado na accuracy atual e consistência esperada para inferência.</small>
            </div>

            <div className="model-detail-card">
              <span className="model-detail-card__label">Cobertura de treino</span>
              <strong>{modelStatus?.train_rows ?? 0}</strong>
              <small>Linhas usadas no treino do modelo.</small>
            </div>

            <div className="model-detail-card">
              <span className="model-detail-card__label">Cobertura de teste</span>
              <strong>{modelStatus?.test_rows ?? 0}</strong>
              <small>Linhas usadas na validação holdout.</small>
            </div>
          </div>
        </section>

        <section className="quick-actions">
          <button className="action-card" onClick={() => navigate("/predictions")}>
            <span className="action-card__emoji">📊</span>
            <div>
              <strong>Ver previsões</strong>
              <small>Acompanhar entradas e picks recentes</small>
            </div>
          </button>

          <button className="action-card" onClick={() => navigate("/results")}>
            <span className="action-card__emoji">🏁</span>
            <div>
              <strong>Ver resultados</strong>
              <small>Checar hits, misses e fechamento</small>
            </div>
          </button>

          <button className="action-card" onClick={() => navigate("/market")}>
            <span className="action-card__emoji">💰</span>
            <div>
              <strong>Mercado / CLV</strong>
              <small>Monitorar preço e valor das entradas</small>
            </div>
          </button>

          <button className="action-card" onClick={() => navigate("/model")}>
            <span className="action-card__emoji">🤖</span>
            <div>
              <strong>Status do modelo</strong>
              <small>Treino, dataset e qualidade técnica</small>
            </div>
          </button>
        </section>

        <section className="panel">
          <div className="panel__header panel__header--stack-on-mobile">
            <div>
              <h2>Últimas previsões</h2>
              <p>Entradas mais recentes registradas no sistema.</p>
            </div>

            <div className="panel__header-actions">
              <span className="mini-kpi">
                <strong>{marketBreakdown.oneXTwo}</strong>
                <small>1X2</small>
              </span>
              <span className="mini-kpi">
                <strong>{marketBreakdown.doubleChance}</strong>
                <small>Dupla hipótese</small>
              </span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Liga</th>
                  <th>Jogo</th>
                  <th>Mercado</th>
                  <th>Pick</th>
                  <th>Prob.</th>
                  <th>Odd</th>
                  <th>Edge</th>
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
                    <td colSpan="12" className="table-empty">
                      Nenhuma previsão encontrada no banco.
                    </td>
                  </tr>
                ) : (
                  predictions.map((item) => {
                    const marketType = normalizeMarketType(item.market_type);
                    const bestProbability =
                      item.best_probability ??
                      item.double_chance_probability ??
                      item.main_market_probability ??
                      null;

                    const edge =
                      item.edge ??
                      item.value_bet_edge ??
                      item.odds_snapshot?.edge ??
                      null;

                    const currentOdd =
                      item.latest_market_odds ??
                      item.opening_market_odds ??
                      null;

                    return (
                      <tr key={item.id || item.fixture_id}>
                        <td>
                          <div className="league-cell">
                            <strong>{item.league_name || "-"}</strong>
                          </div>
                        </td>

                        <td>
                          <div className="match-cell">
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
                                {item.match_date || "-"} • {item.match_time || "-"}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className={`market-badge market-badge--${marketType}`}>
                            {formatMarketType(marketType)}
                          </span>
                        </td>

                        <td>
                          <div className="pick-stack">
                            <span className="pick-badge">{formatPick(item.pick || "-")}</span>
                            <small className="muted-text">{item.pick || "-"}</small>
                          </div>
                        </td>

                        <td>
                          <strong className="table-strong">
                            {formatPercent(bestProbability)}
                          </strong>
                        </td>

                        <td>
                          <strong className="table-strong">{formatOdd(currentOdd)}</strong>
                        </td>

                        <td>
                          <span className={getValueTextClass(edge, true)}>
                            {formatPercent(edge)}
                          </span>
                        </td>

                        <td>
                          <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                            {item.confidence || "-"}
                          </span>
                        </td>

                        <td>{item.model_source || "-"}</td>

                        <td>
                          <span className={`pill pill--status-${normalizeStatus(item.status)}`}>
                            {formatStatus(item.status)}
                          </span>
                        </td>

                        <td>
                          <div className="status-tech-cell">
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value, tone = "neutral" }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__title">{title}</span>
      <strong className="metric-card__value">{value}</strong>
    </div>
  );
}

function getMetricToneByPercentage(value) {
  const number = Number(value ?? 0);
  if (number >= 0.6) return "good";
  if (number >= 0.5) return "mid";
  return "bad";
}

function getToneClassFromProfit(value) {
  const number = Number(value ?? 0);
  if (number > 0) return "tone-good";
  if (number < 0) return "tone-bad";
  return "tone-neutral";
}

function getToneClassFromRoi(value) {
  const number = Number(value ?? 0);
  if (number > 0.05) return "tone-good";
  if (number < 0) return "tone-bad";
  return "tone-neutral";
}

function getToneClassFromAccuracy(value) {
  const number = Number(value ?? 0);
  if (number >= 0.6) return "tone-good";
  if (number >= 0.5) return "tone-mid";
  return "tone-bad";
}

function getValueTextClass(value, isPercent = false) {
  const number = Number(value ?? 0);

  if (isPercent) {
    if (number > 0.05 || number >= 0.6) return "text-good";
    if (number < 0) return "text-bad";
    return "text-neutral";
  }

  if (number > 0) return "text-good";
  if (number < 0) return "text-bad";
  return "text-neutral";
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

function normalizeMarketType(value) {
  const text = String(value || "").toLowerCase().trim();
  if (text === "double_chance") return "double_chance";
  return "1x2";
}

function formatMarketType(value) {
  return normalizeMarketType(value) === "double_chance" ? "Dupla hipótese" : "1X2";
}

function formatPick(value) {
  const pick = String(value || "").toUpperCase().trim();

  if (pick === "1") return "Casa";
  if (pick === "X") return "Empate";
  if (pick === "2") return "Fora";
  if (pick === "1X") return "Casa ou Empate";
  if (pick === "X2") return "Empate ou Fora";
  if (pick === "12") return "Casa ou Fora";

  return pick || "-";
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

function formatOdd(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  return number.toFixed(2);
}