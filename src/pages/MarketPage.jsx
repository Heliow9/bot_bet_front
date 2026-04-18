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

  async function loadData() {
    try {
      setError("");
      const response = await api.get("/dashboard/market?limit=50");
      setItems(response.data.items || []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar os dados de mercado.");
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

  const summary = useMemo(() => {
    const pending = items.filter((item) => getMatchStatus(item).type === "pending").length;
    const live = items.filter((item) => getMatchStatus(item).type === "live").length;
    const resolved = items.filter((item) => getMatchStatus(item).type === "resolved").length;

    return {
      pending,
      live,
      resolved,
      total: items.length,
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
                Veja abertura, odd atual, edge, direção da linha e se a partida
                está pendente, ao vivo ou resolvida.
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
                        <td colSpan="9" className="table-empty">
                          Nenhum dado de mercado encontrado.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const matchStatus = getMatchStatus(item);

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
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className={`pill ${matchStatus.className}`}>
                                {matchStatus.label}
                              </span>
                            </td>

                            <td>
                              <span className="market-pick">{item.pick || "-"}</span>
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
                              <span className={edgeClass(item.edge)}>
                                {formatEdge(item.edge)}
                              </span>
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
                          <strong>{item.pick || "-"}</strong>
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

  if (item?.is_resolved === true || rawStatus === "resolved") {
    return {
      type: "resolved",
      label: "Resolvido",
      className: "pill--status-hit",
    };
  }

  if (rawStatus === "pending") {
    return {
      type: "pending",
      label: "Pendente",
      className: "pill--status-pending",
    };
  }

  if (rawStatus === "hit" || rawStatus === "miss") {
    return {
      type: "resolved",
      label: "Resolvido",
      className: "pill--status-hit",
    };
  }

  return {
    type: "unknown",
    label: "Sem status",
    className: "pill--status-neutral",
  };
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