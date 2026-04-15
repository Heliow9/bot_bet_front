import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@aposta.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        localStorage.removeItem("user");
      }

      navigate("/dashboard");
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-background-glow login-background-glow--one" />
      <div className="login-background-glow login-background-glow--two" />

      <div className="login-card">
        <div className="login-card__header">
          <span className="login-badge">Bot Bet 1x2</span>
          <h1>Entrar no Dashboard</h1>
          <p>
            Acompanhe previsões, odds, acurácia, value bets e evolução do modelo
            em um só lugar.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@aposta.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <button
            className="button button--primary login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}