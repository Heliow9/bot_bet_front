# Deploy no Render - Dashboard com Central de Ações

## Variável obrigatória no Render

Em **Render > bot-bet-front > Environment**, deixe:

```env
VITE_API_URL=https://api-bet2026.duckdns.org
VITE_DASHBOARD_POLL_INTERVAL_MS=60000
```

Depois rode:

```text
Manual Deploy > Clear build cache & deploy
```

## O que foi adicionado

A dashboard agora tem uma **Central de Ações** com botões para:

- Rodar pré-análise 30 minutos
- Conferir resultados pendentes
- Rodar auditoria do dia
- Rodar sincronização pós-deploy
- Treinar modelo ML manualmente
- Ler configuração runtime
- Testar saúde da API
- Atualizar dashboard
- Abrir previsões, resultados, configurações e Swagger

## Endpoints usados

```text
GET  /health
GET  /settings/runtime
POST /settings/runtime/train
POST /admin/run-pre-game-check
POST /admin/run-results-check
POST /admin/run-today-audit
POST /admin/run-post-deploy-sync
```

Todos os endpoints protegidos usam o token salvo no login.
