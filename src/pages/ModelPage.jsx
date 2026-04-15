 import { useEffect, useMemo, useState } from "react";
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
  };

  const byConfidence = data?.by_confidence || [];
  const byLeague = data?.by_league || [];

  const bestLeague = useMemo(() => {
    if (!byLeague.length) return null;
    return [...byLeague].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
  }, [byLeague]);

  const worstLeague = useMemo(() => {
    if (!byLeague.length) return null;
    return [...byLeague].sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0))[0];
  }, [byLeague]);

  const bestConfidence = useMemo(() => {
    if (!byConfidence.length) return null;
    return [...byConfidence].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
  }, [byConfidence]);

  const insightMessage = useMemo(() => {
    const acc = Number(summary.accuracy || 0);

    if (summary.resolved_total === 0) {
      return "Ainda não há partidas suficientes resolvidas para avaliar a consistência do modelo.";
    }

    if (acc < 0.4) {
      return "O modelo ainda está fraco. O ideal agora é restringir ligas, revisar heurísticas e evitar escalar stake.";
    }

    if (acc < 0.55) {
      return "O modelo está mediano. Já dá para observar padrões, mas ainda exige gestão de risco e filtros melhores.";
    }

    return "O modelo está mostrando consistência. Agora vale aprofundar análise por liga, confiança e ROI.";
  }, [summary]);

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
            <div className="model-insight">
              <div className="model-insight__icon">🧠</div>
              <div className="model-insight__content">
                <strong>Leitura do modelo</strong>
                <p>{insightMessage}</p>
              </div>
            </div>

            <section className="stats-grid">
              <StatCard title="Jogos resolvidos" value={summary.resolved_total} />
              <StatCard title="Acertos" value={summary.hits} />
              <StatCard title="Erros" value={summary.misses} />
              <StatCard
                title="Acurácia geral"
                value={`${(Number(summary.accuracy || 0) * 100).toFixed(2)}%`}
              />
            </section>

            <section className="model-highlight-grid">
              <div className="model-highlight">
                <div className="model-highlight__label">Melhor liga</div>
                <div className="model-highlight__value model-highlight__value--good">
                  {bestLeague ? bestLeague.league_name : "-"}
                </div>
              </div>

              <div className="model-highlight">
                <div className="model-highlight__label">Pior liga</div>
                <div className="model-highlight__value model-highlight__value--bad">
                  {worstLeague ? worstLeague.league_name : "-"}
                </div>
              </div>

              <div className="model-highlight">
                <div className="model-highlight__label">Melhor confiança</div>
                <div className="model-highlight__value model-highlight__value--mid">
                  {bestConfidence ? bestConfidence.confidence : "-"}
                </div>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Performance por confiança</h2>
                  <p>Veja rapidamente em quais faixas o modelo está mais confiável.</p>
                </div>
              </div>

              <div className="confidence-grid">
                {byConfidence.map((item) => (
                  <div key={item.confidence} className="confidence-card">
                    <div className="confidence-card__top">
                      <div className="confidence-card__title">
                        Confiança {item.confidence}
                      </div>
                      <span className={`pill pill--${normalizeConfidence(item.confidence)}`}>
                        {item.confidence}
                      </span>
                    </div>

                    <div className="confidence-card__accuracy">
                      {(Number(item.accuracy || 0) * 100).toFixed(1)}
                      <small>%</small>
                    </div>

                    <div className="confidence-card__description">
                      {buildConfidenceMessage(item)}
                    </div>

                    <div className="confidence-card__stats">
                      <div className="confidence-stat">
                        <div className="confidence-stat__label">Total</div>
                        <div className="confidence-stat__value">{item.total}</div>
                      </div>

                      <div className="confidence-stat">
                        <div className="confidence-stat__label">Acertos</div>
                        <div className="confidence-stat__value">{item.hits}</div>
                      </div>

                      <div className="confidence-stat">
                        <div className="confidence-stat__label">Erros</div>
                        <div className="confidence-stat__value">{item.misses}</div>
                      </div>

                      <div className="confidence-stat">
                        <div className="confidence-stat__label">Acurácia</div>
                        <div className="confidence-stat__value">
                          {(Number(item.accuracy || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>Performance por liga</h2>
                  <p>Identifique rapidamente onde o modelo está mais forte e onde precisa melhorar.</p>
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
                    </tr>
                  </thead>

                  <tbody>
                    {byLeague.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="table-empty">
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
                          <td>
                            <span className={`pill ${getAccuracyClass(item.accuracy)}`}>
                              {(Number(item.accuracy || 0) * 100).toFixed(1)}%
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

function getAccuracyClass(acc) {
  const value = Number(acc || 0);
  if (value >= 0.6) return "pill--good";
  if (value >= 0.45) return "pill--mid";
  return "pill--bad";
}

function buildConfidenceMessage(item) {
  const acc = Number(item?.accuracy || 0);
  const total = Number(item?.total || 0);

  if (total === 0) {
    return "Ainda não há volume suficiente para avaliar essa faixa.";
  }

  if (acc >= 0.6) {
    return "Faixa promissora. Vale acompanhar de perto para priorização futura.";
  }

  if (acc >= 0.45) {
    return "Faixa estável, mas ainda pede cautela na leitura.";
  }

  return "Faixa fraca no momento. Ideal revisar filtros ou reduzir exposição.";
}
