import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

export default function MarketPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);

      setError("");
      const response = await api.get("/dashboard/market?limit=50");
      setItems(Array.isArray(response.data?.items) ? response.data.items : []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      console.error("Erro ao carregar mercado:", err);
      setError("Não foi possível carregar os dados de mercado.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const summary = useMemo(() => {
    const pending = items.filter((item) => getMatchStatus(item).type === "pending").length;
    const live = items.filter((item) => getMatchStatus(item).type === "live").length;
    const resolved = items.filter((item) => getMatchStatus(item).type === "resolved").length;
    const valueBets = items.filter((item) => Boolean(item?.has_value_bet)).length;
    const doubleChance = items.filter((item) => normalizeMarketType(item) === "double_chance").length;

    return {
      pending,
      live,
      resolved,
      total: items.length,
      valueBets,
      doubleChance,
    };
  }, [items]);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Mercado / CLV"
          eyebrow="Odds, movimento de linha e status da partida"
        />

        <section className="panel market-panel">
          <div className="panel__header panel__header--market">
            <div>
              <h2>Leitura de mercado</h2>
              <p>
                Veja abertura, odd atual, edge, direção da linha, tipo de mercado e
                se a partida está pendente, ao vivo ou resolvida.
              </p>
            </div>

            {!loading && !error && (
              <div className="market-summary">
                <div className="market-summary__card market-summary__card--total">
                  <span className="market-summary__label">Total</span>
                  <strong>{summary.total}</strong>
                </div>

                <div className="market-summary__card market-summary__card--pending">
                  <span className="market-summary__label">Pendentes</span>
                  <strong>{summary.pending}</strong>
                </div>

                <div className="market-summary__card market-summary__card--live">
                  <span className="market-summary__label">Ao vivo</span>
                  <strong>{summary.live}</strong>
                </div>

                <div className="market-summary__card market-summary__card--resolved">
                  <span className="market-summary__label">Resolvidos</span>
                  <strong>{summary.resolved}</strong>
                </div>
              </div>
            )}
          </div>

          {!loading && !error && items.length > 0 ? (
            <div className="context-strip" style={{ marginBottom: "1rem" }}>
              <div className="context-chip">
                <span className="context-chip__label">Value bets</span>
                <strong>{summary.valueBets}</strong>
              </div>

              <div className="context-chip">
                <span className="context-chip__label">Dupla hipótese</span>
                <strong>{summary.doubleChance}</strong>
              </div>

              <div className="context-chip">
                <span className="context-chip__label">Mercado 1X2</span>
                <strong>{summary.total - summary.doubleChance}</strong>
              </div>

              <div className="context-chip">
                <span className="context-chip__label">Melhor edge</span>
                <strong className={edgeClass(getBestEdge(items))}>
                  {formatEdge(getBestEdge(items))}
                </strong>
              </div>

              <div className="context-chip">
                <span className="context-chip__label">Atualização</span>
                <strong>30s</strong>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="table-empty">Carregando mercado...</div>
          ) : error ? (
            <div className="table-empty">{error}</div>
          ) : (
            <>
              <div className="table-wrap table-wrap--desktop">
                <table className="data-table market-table">
                  <thead>
                    <tr>
                      <th>Jogo</th>
                      <th>Status</th>
                      <th>Mercado</th>
                      <th>Pick</th>
                      <th>Bookmaker</th>
                      <th>Abertura</th>
                      <th>Atual</th>
                      <th>Mov.</th>
                      <th>Edge</th>
                      <th>Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="table-empty">
                          Nenhum dado de mercado encontrado.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const matchStatus = getMatchStatus(item);
                        const marketType = normalizeMarketType(item);
                        const marketLabel = formatMarketType(marketType);
                        const marketClass =
                          marketType === "double_chance"
                            ? "market-type-badge market-type-badge--double_chance"
                            : "market-type-badge market-type-badge--1x2";

                        return (
                          <tr
                            key={
                              item.prediction_id ||
                              item.id ||
                              `${item.home_team}-${item.away_team}-${index}`
                            }
                            className={`market-row market-row--${matchStatus.type}`}
                          >
                            <td>
                              <div className="market-game">
                                <div className="market-game__teams">
                                  {item.home_team} <span>x</span> {item.away_team}
                                </div>

                                <div className="market-game__meta">
                                  <small>{item.league_name || "-"}</small>

                                  {item.match_date ? (
                                    <small>{formatDateTime(item.match_date)}</small>
                                  ) : null}

                                  {item.confidence ? (
                                    <small>Confiança: {formatConfidence(item.confidence)}</small>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className={`pill ${matchStatus.className}`}>
                                {matchStatus.label}
                              </span>
                            </td>

                            <td>
                              <span className={marketClass}>{marketLabel}</span>
                            </td>

                            <td>
                              <div className="league-cell">
                                <span className="market-pick">
                                  {formatPickLabel(item.pick, marketType)}
                                </span>
                                <small className="muted-text">{item.pick || "-"}</small>
                              </div>
                            </td>

                            <td>{item.bookmaker || "-"}</td>
                            <td>{formatOdd(item.opening_market_odds)}</td>
                            <td>{formatOdd(item.latest_market_odds)}</td>

                            <td>
                              <span
                                className={`pill pill--movement-${normalizeMovementDirection(
                                  item.movement_direction,
                                  item.movement
                                )}`}
                              >
                                {formatMovement(item.movement)}
                              </span>
                            </td>

                            <td>
                              <div className="league-cell">
                                <span className={edgeClass(item.edge)}>
                                  {formatEdge(item.edge)}
                                </span>

                                {item.fair_odds !== undefined && item.fair_odds !== null ? (
                                  <small className="muted-text">
                                    Justa: {formatOdd(item.fair_odds)}
                                  </small>
                                ) : null}
                              </div>
                            </td>

                            <td>
                              {item.has_value_bet ? (
                                <span className="pill pill--high">Sim</span>
                              ) : (
                                <span className="pill pill--low">Não</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="market-mobile-list">
                {items.length === 0 ? (
                  <div className="table-empty">Nenhum dado de mercado encontrado.</div>
                ) : (
                  items.map((item, index) => {
                    const matchStatus = getMatchStatus(item);
                    const marketType = normalizeMarketType(item);
                    const marketLabel = formatMarketType(marketType);
                    const marketClass =
                      marketType === "double_chance"
                        ? "market-type-badge market-type-badge--double_chance"
                        : "market-type-badge market-type-badge--1x2";

                    return (
                      <article
                        key={
                          item.prediction_id ||
                          item.id ||
                          `${item.home_team}-${item.away_team}-mobile-${index}`
                        }
                        className={`market-card market-card--${matchStatus.type}`}
                      >
                        <div className="market-card__top">
                          <div className="market-card__league-wrap">
                            <span className="league-chip">{item.league_name || "Liga"}</span>
                            <span className={`pill ${matchStatus.className}`}>
                              {matchStatus.label}
                            </span>
                            <span className={marketClass}>{marketLabel}</span>
                          </div>

                          {item.has_value_bet ? (
                            <span className="pill pill--high">Value</span>
                          ) : (
                            <span className="pill pill--low">Sem value</span>
                          )}
                        </div>

                        <div className="market-card__match">
                          <h3>
                            {item.home_team} <span>x</span> {item.away_team}
                          </h3>
                          <p>
                            {item.match_date ? formatDateTime(item.match_date) : "Data não informada"}
                          </p>
                        </div>

                        <div className="market-card__pick">
                          <span>Pick</span>
                          <strong>{formatPickLabel(item.pick, marketType)}</strong>
                        </div>

                        <div className="market-card__grid">
                          <div className="market-info-cell">
                            <span>Bookmaker</span>
                            <strong>{item.bookmaker || "-"}</strong>
                          </div>

                          <div className="market-info-cell">
                            <span>Abertura</span>
                            <strong>{formatOdd(item.opening_market_odds)}</strong>
                          </div>

                          <div className="market-info-cell">
                            <span>Atual</span>
                            <strong>{formatOdd(item.latest_market_odds)}</strong>
                          </div>

                          <div className="market-info-cell">
                            <span>Movimento</span>
                            <strong>
                              <span
                                className={`pill pill--movement-${normalizeMovementDirection(
                                  item.movement_direction,
                                  item.movement
                                )}`}
                              >
                                {formatMovement(item.movement)}
                              </span>
                            </strong>
                          </div>

                          <div className="market-info-cell">
                            <span>Edge</span>
                            <strong className={edgeClass(item.edge)}>
                              {formatEdge(item.edge)}
                            </strong>
                          </div>

                          <div className="market-info-cell">
                            <span>Status</span>
                            <strong>{matchStatus.label}</strong>
                          </div>

                          {item.fair_odds !== undefined && item.fair_odds !== null ? (
                            <div className="market-info-cell">
                              <span>Odd justa</span>
                              <strong>{formatOdd(item.fair_odds)}</strong>
                            </div>
                          ) : null}

                          {item.confidence ? (
                            <div className="market-info-cell">
                              <span>Confiança</span>
                              <strong>{formatConfidence(item.confidence)}</strong>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function getMatchStatus(item) {
  const rawStatus = String(
    item?.market_status ||
      item?.status ||
      item?.match_status ||
      item?.fixture_status ||
      item?.prediction_status ||
      ""
  )
    .trim()
    .toLowerCase();

  if (item?.is_live === true || rawStatus === "live") {
    return {
      type: "live",
      label: "Ao vivo",
      className: "pill--status-live",
    };
  }

  if (
    item?.is_resolved === true ||
    rawStatus === "resolved" ||
    rawStatus === "hit" ||
    rawStatus === "miss"
  ) {
    return {
      type: "resolved",
      label: "Resolvido",
      className: rawStatus === "miss" ? "pill--status-miss" : "pill--status-hit",
    };
  }

  if (rawStatus === "pending") {
    return {
      type: "pending",
      label: "Pendente",
      className: "pill--status-pending",
    };
  }

  return {
    type: "unknown",
    label: "Sem status",
    className: "pill--status-neutral",
  };
}

function normalizeMarketType(item) {
  const raw = String(item?.market_type || item?.market || "1x2")
    .trim()
    .toLowerCase();

  if (
    raw === "double_chance" ||
    raw === "double chance" ||
    raw === "dupla hipotese" ||
    raw === "dupla hipótese"
  ) {
    return "double_chance";
  }

  return "1x2";
}

function formatMarketType(value) {
  return value === "double_chance" ? "Dupla hipótese" : "1X2";
}

function formatPickLabel(pick, marketType = "1x2") {
  const normalizedPick = String(pick || "").trim().toUpperCase();

  if (!normalizedPick) return "-";

  if (marketType === "double_chance") {
    if (normalizedPick === "1X") return "Casa ou empate";
    if (normalizedPick === "X2") return "Empate ou fora";
    if (normalizedPick === "12") return "Casa ou fora";
  }

  if (normalizedPick === "1") return "Casa";
  if (normalizedPick === "X") return "Empate";
  if (normalizedPick === "2") return "Fora";

  return normalizedPick;
}

function formatConfidence(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("alta")) return "Alta";
  if (raw.includes("média") || raw.includes("media")) return "Média";
  if (raw.includes("baixa")) return "Baixa";
  return value || "-";
}

function normalizeMovementDirection(direction, movement) {
  const raw = String(direction || "").toLowerCase();

  if (raw === "up" || raw === "down" || raw === "stable") {
    return raw;
  }

  const num = Number(movement);
  if (Number.isNaN(num) || num === 0) return "stable";
  return num > 0 ? "up" : "down";
}

function formatOdd(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(2);
}

function formatMovement(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  if (num > 0) return `+${num.toFixed(2)}`;
  return num.toFixed(2);
}

function formatEdge(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function edgeClass(value) {
  if (value === null || value === undefined || value === "") return "text-neutral";

  const num = Number(value);
  if (Number.isNaN(num)) return "text-neutral";

  if (num >= 0.05) return "text-good";
  if (num <= 0) return "text-bad";
  return "text-neutral";
}

function getBestEdge(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const validEdges = items
    .map((item) => Number(item?.edge))
    .filter((value) => Number.isFinite(value));

  if (validEdges.length === 0) return null;

  return Math.max(...validEdges);
}