# Dashboard - Radar Future-Only

## O que mudou

- O Radar de oportunidades não usa mais `/dashboard/predictions`.
- Agora usa `/dashboard/opportunities?limit=10&hours=24`.
- O radar mostra somente jogos futuros válidos retornados pelo backend.
- Cards do radar exibem horário de início e tempo até kickoff.

## Variável do Render

Mantenha no Render:

```env
VITE_API_URL=https://api-bet2026.duckdns.org
VITE_DASHBOARD_POLL_INTERVAL_MS=60000
```

Depois faça:

```text
Manual Deploy > Clear build cache & deploy
```
