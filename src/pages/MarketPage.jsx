import { useEffect, useState } from "react";
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

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Mercado / CLV"
          eyebrow="Odds e movimento de linha"
        />

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Leitura de mercado</h2>
              <p>Veja abertura, odd atual, edge e direção da linha.</p>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">Carregando mercado...</div>
          ) : error ? (
            <div className="table-empty">{error}</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Jogo</th>
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
                      <td colSpan="8" className="table-empty">
                        Nenhum dado de mercado encontrado.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.prediction_id}>
                        <td>
                          <div>{item.home_team} x {item.away_team}</div>
                          <small style={{ color: "#94a3b8" }}>{item.league_name}</small>
                        </td>
                        <td>{item.pick}</td>
                        <td>{item.bookmaker || "-"}</td>
                        <td>{formatOdd(item.opening_market_odds)}</td>
                        <td>{formatOdd(item.latest_market_odds)}</td>
                        <td>
                          <span className={`pill pill--movement-${item.movement_direction || "stable"}`}>
                            {formatMovement(item.movement)}
                          </span>
                        </td>
                        <td>{formatEdge(item.edge)}</td>
                        <td>
                          {item.has_value_bet ? (
                            <span className="pill pill--high">Sim</span>
                          ) : (
                            <span className="pill pill--low">Não</span>
                          )}
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

function formatOdd(value) {
  if (value === null || value === undefined) return "-";
  return Number(value).toFixed(2);
}

function formatMovement(value) {
  if (value === null || value === undefined) return "-";
  if (value > 0) return `+${Number(value).toFixed(2)}`;
  return Number(value).toFixed(2);
}

function formatEdge(value) {
  if (value === null || value === undefined) return "-";
  return `${(Number(value) * 100).toFixed(2)}%`;
}