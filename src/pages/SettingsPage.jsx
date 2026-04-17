import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

const INITIAL_FORM = {
  value_bet_edge: 0.05,
  live_monitor_enabled: true,
  live_monitor_interval_seconds: 390,
  live_minute_checkpoints: "15,30,45,60,75",
  live_signal_min_shots_diff: 4,
  live_signal_min_on_target_diff: 2,
  live_signal_min_possession_diff: 8,
  telegram_send_to_main_chat: true,
  telegram_send_to_channel: false,
  odds_api_keys: [],
};

function parseOddsKeysInput(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatOddsKeysInput(keys) {
  if (!Array.isArray(keys)) return "";
  return keys.join("\n");
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [oddsKeysText, setOddsKeysText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSettings() {
    try {
      setError("");
      const response = await api.get("/settings/runtime");
      const data = {
        ...INITIAL_FORM,
        ...(response.data || {}),
      };

      setForm(data);
      setOddsKeysText(formatOddsKeysInput(data.odds_api_keys));
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function updateField(name, value) {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        value_bet_edge: Number(form.value_bet_edge),
        live_monitor_enabled: Boolean(form.live_monitor_enabled),
        live_monitor_interval_seconds: Number(form.live_monitor_interval_seconds),
        live_signal_min_shots_diff: Number(form.live_signal_min_shots_diff),
        live_signal_min_on_target_diff: Number(form.live_signal_min_on_target_diff),
        live_signal_min_possession_diff: Number(form.live_signal_min_possession_diff),
        telegram_send_to_main_chat: Boolean(form.telegram_send_to_main_chat),
        telegram_send_to_channel: Boolean(form.telegram_send_to_channel),
        odds_api_keys: parseOddsKeysInput(oddsKeysText),
      };

      const response = await api.put("/settings/runtime", payload);

      const data = {
        ...INITIAL_FORM,
        ...(response.data || {}),
      };

      setForm(data);
      setOddsKeysText(formatOddsKeysInput(data.odds_api_keys));
      setSuccess("Configurações salvas com sucesso.");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar
          onLogout={handleLogout}
          title="Configurações"
          eyebrow="Ajustes operacionais"
        />

        {loading ? (
          <div className="panel">
            <div className="table-empty">Carregando configurações...</div>
          </div>
        ) : (
          <form className="settings-form" onSubmit={handleSubmit}>
            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>Value Bet</h2>
                  <p>
                    Defina o edge mínimo para classificar uma entrada como value
                    bet.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-field settings-field--compact">
                  <label>Edge mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.value_bet_edge}
                    onChange={(e) => updateField("value_bet_edge", e.target.value)}
                  />
                  <small>Exemplo: 0.05 = 5%</small>
                </div>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Odds API</h2>
                  <p>
                    Cadastre múltiplas API keys. O backend tentará a próxima
                    automaticamente em caso de 401, 403 ou 429.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-field settings-field--full">
                  <label>API keys de odds</label>
                  <textarea
                    rows={8}
                    value={oddsKeysText}
                    onChange={(e) => {
                      setSuccess("");
                      setOddsKeysText(e.target.value);
                    }}
                    placeholder={`cole uma key por linha\nkey_1\nkey_2\nkey_3`}
                  />
                  <small>
                    Uma key por linha. Duplicadas e linhas vazias serão ignoradas.
                  </small>
                </div>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Monitor ao vivo</h2>
                  <p>
                    Controle o comportamento do monitor live e os thresholds dos
                    sinais.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-field">
                  <label>Monitor live ativo</label>
                  <select
                    value={String(form.live_monitor_enabled)}
                    onChange={(e) =>
                      updateField("live_monitor_enabled", e.target.value === "true")
                    }
                  >
                    <option value="true">Ativado</option>
                    <option value="false">Desativado</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Intervalo do monitor (segundos)</label>
                  <input
                    type="number"
                    min="30"
                    value={form.live_monitor_interval_seconds}
                    onChange={(e) =>
                      updateField("live_monitor_interval_seconds", e.target.value)
                    }
                  />
                  <small>Exemplo: 390 = 6 minutos e 30 segundos</small>
                </div>

                <div className="settings-field settings-field--full">
                  <label>Minutos de checkpoint</label>
                  <input
                    type="text"
                    value={form.live_minute_checkpoints}
                    onChange={(e) =>
                      updateField("live_minute_checkpoints", e.target.value)
                    }
                  />
                  <small>Formato: 15,30,45,60,75</small>
                </div>

                <div className="settings-field">
                  <label>Diferença mínima de chutes</label>
                  <input
                    type="number"
                    min="0"
                    value={form.live_signal_min_shots_diff}
                    onChange={(e) =>
                      updateField("live_signal_min_shots_diff", e.target.value)
                    }
                  />
                </div>

                <div className="settings-field">
                  <label>Diferença mínima no alvo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.live_signal_min_on_target_diff}
                    onChange={(e) =>
                      updateField("live_signal_min_on_target_diff", e.target.value)
                    }
                  />
                </div>

                <div className="settings-field">
                  <label>Diferença mínima de posse</label>
                  <input
                    type="number"
                    min="0"
                    value={form.live_signal_min_possession_diff}
                    onChange={(e) =>
                      updateField("live_signal_min_possession_diff", e.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Telegram</h2>
                  <p>
                    Controle para onde as mensagens automáticas serão enviadas.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-field">
                  <label>Enviar para chat principal</label>
                  <select
                    value={String(form.telegram_send_to_main_chat)}
                    onChange={(e) =>
                      updateField("telegram_send_to_main_chat", e.target.value === "true")
                    }
                  >
                    <option value="true">Ativado</option>
                    <option value="false">Desativado</option>
                  </select>
                  <small>Usa o TELEGRAM_CHAT_ID configurado no backend.</small>
                </div>

                <div className="settings-field">
                  <label>Enviar para canal</label>
                  <select
                    value={String(form.telegram_send_to_channel)}
                    onChange={(e) =>
                      updateField("telegram_send_to_channel", e.target.value === "true")
                    }
                  >
                    <option value="true">Ativado</option>
                    <option value="false">Desativado</option>
                  </select>
                  <small>Usa o TELEGRAM_CHANNEL_CHAT_ID configurado no backend.</small>
                </div>
              </div>
            </section>

            <section className="panel panel--spaced">
              <div className="panel__header">
                <div>
                  <h2>Resumo rápido</h2>
                  <p>Revise os parâmetros atuais antes de salvar.</p>
                </div>
              </div>

              <div className="settings-summary-grid">
                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Edge mínimo</div>
                  <div className="settings-summary-card__value">
                    {(Number(form.value_bet_edge || 0) * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Monitor live</div>
                  <div className="settings-summary-card__value">
                    {form.live_monitor_enabled ? "Ativado" : "Desativado"}
                  </div>
                </div>

                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Intervalo</div>
                  <div className="settings-summary-card__value">
                    {form.live_monitor_interval_seconds}s
                  </div>
                </div>

                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Chat principal</div>
                  <div className="settings-summary-card__value">
                    {form.telegram_send_to_main_chat ? "Ativado" : "Desativado"}
                  </div>
                </div>

                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Canal</div>
                  <div className="settings-summary-card__value">
                    {form.telegram_send_to_channel ? "Ativado" : "Desativado"}
                  </div>
                </div>

                <div className="settings-summary-card">
                  <div className="settings-summary-card__label">Keys de odds</div>
                  <div className="settings-summary-card__value">
                    {parseOddsKeysInput(oddsKeysText).length}
                  </div>
                </div>
              </div>
            </section>

            {(error || success) && (
              <section className="panel panel--spaced">
                <div
                  className={
                    error
                      ? "settings-alert settings-alert--error"
                      : "settings-alert settings-alert--success"
                  }
                >
                  {error || success}
                </div>
              </section>
            )}

            <section className="settings-actions">
              <button
                type="submit"
                className="button button--primary settings-save-button"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            </section>
          </form>
        )}
      </main>
    </div>
  );
}