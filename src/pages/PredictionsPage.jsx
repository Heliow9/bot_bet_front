import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { DASHBOARD_POLL_INTERVAL_MS } from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

export default function PredictionsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("confidence");
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard/predictions/pending?limit=50");
      setItems(response.data.items || []);
      setLastRefreshAt(new Date());
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!navigator.onLine) {
        setError("Você está offline no momento.");
      } else {
        setError("Não foi possível carregar as previsões pendentes.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
<<<<<<< HEAD
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, DASHBOARD_POLL_INTERVAL_MS);
=======
      loadData(true);
    }, 30000);
>>>>>>> 7183c46c4effe5b92bd6aee44ced5c5ce6ff2257

    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const search = query.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(item.league_name || "").toLowerCase().includes(search) ||
        String(item.home_team || "").toLowerCase().includes(search) ||
        String(item.away_team || "").toLowerCase().includes(search) ||
        String(item.pick || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && item.is_live) ||
        (statusFilter === "waiting" && !item.is_live);

      const confidenceType = normalizeConfidence(item.confidence);
      const matchesConfidence =
        confidenceFilter === "all" || confidenceFilter === confidenceType;

      return matchesSearch && matchesStatus && matchesConfidence;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "confidence") {
        return getConfidenceScore(b.confidence) - getConfidenceScore(a.confidence);
      }

      if (sortBy === "live") {
        return Number(b.is_live) - Number(a.is_live);
      }

      if (sortBy === "updated") {
        return (
          getDateTimestamp(b.last_checked_at || b.checked_at) -
          getDateTimestamp(a.last_checked_at || a.checked_at)
        );
      }

      if (sortBy === "probability") {
        return getTopProbability(b) - getTopProbability(a);
      }

      return 0;
    });
  }, [items, query, statusFilter, confidenceFilter, sortBy]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const live = filteredItems.filter((item) => item.is_live).length;
    const high = filteredItems.filter(
      (item) => normalizeConfidence(item.confidence) === "high"
    ).length;

    const avgTopProbability = filteredItems.length
      ? Math.round(
          filteredItems.reduce((acc, item) => acc + getTopProbability(item), 0) /
            filteredItems.length
        )
      : 0;

    return {
      total,
      live,
      high,
      avgTopProbability,
    };
  }, [filteredItems]);

  const liveSummary = useMemo(() => {
    const liveItems = filteredItems.filter((item) => item.is_live);

    const recentlyChecked = [...liveItems].sort(
      (a, b) =>
        getDateTimestamp(b.last_checked_at || b.checked_at) -
        getDateTimestamp(a.last_checked_at || a.checked_at)
    );

    return {
      total: liveItems.length,
      matches: liveItems.slice(0, 3),
      lastCheckedAt:
        recentlyChecked.length > 0
          ? recentlyChecked[0].last_checked_at || recentlyChecked[0].checked_at
          : null,
    };
  }, [filteredItems]);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Previsões pendentes"
          eyebrow="Operação diária"
        />

        <section className="panel predictions-shell predictions-shell--mobile-optimized">
          <div className="predictions-hero predictions-hero--compact">
            <div className="predictions-hero__content">
              <span className="predictions-hero__eyebrow">Monitoramento</span>
              <h2>Central de previsões pendentes</h2>
              <p>
                Acompanhe partidas em aberto, confiança, status técnico e cenário
                mais forte de forma rápida.
              </p>
            </div>

            <button
              className={`action-btn action-btn--full-mobile ${refreshing ? "is-loading" : ""}`}
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              {refreshing ? "Atualizando..." : "Atualizar dados"}
            </button>
          </div>

          <div className="stats-strip stats-strip--mobile-2col">
            <article className="metric-card metric-card--strong">
              <span>Total</span>
              <strong>{stats.total}</strong>
              <small>previsões visíveis</small>
            </article>

            <article className="metric-card">
              <span>Ao vivo</span>
              <strong>{stats.live}</strong>
              <small>partidas monitoradas</small>
            </article>

            <article className="metric-card">
              <span>Alta confiança</span>
              <strong>{stats.high}</strong>
              <small>sinais mais fortes</small>
            </article>

            <article className="metric-card">
              <span>Prob. média topo</span>
              <strong>{stats.avgTopProbability}%</strong>
              <small>força média</small>
            </article>
          </div>

          <div className="toolbar-card toolbar-card--mobile">
            <div className="toolbar-grid toolbar-grid--mobile">
              <div className="field-group field-group--search">
                <label htmlFor="prediction-search">Buscar previsão</label>
                <input
                  id="prediction-search"
                  type="text"
                  placeholder="Liga, times ou pick"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="status-filter">Status técnico</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="live">Ao vivo</option>
                  <option value="waiting">Aguardando</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="confidence-filter">Confiança</label>
                <select
                  id="confidence-filter"
                  value={confidenceFilter}
                  onChange={(e) => setConfidenceFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="sort-by">Ordenar por</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="confidence">Confiança</option>
                  <option value="probability">Maior probabilidade</option>
                  <option value="live">Ao vivo primeiro</option>
                  <option value="updated">Última checagem</option>
                </select>
              </div>
            </div>

            <div className="toolbar-tags toolbar-tags--scroll">
              <button
                className={`toolbar-tag ${statusFilter === "all" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </button>
              <button
                className={`toolbar-tag ${statusFilter === "live" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("live")}
              >
                Ao vivo
              </button>
              <button
                className={`toolbar-tag ${confidenceFilter === "high" ? "is-active" : ""}`}
                onClick={() => setConfidenceFilter("high")}
              >
                Alta confiança
              </button>
            </div>

            <div className="toolbar-meta toolbar-meta--compact">
              <small className="muted-text">
                Última atualização da tela:{" "}
                <strong>{formatDateTime(lastRefreshAt)}</strong>
              </small>
            </div>
          </div>

          <section className="panel panel--spaced live-summary-panel">
            <div className="panel__header">
              <div>
                <h2>Resumo live</h2>
                <p>Visão rápida das partidas em andamento.</p>
              </div>
            </div>

            {liveSummary.total === 0 ? (
              <div className="state-box">Nenhuma partida em live neste momento.</div>
            ) : (
              <>
                <div className="stats-strip stats-strip--mobile-2col">
                  <article className="metric-card metric-card--strong">
                    <span>Jogos em live</span>
                    <strong>{liveSummary.total}</strong>
                    <small>monitorados agora</small>
                  </article>

                  <article className="metric-card">
                    <span>Última checagem</span>
                    <strong>{formatTimeOnly(liveSummary.lastCheckedAt)}</strong>
                    <small>{formatDateOnly(liveSummary.lastCheckedAt)}</small>
                  </article>
                </div>

                <div className="predictions-mobile-list predictions-mobile-list--compact">
                  {liveSummary.matches.map((item) => (
                    <article className="prediction-premium-card" key={`live-${item.id}`}>
                      <div className="prediction-premium-card__head">
                        <div className="prediction-premium-card__league-wrap">
                          <span className="league-chip">
                            {item.league_name || "Liga não informada"}
                          </span>
                          <span className="live-dot">Ao vivo</span>
                        </div>

                        <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                          {item.confidence || "Baixa"}
                        </span>
                      </div>

                      <div className="match-block">
                        <h3>
                          {item.home_team} <span>x</span> {item.away_team}
                        </h3>
                        <p>
                          Status técnico:{" "}
                          <strong>{item.last_status_text || "Ao vivo"}</strong>
                        </p>
                      </div>

                      <div className="info-grid">
                        <div className="info-cell">
                          <span>Pick</span>
                          <strong>{item.pick || "-"}</strong>
                        </div>

                        <div className="info-cell">
                          <span>Última checagem</span>
                          <strong>{formatTimeOnly(item.last_checked_at || item.checked_at)}</strong>
                        </div>

                        <div className="info-cell info-cell--full">
                          <span>Placar</span>
                          <strong>
                            {item.home_score ?? "-"} x {item.away_score ?? "-"}
                          </strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          {loading ? (
            <div className="state-box">Carregando previsões...</div>
          ) : error ? (
            <div className="state-box">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="state-box">Nenhuma previsão pendente encontrada.</div>
          ) : (
            <>
              <div className="predictions-mobile-list">
                {filteredItems.map((item) => {
                  const confidenceType = normalizeConfidence(item.confidence);
                  const topOutcome = getTopOutcome(item);
                  const topProbability = getTopProbability(item);

                  return (
                    <article className="prediction-premium-card" key={item.id}>
                      <div className="prediction-premium-card__head">
                        <div className="prediction-premium-card__league-wrap">
                          <span className="league-chip">
                            {item.league_name || "Liga não informada"}
                          </span>
                          {item.is_live && <span className="live-dot">Ao vivo</span>}
                        </div>

                        <span className={`pill pill--${confidenceType}`}>
                          {item.confidence || "Baixa"}
                        </span>
                      </div>

                      <div className="match-block">
                        <h3>
                          {item.home_team} <span>x</span> {item.away_team}
                        </h3>
                        <p>
                          Pick principal: <strong>{item.pick || "-"}</strong>
                        </p>
                      </div>

                      <div className="highlight-banner">
                        <div>
                          <span>Cenário mais forte</span>
                          <strong>{getOutcomeLabel(topOutcome)}</strong>
                        </div>

                        <div className="highlight-banner__score">
                          <strong>{topProbability}%</strong>
                        </div>
                      </div>

                      <div className="probability-stack">
                        <ProbabilityLine
                          label="Casa"
                          value={toPercent(item.prob_home)}
                          active={topOutcome === "home"}
                        />
                        <ProbabilityLine
                          label="Empate"
                          value={toPercent(item.prob_draw)}
                          active={topOutcome === "draw"}
                        />
                        <ProbabilityLine
                          label="Fora"
                          value={toPercent(item.prob_away)}
                          active={topOutcome === "away"}
                        />
                      </div>

                      <div className="info-grid">
                        <div className="info-cell">
                          <span>Status</span>
                          <strong>Pending</strong>
                        </div>

                        <div className="info-cell">
                          <span>Status técnico</span>
                          <strong>
                            {item.is_live ? "Ao vivo" : item.last_status_text || "Aguardando"}
                          </strong>
                        </div>

                        <div className="info-cell info-cell--full">
                          <span>Última checagem</span>
                          <strong>{formatDateTime(item.last_checked_at || item.checked_at)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="table-wrap table-wrap--desktop">
                <table className="data-table predictions-table">
                  <thead>
                    <tr>
                      <th>Liga</th>
                      <th>Jogo</th>
                      <th>Pick</th>
                      <th>Maior cenário</th>
                      <th>Probabilidades</th>
                      <th>Confiança</th>
                      <th>Status técnico</th>
                      <th>Última checagem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((item) => {
                      const topOutcome = getTopOutcome(item);
                      const topProbability = getTopProbability(item);

                      return (
                        <tr key={item.id}>
                          <td>{item.league_name}</td>

                          <td>
                            <strong>
                              {item.home_team} x {item.away_team}
                            </strong>
                          </td>

                          <td>
                            <span className="desktop-pick">{item.pick || "-"}</span>
                          </td>

                          <td>
                            <div className="desktop-top-outcome">
                              <strong>{getOutcomeLabel(topOutcome)}</strong>
                              <span>{topProbability}%</span>
                            </div>
                          </td>

                          <td>
                            <div className="table-probs">
                              <span>C {toPercent(item.prob_home)}%</span>
                              <span>E {toPercent(item.prob_draw)}%</span>
                              <span>F {toPercent(item.prob_away)}%</span>
                            </div>
                          </td>

                          <td>
                            <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                              {item.confidence || "Baixa"}
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
                              {formatDateTime(item.last_checked_at || item.checked_at)}
                            </small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function ProbabilityLine({ label, value, active }) {
  return (
    <div className={`prob-line ${active ? "prob-line--active" : ""}`}>
      <div className="prob-line__top">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="prob-line__track">
        <div className="prob-line__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function normalizeConfidence(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("alta")) return "high";
  if (text.includes("média") || text.includes("media")) return "medium";
  return "low";
}

function getConfidenceScore(value) {
  const type = normalizeConfidence(value);
  if (type === "high") return 3;
  if (type === "medium") return 2;
  return 1;
}

function toPercent(value) {
  return Math.round((Number(value) || 0) * 100);
}

function getTopOutcome(item) {
  const values = {
    home: Number(item.prob_home) || 0,
    draw: Number(item.prob_draw) || 0,
    away: Number(item.prob_away) || 0,
  };

  return Object.entries(values).sort((a, b) => b[1] - a[1])[0][0];
}

function getTopProbability(item) {
  return Math.max(
    toPercent(item.prob_home),
    toPercent(item.prob_draw),
    toPercent(item.prob_away)
  );
}

function getOutcomeLabel(outcome) {
  if (outcome === "home") return "Casa";
  if (outcome === "draw") return "Empate";
  return "Fora";
}

function normalizeBackendDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  if (!text) return null;

  const hasTimezone =
    text.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(text);

  const normalized = hasTimezone ? text : `${text}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getDateTimestamp(value) {
  const date = normalizeBackendDate(value);
  return date ? date.getTime() : 0;
}

function formatDateTime(value) {
  const date = normalizeBackendDate(value);
  if (!date) return "-";

  try {
    return date.toLocaleString("pt-BR", {
      timeZone: "America/Recife",
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}

function formatTimeOnly(value) {
  const date = normalizeBackendDate(value);
  if (!date) return "-";

  try {
    return date.toLocaleTimeString("pt-BR", {
      timeZone: "America/Recife",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatDateOnly(value) {
  const date = normalizeBackendDate(value);
  if (!date) return "-";

  try {
    return date.toLocaleDateString("pt-BR", {
      timeZone: "America/Recife",
    });
  } catch {
    return "-";
  }
}